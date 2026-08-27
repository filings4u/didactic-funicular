/*
 * screenings4u — Admin Navigation
 * Canonical administration navigation for the screenings4u platform.
 *
 * Navigation structure:
 * Operations
 * DOT Compliance
 * Training / LMS
 * Communications
 * Content
 * System
 *
 * Access control remains enforced by the application/database.
 */

document.addEventListener("DOMContentLoaded", initializeAdminNavigation);

function initializeAdminNavigation() {
  const target = document.getElementById("adminNavigation");

  if (!target) return;

  target.innerHTML = `
    <div class="admin-navigation-brand">
      <img src="images/logo.png" alt="screenings4u">
    </div>

    ${getAdminNavigationMarkup()}

    <div class="admin-navigation-footer">
      <button
        class="admin-navigation-logout"
        id="adminNavigationLogout"
        type="button"
      >
        <span
          class="admin-navigation-logout-icon"
          aria-hidden="true"
        >↪</span>
        <span>Logout</span>
      </button>
    </div>
  `;

  initializeAdminNavigationBehavior();
  initializeAdminNavigationLogout();
}

function getAdminNavigationMarkup() {
  const prefix = getAdminPathPrefix();

  return `
    <nav class="admin-nav" aria-label="Admin navigation">

      <!-- OPERATIONS -->
      <section
        class="admin-nav-group"
        data-nav-group="operations"
      >
        <button
          class="admin-nav-group-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="admin-nav-operations"
        >
          <span class="admin-nav-group-title">
            <span class="admin-nav-group-icon">▤</span>
            <span>Operations</span>
          </span>

          <span
            class="admin-nav-chevron"
            aria-hidden="true"
          >⌄</span>
        </button>

        <div
          class="admin-nav-group-items"
          id="admin-nav-operations"
        >
          <a
            href="${prefix}admin-dashboard.html"
            data-nav-page="admin-dashboard.html"
          >
            Dashboard
          </a>

          <a
            href="${prefix}admin-customers.html"
            data-nav-page="admin-customers.html"
          >
            Customers
          </a>

          <a
            href="${prefix}admin-employers.html"
            data-nav-page="admin-employers.html"
          >
            Employers
          </a>

          <a
            href="${prefix}admin-orders.html"
            data-nav-page="admin-orders.html"
          >
            Orders
          </a>

          <a
            href="${prefix}admin-billing.html"
            data-nav-page="admin-billing.html"
          >
            Billing
          </a>

          <a
            href="${prefix}admin-proposals.html"
            data-nav-page="admin-proposals.html"
          >
            Proposals
          </a>

          <a
            href="${prefix}admin-documents.html"
            data-nav-page="admin-documents.html"
          >
            Documents
          </a>
        </div>
      </section>


      <!-- DOT COMPLIANCE -->
      <section
        class="admin-nav-group"
        data-nav-group="dot-compliance"
      >
        <button
          class="admin-nav-group-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="admin-nav-dot-compliance"
        >
          <span class="admin-nav-group-title">
            <span class="admin-nav-group-icon">◈</span>
            <span>DOT Compliance</span>
          </span>

          <span
            class="admin-nav-chevron"
            aria-hidden="true"
          >⌄</span>
        </button>

        <div
          class="admin-nav-group-items"
          id="admin-nav-dot-compliance"
        >
          <a
            href="${prefix}admin-dot-consortium.html"
            data-nav-page="admin-dot-consortium.html"
          >
            Consortium
          </a>

          <a
            href="${prefix}admin-dot-employers.html"
            data-nav-page="admin-dot-employers.html"
          >
            Employers
          </a>

          <a
            href="${prefix}admin-dot-drivers.html"
            data-nav-page="admin-dot-drivers.html"
          >
            Drivers
          </a>

          <a
            href="${prefix}admin-dot-random-selections.html"
            data-nav-page="admin-dot-random-selections.html"
          >
            Random Selection
          </a>

          <a
            href="${prefix}admin-dot-testing.html"
            data-nav-page="admin-dot-testing.html"
          >
            DOT Testing
          </a>

          <a
            href="${prefix}admin-dot-mis-reports.html"
            data-nav-page="admin-dot-mis-reports.html"
          >
            MIS Reports
          </a>

          <a
            href="${prefix}admin-dot-certificates.html"
            data-nav-page="admin-dot-certificates.html"
          >
            Certificates
          </a>
        </div>
      </section>


      <!-- TRAINING / LMS -->
      <section
        class="admin-nav-group"
        data-nav-group="training"
      >
        <button
          class="admin-nav-group-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="admin-nav-training"
        >
          <span class="admin-nav-group-title">
            <span class="admin-nav-group-icon">▦</span>
            <span>Training / LMS</span>
          </span>

          <span
            class="admin-nav-chevron"
            aria-hidden="true"
          >⌄</span>
        </button>

        <div
          class="admin-nav-group-items"
          id="admin-nav-training"
        >
          <a
            href="${prefix}admin-lms-dashboard.html"
            data-nav-page="admin-lms-dashboard.html"
          >
            LMS Dashboard
          </a>

          <a
            href="${prefix}admin-lms-courses.html"
            data-nav-page="admin-lms-courses.html"
          >
            Courses
          </a>

          <a
            href="${prefix}admin-lms-course-manager.html"
            data-nav-page="admin-lms-course-manager.html"
          >
            Course Manager
          </a>

          <a
            href="${prefix}admin-lms-lessons.html"
            data-nav-page="admin-lms-lessons.html"
          >
            Lessons
          </a>

          <a
            href="${prefix}admin-lms-assessments.html"
            data-nav-page="admin-lms-assessments.html"
          >
            Assessments
          </a>

          <a href="${prefix}admin-lms-quizzes.html" data-nav-page="admin-lms-quizzes.html">Quizzes</a>
          <a href="${prefix}admin-lms-media.html" data-nav-page="admin-lms-media.html">Media</a>
          <a href="${prefix}admin-lms-course-settings.html" data-nav-page="admin-lms-course-settings.html">Course Settings</a>

          <a
            href="${prefix}admin-lms-students.html"
            data-nav-page="admin-lms-students.html"
          >
            Students
          </a>

          <a
            href="${prefix}admin-lms-enrollments.html"
            data-nav-page="admin-lms-enrollments.html"
          >
            Enrollments
          </a>

          <a
            href="${prefix}admin-lms-progress.html"
            data-nav-page="admin-lms-progress.html"
          >
            Progress
          </a>

          <a
            href="${prefix}admin-lms-certificates.html"
            data-nav-page="admin-lms-certificates.html"
          >
            Certificates
          </a>
        </div>
      </section>


      <!-- COMMUNICATIONS -->
      <section
        class="admin-nav-group"
        data-nav-group="communications"
      >
        <button
          class="admin-nav-group-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="admin-nav-communications"
        >
          <span class="admin-nav-group-title">
            <span class="admin-nav-group-icon">✉</span>
            <span>Communications</span>
          </span>

          <span
            class="admin-nav-chevron"
            aria-hidden="true"
          >⌄</span>
        </button>

        <div
          class="admin-nav-group-items"
          id="admin-nav-communications"
        >
          <a
            href="${prefix}admin-email-system.html"
            data-nav-page="admin-email-system.html"
          >
            Email
          </a>

          <a
            href="${prefix}admin-meeting-system.html"
            data-nav-page="admin-meeting-system.html"
          >
            Meetings
          </a>

          <a
            href="${prefix}admin-messaging-system.html"
            data-nav-page="admin-messaging-system.html"
          >
            Messages
          </a>

          <a
            href="${prefix}admin-ticket-center.html"
            data-nav-page="admin-ticket-center.html"
          >
            Support
          </a>
        </div>
      </section>


      <!-- CONTENT -->
      <section
        class="admin-nav-group"
        data-nav-group="content"
      >
        <button
          class="admin-nav-group-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="admin-nav-content"
        >
          <span class="admin-nav-group-title">
            <span class="admin-nav-group-icon">▧</span>
            <span>Content</span>
          </span>

          <span
            class="admin-nav-chevron"
            aria-hidden="true"
          >⌄</span>
        </button>

        <div
          class="admin-nav-group-items"
          id="admin-nav-content"
        >
          <a
            href="${prefix}admin-blog.html"
            data-nav-page="admin-blog.html"
          >
            Blog
          </a>

          <a
            href="${prefix}admin-knowledge-base.html"
            data-nav-page="admin-knowledge-base.html"
          >
            Knowledge Base
          </a>

          <a
            href="${prefix}admin-faqs.html"
            data-nav-page="admin-faqs.html"
          >
            FAQs
          </a>
        </div>
      </section>


      <!-- SYSTEM -->
      <section
        class="admin-nav-group"
        data-nav-group="system"
      >
        <button
          class="admin-nav-group-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="admin-nav-system"
        >
          <span class="admin-nav-group-title">
            <span class="admin-nav-group-icon">⚙</span>
            <span>System</span>
          </span>

          <span
            class="admin-nav-chevron"
            aria-hidden="true"
          >⌄</span>
        </button>

        <div
          class="admin-nav-group-items"
          id="admin-nav-system"
        >
          <a
            href="${prefix}admin-automations.html"
            data-nav-page="admin-automations.html"
          >
            Automations
          </a>

          <a
            href="${prefix}admin-audit.html"
            data-nav-page="admin-audit.html"
          >
            Audit Log
          </a>

          <!--
          <a
            href="${prefix}admin-clients.html"
            data-nav-page="admin-clients.html"
          >
            System Users
          </a>
          -->

          <a
            href="${prefix}admin-roles.html"
            data-nav-page="admin-roles.html"
          >
            Roles &amp; Permissions
          </a>

          <a
            href="${prefix}admin-integrations.html"
            data-nav-page="admin-integrations.html"
          >
            Integrations
          </a>

          <a
            href="${prefix}admin-global-settings.html"
            data-nav-page="admin-global-settings.html"
          >
            Settings
          </a>
        </div>
      </section>

    </nav>
  `;
}


/*
 * ============================================================
 * LOGOUT
 * ============================================================
 */

function initializeAdminNavigationLogout() {
  const button = document.getElementById(
    "adminNavigationLogout"
  );

  if (!button) return;

  button.addEventListener("click", async () => {
    if (button.disabled) return;

    button.disabled = true;

    button.innerHTML = `
      <span
        class="admin-navigation-logout-icon"
        aria-hidden="true"
      >↪</span>
      <span>Signing out...</span>
    `;

    try {
      let signOutCompleted = false;

      /*
       * Preferred logout path:
       * Use the centralized S4U authentication service.
       */
      if (
        window.S4UAuth &&
        typeof window.S4UAuth.signOut === "function"
      ) {
        await window.S4UAuth.signOut();
        signOutCompleted = true;
      }


      /*
       * Fallback logout path:
       * Use an available Supabase client directly.
       */
      if (!signOutCompleted) {
        const client =
          window.supabaseClient ||
          window.screenings4uSupabase ||
          null;

        if (
          client &&
          client.auth &&
          typeof client.auth.signOut === "function"
        ) {
          const { error } =
            await client.auth.signOut();

          if (error) {
            throw error;
          }
        } else {
          console.warn(
            "[Logout] Authentication service unavailable. " +
            "Clearing local session state."
          );
        }
      }


      /*
       * Clear application session state.
       */
      clearAdminSessionState();


      /*
       * Redirect away from the protected page.
       */
      window.location.replace(
        getAdminPathPrefix() +
        "admin-login.html"
      );

    } catch (error) {
      console.error(
        "[Logout] Sign-out error:",
        error
      );


      /*
       * Always remove local session state.
       */
      clearAdminSessionState();


      /*
       * Do not leave the user trapped on
       * an authenticated admin page.
       */
      window.location.replace(
        getAdminPathPrefix() +
        "admin-login.html"
      );
    }
  });
}


function clearAdminSessionState() {
  try {
    sessionStorage.clear();

    localStorage.removeItem(
      "screenings4u-admin-open-group"
    );

    localStorage.removeItem(
      "screenings4u-authenticated"
    );

    localStorage.removeItem(
      "screenings4u-user"
    );

    localStorage.removeItem(
      "screenings4u-session"
    );

    localStorage.removeItem(
      "s4u-authenticated"
    );

    localStorage.removeItem(
      "s4u-user"
    );

  } catch (storageError) {
    console.warn(
      "[Logout] Some local session data " +
      "could not be cleared:",
      storageError
    );
  }
}


/*
 * ============================================================
 * NAVIGATION BEHAVIOR
 * ============================================================
 */

function initializeAdminNavigationBehavior() {
  const nav = document.getElementById(
    "adminNavigation"
  );

  if (!nav) return;

  const groups = Array.from(
    nav.querySelectorAll(".admin-nav-group")
  );

  const links = Array.from(
    nav.querySelectorAll("[data-nav-page]")
  );

  const currentPage = getCurrentAdminPage();

  let activeGroup = null;


  /*
   * Mark the current page as active.
   */
  links.forEach((link) => {
    const targetPage = normalizeAdminPage(
      link.getAttribute("data-nav-page")
    );

    if (targetPage === currentPage) {
      link.classList.add("active");

      activeGroup = link.closest(
        ".admin-nav-group"
      );
    }
  });


  /*
   * Accordion behavior.
   */
  groups.forEach((group) => {
    const toggle = group.querySelector(
      ".admin-nav-group-toggle"
    );

    if (!toggle) return;

    toggle.addEventListener("click", () => {
      const isOpen = group.classList.contains(
        "open"
      );


      /*
       * Close all other groups.
       */
      groups.forEach((otherGroup) => {
        if (otherGroup === group) return;

        otherGroup.classList.remove("open");

        const otherToggle =
          otherGroup.querySelector(
            ".admin-nav-group-toggle"
          );

        if (otherToggle) {
          otherToggle.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      });


      /*
       * Toggle current group.
       */
      group.classList.toggle(
        "open",
        !isOpen
      );

      toggle.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );


      /*
       * Save navigation state.
       */
      saveNavigationState(
        group.dataset.navGroup,
        !isOpen
      );
    });
  });


  /*
   * Keep the active page's group open.
   */
  if (activeGroup) {
    openNavigationGroup(activeGroup);
  } else {
    restoreNavigationState(groups);
  }


  /*
   * Save the group when navigating.
   */
  links.forEach((link) => {
    link.addEventListener("click", () => {
      const group = link.closest(
        ".admin-nav-group"
      );

      if (group) {
        saveNavigationState(
          group.dataset.navGroup,
          true
        );
      }
    });
  });
}


/*
 * ============================================================
 * PATH HELPERS
 * ============================================================
 */

function getAdminPathPrefix() {
  const pathname =
    window.location.pathname || "";

  const parts = pathname
    .split("/")
    .filter(Boolean);


  /*
   * Root-level admin pages use no prefix.
   * Pages one directory below the root use ../.
   */
  const depth = Math.max(
    0,
    parts.length - 1
  );

  return "../".repeat(depth);
}


function getCurrentAdminPage() {
  const path =
    window.location.pathname || "";

  const filename =
    path.split("/").pop();

  return normalizeAdminPage(
    filename || "admin-dashboard.html"
  );
}


function normalizeAdminPage(page) {
  if (!page) return "";

  return page
    .split("?")[0]
    .split("#")[0]
    .trim()
    .toLowerCase();
}


/*
 * ============================================================
 * GROUP STATE
 * ============================================================
 */

function openNavigationGroup(group) {
  if (!group) return;

  const groups =
    document.querySelectorAll(
      "#adminNavigation .admin-nav-group"
    );

  groups.forEach((otherGroup) => {
    const toggle =
      otherGroup.querySelector(
        ".admin-nav-group-toggle"
      );


    if (otherGroup === group) {
      otherGroup.classList.add("open");

      if (toggle) {
        toggle.setAttribute(
          "aria-expanded",
          "true"
        );
      }

    } else {
      otherGroup.classList.remove("open");

      if (toggle) {
        toggle.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    }
  });
}


function saveNavigationState(
  groupName,
  isOpen
) {
  try {
    if (isOpen) {
      localStorage.setItem(
        "screenings4u-admin-open-group",
        groupName
      );

    } else {
      const current =
        localStorage.getItem(
          "screenings4u-admin-open-group"
        );

      if (current === groupName) {
        localStorage.removeItem(
          "screenings4u-admin-open-group"
        );
      }
    }

  } catch (error) {
    console.warn(
      "Unable to save admin navigation state.",
      error
    );
  }
}


function restoreNavigationState(groups) {
  try {
    const savedGroup =
      localStorage.getItem(
        "screenings4u-admin-open-group"
      );

    if (!savedGroup) return;

    groups.forEach((group) => {
      if (
        group.dataset.navGroup ===
        savedGroup
      ) {
        openNavigationGroup(group);
      }
    });

  } catch (error) {
    console.warn(
      "Unable to restore admin navigation state.",
      error
    );
  }
}


/*
 * Public refresh helper.
 */
window.refreshAdminNavigation =
  initializeAdminNavigation;