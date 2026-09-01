/* SCREENINGS4U — STRICT PORTAL AUTH GUARD */

(() => {
  "use strict";

  async function protectPortal({
    portal,
    loginPage = null
  } = {}) {

    if (!portal) {
      throw new Error("Portal name is required.");
    }

    const destination =
      loginPage ||
      window.S4UAuth?.getLoginForPortal?.(portal) ||
      `${portal}-login.html`;

    try {

      if (
        !window.S4UAuth ||
        typeof window.S4UAuth.requireAuth !== "function"
      ) {
        throw new Error(
          "S4UAuth.requireAuth is unavailable. " +
          "Load core-auth.js before portal-auth-guard.js."
        );
      }

      const state =
        await window.S4UAuth.requireAuth({
          portal,
          loginPage: destination
        });

      if (!state) {
        /*
         * requireAuth() handles the genuine no-session or
         * unauthorized redirect itself. Do not perform another
         * redirect or sign-out here.
         */
        return null;
      }

      document.documentElement.classList.remove(
        "s4u-auth-pending"
      );

      document.documentElement.classList.add(
        "s4u-authenticated"
      );

      window.dispatchEvent(
        new CustomEvent(
          "s4u:authenticated",
          {
            detail: state
          }
        )
      );

      return state;

    } catch (error) {

      /*
       * IMPORTANT:
       * A verification/database/RLS error must not destroy a valid
       * Supabase session. The old guard signed the user out and
       * redirected on every exception, which created the login-loop
       * behavior on management pages.
       */
      console.error(
        `[${portal} portal guard]`,
        error
      );

      document.documentElement.classList.remove(
        "s4u-auth-pending"
      );

      document.documentElement.classList.add(
        "s4u-auth-error"
      );

      window.dispatchEvent(
        new CustomEvent(
          "s4u:auth-error",
          {
            detail: {
              portal,
              error
            }
          }
        )
      );

      return null;
    }
  }

  window.S4UPortalGuard =
    Object.freeze({
      protectPortal
    });
})();
