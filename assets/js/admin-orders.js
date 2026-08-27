/* ============================================================
   screenings4u — ORDER MANAGEMENT
   Enterprise page controller
   ============================================================ */

(function () {
  "use strict";

  let orders = [];
  let itemCounts = new Map();
  let locationCounts = new Map();

  const $ = (id) => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", initializeOrders);

  async function initializeOrders() {
    bindEvents();

    try {
      await requireAccess();
      await loadOrders();
    } catch (error) {
      console.error("Orders initialization failed:", error);
      showMessage(error.message || "Unable to load order management.", "error");
      renderError(error.message || "Unable to load orders.");
    }
  }

  function bindEvents() {
    $("refreshBtn")?.addEventListener("click", loadOrders);
    $("primaryActionBtn")?.addEventListener("click", () => {
      window.location.href = "admin-order-create.html";
    });

    $("searchInput")?.addEventListener("input", renderOrders);
    $("statusFilter")?.addEventListener("change", renderOrders);
  }

  async function requireAccess() {
    if (!window.S4UAuth || typeof window.S4UAuth.requireSession !== "function") {
      throw new Error("Authentication system is unavailable.");
    }

    const session = await window.S4UAuth.requireSession("admin-login.html");

    if (!session) {
      throw new Error("A valid session is required.");
    }

    if (
      window.S4UPermissions &&
      typeof window.S4UPermissions.requirePermission === "function"
    ) {
      const allowed = await window.S4UPermissions.requirePermission(
        "orders.read",
        "admin-dashboard.html"
      );

      if (!allowed) {
        throw new Error("You do not have permission to access order management.");
      }
    }
  }

  function getClient() {
    if (!window.S4UAuth || typeof window.S4UAuth.getClient !== "function") {
      throw new Error("Supabase client is unavailable.");
    }

    const client = window.S4UAuth.getClient();

    if (!client) {
      throw new Error("Supabase client is unavailable.");
    }

    return client;
  }

  async function loadOrders() {
    setLoading(true);
    clearMessage();

    try {
      const client = getClient();

      const [ordersResult, itemsResult, locationsResult] = await Promise.all([
        client
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),

        client
          .from("order_items")
          .select("order_id"),

        client
          .from("order_donor_locations")
          .select("order_id")
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (locationsResult.error) throw locationsResult.error;

      orders = ordersResult.data || [];
      itemCounts = countByOrder(itemsResult.data || []);
      locationCounts = countByOrder(locationsResult.data || []);

      populateStatusFilter();
      renderMetrics();
      renderOrders();
      renderRecentOrders();

    } catch (error) {
      console.error("Order load failed:", error);
      showMessage(error.message || "Unable to load orders.", "error");
      renderError(error.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  function countByOrder(records) {
    const counts = new Map();

    records.forEach((record) => {
      if (!record.order_id) return;
      counts.set(record.order_id, (counts.get(record.order_id) || 0) + 1);
    });

    return counts;
  }

  function populateStatusFilter() {
    const filter = $("statusFilter");
    const current = filter.value;

    const statuses = [...new Set(
      orders
        .map((order) => String(order.status || "").trim())
        .filter(Boolean)
    )].sort();

    filter.innerHTML = '<option value="">All statuses</option>';

    statuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      filter.appendChild(option);
    });

    filter.value = statuses.includes(current) ? current : "";
  }

  function renderMetrics() {
    const total = orders.length;

    const active = orders.filter((order) => {
      const status = normalizeStatus(order.status);
      return [
        "pending",
        "processing",
        "in progress",
        "active",
        "scheduled"
      ].includes(status);
    }).length;

    const completed = orders.filter((order) => {
      const status = normalizeStatus(order.status);
      return [
        "completed",
        "fulfilled",
        "closed"
      ].includes(status);
    }).length;

    const now = new Date();

    const monthly = orders.filter((order) => {
      if (!order.created_at) return false;
      const created = new Date(order.created_at);

      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth()
      );
    }).length;

    setText("totalOrders", total);
    setText("activeOrders", active);
    setText("completedOrders", completed);
    setText("monthlyOrders", monthly);
  }

  function getFilteredOrders() {
    const query = ($("searchInput")?.value || "").trim().toLowerCase();
    const status = $("statusFilter")?.value || "";

    return orders.filter((order) => {
      const searchable = Object.values(order)
        .filter((value) =>
          typeof value === "string" ||
          typeof value === "number"
        )
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      const matchesStatus =
        !status || String(order.status || "") === status;

      return matchesSearch && matchesStatus;
    });
  }

  function renderOrders() {
    const body = $("tableBody");
    if (!body) return;

    const rows = getFilteredOrders();

    if (!rows.length) {
      body.innerHTML = `
        <tr>
          <td colspan="7" class="s4u-empty">
            No orders match the current filters.
          </td>
        </tr>
      `;
      return;
    }

    body.innerHTML = rows.map((order) => {
      const id = order.id;
      const number = getOrderLabel(order);
      const customer = getCustomerLabel(order);
      const status = order.status || "—";
      const items = itemCounts.get(id) || 0;
      const locations = locationCounts.get(id) || 0;

      return `
        <tr>
          <td>
            <strong>${escapeHtml(number)}</strong>
            <small>${escapeHtml(shortId(id))}</small>
          </td>
          <td>${escapeHtml(customer)}</td>
          <td>
            <span class="s4u-status ${statusClass(status)}">
              ${escapeHtml(status)}
            </span>
          </td>
          <td>${items}</td>
          <td>${locations}</td>
          <td>${escapeHtml(formatDate(order.created_at))}</td>
          <td>
            <a
              class="operations-table-action"
              href="admin-order-manage.html?id=${encodeURIComponent(id)}"
            >
              Manage
            </a>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderRecentOrders() {
    const container = $("recentList");
    if (!container) return;

    const recent = orders.slice(0, 6);

    if (!recent.length) {
      container.innerHTML = `
        <div class="s4u-empty">No orders available.</div>
      `;
      return;
    }

    container.innerHTML = recent.map((order) => `
      <a
        class="operations-list-item"
        href="admin-order-manage.html?id=${encodeURIComponent(order.id)}"
      >
        <strong>${escapeHtml(getOrderLabel(order))}</strong>
        <span>
          ${escapeHtml(getCustomerLabel(order))}
          · ${escapeHtml(order.status || "No status")}
          · ${escapeHtml(formatDate(order.created_at))}
        </span>
      </a>
    `).join("");
  }

  function getOrderLabel(order) {
    const preferred = [
      "order_number",
      "order_code",
      "reference_number",
      "reference"
    ];

    for (const field of preferred) {
      if (order[field]) return String(order[field]);
    }

    return `Order ${shortId(order.id)}`;
  }

  function getCustomerLabel(order) {
    const nameFields = [
      "customer_name",
      "client_name",
      "full_name"
    ];

    for (const field of nameFields) {
      if (order[field]) return String(order[field]);
    }

    const combinedName = [
      order.customer_first_name,
      order.customer_last_name
    ].filter(Boolean).join(" ").trim();

    if (combinedName) return combinedName;

    const emailFields = [
      "customer_email",
      "email"
    ];

    for (const field of emailFields) {
      if (order[field]) return String(order[field]);
    }

    return "Customer";
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString();
  }

  function shortId(value) {
    return value ? String(value).slice(0, 8) : "—";
  }

  function normalizeStatus(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ");
  }

  function statusClass(value) {
    const status = normalizeStatus(value);

    if (["completed", "fulfilled", "closed", "paid"].includes(status)) {
      return "success";
    }

    if (["cancelled", "canceled", "failed", "void"].includes(status)) {
      return "danger";
    }

    if (["pending", "processing", "in progress", "scheduled"].includes(status)) {
      return "warning";
    }

    return "";
  }

  function renderError(message) {
    const body = $("tableBody");

    if (body) {
      body.innerHTML = `
        <tr>
          <td colspan="7" class="s4u-empty">
            ${escapeHtml(message)}
          </td>
        </tr>
      `;
    }
  }

  function setLoading(isLoading) {
    const button = $("refreshBtn");

    if (!button) return;

    button.disabled = isLoading;
    button.setAttribute("aria-busy", String(isLoading));
    button.textContent = isLoading ? "Loading…" : "↻ Refresh";
  }

  function showMessage(message, type) {
    const box = $("pageMessage");

    if (!box) return;

    box.textContent = message;
    box.className = `operations-message ${type || ""}`.trim();
    box.style.display = "block";
  }

  function clearMessage() {
    const box = $("pageMessage");

    if (!box) return;

    box.textContent = "";
    box.className = "operations-message";
    box.style.display = "";
  }

  function setText(id, value) {
    const element = $(id);

    if (element) {
      element.textContent = String(value);
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

})();
