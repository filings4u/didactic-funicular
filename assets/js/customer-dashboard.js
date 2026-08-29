/* ============================================================
   SCREENINGS4U
   CUSTOMER DASHBOARD
   customer-dashboard.js
   ============================================================ */

(function () {
  "use strict";

  /* ==========================================================
     CONFIGURATION
     ========================================================== */

  const CUSTOMER_DASHBOARD_CONFIG = {
    recentOrdersLimit: 5,
    recentResultsLimit: 5,
    recentDocumentsLimit: 5,
    recentNotificationsLimit: 5
  };


  /* ==========================================================
     STATE
     ========================================================== */

  const dashboardState = {
    user: null,
    profile: null,

    orders: [],
    results: [],
    documents: [],
    notifications: [],

    donorPasses: [],

    initialized: false
  };


  /* ==========================================================
     DOM READY
     ========================================================== */

  document.addEventListener("DOMContentLoaded", function () {
    initializeCustomerDashboard();
  });


  /* ==========================================================
     INITIALIZATION
     ========================================================== */

  async function initializeCustomerDashboard() {
    if (dashboardState.initialized) {
      return;
    }

    dashboardState.initialized = true;

    try {
      showDashboardLoadingState();

      /*
       * Wait briefly for the shared portal shell to initialize.
       *
       * The shell is responsible for:
       * - authentication
       * - sidebar
       * - user menu
       * - shared notifications
       */
      await waitForPortalShell();

      /*
       * Get authenticated user.
       *
       * We support either:
       * 1. A shared portal state object
       * 2. Direct Supabase access
       */
      dashboardState.user = await getAuthenticatedCustomer();

      if (!dashboardState.user) {
        handleMissingSession();
        return;
      }

      /*
       * Load dashboard data.
       *
       * These functions are intentionally separated so we can
       * wire each section independently as we verify the exact
       * Supabase table columns.
       */
      await Promise.all([
        loadCustomerProfile(),
        loadCustomerOrders(),
        loadCustomerResults(),
        loadCustomerDonorPasses(),
        loadCustomerDocuments(),
        loadCustomerNotifications()
      ]);

      renderCustomerDashboard();

      hideDashboardLoadingState();

    } catch (error) {
      console.error(
        "[Customer Dashboard] Initialization error:",
        error
      );

      handleDashboardError(error);
    }
  }


  /* ==========================================================
     PORTAL SHELL WAIT
     ========================================================== */

  function waitForPortalShell() {
    return new Promise(function (resolve) {

      /*
       * If the shared shell exposes a ready event,
       * this listener can be expanded later.
       *
       * For now, this gives the shared scripts enough time
       * to initialize without blocking the dashboard.
       */
      window.setTimeout(function () {
        resolve();
      }, 50);

    });
  }


  /* ==========================================================
     AUTHENTICATED USER
     ========================================================== */

  async function getAuthenticatedCustomer() {

    /*
     * Option 1:
     * Shared portal application state.
     *
     * We do not assume this exists.
     */
    if (
      window.portalState &&
      window.portalState.user
    ) {
      return window.portalState.user;
    }


    /*
     * Option 2:
     * Shared authentication helper.
     */
    if (
      window.PortalAuth &&
      typeof window.PortalAuth.getCurrentUser === "function"
    ) {
      return await window.PortalAuth.getCurrentUser();
    }


    /*
     * Option 3:
     * Direct Supabase client.
     *
     * This supports the existing global Supabase pattern
     * used throughout the platform.
     */
    const supabaseClient = getSupabaseClient();

    if (!supabaseClient) {
      console.warn(
        "[Customer Dashboard] Supabase client not available."
      );

      return null;
    }

    const {
      data,
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.error(
        "[Customer Dashboard] Auth error:",
        error
      );

      return null;
    }

    return data ? data.user : null;
  }


  /* ==========================================================
     SUPABASE CLIENT
     ========================================================== */

  function getSupabaseClient() {

    /*
     * Support common global client patterns.
     *
     * We are not creating a new client here because the
     * portal shell should own the connection configuration.
     */

    if (window.supabaseClient) {
      return window.supabaseClient;
    }

    if (window.supabase) {

      /*
       * Some existing pages may expose a custom client.
       */
      if (
        typeof window.supabase.from === "function"
      ) {
        return window.supabase;
      }

    }

    if (window.portalSupabase) {
      return window.portalSupabase;
    }

    return null;
  }


  /* ==========================================================
     LOAD CUSTOMER PROFILE
     ========================================================== */

  async function loadCustomerProfile() {

    /*
     * IMPORTANT:
     *
     * We know customer_profiles exists.
     *
     * We do NOT yet have the complete column list in the
     * current verified schema context.
     *
     * We therefore do not guess whether the relationship
     * uses:
     *
     * user_id
     * auth_user_id
     * profile_id
     * customer_id
     *
     * This function remains ready for the exact query.
     */

    dashboardState.profile = null;

    return null;
  }


  /* ==========================================================
     LOAD ORDERS
     ========================================================== */

  async function loadCustomerOrders() {

    /*
     * Verified table:
     *
     * public.orders
     *
     * However, before wiring the query we need the exact
     * relationship between orders and the authenticated
     * customer/customer_profiles table.
     *
     * This prevents incorrect queries.
     */

    dashboardState.orders = [];

    return [];
  }


  /* ==========================================================
     LOAD RESULTS
     ========================================================== */

  async function loadCustomerResults() {

    /*
     * Results may be represented through:
     *
     * dot_test_results
     * dot_tests
     * documents
     *
     * We need to verify the relationship and customer-facing
     * visibility rules before exposing any result data.
     */

    dashboardState.results = [];

    return [];
  }


  /* ==========================================================
     LOAD DONOR PASSES
     ========================================================== */

  async function loadCustomerDonorPasses() {

    /*
     * The donor pass workflow needs to be mapped to the
     * appropriate order/testing tables.
     *
     * We will wire this after verifying the existing schema.
     */

    dashboardState.donorPasses = [];

    return [];
  }


  /* ==========================================================
     LOAD DOCUMENTS
     ========================================================== */

  async function loadCustomerDocuments() {

    /*
     * Verified table:
     *
     * public.documents
     *
     * We still need the exact ownership/linking columns before
     * querying documents for the logged-in customer.
     */

    dashboardState.documents = [];

    return [];
  }


  /* ==========================================================
     LOAD NOTIFICATIONS
     ========================================================== */

  async function loadCustomerNotifications() {

    /*
     * Verified table:
     *
     * public.notifications
     *
     * The dashboard notification section will eventually
     * synchronize with the shared portal notification bell.
     */

    dashboardState.notifications = [];

    return [];
  }


  /* ==========================================================
     RENDER DASHBOARD
     ========================================================== */

  function renderCustomerDashboard() {

    renderWelcomeSection();

    renderSummaryCards();

    renderRecentOrders();

    renderRecentResults();

    renderDocuments();

    renderNotifications();

    updatePortalNotificationBadge();
  }


  /* ==========================================================
     WELCOME SECTION
     ========================================================== */

  function renderWelcomeSection() {

    const welcomeNameElement = document.getElementById(
      "customerWelcomeName"
    );

    if (!welcomeNameElement) {
      return;
    }

    const customerName = getCustomerDisplayName();

    welcomeNameElement.textContent = customerName;
  }


  /* ==========================================================
     CUSTOMER DISPLAY NAME
     ========================================================== */

  function getCustomerDisplayName() {

    /*
     * We deliberately use safe fallbacks until the exact
     * customer_profiles columns are confirmed.
     */

    if (
      dashboardState.profile &&
      dashboardState.profile.first_name
    ) {
      return dashboardState.profile.first_name;
    }

    if (
      dashboardState.user &&
      dashboardState.user.user_metadata &&
      dashboardState.user.user_metadata.first_name
    ) {
      return dashboardState.user.user_metadata.first_name;
    }

    if (
      dashboardState.user &&
      dashboardState.user.email
    ) {
      const emailName =
        dashboardState.user.email.split("@")[0];

      return formatDisplayName(emailName);
    }

    return "Welcome";
  }


  function formatDisplayName(value) {

    if (!value) {
      return "Welcome";
    }

    return value
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, function (character) {
        return character.toUpperCase();
      });
  }


  /* ==========================================================
     SUMMARY CARDS
     ========================================================== */

  function renderSummaryCards() {

    setSummaryValue(
      "customerTotalOrders",
      dashboardState.orders.length
    );

    setSummaryValue(
      "customerAvailableResults",
      dashboardState.results.length
    );

    setSummaryValue(
      "customerDonorPassCount",
      dashboardState.donorPasses.length
    );

    setSummaryValue(
      "customerDocumentCount",
      dashboardState.documents.length
    );
  }


  function setSummaryValue(
    elementId,
    value
  ) {

    const element =
      document.getElementById(elementId);

    if (!element) {
      return;
    }

    element.textContent =
      Number(value || 0).toLocaleString();
  }


  /* ==========================================================
     RECENT ORDERS
     ========================================================== */

  function renderRecentOrders() {

    const container =
      document.getElementById(
        "customerRecentOrders"
      );

    if (!container) {
      return;
    }

    const orders =
      dashboardState.orders.slice(
        0,
        CUSTOMER_DASHBOARD_CONFIG.recentOrdersLimit
      );

    if (!orders.length) {

      container.innerHTML =
        createEmptyState({
          title: "No orders yet",
          message:
            "When you purchase a service, your orders will appear here.",
          actionText: "Purchase Services",
          actionHref: "customer-catalog.html",
          icon: "clipboard"
        });

      return;
    }

    container.innerHTML =
      orders
        .map(function (order) {
          return createOrderItem(order);
        })
        .join("");
  }


  function createOrderItem(order) {

    /*
     * This renderer supports flexible property names
     * temporarily so it can be finalized once the schema
     * is connected.
     */

    const orderName =
      order.name ||
      order.title ||
      order.service_name ||
      "Service Order";

    const orderNumber =
      order.order_number ||
      order.reference_number ||
      order.id ||
      "";

    const orderDate =
      order.created_at
        ? formatDashboardDate(order.created_at)
        : "Order details available";

    const status =
      normalizeOrderStatus(
        order.status
      );

    return `
      <div class="customer-order-item">

        <div class="customer-order-icon">
          ${getOrderIcon()}
        </div>

        <div class="customer-order-copy">

          <div class="customer-order-name">
            ${escapeHtml(orderName)}
          </div>

          <div class="customer-order-meta">
            ${escapeHtml(orderNumber)}
            ${orderNumber ? " · " : ""}
            ${escapeHtml(orderDate)}
          </div>

        </div>

        <div class="customer-order-status ${status.className}">
          ${escapeHtml(status.label)}
        </div>

      </div>
    `;
  }


  /* ==========================================================
     RECENT RESULTS
     ========================================================== */

  function renderRecentResults() {

    const container =
      document.getElementById(
        "customerRecentResults"
      );

    if (!container) {
      return;
    }

    const results =
      dashboardState.results.slice(
        0,
        CUSTOMER_DASHBOARD_CONFIG.recentResultsLimit
      );

    if (!results.length) {

      container.innerHTML =
        createEmptyState({
          title: "No results available",
          message:
            "Completed screening results available to you will appear here.",
          actionText: "View Results",
          actionHref: "customer-results.html",
          icon: "results"
        });

      return;
    }

    container.innerHTML =
      results
        .map(function (result) {
          return createResultItem(result);
        })
        .join("");
  }


  function createResultItem(result) {

    const resultName =
      result.name ||
      result.title ||
      result.test_name ||
      "Screening Result";

    const resultDate =
      result.created_at
        ? formatDashboardDate(result.created_at)
        : "Result available";

    const resultHref =
      result.href ||
      "customer-results.html";

    return `
      <div class="customer-result-item">

        <div class="customer-result-icon">
          ${getResultIcon()}
        </div>

        <div class="customer-result-copy">

          <div class="customer-result-name">
            ${escapeHtml(resultName)}
          </div>

          <div class="customer-result-meta">
            ${escapeHtml(resultDate)}
          </div>

        </div>

        <a
          href="${escapeAttribute(resultHref)}"
          class="customer-result-action"
        >
          View
        </a>

      </div>
    `;
  }


  /* ==========================================================
     DOCUMENTS
     ========================================================== */

  function renderDocuments() {

    const container =
      document.getElementById(
        "customerDashboardDocuments"
      );

    if (!container) {
      return;
    }

    const documents =
      dashboardState.documents.slice(
        0,
        CUSTOMER_DASHBOARD_CONFIG.recentDocumentsLimit
      );

    if (!documents.length) {

      container.innerHTML =
        createEmptyState({
          title: "No documents available",
          message:
            "Your important documents will appear here when available.",
          actionText: "View Documents",
          actionHref: "customer-documents.html",
          icon: "document"
        });

      return;
    }

    container.innerHTML =
      documents
        .map(function (document) {
          return createDocumentItem(document);
        })
        .join("");
  }


  function createDocumentItem(document) {

    const documentName =
      document.name ||
      document.title ||
      document.file_name ||
      "Document";

    const documentDate =
      document.created_at
        ? formatDashboardDate(document.created_at)
        : "";

    const documentHref =
      document.url ||
      document.download_url ||
      "customer-documents.html";

    return `
      <div class="customer-document-item">

        <div class="customer-document-icon">
          ${getDocumentIcon()}
        </div>

        <div class="customer-document-copy">

          <div class="customer-document-name">
            ${escapeHtml(documentName)}
          </div>

          <div class="customer-document-meta">
            ${escapeHtml(documentDate)}
          </div>

        </div>

        <a
          href="${escapeAttribute(documentHref)}"
          class="customer-document-action"
        >
          View
        </a>

      </div>
    `;
  }


  /* ==========================================================
     NOTIFICATIONS
     ========================================================== */

  function renderNotifications() {

    const container =
      document.getElementById(
        "customerDashboardNotifications"
      );

    if (!container) {
      return;
    }

    const notifications =
      dashboardState.notifications.slice(
        0,
        CUSTOMER_DASHBOARD_CONFIG.recentNotificationsLimit
      );

    if (!notifications.length) {

      container.innerHTML =
        createEmptyState({
          title: "You're all caught up",
          message:
            "New account updates and notifications will appear here.",
          icon: "bell"
        });

      return;
    }

    container.innerHTML =
      notifications
        .map(function (notification) {
          return createNotificationItem(
            notification
          );
        })
        .join("");
  }


  function createNotificationItem(notification) {

    const title =
      notification.title ||
      "Account Notification";

    const message =
      notification.message ||
      notification.body ||
      "";

    const isRead =
      notification.is_read === true;

    const createdAt =
      notification.created_at
        ? formatRelativeDate(
            notification.created_at
          )
        : "";

    return `
      <div
        class="customer-notification-item ${
          isRead ? "read" : ""
        }"
      >

        <div class="customer-notification-dot"></div>

        <div class="customer-notification-copy">

          <div class="customer-notification-title">
            ${escapeHtml(title)}
          </div>

          <div class="customer-notification-message">
            ${escapeHtml(message)}
          </div>

          <span class="customer-notification-time">
            ${escapeHtml(createdAt)}
          </span>

        </div>

      </div>
    `;
  }


  /* ==========================================================
     PORTAL NOTIFICATION BADGE
     ========================================================== */

  function updatePortalNotificationBadge() {

    const unreadCount =
      dashboardState.notifications.filter(
        function (notification) {
          return notification.is_read !== true;
        }
      ).length;

    /*
     * Support common IDs used by the portal shell.
     */
    const badgeIds = [
      "portalNotificationBadge",
      "customerNotificationBadge",
      "notificationBadge"
    ];

    badgeIds.forEach(function (badgeId) {

      const badge =
        document.getElementById(badgeId);

      if (!badge) {
        return;
      }

      if (unreadCount > 0) {

        badge.textContent =
          unreadCount > 99
            ? "99+"
            : unreadCount;

        badge.hidden = false;

      } else {

        badge.textContent = "";
        badge.hidden = true;

      }

    });
  }


  /* ==========================================================
     EMPTY STATE
     ========================================================== */

  function createEmptyState(options) {

    const title =
      options.title || "Nothing here yet";

    const message =
      options.message || "";

    const actionText =
      options.actionText || "";

    const actionHref =
      options.actionHref || "#";

    const icon =
      getEmptyStateIcon(
        options.icon
      );

    const actionHtml =
      actionText
        ? `
          <a
            href="${escapeAttribute(actionHref)}"
            class="customer-empty-action"
          >
            ${escapeHtml(actionText)}
          </a>
        `
        : "";

    return `
      <div class="customer-dashboard-empty">

        <div class="customer-empty-icon">
          ${icon}
        </div>

        <h3>
          ${escapeHtml(title)}
        </h3>

        <p>
          ${escapeHtml(message)}
        </p>

        ${actionHtml}

      </div>
    `;
  }


  /* ==========================================================
     STATUS NORMALIZATION
     ========================================================== */

  function normalizeOrderStatus(status) {

    const value =
      String(status || "processing")
        .trim()
        .toLowerCase();

    if (
      [
        "complete",
        "completed",
        "paid",
        "fulfilled"
      ].includes(value)
    ) {
      return {
        className: "complete",
        label: "Complete"
      };
    }

    if (
      [
        "pending",
        "awaiting",
        "unpaid"
      ].includes(value)
    ) {
      return {
        className: "pending",
        label: "Pending"
      };
    }

    return {
      className: "processing",
      label: "Processing"
    };
  }


  /* ==========================================================
     DATE FORMATTING
     ========================================================== */

  function formatDashboardDate(value) {

    try {

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "";
      }

      return new Intl.DateTimeFormat(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric"
        }
      ).format(date);

    } catch (error) {

      return "";

    }
  }


  function formatRelativeDate(value) {

    try {

      const date =
        new Date(value);

      const now =
        new Date();

      const difference =
        now.getTime() -
        date.getTime();

      const minute =
        60 * 1000;

      const hour =
        60 * minute;

      const day =
        24 * hour;

      if (difference < minute) {
        return "Just now";
      }

      if (difference < hour) {

        const minutes =
          Math.floor(
            difference / minute
          );

        return `${minutes}m ago`;
      }

      if (difference < day) {

        const hours =
          Math.floor(
            difference / hour
          );

        return `${hours}h ago`;
      }

      if (difference < day * 7) {

        const days =
          Math.floor(
            difference / day
          );

        return `${days}d ago`;
      }

      return formatDashboardDate(value);

    } catch (error) {

      return "";

    }
  }


  /* ==========================================================
     LOADING STATE
     ========================================================== */

  function showDashboardLoadingState() {

    const containers = [
      "customerRecentOrders",
      "customerRecentResults",
      "customerDashboardDocuments",
      "customerDashboardNotifications"
    ];

    containers.forEach(function (containerId) {

      const container =
        document.getElementById(containerId);

      if (!container) {
        return;
      }

      container.innerHTML = `
        <div class="customer-dashboard-loading">

          <span
            class="customer-loading-spinner"
            aria-hidden="true"
          ></span>

          <span>
            Loading your information...
          </span>

        </div>
      `;

    });
  }


  function hideDashboardLoadingState() {

    /*
     * Rendering replaces loading states.
     * This function remains available for future global
     * loading indicators.
     */

  }


  /* ==========================================================
     AUTH FAILURE
     ========================================================== */

  function handleMissingSession() {

    console.warn(
      "[Customer Dashboard] No authenticated session found."
    );

    /*
     * We do not force a redirect until the exact login route
     * used by the portal shell is confirmed.
     */

    showDashboardMessage(
      "Your session could not be found. Please sign in again."
    );
  }


  /* ==========================================================
     ERROR HANDLING
     ========================================================== */

  function handleDashboardError(error) {

    console.error(
      "[Customer Dashboard] Dashboard error:",
      error
    );

    const message =
      error &&
      error.message
        ? error.message
        : "We were unable to load your dashboard.";

    showDashboardMessage(message);
  }


  function showDashboardMessage(message) {

    const containers = [
      "customerRecentOrders",
      "customerRecentResults",
      "customerDashboardDocuments",
      "customerDashboardNotifications"
    ];

    containers.forEach(function (containerId) {

      const container =
        document.getElementById(containerId);

      if (!container) {
        return;
      }

      container.innerHTML = `
        <div class="customer-dashboard-empty compact">

          <div class="customer-empty-icon">
            ${getAlertIcon()}
          </div>

          <h3>
            Unable to load this section
          </h3>

          <p>
            ${escapeHtml(message)}
          </p>

        </div>
      `;

    });
  }


  /* ==========================================================
     SVG ICONS
     ========================================================== */

  function getOrderIcon() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 11l3 3L22 4"></path>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
      </svg>
    `;
  }


  function getResultIcon() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 12l2 2 4-4"></path>
        <path d="M21 12a9 9 0 1 1-3.3-6.94"></path>
      </svg>
    `;
  }


  function getDocumentIcon() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
        <path d="M8 13h8"></path>
        <path d="M8 17h8"></path>
      </svg>
    `;
  }


  function getAlertIcon() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <path d="M12 9v4"></path>
        <path d="M12 17h.01"></path>
      </svg>
    `;
  }


  function getEmptyStateIcon(icon) {

    const icons = {

      clipboard: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8" y="3" width="8" height="4" rx="1"></rect>
          <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"></path>
        </svg>
      `,

      results: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 12l2 2 4-4"></path>
          <circle cx="12" cy="12" r="9"></circle>
        </svg>
      `,

      document: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
        </svg>
      `,

      bell: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      `

    };

    return (
      icons[icon] ||
      icons.document
    );
  }


  /* ==========================================================
     SECURITY HELPERS
     ========================================================== */

  function escapeHtml(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function escapeAttribute(value) {
    return escapeHtml(value);
  }


  /* ==========================================================
     PUBLIC DASHBOARD API
     ========================================================== */

  window.CustomerDashboard = {

    refresh: async function () {

      dashboardState.initialized = false;

      await initializeCustomerDashboard();

    },

    getState: function () {

      return {
        ...dashboardState
      };

    }

  };


})();