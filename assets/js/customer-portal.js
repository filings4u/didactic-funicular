/* ============================================================
   SCREENINGS4U
   CUSTOMER PORTAL SHELL
   customer-portal.js
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", initializeCustomerPortal);

  /* ==========================================================
     INITIALIZE
     ========================================================== */

  function initializeCustomerPortal() {
    injectCustomerSidebar();
    injectCustomerHeader();
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

  function injectCustomerSidebar() {
    const sidebarTarget = document.getElementById(
      "customer-portal-sidebar"
    );

    if (!sidebarTarget) {
      return;
    }

    sidebarTarget.innerHTML = getSidebarMarkup();
  }


  function getSidebarMarkup() {
    return `
      <aside
        class="customer-sidebar"
        id="customer-sidebar"
        aria-label="Customer portal navigation"
      >
        <div class="customer-sidebar-inner">

          <!-- =================================================
               BRAND
               ================================================= -->

          <div class="customer-sidebar-brand">

            <a
              href="customer-dashboard.html"
              class="customer-sidebar-logo-link"
              aria-label="Screenings4u Customer Portal"
            >
              <img
                src="images/logo.png"
                alt="screenings4u"
                class="customer-sidebar-logo"
              />

              <div class="customer-sidebar-brand-copy">
                <span class="customer-sidebar-brand-label">
                  Customer Portal
                </span>
              </div>
            </a>


            <button
              type="button"
              class="customer-sidebar-collapse"
              id="customer-sidebar-collapse"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
            </button>

          </div>


          <!-- =================================================
               NAVIGATION
               ================================================= -->

          <div class="customer-sidebar-scroll">

            <!-- OVERVIEW -->

            <div class="customer-nav-group">

              <span class="customer-nav-label">
                Overview
              </span>

              <nav class="customer-nav">

                <a
                  href="customer-dashboard.html"
                  class="customer-nav-link"
                  data-customer-page="customer-dashboard.html"
                >
                  <span class="customer-nav-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect
                        x="3"
                        y="3"
                        width="7"
                        height="7"
                        rx="1"
                      ></rect>

                      <rect
                        x="14"
                        y="3"
                        width="7"
                        height="7"
                        rx="1"
                      ></rect>

                      <rect
                        x="3"
                        y="14"
                        width="7"
                        height="7"
                        rx="1"
                      ></rect>

                      <rect
                        x="14"
                        y="14"
                        width="7"
                        height="7"
                        rx="1"
                      ></rect>
                    </svg>
                  </span>

                  <span class="customer-nav-text">
                    Dashboard
                  </span>
                </a>

              </nav>

            </div>


            <!-- MY SERVICES -->

            <div class="customer-nav-group">

              <span class="customer-nav-label">
                My Services
              </span>

              <nav class="customer-nav">


                <!-- ORDERS -->

                <a
                  href="customer-orders.html"
                  class="customer-nav-link"
                  data-customer-page="customer-orders.html"
                >
                  <span class="customer-nav-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 3h12"></path>
                      <path d="M6 7h12"></path>
                      <path d="M6 11h12"></path>
                      <path d="M6 15h8"></path>
                      <path d="M4 3h.01"></path>
                      <path d="M4 7h.01"></path>
                      <path d="M4 11h.01"></path>
                      <path d="M4 15h.01"></path>
                    </svg>
                  </span>

                  <span class="customer-nav-text">
                    Orders
                  </span>
                </a>


                <!-- RESULTS -->

                <a
                  href="customer-results.html"
                  class="customer-nav-link"
                  data-customer-page="customer-results.html"
                >
                  <span class="customer-nav-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 3h7l4 4v14H7z"></path>
                      <path d="M14 3v5h5"></path>
                      <path d="M9 13l2 2 4-4"></path>
                    </svg>
                  </span>

                  <span class="customer-nav-text">
                    Results
                  </span>
                </a>


                <!-- DONOR PASS -->

                <a
                  href="customer-donor-pass.html"
                  class="customer-nav-link"
                  data-customer-page="customer-donor-pass.html"
                >
                  <span class="customer-nav-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                      ></rect>

                      <circle
                        cx="8"
                        cy="12"
                        r="2"
                      ></circle>

                      <path d="M13 10h5"></path>
                      <path d="M13 14h5"></path>
                    </svg>
                  </span>

                  <span class="customer-nav-text">
                    Donor Pass
                  </span>
                </a>


                <!-- DOCUMENTS -->

                <a
                  href="customer-documents.html"
                  class="customer-nav-link"
                  data-customer-page="customer-documents.html"
                >
                  <span class="customer-nav-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <path d="M14 2v6h6"></path>
                      <path d="M8 13h8"></path>
                      <path d="M8 17h5"></path>
                    </svg>
                  </span>

                  <span class="customer-nav-text">
                    Documents
                  </span>
                </a>


                <!-- NOTIFICATIONS -->

                <a
                  href="customer-notifications.html"
                  class="customer-nav-link"
                  data-customer-page="customer-notifications.html"
                >
                  <span class="customer-nav-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
                      <path d="M10 21h4"></path>
                    </svg>
                  </span>

                  <span class="customer-nav-text">
                    Notifications
                  </span>

                  <span
                    class="customer-nav-badge"
                    id="customer-notification-count"
                    style="display: none;"
                  >
                    0
                  </span>
                </a>

              </nav>

            </div>


            <!-- PURCHASE -->

            <div class="customer-nav-group">

              <span class="customer-nav-label">
                Purchase
              </span>

              <nav class="customer-nav">

                <a
                  href="customer-catalog.html"
                  class="customer-nav-link"
                  data-customer-page="customer-catalog.html"
                >
                  <span class="customer-nav-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="9" cy="20" r="1"></circle>
                      <circle cx="20" cy="20" r="1"></circle>
                      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L22 6H6"></path>
                    </svg>
                  </span>

                  <span class="customer-nav-text">
                    Service Catalog
                  </span>
                </a>

              </nav>

            </div>


            <!-- ACCOUNT -->

            <div class="customer-nav-group">

              <span class="customer-nav-label">
                Account
              </span>

              <nav class="customer-nav">


                <!-- BILLING -->

                <a
                  href="customer-billing.html"
                  class="customer-nav-link"
                  data-customer-page="customer-billing.html"
                >
                  <span class="customer-nav-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                      ></rect>

                      <path d="M3 10h18"></path>
                      <path d="M7 15h2"></path>
                    </svg>
                  </span>

                  <span class="customer-nav-text">
                    Billing &amp; Receipts
                  </span>
                </a>


                <!-- ACCOUNT -->

                <a
                  href="customer-account.html"
                  class="customer-nav-link"
                  data-customer-page="customer-account.html"
                >
                  <span class="customer-nav-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                      ></circle>

                      <path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6"></path>
                    </svg>
                  </span>

                  <span class="customer-nav-text">
                    My Account
                  </span>
                </a>

              </nav>

            </div>

          </div>


          <!-- =================================================
               SIDEBAR FOOTER
               ================================================= -->

          <div class="customer-sidebar-footer">

            <div class="customer-sidebar-footer-links">


              <!-- BACK TO MAIN WEBSITE -->

              <a
                href="index.html"
                class="customer-footer-link"
              >
                <span class="customer-footer-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 12H5"></path>
                    <path d="m12 19-7-7 7-7"></path>
                  </svg>
                </span>

                <span class="customer-footer-text">
                  Back to Screenings4u
                </span>
              </a>


              <!-- SIGN OUT -->

              <button
                type="button"
                class="customer-footer-link sign-out"
                data-customer-sign-out
              >
                <span class="customer-footer-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10 17l5-5-5-5"></path>
                    <path d="M15 12H3"></path>
                    <path d="M21 19V5a2 2 0 0 0-2-2h-6"></path>
                  </svg>
                </span>

                <span class="customer-footer-text">
                  Sign Out
                </span>
              </button>

            </div>

          </div>

        </div>
      </aside>


      <!-- MOBILE OVERLAY -->

      <div
        class="customer-sidebar-overlay"
        id="customer-sidebar-overlay"
        aria-hidden="true"
      ></div>
    `;
  }


  /* ==========================================================
     HEADER
     ========================================================== */

  function injectCustomerHeader() {
    const headerTarget = document.getElementById(
      "customer-portal-header"
    );

    if (!headerTarget) {
      return;
    }

    const pageTitle =
      document.body.getAttribute("data-page-title") ||
      "Customer Portal";

    const pageSubtitle =
      document.body.getAttribute("data-page-subtitle") ||
      "Manage your Screenings4u services and account.";

    headerTarget.className = "customer-portal-header";

    headerTarget.innerHTML = `
      <div class="customer-header-left">

        <!-- MOBILE MENU -->

        <button
          type="button"
          class="customer-mobile-menu"
          id="customer-mobile-menu"
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16"></path>
            <path d="M4 12h16"></path>
            <path d="M4 17h16"></path>
          </svg>
        </button>


        <!-- PAGE TITLE -->

        <div class="customer-header-title-wrap">

          <h1 class="customer-header-title">
            ${escapeHtml(pageTitle)}
          </h1>

          <p class="customer-header-subtitle">
            ${escapeHtml(pageSubtitle)}
          </p>

        </div>

      </div>


      <div class="customer-header-right">

        <!-- NOTIFICATIONS -->

        <button
          type="button"
          class="customer-header-icon-button"
          id="customer-header-notifications"
          aria-label="View notifications"
          title="Notifications"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
            <path d="M10 21h4"></path>
          </svg>

          <span
            class="customer-notification-indicator"
            id="customer-header-notification-indicator"
            style="display: none;"
          ></span>
        </button>


        <!-- ACCOUNT MENU -->

        <div
          class="customer-account-menu"
          id="customer-account-menu"
        >

          <button
            type="button"
            class="customer-account-trigger"
            id="customer-account-trigger"
            aria-haspopup="true"
            aria-expanded="false"
          >

            <span
              class="customer-account-avatar"
              id="customer-account-avatar"
            >
              CU
            </span>


            <span class="customer-account-copy">

              <span
                class="customer-account-name"
                id="customer-account-name"
              >
                Customer
              </span>

              <span class="customer-account-role">
                Customer Account
              </span>

            </span>


            <svg
              class="customer-account-chevron"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6"></path>
            </svg>

          </button>


          <!-- ACCOUNT DROPDOWN -->

          <div
            class="customer-account-dropdown"
            id="customer-account-dropdown"
          >

            <div class="customer-account-dropdown-user">

              <span
                class="customer-dropdown-name"
                id="customer-dropdown-name"
              >
                Customer
              </span>

              <span
                class="customer-dropdown-email"
                id="customer-dropdown-email"
              >
                customer@example.com
              </span>

            </div>


            <div class="customer-dropdown-links">

              <a
                href="customer-account.html"
                class="customer-dropdown-link"
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
                href="customer-billing.html"
                class="customer-dropdown-link"
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

                Billing
              </a>


              <button
                type="button"
                class="customer-dropdown-link sign-out"
                data-customer-sign-out
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
        "customer-sidebar-reopen"
      )
    ) {
      return;
    }

    const button = document.createElement(
      "button"
    );

    button.type = "button";
    button.id = "customer-sidebar-reopen";
    button.className = "customer-sidebar-reopen";

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
      "customer-dashboard.html";

    const navigationLinks =
      document.querySelectorAll(
        ".customer-nav-link[data-customer-page]"
      );

    navigationLinks.forEach(function (link) {
      const page =
        link.getAttribute(
          "data-customer-page"
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
      document.querySelectorAll(".customer-nav-group")
    );

    if (!groups.length) {
      return;
    }

    let activeGroup = null;

    groups.forEach(function (group) {
      const label = group.querySelector(".customer-nav-label");
      const nav = group.querySelector(".customer-nav");
      const activeLink = group.querySelector(
        ".customer-nav-link.active"
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
      // without changing customer-portal.css.
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
          ".customer-nav-label"
        );

        const nav = group.querySelector(
          ".customer-nav"
        );

        const isOpen = group === targetGroup;

        group.classList.toggle(
          "customer-nav-group-open",
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
          // does not require any modifications to customer-portal.css.
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
        ".customer-nav-label"
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
        "customer-sidebar-collapse"
      );

    if (collapseButton) {
      collapseButton.addEventListener(
        "click",
        collapseSidebar
      );
    }


    const storedState =
      localStorage.getItem(
        "customerPortalSidebarCollapsed"
      );

    if (
      storedState === "true" &&
      window.innerWidth > 860
    ) {
      document.body.classList.add(
        "customer-sidebar-collapsed"
      );
    }
  }


  function collapseSidebar() {
    if (window.innerWidth <= 860) {
      return;
    }

    document.body.classList.add(
      "customer-sidebar-collapsed"
    );

    localStorage.setItem(
      "customerPortalSidebarCollapsed",
      "true"
    );
  }


  function expandSidebar() {
    document.body.classList.remove(
      "customer-sidebar-collapsed"
    );

    localStorage.setItem(
      "customerPortalSidebarCollapsed",
      "false"
    );
  }


  /* ==========================================================
     MOBILE NAVIGATION
     ========================================================== */

  function initializeMobileNavigation() {
    const menuButton =
      document.getElementById(
        "customer-mobile-menu"
      );

    const sidebar =
      document.getElementById(
        "customer-sidebar"
      );

    const overlay =
      document.getElementById(
        "customer-sidebar-overlay"
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
        ".customer-nav-link"
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
        "customer-sidebar"
      );

    const overlay =
      document.getElementById(
        "customer-sidebar-overlay"
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
        "customer-sidebar"
      );

    const overlay =
      document.getElementById(
        "customer-sidebar-overlay"
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
        "customer-account-menu"
      );

    const trigger =
      document.getElementById(
        "customer-account-trigger"
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
        "customer-header-notifications"
      );

    if (!button) {
      return;
    }

    button.addEventListener(
      "click",
      function () {
        window.location.href =
          "customer-notifications.html";
      }
    );
  }


  /* ==========================================================
     NOTIFICATION COUNT
     ========================================================== */

  window.updateCustomerNotificationCount =
    function (count) {

      const numericCount =
        Number(count) || 0;

      const navBadge =
        document.getElementById(
          "customer-notification-count"
        );

      const headerIndicator =
        document.getElementById(
          "customer-header-notification-indicator"
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
     CUSTOMER USER UPDATE
     ========================================================== */

  window.updateCustomerPortalUser =
    function (user) {

      if (!user) {
        return;
      }


      const name =
        user.fullName ||
        user.name ||
        "Customer";

      const email =
        user.email ||
        "";

      const initials =
        getInitials(name);


      const accountName =
        document.getElementById(
          "customer-account-name"
        );

      const dropdownName =
        document.getElementById(
          "customer-dropdown-name"
        );

      const dropdownEmail =
        document.getElementById(
          "customer-dropdown-email"
        );

      const avatar =
        document.getElementById(
          "customer-account-avatar"
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


function initializeSignOutButtons() {
  const buttons =
    document.querySelectorAll(
      "[data-customer-sign-out]"
    );

  buttons.forEach(function (button) {

    button.addEventListener(
      "click",
      async function (event) {

        event.preventDefault();

        if (button.disabled) {
          return;
        }

        button.disabled = true;

        try {

          if (
            window.S4UAuth &&
            typeof window.S4UAuth.signOut === "function"
          ) {

            await window.S4UAuth.signOut({
              redirectTo:
                "customer-login.html"
            });

            return;
          }

          console.error(
            "[Customer Portal] S4UAuth.signOut() is unavailable."
          );

          window.location.replace(
            "customer-login.html"
          );

        } catch (error) {

          console.error(
            "[Customer Portal] Sign-out failed:",
            error
          );

          button.disabled = false;

          alert(
            "We could not sign you out. Please try again."
          );

        }

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
      return "CU";
    }

    const parts =
      String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
      return "CU";
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