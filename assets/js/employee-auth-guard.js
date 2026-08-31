/* ===== employee-auth-guard.js ===== */

document.addEventListener("DOMContentLoaded", () => {
  if (!window.S4UPortalGuard || typeof window.S4UPortalGuard.protectPortal !== "function") {
    console.error("[Employee Auth Guard] S4UPortalGuard.protectPortal is unavailable.");
    window.location.replace("employee-login.html");
    return;
  }

  window.S4UPortalGuard.protectPortal({
    portal: "employee",
    loginPage: "employee-login.html",
    fallback: "employee-dashboard.html"
  });
});
