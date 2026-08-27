/* ============================================================
   SCREENINGS4U LEARNING CENTER
   SHARED LMS APPLICATION JAVASCRIPT
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initializeLmsShell();
  });

  function initializeLmsShell() {
    initializeMobileNavigation();
    initializeNavigationState();
    initializeUserMenu();
  }

  /* ==========================================================
     MOBILE NAVIGATION
     ========================================================== */

  function initializeMobileNavigation() {
    const menuButton = document.querySelector(
      "[data-lms-menu-toggle]"
    );

    const overlay = document.querySelector(
      "[data-lms-sidebar-overlay]"
    );

    if (menuButton) {
      menuButton.addEventListener("click", function () {
        document.body.classList.toggle("lms-sidebar-open");
      });
    }

    if (overlay) {
      overlay.addEventListener("click", function () {
        document.body.classList.remove("lms-sidebar-open");
      });
    }

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) {
        document.body.classList.remove("lms-sidebar-open");
      }
    });
  }

  /* ==========================================================
     ACTIVE NAVIGATION
     ========================================================== */

  function initializeNavigationState() {
    const currentPage =
      window.location.pathname.split("/").pop() ||
      "admin-lms-courses.html";

    const navigationLinks =
      document.querySelectorAll(".lms-nav-link");

    navigationLinks.forEach(function (link) {
      const href = link.getAttribute("href");

      if (!href) return;

      if (href === currentPage) {
        link.classList.add("active");
      }
    });
  }

  /* ==========================================================
     USER MENU PLACEHOLDER
     ========================================================== */

  function initializeUserMenu() {
    const userButton = document.querySelector(
      "[data-lms-user-button]"
    );

    if (!userButton) return;

    userButton.addEventListener("click", function () {
      /*
       * User menu will be connected later to:
       *
       * - Supabase authentication
       * - Current user profile
       * - Sign out
       * - Account settings
       */
    });
  }

  /* ==========================================================
     GLOBAL LMS UTILITIES
     ========================================================== */

  window.LMS = window.LMS || {};

  window.LMS.openSidebar = function () {
    document.body.classList.add("lms-sidebar-open");
  };

  window.LMS.closeSidebar = function () {
    document.body.classList.remove("lms-sidebar-open");
  };

})();