/* ============================================================
   SCREENINGS4U — CORE AUTH
   STRICT ROLE-BASED PORTAL AUTHENTICATION

   PORTALS:
   - Admin
   - Customer
   - Employer
   - Employee / LMS

   IMPORTANT:
   Users may have more than one system role, but they must
   authenticate through the correct portal.

   ============================================================ */

(() => {
  "use strict";

  /* ============================================================
     PORTAL CONFIGURATION
     ============================================================ */

  const PORTALS = Object.freeze({

    admin: {
      login: "admin-login.html",
      dashboard: "admin-dashboard.html",

      allowedRoles: [
        "super_admin",
        "admin",
        "administrator",
        "operations",
        "compliance",
        "billing",
        "support",
        "content",
        "readonly"
      ]
    },

    customer: {
      login: "customer-login.html",
      dashboard: "customer-dashboard.html",

      allowedRoles: [
        "client_user",
        "client_admin",
        "client_manager"
      ]
    },

    employer: {
      login: "employer-login.html",
      dashboard: "employer-dashboard.html",

      allowedRoles: [
        "employer_user",
        "employer_admin",
        "employer_hr",
        "employer_safety",
        "employer_billing"
      ]
    },

    employee: {
      login: "employee-login.html",
      dashboard: "employee-dashboard.html",
      allowedRoles: ["employee"]
    },

    training: {
      login: "training-login.html",
      dashboard: "lms-dashboard.html",
      allowedRoles: []
    }

  });


  /* ============================================================
     AUTH STATE
     ============================================================ */

  let state = {
    initialized: false,
    session: null,
    user: null,
    profile: null,
    roles: [],
    primaryRole: null
  };


  /* ============================================================
     SUPABASE CLIENT
     ============================================================ */

  function getClient() {

    if (
      typeof window.getScreenings4uSupabase === "function"
    ) {
      return window.getScreenings4uSupabase();
    }

    if (
      window.screenings4uSupabase &&
      window.screenings4uSupabase.auth
    ) {
      return window.screenings4uSupabase;
    }

    if (
      window.supabaseClient &&
      window.supabaseClient.auth
    ) {
      return window.supabaseClient;
    }

    throw new Error(
      "Supabase client is not available. " +
      "Load Supabase and supabase-config.js before core-auth.js."
    );

  }


  /* ============================================================
     ROLE NORMALIZATION
     ============================================================ */

  function normalizeRole(value) {

    if (!value) {
      return null;
    }

    return String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

  }


  function uniqueRoles(values = []) {

    return [
      ...new Set(
        values
          .map(normalizeRole)
          .filter(Boolean)
      )
    ];

  }


  /* ============================================================
     GET PORTAL
     ============================================================ */

  function getPortal(portalName) {

    const name = String(portalName || "")
      .trim()
      .toLowerCase();

    const portal = PORTALS[name];

    if (!portal) {
      throw new Error(
        `Unknown portal "${portalName}".`
      );
    }

    return {
      name,
      ...portal
    };

  }


  /* ============================================================
     GET SESSION
     ============================================================ */

  async function getSession() {

    const client = getClient();

    const {
      data,
      error
    } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    return data?.session || null;

  }


  /* ============================================================
     GET USER PROFILE

     The central profile table is user_profiles.
     This function does NOT require a nonexistent
     admin_profiles table.
     ============================================================ */

  async function getProfile(userId = null) {

    const client = getClient();

    let id = userId;

    if (!id) {

      const session = await getSession();

      if (!session?.user?.id) {
        return null;
      }

      id = session.user.id;

    }

    const {
      data,
      error
    } = await client
      .from("user_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {

      console.warn(
        "[S4UAuth] Unable to load user profile:",
        error
      );

      return null;

    }

    return data || null;

  }


  /* ============================================================
     GET USER ROLES

     Roles are loaded from:

     user_role_assignments
     ============================================================ */

  async function getRoles(userId = null) {

    const client = getClient();

    let id = userId;

    if (!id) {

      const session = await getSession();

      if (!session?.user?.id) {
        return [];
      }

      id = session.user.id;

    }


    const {
      data,
      error
    } = await client
      .from("user_role_assignments")
      .select("*")
      .eq("user_id", id);


    if (error) {

      console.error(
        "[S4UAuth] Unable to load user roles:",
        error
      );

      /*
       * A database/RLS/read failure is not the same thing as a user
       * having no roles. Throw so the caller can treat this as an
       * authentication-verification error instead of signing out a
       * valid session.
       */
      throw error;

    }


    const foundRoles = [];

    (data || []).forEach((row) => {

      [
        row.role,
        row.role_name,
        row.role_code,
        row.role_key,
        row.app_role
      ].forEach((value) => {

        const role = normalizeRole(value);

        if (role) {
          foundRoles.push(role);
        }

      });

    });


    return uniqueRoles(foundRoles);

  }


  /* ============================================================
     CHECK PORTAL ACCESS

     This is the central authorization check.

     ADMIN:
       Any recognized administrative role.

     CUSTOMER:
       Customer role only.

     EMPLOYER:
       Employer role only.

     EMPLOYEE:
       Employee role only.
       Employee dashboard is LMS only.
     ============================================================ */

  function userCanAccessPortal(
    userRoles = [],
    portalName
  ) {

    const portal = getPortal(portalName);

    const normalizedUserRoles =
      uniqueRoles(userRoles);

    const allowedRoles =
      uniqueRoles(portal.allowedRoles);


    return normalizedUserRoles.some(
      (role) => allowedRoles.includes(role)
    );

  }



  /* ============================================================
     VERIFY ADMIN ACCESS

     The database already exposes public.is_admin() as a
     SECURITY DEFINER function. Use it as a reliable fallback when
     direct role-table reads are restricted by RLS.
     ============================================================ */

  async function verifyAdminAccess(userRoles = []) {

    if (userCanAccessPortal(userRoles, "admin")) {
      return true;
    }

    try {

      const client = getClient();

      const {
        data,
        error
      } = await client.rpc("is_admin");

      if (error) {
        throw error;
      }

      return data === true;

    } catch (error) {

      console.error(
        "[S4UAuth] Unable to verify admin access:",
        error
      );

      throw error;

    }

  }


  /* ============================================================
     GET PRIMARY ROLE
     ============================================================ */

  function getPrimaryRole(userRoles = []) {

    const roles = uniqueRoles(userRoles);

    if (
      userCanAccessPortal(roles, "admin")
    ) {
      return "admin";
    }

    if (
      userCanAccessPortal(roles, "employer")
    ) {
      return "employer";
    }

    if (
      userCanAccessPortal(roles, "employee")
    ) {
      return "employee";
    }

    if (
      userCanAccessPortal(roles, "customer")
    ) {
      return "customer";
    }

    return null;

  }


  /* ============================================================
     INITIALIZE
     ============================================================ */

  async function initialize({
    force = false
  } = {}) {

    if (
      state.initialized &&
      !force
    ) {
      return {
        ...state,
        roles: [...state.roles]
      };
    }


    const session =
      await getSession();


    /* ----------------------------------------------------------
       NO SESSION
       ---------------------------------------------------------- */

    if (!session?.user) {

      state = {
        initialized: true,
        session: null,
        user: null,
        profile: null,
        roles: [],
        primaryRole: null
      };

      return {
        ...state,
        roles: []
      };

    }


    /* ----------------------------------------------------------
       AUTHENTICATED USER
       ---------------------------------------------------------- */

    const user =
      session.user;


    const [
      profileResult,
      rolesResult
    ] = await Promise.allSettled([

      getProfile(user.id),

      getRoles(user.id)

    ]);

    const profile =
      profileResult.status === "fulfilled"
        ? profileResult.value
        : null;

    const roles =
      rolesResult.status === "fulfilled"
        ? rolesResult.value
        : [];

    const roleLoadError =
      rolesResult.status === "rejected"
        ? rolesResult.reason
        : null;


    state = {

      initialized: true,

      session,

      user,

      profile,

      roles,

      primaryRole:
        getPrimaryRole(roles),

      roleLoadError

    };


    return {
      ...state,
      roles: [...roles]
    };

  }


  /* ============================================================
     HAS ROLE
     ============================================================ */

  async function hasRole(
    role,
    userId = null
  ) {

    const requestedRole = normalizeRole(role);
    if (!requestedRole) return false;

    if (requestedRole === "training") {
      const client = getClient();
      const { data, error } = await client.rpc("can_access_training_portal");
      if (error) {
        console.error("[S4UAuth] Training access check failed:", error);
        return false;
      }
      return data === true;
    }

    const userRoles = await getRoles(userId);


    return userRoles.includes(
      requestedRole
    );

  }


  /* ============================================================
     HAS ANY ROLE
     ============================================================ */

  async function hasAnyRole(
    allowedRoles = [],
    userId = null
  ) {

    const allowed =
      uniqueRoles(allowedRoles);

    if (!allowed.length) {
      return false;
    }


    const userRoles =
      await getRoles(userId);


    return userRoles.some(
      (role) => allowed.includes(role)
    );

  }


  /* ============================================================
     GET DASHBOARD
     ============================================================ */

  function getDashboardForRole(role) {

    const normalizedRole = normalizeRole(role);

    if (!normalizedRole) {
      return null;
    }

    /* Accept portal names as well as concrete database roles. */
    if (PORTALS[normalizedRole]) {
      return PORTALS[normalizedRole].dashboard;
    }

    for (const portal of Object.values(PORTALS)) {
      if (portal.allowedRoles.includes(normalizedRole)) {
        return portal.dashboard;
      }
    }

    return null;
  }


  /* ============================================================
     GET LOGIN PAGE
     ============================================================ */

  function getLoginForPortal(
    portalName
  ) {

    return getPortal(
      portalName
    ).login;

  }


  /* ============================================================
     REQUIRE AUTHENTICATION

     Example:

     S4UAuth.requireAuth({
       portal: "admin"
     });

     If the user is not authorized for that exact
     portal, they are signed out and returned to
     THAT portal's login page.
     ============================================================ */

  async function requireAuth({
    portal = null,
    loginPage = null
  } = {}) {

    let portalConfig = null;


    if (portal) {

      portalConfig =
        getPortal(portal);

    }


    const resolvedLoginPage =

      loginPage ||

      portalConfig?.login ||

      "admin-login.html";


    const session =
      await getSession();


    /* ----------------------------------------------------------
       NO SESSION
       ---------------------------------------------------------- */

    if (!session?.user) {

      window.location.replace(
        resolvedLoginPage
      );

      return null;

    }


    /* ----------------------------------------------------------
       LOAD FRESH AUTH STATE
       ---------------------------------------------------------- */

    const authState =
      await initialize({
        force: true
      });


    /* ----------------------------------------------------------
       NO PORTAL SPECIFIED
       ---------------------------------------------------------- */

    if (!portalConfig) {

      return authState;

    }


    /* ----------------------------------------------------------
       STRICT PORTAL ACCESS
       ---------------------------------------------------------- */

    let allowed = false;

    if (portal === "training") {

      allowed =
        await hasRole(
          "training",
          authState.user?.id
        );

    } else if (portal === "admin") {

      /*
       * Admin access must remain secure, but it should not depend
       * exclusively on a client-side direct read of the role table.
       * public.is_admin() is the database-authoritative fallback.
       */
      allowed =
        await verifyAdminAccess(
          authState.roles
        );

    } else {

      allowed =
        userCanAccessPortal(
          authState.roles,
          portal
        );

    }


    if (!allowed) {

      console.warn(
        "[S4UAuth] Portal access denied.",
        {
          portal,
          userId:
            authState.user?.id,
          roles:
            authState.roles
        }
      );


      await signOutSilently();


      window.location.replace(
        resolvedLoginPage
      );


      return null;

    }


    return authState;

  }


  /* ============================================================
     SIGN IN
     ============================================================ */

  async function signIn(
    email,
    password
  ) {

    const client =
      getClient();


    const {
      data,
      error
    } = await client
      .auth
      .signInWithPassword({

        email:
          String(
            email || ""
          ).trim(),

        password

      });


    if (error) {
      throw error;
    }


    /* Refresh auth state immediately */

    await initialize({
      force: true
    });


    return data;

  }


  /* ============================================================
     STRICT PORTAL SIGN IN

     IMPORTANT:

     The user is authenticated first.

     Then the user's roles are checked.

     If they do not belong to the portal:
     - session is destroyed
     - an error is returned
     - no other portal redirect occurs
     ============================================================ */

  async function signInToPortal(
    portalName,
    email,
    password
  ) {

    const portal =
      getPortal(portalName);


    const result =
      await signIn(
        email,
        password
      );


    const authState =
      await initialize({
        force: true
      });


    if (!authState?.user?.id) {

      await signOutSilently();

      throw new Error(
        "Unable to verify your account."
      );

    }


    const authorized = portalName === "training"
      ? await hasRole("training", authState.user.id)
      : userCanAccessPortal(authState.roles, portalName);


    if (!authorized) {

      console.warn(
        "[S4UAuth] Login denied for portal.",
        {
          portal:
            portalName,
          userId:
            authState.user.id,
          roles:
            authState.roles
        }
      );


      await signOutSilently();


      throw new Error(
        "This account does not have access to the " +
        portalName +
        " portal."
      );

    }


    return {

      ...result,

      portal,

      state:
        authState

    };

  }


  /* ============================================================
     SILENT SIGN OUT
     ============================================================ */

  async function signOutSilently() {

    try {

      const client =
        getClient();


      await client.auth.signOut();


    } catch (error) {

      console.error(
        "[S4UAuth] Unable to sign out:",
        error
      );

    }


    state = {

      initialized: true,
      session: null,
      user: null,
      profile: null,
      roles: [],
      primaryRole: null

    };

  }


  /* ============================================================
     SIGN OUT
     ============================================================ */

  async function signOut(loginPage = "admin-login.html") {

    const destination =
      typeof loginPage === "object" && loginPage !== null
        ? loginPage.redirectTo || "admin-login.html"
        : loginPage;

    await signOutSilently();
    window.location.replace(destination);
  }


  /* ============================================================
     PUBLIC API
     ============================================================ */

  window.S4UAuth = Object.freeze({

    /* Client */

    getClient,


    /* Session */

    getSession,


    /* State */

    initialize,


    /* User */

    getProfile,


    /* Roles */

    getRoles,

    hasRole,

    hasAnyRole,

    normalizeRole,

    userCanAccessPortal,

    verifyAdminAccess,

    getPrimaryRole,


    /* Portals */

    PORTALS,

    getPortal,

    getDashboardForRole,

    getLoginForPortal,


    /* Protection */

    requireAuth,


    /* Authentication */

    signIn,

    signInToPortal,

    signOut,

    signOutSilently

  });

})();