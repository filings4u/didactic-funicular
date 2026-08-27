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
      <button class="admin-navigation-logout" id="adminNavigationLogout" type="button">
        <span class="admin-navigation-logout-icon" aria-hidden="true">↪</span>
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
  <section class="admin-nav-group" data-nav-group="operations">
    <button
      class="admin-nav-group-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="admin-nav-operations">
      <span class="admin-nav-group-title">
        <span class="admin-nav-group-icon">▤</span>
        <span>Operations</span>
      </span>
      <span class="admin-nav-chevron" aria-hidden="true">⌄</span>
    </button>

    <div class="admin-nav-group-items" id="admin-nav-operations">
      <a href="${prefix}customer-dashboard.html" data-nav-page="customer-dashboard.html">
        Dashboard
      </a>
      <a href="${prefix}customer-account.html" data-nav-page="customer-account.html">
        My Account
      </a>
      <a href="${prefix}customer-orders.html" data-nav-page="customer-orders.html">
        My Orders
      </a>
    </div>
  </section>

  <!-- DOT COMPLIANCE -->
  <section class="admin-nav-group" data-nav-group="dot-compliance">
    <button
      class="admin-nav-group-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="admin-nav-dot-compliance">
      <span class="admin-nav-group-title">
        <span class="admin-nav-group-icon">◈</span>
        <span>DOT Compliance</span>
      </span>
      <span class="admin-nav-chevron" aria-hidden="true">⌄</span>
    </button>

    <div class="admin-nav-group-items" id="admin-nav-dot-compliance">
      <!-- No customer pages currently belong in this section. -->
    </div>
  </section>

  <!-- TRAINING / LMS -->
  <section class="admin-nav-group" data-nav-group="training">
    <button
      class="admin-nav-group-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="admin-nav-training">
      <span class="admin-nav-group-title">
        <span class="admin-nav-group-icon">▦</span>
        <span>Training / LMS</span>
      </span>
      <span class="admin-nav-chevron" aria-hidden="true">⌄</span>
    </button>

    <div class="admin-nav-group-items" id="admin-nav-training">
      <a href="${prefix}customer-training.html" data-nav-page="customer-training.html">
        My Training
      </a>
      <a href="${prefix}customer-training-certificates.html" data-nav-page="customer-training-certificates.html">
        Training Certificates
      </a>
    </div>
  </section>

  <!-- COMMUNICATIONS -->
  <section class="admin-nav-group" data-nav-group="communications">
    <button
      class="admin-nav-group-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="admin-nav-communications">
      <span class="admin-nav-group-title">
        <span class="admin-nav-group-icon">✉</span>
        <span>Communications</span>
      </span>
      <span class="admin-nav-chevron" aria-hidden="true">⌄</span>
    </button>

    <div class="admin-nav-group-items" id="admin-nav-communications">
      <!-- No customer pages currently belong in this section. -->
    </div>
  </section>

  <!-- CONTENT -->
  <section class="admin-nav-group" data-nav-group="content">
    <button
      class="admin-nav-group-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="admin-nav-content">
      <span class="admin-nav-group-title">
        <span class="admin-nav-group-icon">▧</span>
        <span>Content</span>
      </span>
      <span class="admin-nav-chevron" aria-hidden="true">⌄</span>
    </button>

    <div class="admin-nav-group-items" id="admin-nav-content">
      <a href="${prefix}customer-documents.html" data-nav-page="customer-documents.html">
        My Documents
      </a>
    </div>
  </section>

  <!-- SYSTEM -->
  <section class="admin-nav-group" data-nav-group="system">
    <button
      class="admin-nav-group-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="admin-nav-system">
      <span class="admin-nav-group-title">
        <span class="admin-nav-group-icon">⚙</span>
        <span>System</span>
      </span>
      <span class="admin-nav-chevron" aria-hidden="true">⌄</span>
    </button>

    <div class="admin-nav-group-items" id="admin-nav-system">
      <!-- No customer pages currently belong in this section. -->
    </div>
  </section>

</nav>
  `;
}

function initializeAdminNavigationLogout() {
  const button = document.getElementById("adminNavigationLogout");

  if (!button) return;

  button.addEventListener("click", async () => {
    button.disabled = true;

    try {
      if (
        window.S4UAuth &&
        typeof window.S4UAuth.signOut === "function"
      ) {
        await window.S4UAuth.signOut();
      }
    } catch (error) {
      console.error("Admin logout failed:", error);
    } finally {
      window.location.href = getAdminPathPrefix() + "customer-login.html";
    }
  });
}

function initializeAdminNavigationBehavior() {
  const nav = document.getElementById("adminNavigation");

  if (!nav) return;

  const groups = Array.from(
    nav.querySelectorAll(".admin-nav-group")
  );

  const links = Array.from(
    nav.querySelectorAll("[data-nav-page]")
  );

  const currentPage = getCurrentAdminPage();

  let activeGroup = null;

  links.forEach((link) => {
    const targetPage = normalizeAdminPage(
      link.getAttribute("data-nav-page")
    );

    if (targetPage === currentPage) {
      link.classList.add("active");
      activeGroup = link.closest(".admin-nav-group");
    }
  });

  groups.forEach((group) => {
    const toggle = group.querySelector(".admin-nav-group-toggle");

    if (!toggle) return;

    toggle.addEventListener("click", () => {
      const isOpen = group.classList.contains("open");

      groups.forEach((otherGroup) => {
        if (otherGroup === group) return;

        otherGroup.classList.remove("open");

        const otherToggle = otherGroup.querySelector(
          ".admin-nav-group-toggle"
        );

        if (otherToggle) {
          otherToggle.setAttribute("aria-expanded", "false");
        }
      });

      group.classList.toggle("open", !isOpen);
      toggle.setAttribute("aria-expanded", String(!isOpen));

      saveNavigationState(group.dataset.navGroup, !isOpen);
    });
  });

  if (activeGroup) {
    openNavigationGroup(activeGroup);
  } else {
    restoreNavigationState(groups);
  }

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const group = link.closest(".admin-nav-group");

      if (group) {
        saveNavigationState(group.dataset.navGroup, true);
      }
    });
  });
}

function getAdminPathPrefix() {
  const pathname = window.location.pathname || "";
  const parts = pathname.split("/").filter(Boolean);

  /*
   * Root-level admin pages use no prefix.
   * Pages one directory below the root use ../.
   */
  const depth = Math.max(0, parts.length - 1);

  return "../".repeat(depth);
}

function getCurrentAdminPage() {
  const path = window.location.pathname || "";
  const filename = path.split("/").pop();

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

function openNavigationGroup(group) {
  if (!group) return;

  const groups = document.querySelectorAll(
    "#adminNavigation .admin-nav-group"
  );

  groups.forEach((otherGroup) => {
    const toggle = otherGroup.querySelector(
      ".admin-nav-group-toggle"
    );

    if (otherGroup === group) {
      otherGroup.classList.add("open");

      if (toggle) {
        toggle.setAttribute("aria-expanded", "true");
      }
    } else {
      otherGroup.classList.remove("open");

      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
    }
  });
}

function saveNavigationState(groupName, isOpen) {
  try {
    if (isOpen) {
      localStorage.setItem(
        "screenings4u-admin-open-group",
        groupName
      );
    } else {
      const current = localStorage.getItem(
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
    const savedGroup = localStorage.getItem(
      "screenings4u-admin-open-group"
    );

    if (!savedGroup) return;

    groups.forEach((group) => {
      if (group.dataset.navGroup === savedGroup) {
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

window.refreshAdminNavigation = initializeAdminNavigation;
