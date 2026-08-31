/* ============================================================
   screenings4u — EMPLOYER AUTH GUARD
   Compatible with the current portal-auth-guard.js API.
   ============================================================ */
(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    if (!window.S4UPortalGuard?.protectPortal) {
      console.error("[Employer auth guard] S4UPortalGuard.protectPortal is unavailable.");
      return;
    }

    await window.S4UPortalGuard.protectPortal({
      portal: "employer",
      loginPage: "employer-login.html"
    });
  });
})();
