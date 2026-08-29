/* ============================================================
   screenings4u — CORE AUTH
   Shared authentication and portal access control.

   Requires:
   - Supabase JavaScript library
   - supabase-config.js

   Provides:
   - Shared Supabase client access
   - Session initialization
   - Sign in
   - Shared sign out
   - Role detection
   - Profile verification
   - Active/inactive account checks
   - Portal access verification
   - Protected-page authorization helpers
   ============================================================ */

(() => {
  "use strict";

  /* ==========================================================
     DASHBOARD ROUTING
     ========================================================== */

  const DASH = {
    admin: "admin-dashboard.html",
    customer: "customer-dashboard.html",
    employer: "employer-dashboard.html",
    employee: "employee-dashboard.html"
  };


  /* ==========================================================
     ROLE ALIASES
     ========================================================== */

  const ALIAS = {
    administrator: "admin",
    user: "customer",
    client: "customer",
    company: "employer",
    staff: "employee"
  };


  /* ==========================================================
     AUTH STATE
     ========================================================== */

  let state = {
    initialized: false,
    session: null,
    user: null,
    profile: null,
    roles: [],
    primaryRole: null
  };


  /* ==========================================================
     ROLE HELPERS
     ========================================================== */

  function normalizeRole(value) {
    if (!value) return null;

    const role = String(value)
      .trim()
      .toLowerCase();

    return ALIAS[role] || role;
  }


  function roles(values = []) {
    return [
      ...new Set(
        values
          .map(normalizeRole)
          .filter(Boolean)
      )
    ];
  }


  function primary(roleList) {
    const priority = [
      "admin",
      "employer",
      "employee",
      "customer"
    ];

    return (
      priority.find(role =>
        roleList.includes(role)
      ) ||
      roleList[0] ||
      null
    );
  }


  /* ==========================================================
     SUPABASE CLIENT
     ========================================================== */

  function getClient() {
    if (
      typeof window.getScreenings4uSupabase ===
      "function"
    ) {
      return window.getScreenings4uSupabase();
    }

    if (window.screenings4uSupabase) {
      return window.screenings4uSupabase;
    }

    throw new Error(
      "Load Supabase and supabase-config.js before core-auth.js."
    );
  }


  /* ==========================================================
     MAIN USER PROFILE
     ========================================================== */

  async function loadProfile(id) {
    const { data, error } =
      await getClient()
        .from("user_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
      throw error;
    }

    return data || null;
  }


  /* ==========================================================
     ROLE PROFILE VERIFICATION
     ========================================================== */

  async function verifyRoleProfile(id, role) {
    const tableMap = {
      admin: "admin_profiles",
      customer: "customer_profiles",
      employer: "employer_profiles"
    };

    const normalized = normalizeRole(role);
    const table = tableMap[normalized];

    if (!table) {
      return {
        allowed: false,
        reason: "Unsupported portal role.",
        profile: null
      };
    }

    const { data, error } =
      await getClient()
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return {
        allowed: false,
        reason:
          `This account is not registered for the ${normalized} portal.`,
        profile: null
      };
    }

    /*
     * Only an explicit false value blocks access.
     *
     * This preserves compatibility with existing profile rows
     * where is_active may be null or not yet populated.
     */
    if (data.is_active === false) {
      return {
        allowed: false,
        reason:
          "This account is inactive. Please contact support.",
        profile: data
      };
    }

    return {
      allowed: true,
      reason: null,
      profile: data
    };
  }


  /* ==========================================================
     EMPLOYEE PROFILE VERIFICATION
     ========================================================== */

  async function verifyEmployeeProfile(id) {
    const columns = [
      "user_id",
      "profile_id",
      "auth_user_id",
      "id"
    ];

    let foundSchemaColumn = false;

    for (const column of columns) {
      const { data, error } =
        await getClient()
          .from("employer_employees")
          .select("*")
          .eq(column, id)
          .limit(1);

      /*
       * Some deployments may not contain every possible
       * employee auth-link column. Try the next option.
       */
      if (error) {
        continue;
      }

      foundSchemaColumn = true;

      const employee =
        Array.isArray(data)
          ? data[0]
          : null;

      if (!employee) {
        continue;
      }

      if (employee.is_active === false) {
        return {
          allowed: false,
          reason:
            "Your employee account is inactive. Please contact your employer.",
          profile: employee
        };
      }

      return {
        allowed: true,
        reason: null,
        profile: employee
      };
    }

    if (!foundSchemaColumn) {
      console.warn(
        "[S4UAuth] Employee profile columns could not be verified."
      );
    }

    return {
      allowed: false,
      reason:
        "This account is not registered for the employee portal.",
      profile: null
    };
  }


  /* ==========================================================
     PORTAL ACCESS VERIFICATION
     ========================================================== */

  async function verifyPortalAccess(id, role) {
    const normalized = normalizeRole(role);

    if (normalized === "employee") {
      return verifyEmployeeProfile(id);
    }

    return verifyRoleProfile(
      id,
      normalized
    );
  }


  /* ==========================================================
     ROLE LOADING
     ========================================================== */

  async function loadRoles(
    id,
    profileData
  ) {
    const client = getClient();
    const found = [];


    /*
     * USER ROLE ASSIGNMENTS
     */

    const {
      data: assignmentData,
      error: assignmentError
    } =
      await client
        .from("user_role_assignments")
        .select("*")
        .eq("user_id", id);

    if (!assignmentError) {
      (assignmentData || []).forEach(row => {
        [
          row.role,
          row.role_key,
          row.role_name,
          row.app_role
        ].forEach(value => {
          const normalized =
            normalizeRole(value);

          if (normalized) {
            found.push(normalized);
          }
        });
      });
    }


    /*
     * ROLE PROFILE TABLES
     *
     * This checks whether a profile exists.
     * Active status is verified separately by
     * verifyPortalAccess().
     */

    for (
      const [table, role] of [
        ["admin_profiles", "admin"],
        ["customer_profiles", "customer"],
        ["employer_profiles", "employer"]
      ]
    ) {
      const { data, error } =
        await client
          .from(table)
          .select("id")
          .eq("id", id)
          .maybeSingle();

      if (!error && data) {
        found.push(role);
      }
    }


    /*
     * EMPLOYEE PROFILE
     */

    for (
      const column of [
        "user_id",
        "profile_id",
        "auth_user_id",
        "id"
      ]
    ) {
      const {
        data,
        error
      } =
        await client
          .from("employer_employees")
          .select("id")
          .eq(column, id)
          .limit(1);

      if (
        !error &&
        data?.length
      ) {
        found.push("employee");
        break;
      }
    }


    /*
     * ROLE VALUES STORED ON user_profiles
     */

    [
      profileData?.role,
      profileData?.role_key,
      profileData?.account_role
    ].forEach(value => {
      const normalized =
        normalizeRole(value);

      if (normalized) {
        found.push(normalized);
      }
    });


    return roles(found);
  }


  /* ==========================================================
     SESSION INITIALIZATION
     ========================================================== */

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

    const client = getClient();

    const {
      data,
      error
    } =
      await client.auth.getSession();

    if (error) {
      throw error;
    }

    const session =
      data?.session || null;


    /*
     * NO ACTIVE SESSION
     */

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


    const user =
      session.user;


    /*
     * MAIN PROFILE
     *
     * Do not block authentication if user_profiles
     * is temporarily unavailable. Role/profile checks
     * will still determine portal access.
     */

    let profile = null;

    try {
      profile =
        await loadProfile(user.id);
    } catch (error) {
      console.warn(
        "[S4UAuth] Could not load user_profiles:",
        error.message
      );
    }


    const roleList =
      await loadRoles(
        user.id,
        profile
      );


    state = {
      initialized: true,
      session,
      user,
      profile,
      roles: roleList,
      primaryRole:
        primary(roleList)
    };


    return {
      ...state,
      roles: [...roleList]
    };
  }


  /* ==========================================================
     SIGN IN
     ========================================================== */

  async function signIn(
    email,
    password
  ) {
    const {
      data,
      error
    } =
      await getClient()
        .auth
        .signInWithPassword({
          email: String(
            email || ""
          ).trim(),
          password
        });

    if (error) {
      throw error;
    }

    /*
     * Refresh the shared state immediately after login.
     */

    await initialize({
      force: true
    });

    return data;
  }


  /* ==========================================================
     SIGN OUT
     ========================================================== */

  async function signOut({
    redirectTo = null
  } = {}) {
    const { error } =
      await getClient()
        .auth
        .signOut();

    if (error) {
      throw error;
    }

    state = {
      initialized: true,
      session: null,
      user: null,
      profile: null,
      roles: [],
      primaryRole: null
    };

    if (redirectTo) {
      window.location.replace(
        redirectTo
      );
    }
  }


  /* ==========================================================
     PROTECTED PAGE AUTHORIZATION
     ========================================================== */

  async function requireAuth({
    loginPage =
      "customer-login.html",

    allowedRoles = [],

    fallback = null
  } = {}) {
    const authState =
      await initialize();

    const wanted =
      roles(allowedRoles);


    /*
     * NOT AUTHENTICATED
     */

    if (
      !authState.session ||
      !authState.user
    ) {
      window.location.replace(
        loginPage
      );

      return null;
    }


    /*
     * ROLE AUTHORIZATION
     */

    if (wanted.length) {
      const matchedRole =
        wanted.find(role =>
          authState.roles.includes(
            role
          )
        );

      if (!matchedRole) {
        window.location.replace(
          fallback ||
          DASH[authState.primaryRole] ||
          loginPage
        );

        return null;
      }


      /*
       * CENTRAL PROFILE + ACTIVE STATUS CHECK
       */

      const access =
        await verifyPortalAccess(
          authState.user.id,
          matchedRole
        );

      if (!access.allowed) {
        await signOut({
          redirectTo:
            fallback ||
            loginPage
        });

        return null;
      }
    }


    return authState;
  }


  /* ==========================================================
     PUBLIC API
     ========================================================== */

  window.S4UAuth =
    Object.freeze({

      getClient,

      initialize,

      signIn,

      signOut,

      requireAuth,

      verifyPortalAccess,

      verifyRoleProfile,

      verifyEmployeeProfile,


      hasRole: role =>
        state.roles.includes(
          normalizeRole(role)
        ),


      hasAnyRole: roleList =>
        roles(roleList).some(
          role =>
            state.roles.includes(
              role
            )
        ),


      getDashboardForRole: role =>
        DASH[
          normalizeRole(role)
        ] || null,


      getState: () => ({
        ...state,
        roles: [
          ...state.roles
        ]
      }),


      normalizeRole
    });

})();