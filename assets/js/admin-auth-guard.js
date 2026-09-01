/* ============================================================
   SCREENINGS4U — MANAGEMENT PORTAL ADMIN AUTH GUARD

   ADMIN / MANAGEMENT PORTAL ONLY.

   Requires:
   1. @supabase/supabase-js
   2. assets/js/supabase-config.js

   This guard intentionally DOES NOT depend on:
   - core-auth.js
   - portal-auth-guard.js
   - training-auth-guard.js
   - customer/employer/employee portal auth

   Database authorization:
   public.is_admin()

   ============================================================ */

(() => {
  "use strict";

  const LOGIN_PAGE = "admin-login.html";

  let protectionPromise = null;

  function getClient() {
    if (
      typeof window.getScreenings4uSupabase === "function"
    ) {
      const client =
        window.getScreenings4uSupabase();

      if (client?.auth && client?.rpc) {
        return client;
      }
    }

    if (
      window.screenings4uSupabase?.auth &&
      window.screenings4uSupabase?.rpc
    ) {
      return window.screenings4uSupabase;
    }

    if (
      window.supabaseClient?.auth &&
      window.supabaseClient?.rpc
    ) {
      return window.supabaseClient;
    }

    throw new Error(
      "Supabase client is unavailable. " +
      "Load supabase-config.js before admin-auth-guard.js."
    );
  }

  function redirectToLogin() {
    if (
      location.pathname
        .toLowerCase()
        .endsWith("/admin-login.html")
    ) {
      return;
    }

    window.location.replace(LOGIN_PAGE);
  }

  function revealPage() {
    document.documentElement.classList.remove(
      "s4u-auth-pending"
    );

    document.documentElement.classList.add(
      "s4u-authenticated"
    );
  }

  async function protect() {
    if (protectionPromise) {
      return protectionPromise;
    }

    protectionPromise =
      (async () => {
        const client = getClient();

        /*
         * CHECK 1 — REAL SUPABASE SESSION
         *
         * Redirect ONLY when Supabase explicitly reports that no
         * authenticated session exists.
         */
        const {
          data: sessionData,
          error: sessionError
        } = await client.auth.getSession();

        if (sessionError) {
          /*
           * A temporary client/network error is not proof that the
           * user is logged out. Do not destroy the session.
           */
          console.error(
            "[Admin Auth] Session check failed:",
            sessionError
          );

          document.documentElement.classList.remove(
            "s4u-auth-pending"
          );

          document.documentElement.classList.add(
            "s4u-auth-error"
          );

          return null;
        }

        const session =
          sessionData?.session || null;

        if (!session?.user?.id) {
          console.warn(
            "[Admin Auth] No active admin session."
          );

          redirectToLogin();
          return null;
        }

        /*
         * CHECK 2 — DATABASE-AUTHORITATIVE ADMIN ACCESS
         *
         * The screenings4u database already exposes public.is_admin()
         * as SECURITY DEFINER. This avoids client-side RLS problems
         * when reading user_role_assignments directly.
         */
        const {
          data: isAdmin,
          error: adminError
        } = await client.rpc("is_admin");

        if (adminError) {
          /*
           * Again: an RPC/network failure is not the same thing as an
           * explicit access denial. Do not sign the user out.
           */
          console.error(
            "[Admin Auth] Unable to verify admin access:",
            adminError
          );

          document.documentElement.classList.remove(
            "s4u-auth-pending"
          );

          document.documentElement.classList.add(
            "s4u-auth-error"
          );

          return null;
        }

        if (isAdmin !== true) {
          console.warn(
            "[Admin Auth] Authenticated account is not an admin.",
            {
              userId: session.user.id
            }
          );

          /*
           * Do not call auth.signOut() here.
           * An account can have access to another Screenings4u portal,
           * and the management guard must not destroy those sessions.
           */
          redirectToLogin();
          return null;
        }

        const state = {
          session,
          user: session.user,
          isAdmin: true
        };

        window.S4UAdminAuthState =
          state;

        revealPage();

        window.dispatchEvent(
          new CustomEvent(
            "s4u:admin-authenticated",
            {
              detail: state
            }
          )
        );

        return state;
      })()
      .finally(() => {
        /*
         * Keep the resolved promise available during this page load.
         */
      });

    return protectionPromise;
  }

  window.S4UAdminAuth =
    Object.freeze({
      protect,
      getClient
    });

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        protect().catch((error) => {
          console.error(
            "[Admin Auth] Unexpected protection error:",
            error
          );
        });
      },
      {
        once: true
      }
    );
  } else {
    protect().catch((error) => {
      console.error(
        "[Admin Auth] Unexpected protection error:",
        error
      );
    });
  }
})();
