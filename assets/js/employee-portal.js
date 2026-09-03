/* ============================================================
   SCREENINGS4U
   EMPLOYEE PORTAL SHELL
   employee-portal.js
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", initializeEmployeePortal);

  /* ==========================================================
     INITIALIZE
     ========================================================== */

  function initializeEmployeePortal() {
    injectEmployeeSidebar();
    injectEmployeeHeader();
    injectSidebarReopenButton();

    setActiveNavigation();
    initializeSidebarControls();
    initializeNavigationAccordion();
    initializeMobileNavigation();
    initializeAccountMenu();
    initializeNotificationButton();
    initializeSignOutButtons();

    applyPageMetadata();
  }


  /* ==========================================================
     SIDEBAR
     ========================================================== */

  function injectEmployeeSidebar() {
    const sidebarTarget = document.getElementById(
      "employee-portal-sidebar"
    );

    if (!sidebarTarget) {
      return;
    }

    sidebarTarget.innerHTML = getSidebarMarkup();
  }


  function getSidebarMarkup() {
    return `
      <aside class="employee-sidebar" id="employee-sidebar" aria-label="Employee portal navigation">
        <div class="employee-sidebar-inner">
          <div class="employee-sidebar-brand">
            <a href="employee-dashboard.html" class="employee-sidebar-logo-link" aria-label="Screenings4u Employee Portal">
              <img src="images/logo.png" alt="screenings4u" class="employee-sidebar-logo" />
              <div class="employee-sidebar-brand-copy">
                <span class="employee-sidebar-brand-label">Employee Portal</span>
              </div>
            </a>

            <button type="button"
                    class="employee-sidebar-collapse"
                    id="employee-sidebar-collapse"
                    aria-label="Collapse sidebar"
                    title="Collapse sidebar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
            </button>
          </div>

          <div class="employee-sidebar-scroll">

            <div class="employee-nav-group">
              <span class="employee-nav-label">Overview</span>
              <nav class="employee-nav">
                <a href="employee-welcome.html" class="employee-nav-link" data-employee-page="employee-welcome.html">
                  <span class="employee-nav-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M3 11.5 12 4l9 7.5"></path>
                      <path d="M5.5 10.5V20h13v-9.5"></path>
                      <path d="M9.5 20v-6h5v6"></path>
                    </svg>
                  </span>
                  <span class="employee-nav-text">Welcome</span>
                </a>

                <a href="employee-dashboard.html" class="employee-nav-link" data-employee-page="employee-dashboard.html">
                  <span class="employee-nav-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                      <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                      <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                      <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                    </svg>
                  </span>
                  <span class="employee-nav-text">Dashboard</span>
                </a>

                <a href="employee-notifications.html" class="employee-nav-link" data-employee-page="employee-notifications.html">
                  <span class="employee-nav-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
                      <path d="M10 21h4"></path>
                    </svg>
                  </span>
                  <span class="employee-nav-text">Notifications</span>
                  <span class="employee-nav-badge" id="employee-notification-count" style="display:none;">0</span>
                </a>
              </nav>
            </div>

            <div class="employee-nav-group">
              <span class="employee-nav-label">Training</span>
              <nav class="employee-nav">
                <a href="employee-courses.html" class="employee-nav-link" data-employee-page="employee-courses.html">
                  <span class="employee-nav-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M3 5h8a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H3z"></path>
                      <path d="M21 5h-8a3 3 0 0 0-3 3v11a3 3 0 0 1 3-3h8z"></path>
                    </svg>
                  </span>
                  <span class="employee-nav-text">My Courses</span>
                </a>

                <a href="employee-training-progress.html" class="employee-nav-link" data-employee-page="employee-training-progress.html">
                  <span class="employee-nav-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 19V9"></path>
                      <path d="M10 19V5"></path>
                      <path d="M16 19v-7"></path>
                      <path d="M22 19V3"></path>
                    </svg>
                  </span>
                  <span class="employee-nav-text">Training Progress</span>
                </a>

                <a href="employee-certificates.html" class="employee-nav-link" data-employee-page="employee-certificates.html">
                  <span class="employee-nav-icon">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="5"></circle>
                      <path d="m8.5 12.5-1 8 4.5-2 4.5 2-1-8"></path>
                    </svg>
                  </span>
                  <span class="employee-nav-text">Certificates</span>
                </a>
              </nav>
            </div>

            <div class="employee-nav-group">
              <span class="employee-nav-label">Account & Support</span>
              <nav class="employee-nav">
                <a href="employee-account.html" class="employee-nav-link" data-employee-page="employee-account.html">
                  <span class="employee-nav-icon">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4"></circle>
                      <path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6"></path>
                    </svg>
                  </span>
                  <span class="employee-nav-text">My Account</span>
                </a>

                <a href="employee-contact-employer.html" class="employee-nav-link" data-employee-page="employee-contact-employer.html">
                  <span class="employee-nav-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 4h16v13H8l-4 4z"></path>
                      <path d="M8 9h8"></path>
                      <path d="M8 13h5"></path>
                    </svg>
                  </span>
                  <span class="employee-nav-text">Contact Employer</span>
                </a>
              </nav>
            </div>

          </div>

          <div class="employee-sidebar-footer">
            <div class="employee-sidebar-footer-links">
              <a href="https://screenings4u.com" class="employee-footer-link">
                <span class="employee-footer-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M19 12H5"></path>
                    <path d="m12 19-7-7 7-7"></path>
                  </svg>
                </span>
                <span class="employee-footer-text">Back to Screenings4u</span>
              </a>

              <button type="button" class="employee-footer-link sign-out" data-employee-sign-out>
                <span class="employee-footer-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M10 17l5-5-5-5"></path>
                    <path d="M15 12H3"></path>
                    <path d="M21 19V5a2 2 0 0 0-2-2h-6"></path>
                  </svg>
                </span>
                <span class="employee-footer-text">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div class="employee-sidebar-overlay" id="employee-sidebar-overlay" aria-hidden="true"></div>
    `;
  }

  /* ==========================================================
     HEADER
     ========================================================== */

  function injectEmployeeHeader() {
    const headerTarget = document.getElementById(
      "employee-portal-header"
    );

    if (!headerTarget) {
      return;
    }

    const pageTitle =
      document.body.getAttribute("data-page-title") ||
      "Employee Portal";

    const pageSubtitle =
      document.body.getAttribute("data-page-subtitle") ||
      "Access your training, progress, certificates, and account.";

    headerTarget.className = "employee-portal-header";

    headerTarget.innerHTML = `
      <div class="employee-header-left">

        <!-- MOBILE MENU -->

        <button
          type="button"
          class="employee-mobile-menu"
          id="employee-mobile-menu"
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16"></path>
            <path d="M4 12h16"></path>
            <path d="M4 17h16"></path>
          </svg>
        </button>


        <!-- PAGE TITLE -->

        <div class="employee-header-title-wrap">

          <h1 class="employee-header-title">
            ${escapeHtml(pageTitle)}
          </h1>

          <p class="employee-header-subtitle">
            ${escapeHtml(pageSubtitle)}
          </p>

        </div>

      </div>


      <div class="employee-header-right">

        <!-- NOTIFICATIONS -->

        <button
          type="button"
          class="employee-header-icon-button"
          id="employee-header-notifications"
          aria-label="View notifications"
          title="Notifications"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
            <path d="M10 21h4"></path>
          </svg>

          <span
            class="employee-notification-indicator"
            id="employee-header-notification-indicator"
            style="display: none;"
          ></span>
        </button>


        <!-- ACCOUNT MENU -->

        <div
          class="employee-account-menu"
          id="employee-account-menu"
        >

          <button
            type="button"
            class="employee-account-trigger"
            id="employee-account-trigger"
            aria-haspopup="true"
            aria-expanded="false"
          >

            <span
              class="employee-account-avatar"
              id="employee-account-avatar"
            >
            </span>


            <span class="employee-account-copy">

              <span
                class="employee-account-name"
                id="employee-account-name"
              >
              </span>

              <span class="employee-account-role">
                Employee Account
              </span>

            </span>


            <svg
              class="employee-account-chevron"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6"></path>
            </svg>

          </button>


          <!-- ACCOUNT DROPDOWN -->

          <div
            class="employee-account-dropdown"
            id="employee-account-dropdown"
          >

            <div class="employee-account-dropdown-user">

              <span
                class="employee-dropdown-name"
                id="employee-dropdown-name"
              >
              </span>

              <span
                class="employee-dropdown-email"
                id="employee-dropdown-email"
              >
              </span>

            </div>


            <div class="employee-dropdown-links">

              <a
                href="employee-account.html"
                class="employee-dropdown-link"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                  ></circle>

                  <path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6"></path>
                </svg>

                My Account
              </a>


              <a
                href="employee-contact-employer.html"
                class="employee-dropdown-link"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                  ></rect>

                  <path d="M3 10h18"></path>
                </svg>

                Contact Employer
              </a>


              <button
                type="button"
                class="employee-dropdown-link sign-out"
                data-employee-sign-out
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 17l5-5-5-5"></path>
                  <path d="M15 12H3"></path>
                  <path d="M21 19V5a2 2 0 0 0-2-2h-6"></path>
                </svg>

                Sign Out
              </button>

            </div>

          </div>

        </div>

      </div>
    `;
  }


  /* ==========================================================
     SIDEBAR REOPEN BUTTON
     ========================================================== */

  function injectSidebarReopenButton() {
    if (
      document.getElementById(
        "employee-sidebar-reopen"
      )
    ) {
      return;
    }

    const button = document.createElement(
      "button"
    );

    button.type = "button";
    button.id = "employee-sidebar-reopen";
    button.className = "employee-sidebar-reopen";

    button.setAttribute(
      "aria-label",
      "Expand sidebar"
    );

    button.setAttribute(
      "title",
      "Expand sidebar"
    );

    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9 18 6-6-6-6"></path>
      </svg>
    `;

    document.body.appendChild(button);

    button.addEventListener(
      "click",
      expandSidebar
    );
  }


  /* ==========================================================
     ACTIVE NAVIGATION
     ========================================================== */

  function setActiveNavigation() {
    const currentPage =
      window.location.pathname
        .split("/")
        .pop() ||
      "employee-dashboard.html";

    const navigationLinks =
      document.querySelectorAll(
        ".employee-nav-link[data-employee-page]"
      );

    navigationLinks.forEach(function (link) {
      const page =
        link.getAttribute(
          "data-employee-page"
        );

      link.classList.remove("active");

      if (page === currentPage) {
        link.classList.add("active");
      }
    });
  }


  /* ==========================================================
     NAVIGATION ACCORDION
     ========================================================== */

  function initializeNavigationAccordion() {
    const groups = Array.from(
      document.querySelectorAll(".employee-nav-group")
    );

    if (!groups.length) {
      return;
    }

    let activeGroup = null;

    groups.forEach(function (group) {
      const label = group.querySelector(".employee-nav-label");
      const nav = group.querySelector(".employee-nav");
      const activeLink = group.querySelector(
        ".employee-nav-link.active"
      );

      if (!label || !nav) {
        return;
      }

      // Make the existing label behave like an accordion trigger.
      label.setAttribute("role", "button");
      label.setAttribute("tabindex", "0");
      label.setAttribute("aria-expanded", "false");
      label.style.cursor = "pointer";

      // Preserve comfortable spacing between collapsed sections
      // without changing employer-portal.css.
      group.style.marginBottom = "10px";
      label.style.paddingTop = "10px";
      label.style.paddingBottom = "10px";

      if (activeLink) {
        activeGroup = group;
      }
    });

    // If no page link is active, keep the first group open.
    if (!activeGroup) {
      activeGroup = groups[0];
    }

    function openGroup(targetGroup) {
      groups.forEach(function (group) {
        const label = group.querySelector(
          ".employee-nav-label"
        );

        const nav = group.querySelector(
          ".employee-nav"
        );

        const isOpen = group === targetGroup;

        group.classList.toggle(
          "employee-nav-group-open",
          isOpen
        );

        if (label) {
          label.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
          );
        }

        if (nav) {
          // Inline display control keeps this change JS-only and
          // does not require any modifications to employer-portal.css.
          nav.style.display = isOpen ? "" : "none";

          if (isOpen) {
            // Restore breathing room between the section heading
            // and its navigation links.
            nav.style.paddingTop = "4px";
            nav.style.paddingBottom = "6px";
          }
        }
      });
    }

    groups.forEach(function (group) {
      const label = group.querySelector(
        ".employee-nav-label"
      );

      if (!label) {
        return;
      }

      label.addEventListener(
        "click",
        function () {
          openGroup(group);
        }
      );

      label.addEventListener(
        "keydown",
        function (event) {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            openGroup(group);
          }
        }
      );
    });

    openGroup(activeGroup);
  }


  /* ==========================================================
     SIDEBAR CONTROLS
     ========================================================== */

  function initializeSidebarControls() {
    const collapseButton =
      document.getElementById(
        "employee-sidebar-collapse"
      );

    if (collapseButton) {
      collapseButton.addEventListener(
        "click",
        collapseSidebar
      );
    }


    const storedState =
      localStorage.getItem(
        "employeePortalSidebarCollapsed"
      );

    if (
      storedState === "true" &&
      window.innerWidth > 860
    ) {
      document.body.classList.add(
        "employee-sidebar-collapsed"
      );
    }
  }


  function collapseSidebar() {
    if (window.innerWidth <= 860) {
      return;
    }

    document.body.classList.add(
      "employee-sidebar-collapsed"
    );

    localStorage.setItem(
      "employeePortalSidebarCollapsed",
      "true"
    );
  }


  function expandSidebar() {
    document.body.classList.remove(
      "employee-sidebar-collapsed"
    );

    localStorage.setItem(
      "employeePortalSidebarCollapsed",
      "false"
    );
  }


  /* ==========================================================
     MOBILE NAVIGATION
     ========================================================== */

  function initializeMobileNavigation() {
    const menuButton =
      document.getElementById(
        "employee-mobile-menu"
      );

    const sidebar =
      document.getElementById(
        "employee-sidebar"
      );

    const overlay =
      document.getElementById(
        "employee-sidebar-overlay"
      );

    if (
      !menuButton ||
      !sidebar ||
      !overlay
    ) {
      return;
    }


    menuButton.addEventListener(
      "click",
      openMobileSidebar
    );

    overlay.addEventListener(
      "click",
      closeMobileSidebar
    );


    const navigationLinks =
      sidebar.querySelectorAll(
        ".employee-nav-link"
      );

    navigationLinks.forEach(function (link) {
      link.addEventListener(
        "click",
        closeMobileSidebar
      );
    });


    window.addEventListener(
      "resize",
      function () {
        if (window.innerWidth > 860) {
          closeMobileSidebar();
        }
      }
    );
  }


  function openMobileSidebar() {
    const sidebar =
      document.getElementById(
        "employee-sidebar"
      );

    const overlay =
      document.getElementById(
        "employee-sidebar-overlay"
      );

    if (!sidebar || !overlay) {
      return;
    }

    sidebar.classList.add(
      "mobile-open"
    );

    overlay.classList.add(
      "active"
    );

    document.body.classList.add(
      "sidebar-open"
    );
  }


  function closeMobileSidebar() {
    const sidebar =
      document.getElementById(
        "employee-sidebar"
      );

    const overlay =
      document.getElementById(
        "employee-sidebar-overlay"
      );

    if (sidebar) {
      sidebar.classList.remove(
        "mobile-open"
      );
    }

    if (overlay) {
      overlay.classList.remove(
        "active"
      );
    }

    document.body.classList.remove(
      "sidebar-open"
    );
  }


  /* ==========================================================
     ACCOUNT MENU
     ========================================================== */

  function initializeAccountMenu() {
    const menu =
      document.getElementById(
        "employee-account-menu"
      );

    const trigger =
      document.getElementById(
        "employee-account-trigger"
      );

    if (!menu || !trigger) {
      return;
    }


    trigger.addEventListener(
      "click",
      function (event) {
        event.stopPropagation();

        const isOpen =
          menu.classList.toggle("open");

        trigger.setAttribute(
          "aria-expanded",
          isOpen ? "true" : "false"
        );
      }
    );


    document.addEventListener(
      "click",
      function (event) {
        if (!menu.contains(event.target)) {
          menu.classList.remove("open");

          trigger.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );


    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Escape") {
          menu.classList.remove("open");

          trigger.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );
  }


  /* ==========================================================
     NOTIFICATIONS
     ========================================================== */

  function initializeNotificationButton() {
    const button =
      document.getElementById(
        "employee-header-notifications"
      );

    if (!button) {
      return;
    }

    button.addEventListener(
      "click",
      function () {
        window.location.href =
          "employee-notifications.html";
      }
    );
  }


  /* ==========================================================
     NOTIFICATION COUNT
     ========================================================== */

  window.updateEmployeeNotificationCount =
    function (count) {

      const numericCount =
        Number(count) || 0;

      const navBadge =
        document.getElementById(
          "employee-notification-count"
        );

      const headerIndicator =
        document.getElementById(
          "employee-header-notification-indicator"
        );


      if (navBadge) {

        navBadge.textContent =
          numericCount;

        navBadge.style.display =
          numericCount > 0
            ? ""
            : "none";
      }


      if (headerIndicator) {

        headerIndicator.style.display =
          numericCount > 0
            ? ""
            : "none";
      }
    };


  /* ==========================================================
     EMPLOYER USER UPDATE
     ========================================================== */

  window.updateEmployeePortalUser =
    function (user) {

      if (!user) {
        return;
      }


      const name =
        user.fullName ||
        user.name ||
        "";

      const email =
        user.email ||
        "";

      const initials =
        getInitials(name);


      const accountName =
        document.getElementById(
          "employee-account-name"
        );

      const dropdownName =
        document.getElementById(
          "employee-dropdown-name"
        );

      const dropdownEmail =
        document.getElementById(
          "employee-dropdown-email"
        );

      const avatar =
        document.getElementById(
          "employee-account-avatar"
        );


      if (accountName) {
        accountName.textContent = name;
      }

      if (dropdownName) {
        dropdownName.textContent = name;
      }

      if (dropdownEmail) {
        dropdownEmail.textContent = email;
      }

      if (avatar) {
        avatar.textContent = initials;
      }
    };


  /* ==========================================================
     SIGN OUT
     ========================================================== */

  function initializeSignOutButtons() {
    const buttons =
      document.querySelectorAll(
        "[data-employee-sign-out]"
      );

    buttons.forEach(function (button) {
      button.addEventListener(
        "click",
        async function () {
          if (button.disabled) {
            return;
          }

          button.disabled = true;

          try {
            let client = null;

            if (
              typeof window.getScreenings4uSupabase ===
              "function"
            ) {
              client =
                await window.getScreenings4uSupabase();
            } else {
              client =
                window.screenings4uSupabase ||
                window.supabaseClient ||
                null;
            }

            if (!client?.auth) {
              throw new Error(
                "Supabase auth client is unavailable."
              );
            }

            const { error } =
              await client.auth.signOut({
                scope: "local"
              });

            if (error) {
              throw error;
            }

          } catch (error) {
            console.error(
              "[Employee Portal] Sign out failed:",
              error
            );

            button.disabled = false;

            alert(
              "We could not sign you out. Please try again."
            );

            return;
          }

          window.location.replace(
            "employee-login.html"
          );
        }
      );
    });
  }


  /* ==========================================================
     PAGE METADATA
     ========================================================== */

  function applyPageMetadata() {
    const pageTitle =
      document.body.getAttribute(
        "data-page-title"
      );

    if (pageTitle) {
      document.title =
        pageTitle +
        " | Screenings4u";
    }
  }


  /* ==========================================================
     UTILITIES
     ========================================================== */

  function getInitials(name) {
    if (!name) {
      return "";
    }

    const parts =
      String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
      return "";
    }

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }


  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

})();