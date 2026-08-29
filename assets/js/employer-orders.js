/* ============================================================
   SCREENINGS4U — EMPLOYER ORDERS
   employer-orders.js

   Database tables expected during final wiring:
   - orders
   - order_items
   - order_donor_locations
   - payments
   - payment_refunds
   - invoices (when applicable)

   Exact column mapping will be verified before live queries.
   ============================================================ */

(function () {
  "use strict";

  const state = {
    orders: [],
    activeType: "all"
  };

  document.addEventListener("DOMContentLoaded", initializeOrders);

  function initializeOrders() {
    bindControls();
    loadOrders();
  }

  function bindControls() {
    const search = document.getElementById("order-search");
    const statusFilter = document.getElementById("order-status-filter");

    if (search) search.addEventListener("input", renderOrders);
    if (statusFilter) statusFilter.addEventListener("change", renderOrders);

    document.querySelectorAll(".order-type-tab").forEach(function (button) {
      button.addEventListener("click", function () {
        state.activeType = button.dataset.orderType || "all";

        document.querySelectorAll(".order-type-tab").forEach(function (tab) {
          tab.classList.remove("active");
        });

        button.classList.add("active");
        renderOrders();
      });
    });

    bindClick("order-detail-close", closeOrderDetail);
    bindClick("order-detail-close-bottom", closeOrderDetail);
    bindClick("order-detail-backdrop", closeOrderDetail);
  }

  async function loadOrders() {
    /*
      SUPABASE WIRING PLAN

      1. Read the authenticated session.
      2. Resolve the employer profile for that user.
      3. Query orders where employer_id belongs to the organization.
      4. Join/load order_items separately if required by schema.
      5. RLS must enforce employer ownership.

      Never expose orders from another organization based solely
      on a client-provided employer ID.
    */

    state.orders = [];

    updateMetrics();
    renderOrders();
  }

  function getFilteredOrders() {
    const search = getValue("order-search").toLowerCase();
    const status = getValue("order-status-filter") || "all";

    return state.orders.filter(function (order) {
      const orderNumber = String(order.order_number || order.id || "").toLowerCase();
      const serviceText = getOrderServiceText(order).toLowerCase();
      const orderType = String(order.type || "").toLowerCase();
      const orderStatus = String(order.status || "").toLowerCase();

      const matchesSearch =
        !search ||
        orderNumber.includes(search) ||
        serviceText.includes(search);

      const matchesStatus =
        status === "all" ||
        orderStatus === status;

      const matchesType =
        state.activeType === "all" ||
        orderType === state.activeType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  function renderOrders() {
    const tbody = document.getElementById("orders-table-body");
    if (!tbody) return;

    const orders = getFilteredOrders();

    if (orders.length === 0) {
      const noOrdersAtAll = state.orders.length === 0;

      tbody.innerHTML = `
        <tr class="orders-empty-row">
          <td colspan="6">
            <div class="orders-empty-state">
              <div class="orders-empty-icon">□</div>
              <h3>${noOrdersAtAll ? "Your orders will appear here" : "No orders match your filters"}</h3>
              <p>${
                noOrdersAtAll
                  ? "Orders placed through Screenings4u will be available in this portal."
                  : "Try changing your search, status, or order type."
              }</p>
              ${
                noOrdersAtAll
                  ? '<a href="employer-catalog.html" class="orders-secondary-btn">Browse Services</a>'
                  : ""
              }
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders.map(function (order) {
      const status = String(order.status || "pending").toLowerCase();

      return `
        <tr>
          <td>
            <span class="order-number">${escapeHtml(order.order_number || order.id || "Order")}</span>
            <span class="order-id-subtext">${escapeHtml(formatOrderType(order.type))}</span>
          </td>
          <td class="order-services">${escapeHtml(getOrderServiceText(order))}</td>
          <td>${escapeHtml(formatDate(order.created_at || order.date))}</td>
          <td>
            <span class="order-status order-status-${escapeAttribute(status)}">
              ${escapeHtml(capitalize(status))}
            </span>
          </td>
          <td class="order-total">${escapeHtml(formatCurrency(order.total_amount || order.total))}</td>
          <td>
            <button type="button" class="order-view-btn" data-order-id="${escapeAttribute(order.id)}">
              View
            </button>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll("[data-order-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        openOrderDetail(button.dataset.orderId);
      });
    });
  }

  function updateMetrics() {
    const totalOrders = state.orders.length;

    const activeOrders = state.orders.filter(function (order) {
      const status = String(order.status || "").toLowerCase();
      return status === "pending" || status === "processing";
    }).length;

    const completedOrders = state.orders.filter(function (order) {
      return String(order.status || "").toLowerCase() === "completed";
    }).length;

    const totalSpend = state.orders.reduce(function (total, order) {
      return total + Number(order.total_amount || order.total || 0);
    }, 0);

    setText("stat-total-orders", totalOrders || "—");
    setText("stat-active-orders", activeOrders || "—");
    setText("stat-completed-orders", completedOrders || "—");
    setText("stat-total-spend", totalOrders ? formatCurrency(totalSpend) : "—");
  }

  function openOrderDetail(orderId) {
    const order = state.orders.find(function (item) {
      return String(item.id) === String(orderId);
    });

    if (!order) return;

    const modal = document.getElementById("order-detail-modal");
    const title = document.getElementById("order-detail-title");
    const content = document.getElementById("order-detail-content");

    if (!modal || !content) return;

    if (title) {
      title.textContent = order.order_number || "Order Details";
    }

    const services = Array.isArray(order.services)
      ? order.services
      : [getOrderServiceText(order)];

    content.innerHTML = `
      <div class="order-detail-grid">
        <div class="order-detail-item">
          <span>Status</span>
          <strong>${escapeHtml(capitalize(order.status || "pending"))}</strong>
        </div>
        <div class="order-detail-item">
          <span>Order Type</span>
          <strong>${escapeHtml(formatOrderType(order.type))}</strong>
        </div>
        <div class="order-detail-item">
          <span>Order Date</span>
          <strong>${escapeHtml(formatDate(order.created_at || order.date))}</strong>
        </div>
        <div class="order-detail-item">
          <span>Total</span>
          <strong>${escapeHtml(formatCurrency(order.total_amount || order.total))}</strong>
        </div>
      </div>

      <div class="order-detail-services">
        <h3>Services</h3>
        <ul>
          ${services.map(function (service) {
            return "<li>" + escapeHtml(service) + "</li>";
          }).join("")}
        </ul>
      </div>
    `;

    modal.hidden = false;
  }

  function closeOrderDetail() {
    const modal = document.getElementById("order-detail-modal");
    if (modal) modal.hidden = true;
  }

  function getOrderServiceText(order) {
    if (Array.isArray(order.services) && order.services.length) {
      return order.services.join(", ");
    }

    if (order.service_name) return String(order.service_name);
    if (order.item_count) return String(order.item_count) + " service item(s)";

    return "Service order";
  }

  function formatOrderType(type) {
    const types = {
      testing: "Testing",
      screening: "Screening",
      training: "Training"
    };

    return types[type] || "Service";
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  }

  function capitalize(value) {
    const text = String(value || "");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function bindClick(id, handler) {
    const element = document.getElementById(id);
    if (element) element.addEventListener("click", handler);
  }

  function getValue(id) {
    const element = document.getElementById(id);
    return element ? String(element.value || "").trim() : "";
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value == null ? "" : value;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

})();
