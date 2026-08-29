/* ============================================================
   SCREENINGS4U LEARNING CENTER — ADMINISTRATION
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

    setOpenGroup(activeGroup || null, false);
    bindAccordion();
    bindMobileMenu();
  }

  function getCurrentPage() {
    return window.location.pathname.split("/").pop() || "admin-lms-dashboard.html";
  }

  const groups = [
    {
      id: "overview",
      label: "Overview",
      items: [
        { label: "Dashboard", href: "admin-lms-dashboard.html", icon: "dashboard" }
      ]
    },
    {
      id: "content",
      label: "Learning Content",
      items: [
        { label: "Courses", href: "admin-lms-courses.html", icon: "book" },
        { label: "Lessons", href: "admin-lms-lessons.html", icon: "play" },
        { label: "Media", href: "admin-lms-media.html", icon: "image" }
      ]
    },
    {
      id: "knowledge",
      label: "Knowledge Checks",
      items: [
        { label: "Quizzes", href: "admin-lms-quizzes.html", icon: "quiz" },
        { label: "Assessments", href: "admin-lms-assessments.html", icon: "assessment" }
      ]
    },
    {
      id: "learners",
      label: "Learners",
      items: [
        { label: "Students", href: "admin-lms-students.html", icon: "users" },
        { label: "Enrollments", href: "admin-lms-enrollments.html", icon: "enrollment" },
        { label: "Progress", href: "admin-lms-progress.html", icon: "chart" }
      ]
    },
    {
      id: "credentials",
      label: "Credentials",
      items: [
        { label: "Certificates", href: "admin-lms-certificates.html", icon: "certificate" }
      ]
    },
    {
      id: "system",
      label: "System",
      items: [
        { label: "Course Settings", href: "admin-lms-course-settings.html", icon: "gear" }
      ]
    }
  ];

  function findActiveGroup(page) {
    const group = groups.find(function (groupItem) {
      return groupItem.items.some(function (item) {
        return item.href === page;
      });
    });

    return group ? group.id : null;
  }

  function icon(name) {
    const icons = {
      dashboard: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"></rect><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"></rect><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"></rect><rect x="13.5" y="13.5" width="7" height="7" rx="1.2"></rect>',
      book: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M7 8h10M7 12h7M7 16h5"></path>',
      play: '<path d="M8 5v14l11-7z"></path>',
      image: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="8.5" cy="9" r="1.5"></circle><path d="m21 15-5-5L5 21"></path>',
      quiz: '<path d="M9 11h6M9 15h4"></path><path d="M5 3h14v18H5z"></path>',
      assessment: '<path d="M6 3h12v18H6z"></path><path d="M9 8h6M9 12h6M9 16h4"></path>',
      users: '<circle cx="9" cy="8" r="3"></circle><path d="M3 21c.6-4 2.7-6 6-6s5.4 2 6 6"></path><path d="M16 5a3 3 0 0 1 0 6M17 15c2.2.5 3.6 2.2 4 5"></path>',
      enrollment: '<circle cx="12" cy="8" r="3.5"></circle><path d="M5 21c.7-4.2 3.1-6.5 7-6.5s6.3 2.3 7 6.5"></path><path d="m17 12 2 2 3-4"></path>',
      chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19V3"></path>',
      certificate: '<circle cx="12" cy="8" r="5"></circle><path d="m8.5 12.5-1 8L12 18l4.5 2.5-1-8"></path>',
      gear: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.8v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1A1.7 1.7 0 0 0 7.4 15a1.7 1.7 0 0 0-1.5-1H5.7v-2.8h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L7 8.2l2-2 .1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.8v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.4 1z</path>',
      back: '<path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path>',
      chevron: '<path d="m9 18 6-6-6-6"></path>'
    };

    return '<span class="admin-lms-nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + icons[name] + '</svg></span>';
  }

  function getSidebarMarkup() {
    const currentPage = getCurrentPage();

    const groupMarkup = groups.map(function (group) {
      const isActiveGroup = group.items.some(function (item) {
        return item.href === currentPage;
      });

      const items = group.items.map(function (item) {
        const active = item.href === currentPage;

        return '<a href="' + item.href + '" class="admin-lms-nav-link' + (active ? ' active' : '') + '" data-admin-page="' + item.href + '">' +
          icon(item.icon) +
          '<span class="admin-lms-nav-text">' + item.label + '</span>' +
        '</a>';
      }).join('');

      return '<section class="admin-lms-nav-group' + (isActiveGroup ? ' is-open' : '') + '" data-admin-nav-group="' + group.id + '">' +
        '<button type="button" class="admin-lms-nav-group-toggle" aria-expanded="' + (isActiveGroup ? 'true' : 'false') + '">' +
          '<span class="admin-lms-nav-label">' + group.label + '</span>' +
          '<span class="admin-lms-nav-group-chevron">' + icon('chevron') + '</span>' +
        '</button>' +
        '<div class="admin-lms-nav-panel">' +
          '<nav class="admin-lms-nav" aria-label="' + group.label + '">' + items + '</nav>' +
        '</div>' +
      '</section>';
    }).join('');

    return '<aside class="admin-lms-sidebar" aria-label="Learning Center administration navigation">' +
      '<div class="admin-lms-sidebar-inner">' +
        '<a href="admin-lms-dashboard.html" class="admin-lms-brand">' +
          '<img src="images/logo2.png" alt="screenings4u" class="admin-lms-brand-logo">' +
          '<span class="admin-lms-brand-title">Learning Center</span>' +
          '<span class="admin-lms-brand-subtitle">Administration</span>' +
        '</a>' +
        '<div class="admin-lms-sidebar-scroll">' + groupMarkup + '</div>' +
        '<div class="admin-lms-sidebar-footer">' +
          '<a href="lms-dashboard.html" class="admin-lms-return-link">' + icon('back') +
            '<span>Back to Learning Center</span>' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</aside>' +
    '<div class="admin-lms-sidebar-overlay" data-admin-sidebar-overlay></div>';
  }

  function bindAccordion() {
    document.querySelectorAll('.admin-lms-nav-group-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        const group = button.closest('.admin-lms-nav-group');
        const groupId = group ? group.getAttribute('data-admin-nav-group') : null;
        const isOpen = group && group.classList.contains('is-open');

        setOpenGroup(isOpen ? null : groupId, true);
      });
    });
  }

  function setOpenGroup(groupId) {
    document.querySelectorAll('.admin-lms-nav-group').forEach(function (group) {
      const open = group.getAttribute('data-admin-nav-group') === groupId;
      group.classList.toggle('is-open', open);

      const button = group.querySelector('.admin-lms-nav-group-toggle');
      if (button) button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function bindMobileMenu() {
    const button = document.querySelector('[data-admin-menu-toggle]');
    const sidebar = document.querySelector('.admin-lms-sidebar');
    const overlay = document.querySelector('[data-admin-sidebar-overlay]');

    function closeMenu() {
      if (sidebar) sidebar.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-visible');
    }

    function toggleMenu() {
      if (!sidebar || !overlay) return;
      const open = sidebar.classList.toggle('is-open');
      overlay.classList.toggle('is-visible', open);
    }

    if (button) button.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
  }
})();
