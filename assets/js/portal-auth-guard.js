/* ============================================================
   screenings4u — PORTAL AUTH GUARD
   Compatible with the current core-auth.js API.
   ============================================================ */

(() => {
  "use strict";

  async function protectPortal({
    portal,
    loginPage = null
  } = {}) {
    if (!portal) {
      throw new Error(
        "S4UPortalGuard.protectPortal requires a portal name."
      );
    }

    try {
      if (
        !window.S4UAuth ||
        typeof window.S4UAuth.requireAuth !== "function"
      ) {
        throw new Error(
          "S4UAuth.requireAuth is unavailable. Load core-auth.js first."
        );
      }

      const state =
        await window.S4UAuth.requireAuth({
          portal,
          loginPage
        });

      if (!state) {
        return null;
      }

      document.documentElement.classList.add(
        "s4u-authenticated"
      );

      window.dispatchEvent(
        new CustomEvent("s4u:authenticated", {
          detail: state
        })
      );

      return state;

    } catch (error) {
      console.error(
        `[${portal} portal guard]`,
        error
      );

      window.S4UUI?.toast?.(
        "We could not verify your account. Please sign in again.",
        "error"
      );

      const destination =
        loginPage ||
        window.S4UAuth?.getLoginForPortal?.(portal) ||
        "customer-login.html";

      window.setTimeout(() => {
        window.location.replace(destination);
      }, 500);

      return null;
    }
  }

  window.S4UPortalGuard =
    Object.freeze({
      protectPortal
    });
})();