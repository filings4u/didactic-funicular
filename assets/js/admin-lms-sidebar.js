/* ============================================================

   SCREENINGS4U MANAGEMENT PORTAL

   DYNAMIC ACCORDION SIDEBAR

   Only one navigation group is open at a time.

   ============================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", initializeAdminLmsSidebar);

  function initializeAdminLmsSidebar() {
    const target = document.getElementById("admin-lms-sidebar-target");

    if (!target) return;

    target.innerHTML = getSidebarMarkup();

    const currentPage = getCurrentPage();
    const activeGroup = findActiveGroup(currentPage);

    setOpenGroup(activeGroup || null);

  bindAccordion();

bindMobileMenu();

bindSidebarCollapse();

bindUserDropdown();
    bindLogout();
  }

  function getCurrentPage() {
    return (
      window.location.pathname.split("/").pop() ||
      "admin-dashboard.html"
    );
  }


  /* ============================================================
     MANAGEMENT PORTAL NAVIGATION
     ============================================================ */

  const groups = [

    {
      id: "overview",
      label: "Dashboard",
      items: [
        {
          label: "Dashboard",
          href: "admin-dashboard.html",
          icon: "dashboard"
        }
      ]
    },

    {
      id: "employers",
      label: "Employer Management",
      items: [
        {
          label: "Employers",
          href: "admin-employers.html",
          icon: "building"
        },
        {
          label: "Employer Users",
          href: "admin-employer-users.html",
          icon: "users"
        },
        {
          label: "Employees",
          href: "admin-employees.html",
          icon: "employee"
        }
      ]
    },

    {
      id: "dot-testing",
      label: "DOT Testing",
      items: [
        {
          label: "DOT Tests",
          href: "admin-dot-tests.html",
          icon: "clipboard"
        },
        {
          label: "Test Results",
          href: "admin-test-results.html",
          icon: "results"
        },
        {
          label: "Collection / Testing",
          href: "admin-collection-testing.html",
          icon: "medical"
        }
      ]
    },

    {
      id: "random-testing",
      label: "Random Testing",
      items: [
        {
          label: "Random Programs",
          href: "admin-random-programs.html",
          icon: "random"
        },
        {
          label: "Program Employers",
          href: "admin-random-program-employers.html",
          icon: "building"
        },
        {
          label: "Random Selections",
          href: "admin-random-selections.html",
          icon: "selection"
        },
        {
          label: "Selection Employees",
          href: "admin-selection-employees.html",
          icon: "users"
        }
      ]
    },

    {
      id: "training",
      label: "Training",
      items: [
          {
          label: "Create Course",
          href: "admin-lms-creation.html",
          icon: "course"
        },
 
        {
          label: "Courses",
          href: "admin-lms-courses.html",
          icon: "book"
        },

              {
          label: "Quizzes",
          href: "admin-lms-quizzes.html",
          icon: "quiz"
        },

              {
          label: "Assessments",
          href: "admin-lms-assessment-builder.html",
          icon: "assessment"
        },

        {
          label: "Video Library",
          href: "admin-lms-video.html",
          icon: "video"
        },
      ]
    },

    {
      id: "crm",
      label: "CRM & Relationships",
      items: [
        {
          label: "Admin CRM",
          href: "admin-crm.html",
          icon: "crm"
        },
        {
          label: "Customer CRM",
          href: "admin-customer-crm.html",
          icon: "customer"
        },
        {
          label: "Employer CRM",
          href: "admin-employer-crm.html",
          icon: "building"
        }
      ]
    },

    {
      id: "sales",
      label: "Sales & Orders",
      items: [
        {
          label: "Orders",
          href: "admin-orders.html",
          icon: "orders"
        },
        {
          label: "Order History",
          href: "admin-order-history.html",
          icon: "history"
        },
        {
          label: "Create Order",
          href: "admin-checkout.html",
          icon: "plus"
        },
        {
          label: "Quotes",
          href: "admin-quotes.html",
          icon: "quote"
        },
        {
          label: "Proposals",
          href: "admin-proposals.html",
          icon: "document"
        },
        {
          label: "Invoices",
          href: "admin-invoices.html",
          icon: "invoice"
        }
      ]
    },

    {
      id: "scheduling",
      label: "Scheduling",
      items: [
        {
          label: "Phone Appointments",
          href: "admin-phone-scheduling.html",
          icon: "phone"
        },
        {
          label: "In-Person Appointments",
          href: "admin-in-person-scheduling.html",
          icon: "calendar"
        },
        {
          label: "Online Meetings",
          href: "admin-online-meetings.html",
          icon: "video"
        },
        {
          label: "Microsoft Teams",
          href: "admin-teams-meetings.html",
          icon: "teams"
        }
      ]
    },

    {
      id: "communication",
      label: "Communication",
      items: [
        {
          label: "Email Marketing",
          href: "admin-email-marketing.html",
          icon: "mail"
        },
        {
          label: "Customer Chat",
          href: "admin-customer-chat.html",
          icon: "chat"
        },
        {
          label: "Internal Chat",
          href: "admin-internal-chat.html",
          icon: "message"
        },
        {
          label: "Notifications",
          href: "admin-notifications.html",
          icon: "bell"
        }
      ]
    },

    {
      id: "content-support",
      label: "Content & Support",
      items: [
        {
          label: "Blog",
          href: "admin-blog.html",
          icon: "blog"
        },
        {
          label: "FAQs",
          href: "admin-faqs.html",
          icon: "faq"
        },
        {
          label: "Knowledge Base",
          href: "admin-knowledge-base.html",
          icon: "knowledge"
        },
        {
          label: "Support Tickets",
          href: "admin-support-tickets.html",
          icon: "support"
        },
        {
          label: "Documents Vault",
          href: "admin-documents.html",
          icon: "folder"
        }
      ]
    },

    {
      id: "account-access",
      label: "Account Access",
      items: [
        {
          label: "View Customer Account",
          href: "admin-customer-login.html",
          icon: "customer"
        },
        {
          label: "View Employer Account",
          href: "admin-employer-login.html",
          icon: "building"
        },
        {
          label: "View Employee Account",
          href: "admin-employee-login.html",
          icon: "employee"
        }
      ]
    },

    {
      id: "system",
      label: "System",
      items: [
        {
          label: "URL Redirects",
          href: "admin-url-redirects.html",
          icon: "globe"
        },
        {
          label: "SEO Management",
          href: "admin-seo.html",
          icon: "results"
        },
        {
          label: "Search Submission",
          href: "admin-search-submissions.html",
          icon: "globe"
        },
        {
          label: "Forms Editor",
          href: "admin-forms.html",
          icon: "document"
        },
        {
          label: "Task Manager",
          href: "admin-tasks.html",
          icon: "clipboard"
        },
        {
          label: "Accounts",
          href: "admin-accounts.html",
          icon: "users"
        },
        {
          label: "Audit Log",
          href: "admin-audit.html",
          icon: "history"
        },
        {
          label: "Global Settings",
          href: "admin-global-settings.html",
          icon: "gear"
        }
      ]
    }

  ];


  /* ============================================================
     ACTIVE GROUP
     ============================================================ */

  function findActiveGroup(page) {
    const group = groups.find(function (groupItem) {
      return groupItem.items.some(function (item) {
        return item.href === page;
      });
    });

    return group ? group.id : null;
  }


  /* ============================================================
     ICONS
     ============================================================ */

  function icon(name) {

    const icons = {

      dashboard:
        '<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"></rect>' +
        '<rect x="13.5" y="3.5" width="7" height="7" rx="1.2"></rect>' +
        '<rect x="3.5" y="13.5" width="7" height="7" rx="1.2"></rect>' +
        '<rect x="13.5" y="13.5" width="7" height="7" rx="1.2"></rect>',

      building:
        '<rect x="4" y="3" width="16" height="18" rx="1.5"></rect>' +
        '<path d="M8 7h1M12 7h1M16 7h1M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1"></path>',

      users:
        '<circle cx="9" cy="8" r="3"></circle>' +
        '<path d="M3 21c.6-4 2.7-6 6-6s5.4 2 6 6"></path>' +
        '<path d="M16 5a3 3 0 0 1 0 6M17 15c2.2.5 3.6 2.2 4 5"></path>',

      employee:
        '<circle cx="12" cy="8" r="3.5"></circle>' +
        '<path d="M5 21c.7-4.2 3.1-6.5 7-6.5s6.3 2.3 7 6.5"></path>',

      clipboard:
        '<rect x="5" y="4" width="14" height="17" rx="2"></rect>' +
        '<path d="M9 4V2h6v2M8 10h8M8 14h8M8 18h5"></path>',

      results:
        '<path d="M5 3h14v18H5z"></path>' +
        '<path d="m8 10 2 2 4-4M8 16h8"></path>',

      medical:
        '<circle cx="12" cy="12" r="9"></circle>' +
        '<path d="M12 8v8M8 12h8"></path>',

      random:
        '<path d="M4 7h3l10 10h3"></path>' +
        '<path d="M17 7h3"></path>' +
        '<path d="m17 7 3 3-3 3"></path>' +
        '<path d="M4 17h3l3-3"></path>' +
        '<path d="m17 17 3-3-3-3"></path>',

      selection:
        '<circle cx="12" cy="8" r="3"></circle>' +
        '<path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6"></path>' +
        '<path d="m16 11 2 2 3-4"></path>',

      book:
        '<rect x="3" y="4" width="18" height="16" rx="2"></rect>' +
        '<path d="M7 8h10M7 12h7M7 16h5"></path>',

      manage:
        '<rect x="4" y="4" width="16" height="16" rx="2"></rect>' +
        '<path d="M8 9h8M8 13h8M8 17h5"></path>',

      build:
        '<path d="M14 6 18 2l2 2-4 4"></path>' +
        '<path d="m4 20 7-7"></path>' +
        '<path d="M5 5h5v5H5z"></path>',

      lesson:
        '<rect x="3" y="4" width="18" height="16" rx="2"></rect>' +
        '<path d="m10 9 5 3-5 3z"></path>',

      assessment:
        '<path d="M6 3h12v18H6z"></path>' +
        '<path d="M9 8h6M9 12h6M9 16h4"></path>',

      crm:
        '<circle cx="9" cy="8" r="3"></circle>' +
        '<path d="M3 21c.6-4 2.7-6 6-6"></path>' +
        '<circle cx="17" cy="9" r="2.5"></circle>' +
        '<path d="M14 20c.5-3 2-5 4.5-5 1 0 1.8.2 2.5.6"></path>',

      customer:
        '<circle cx="12" cy="8" r="3.5"></circle>' +
        '<path d="M5 21c.7-4.2 3.1-6.5 7-6.5s6.3 2.3 7 6.5"></path>',

      orders:
        '<path d="M4 5h16l-2 14H6z"></path>' +
        '<path d="M4 5 2 2M8 9h8"></path>',

      history:
        '<path d="M3 12a9 9 0 1 0 3-6.7"></path>' +
        '<path d="M3 4v5h5"></path>' +
        '<path d="M12 7v5l3 2"></path>',

      plus:
        '<circle cx="12" cy="12" r="9"></circle>' +
        '<path d="M12 8v8M8 12h8"></path>',

      quote:
        '<path d="M7 8H4v5h4v-3H6"></path>' +
        '<path d="M17 8h-3v5h4v-3h-2"></path>',

      document:
        '<path d="M6 3h8l4 4v14H6z"></path>' +
        '<path d="M14 3v5h5M9 13h6M9 17h6"></path>',

      invoice:
        '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"></path>' +
        '<path d="M9 8h6M9 12h6M9 16h4"></path>',

      phone:
        '<path d="M6 3h3l2 5-2 2c1.5 3 2.5 4 5 5l2-2 5 2v3c0 2-2 3-4 2C9 18 6 15 4 7 3 5 4 3 6 3z"></path>',

      calendar:
        '<rect x="3" y="5" width="18" height="16" rx="2"></rect>' +
        '<path d="M16 3v4M8 3v4M3 10h18"></path>',

      video:
        '<rect x="3" y="6" width="13" height="12" rx="2"></rect>' +
        '<path d="m16 10 5-3v10l-5-3"></path>',

      teams:
        '<rect x="4" y="5" width="10" height="14" rx="2"></rect>' +
        '<path d="M8 9h5M10.5 9v6"></path>' +
        '<circle cx="18" cy="9" r="2"></circle>' +
        '<path d="M15 18c.5-3 1.5-4.5 3-4.5s2.5 1.5 3 4.5"></path>',

      mail:
        '<rect x="3" y="5" width="18" height="14" rx="2"></rect>' +
        '<path d="m3 7 9 6 9-6"></path>',

      chat:
        '<path d="M4 5h16v11H8l-4 4z"></path>' +
        '<path d="M8 10h8M8 13h5"></path>',

      message:
        '<path d="M4 5h16v11H9l-5 4z"></path>' +
        '<path d="M8 10h8M8 13h8"></path>',

      bell:
        '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>' +
        '<path d="M10 21h4"></path>',

      blog:
        '<path d="M5 3h14v18H5z"></path>' +
        '<path d="M8 8h8M8 12h8M8 16h5"></path>',

      faq:
        '<circle cx="12" cy="12" r="9"></circle>' +
        '<path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4"></path>' +
        '<path d="M12 17h.01"></path>',

      knowledge:
        '<path d="M4 5h7v14H4zM13 5h7v14h-7z"></path>' +
        '<path d="M11 7c1-1 2-1 3 0"></path>',

      support:
        '<circle cx="12" cy="12" r="9"></circle>' +
        '<path d="M8 12a4 4 0 0 1 8 0"></path>' +
        '<path d="M8 12v3M16 12v3M10 19h4"></path>',

      folder:
        '<path d="M3 7h7l2 2h9v11H3z"></path>',

      gear:
        '<circle cx="12" cy="12" r="3"></circle>' +
        '<path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.8v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1A1.7 1.7 0 0 0 7.4 15a1.7 1.7 0 0 0-1.5-1H5.7v-2.8h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L7 8.2l2-2 .1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.8v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.4 1z"></path>',

      globe:
        '<circle cx="12" cy="12" r="9"></circle>' +
        '<path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"></path>',

      logout:
        '<path d="M10 4H5v16h5"></path>' +
        '<path d="M14 8l4 4-4 4M18 12H9"></path>',

      chevron:
        '<path d="m9 18 6-6-6-6"></path>'
    };


    return (
      '<span class="admin-lms-nav-icon">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          (icons[name] || icons.dashboard) +
        '</svg>' +
      '</span>'
    );
  }


  /* ============================================================
     SIDEBAR MARKUP
     ============================================================ */

  function getSidebarMarkup() {

    const currentPage = getCurrentPage();

    const groupMarkup = groups.map(function (group) {

      const isActiveGroup = group.items.some(function (item) {
        return item.href === currentPage;
      });


      const items = group.items.map(function (item) {

        const active = item.href === currentPage;

        return (
          '<a href="' + item.href +
          '" class="admin-lms-nav-link' +
          (active ? ' active' : '') +
          '" data-admin-page="' + item.href + '">' +

            icon(item.icon) +

            '<span class="admin-lms-nav-text">' +
              item.label +
            '</span>' +

          '</a>'
        );

      }).join("");


      return (
        '<section class="admin-lms-nav-group' +
        (isActiveGroup ? ' is-open' : '') +
        '" data-admin-nav-group="' + group.id + '">' +

          '<button type="button" ' +
          'class="admin-lms-nav-group-toggle" ' +
          'aria-expanded="' +
          (isActiveGroup ? 'true' : 'false') +
          '">' +

            '<span class="admin-lms-nav-label">' +
              group.label +
            '</span>' +

            '<span class="admin-lms-nav-group-chevron">' +
              icon("chevron") +
            '</span>' +

          '</button>' +

          '<div class="admin-lms-nav-panel">' +

            '<nav class="admin-lms-nav" ' +
            'aria-label="' + group.label + '">' +

              items +

            '</nav>' +

          '</div>' +

        '</section>'
      );

    }).join("");


    return (

      '<aside class="admin-lms-sidebar" ' +
      'aria-label="Screenings4u Management Portal navigation">' +

        '<div class="admin-lms-sidebar-inner">' +


          /* BRAND */

          '<a href="admin-dashboard.html" class="admin-lms-brand">' +

            '<img src="images/logo2.png" ' +
            'alt="screenings4u" ' +
            'class="admin-lms-brand-logo">' +

            '<span class="admin-lms-brand-title">' +
              'Management Portal' +
            '</span>' +

          '</a>' +


          /* NAVIGATION */

          '<div class="admin-lms-sidebar-scroll">' +

            groupMarkup +

          '</div>' +


        '</div>' +

      '</aside>' +

      '<div class="admin-lms-sidebar-overlay" ' +
      'data-admin-sidebar-overlay></div>'
    );
  }


  /* ============================================================
     ACCORDION
     ============================================================ */

  function bindAccordion() {

    document
      .querySelectorAll(".admin-lms-nav-group-toggle")
      .forEach(function (button) {

        button.addEventListener("click", function () {

          const group =
            button.closest(".admin-lms-nav-group");

          const groupId =
            group
              ? group.getAttribute("data-admin-nav-group")
              : null;

          const isOpen =
            group &&
            group.classList.contains("is-open");


          setOpenGroup(
            isOpen ? null : groupId
          );

        });

      });

  }


  function setOpenGroup(groupId) {

    document
      .querySelectorAll(".admin-lms-nav-group")
      .forEach(function (group) {

        const open =
          group.getAttribute("data-admin-nav-group") ===
          groupId;


        group.classList.toggle(
          "is-open",
          open
        );


        const button =
          group.querySelector(
            ".admin-lms-nav-group-toggle"
          );


        if (button) {

          button.setAttribute(
            "aria-expanded",
            open ? "true" : "false"
          );

        }

      });

  }


  /* ============================================================
     MOBILE MENU
     ============================================================ */

  function bindMobileMenu() {

    const button =
      document.querySelector(
        "[data-admin-menu-toggle]"
      );

    const sidebar =
      document.querySelector(
        ".admin-lms-sidebar"
      );

    const overlay =
      document.querySelector(
        "[data-admin-sidebar-overlay]"
      );


    function closeMenu() {

      if (sidebar) {

        sidebar.classList.remove("is-open");

      }

      if (overlay) {

        overlay.classList.remove("is-visible");

      }

    }


    function toggleMenu() {

      if (!sidebar || !overlay) return;


      const open =
        sidebar.classList.toggle("is-open");


      overlay.classList.toggle(
        "is-visible",
        open
      );

    }


    if (button) {

      button.addEventListener(
        "click",
        toggleMenu
      );

    }


    if (overlay) {

      overlay.addEventListener(
        "click",
        closeMenu
      );

    }

  }


  /* ============================================================
     LOGOUT
     ============================================================ */

  function bindLogout() {

    const logoutButton =
      document.querySelector(
        "[data-admin-logout]"
      );

    if (!logoutButton) return;


    logoutButton.addEventListener(
      "click",
      async function () {

        try {

          /*
           * If the global Supabase client exists,
           * sign the administrator out.
           */

          if (
            window.supabaseClient &&
            window.supabaseClient.auth
          ) {

            await window.supabaseClient
              .auth
              .signOut();

          }

        } catch (error) {

          console.error(
            "Logout error:",
            error
          );

        } finally {

          /*
           * Change this destination if your
           * administrator login page has a
           * different filename.
           */

          window.location.href =
            "admin-login.html";

        }

      }
    );

  }


})();

function bindSidebarCollapse() {

  const collapseButton = document.querySelector(
    '[data-admin-sidebar-collapse]'
  );

  const app = document.querySelector('.admin-lms-app');
  const sidebar = document.querySelector('.admin-lms-sidebar');
  const main = document.querySelector('.admin-lms-main');

  if (!collapseButton || !app || !sidebar || !main) return;

  /*
   * The original LMS stylesheet does not contain the Management
   * Portal collapse rules. Add them here so this file works with
   * the existing stylesheet without leaving the content width behind.
   */
  if (!document.getElementById('screenings4u-admin-sidebar-fix')) {
    const style = document.createElement('style');
    style.id = 'screenings4u-admin-sidebar-fix';
    style.textContent = `
      @media (min-width: 1101px) {
        .admin-lms-app .admin-lms-sidebar {
          transition: transform .25s ease, width .25s ease;
        }

        .admin-lms-app .admin-lms-main {
          width: calc(100% - var(--admin-sidebar));
          margin-left: var(--admin-sidebar);
          transition: margin-left .25s ease, width .25s ease;
        }

        .admin-lms-app.sidebar-collapsed .admin-lms-sidebar {
          transform: translateX(-100%);
        }

        .admin-lms-app.sidebar-collapsed .admin-lms-main {
          width: 100%;
          margin-left: 0;
        }

        .admin-lms-app.sidebar-collapsed .admin-lms-sidebar.is-open {
          transform: translateX(0);
        }
      }

      .admin-lms-sidebar-scroll {
        min-height: 0;
        overflow-y: auto !important;
        overflow-x: hidden;
        overscroll-behavior: contain;
        scrollbar-width: thin;
      }

      .admin-lms-sidebar-scroll::-webkit-scrollbar {
        width: 6px;
      }

      .admin-lms-sidebar-scroll::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,.22);
        border-radius: 999px;
      }
    `;
    document.head.appendChild(style);
  }

  function setCollapsed(collapsed) {
    app.classList.toggle('sidebar-collapsed', collapsed);

    collapseButton.setAttribute(
      'aria-label',
      collapsed ? 'Expand sidebar' : 'Collapse sidebar'
    );

    collapseButton.setAttribute(
      'aria-expanded',
      collapsed ? 'false' : 'true'
    );

    localStorage.setItem(
      'screenings4u-admin-sidebar-collapsed',
      collapsed ? 'true' : 'false'
    );
  }

  const savedState = localStorage.getItem(
    'screenings4u-admin-sidebar-collapsed'
  );

  setCollapsed(savedState === 'true');

  collapseButton.addEventListener('click', function () {
    setCollapsed(!app.classList.contains('sidebar-collapsed'));
  });
}

function bindUserDropdown() {

    const toggle = document.querySelector(
        '[data-admin-user-menu-toggle]'
    );

    const menu = document.querySelector(
        '[data-admin-user-menu]'
    );

    if (!toggle || !menu) return;


    function closeMenu() {

        menu.classList.remove('is-open');

        toggle.setAttribute(
            'aria-expanded',
            'false'
        );

    }


    toggle.addEventListener(
        'click',
        function (event) {

            event.stopPropagation();

            const isOpen = menu.classList.toggle(
                'is-open'
            );

            toggle.setAttribute(
                'aria-expanded',
                isOpen ? 'true' : 'false'
            );

        }
    );


    document.addEventListener(
        'click',
        function (event) {

            if (
                !menu.contains(event.target) &&
                !toggle.contains(event.target)
            ) {

                closeMenu();

            }

        }
    );

}
