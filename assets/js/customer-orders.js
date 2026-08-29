/* ============================================================
   SCREENINGS4U
   CUSTOMER ORDERS
   customer-orders.js

   UI DATA ONLY FOR NOW.
   Supabase wiring will replace the demo data layer.
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener(
    "DOMContentLoaded",
    initializeCustomerOrders
  );


  /* ==========================================================
     STATE
     ========================================================== */

  const state = {
    filter: "all",
    search: "",
    newestFirst: true,
    orders: []
  };


  /* ==========================================================
     INITIALIZE
     ========================================================== */

  function initializeCustomerOrders() {
    bindOrderControls();
    loadOrders();
  }


  /* ==========================================================
     CONTROLS
     ========================================================== */

  function bindOrderControls() {
    const filterButtons = document.querySelectorAll(
      ".customer-orders-filter"
    );

    filterButtons.forEach(function (button) {
      button.addEventListener(
        "click",
        function () {
          state.filter = button.dataset.orderFilter || "all";

          filterButtons.forEach(function (item) {
            const isActive = item === button;

            item.classList.toggle(
              "is-active",
              isActive
            );

            item.setAttribute(
              "aria-selected",
              isActive ? "true" : "false"
            );
          });

          renderOrders();
        }
      );
    });


    const searchInput = document.getElementById(
      "customer-orders-search-input"
    );

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        function () {
          state.search = searchInput.value
            .trim()
            .toLowerCase();

          renderOrders();
        }
      );
    }


    const sortButton = document.getElementById(
      "customer-orders-sort"
    );

    if (sortButton) {
      sortButton.addEventListener(
        "click",
        function () {
          state.newestFirst = !state.newestFirst;

          sortButton.lastChild.textContent = state.newestFirst
            ? " Newest First"
            : " Oldest First";

          renderOrders();
        }
      );
    }
  }


  /* ==========================================================
     LOAD
     ========================================================== */

  async function loadOrders() {
    showLoading(true);

    /*
      SUPABASE WIRING POINT

      Replace the demo assignment below with the authenticated
      customer's order query when we wire this page.

      The UI intentionally does not assume the final column names
      beyond the display model used here.
    */

    await wait(350);

    state.orders = [];

    updateSummary();
    renderOrders();

    showLoading(false);
  }


  /* ==========================================================
     SUMMARY
     ========================================================== */

  function updateSummary() {
    const active = state.orders.filter(function (order) {
      return (
        order.status === "pending" ||
        order.status === "processing"
      );
    }).length;

    const completed = state.orders.filter(function (order) {
      return order.status === "completed";
    }).length;

    setText(
      "orders-active-count",
      active
    );

    setText(
      "orders-completed-count",
      completed
    );

    setText(
      "orders-total-count",
      state.orders.length
    );
  }


  /* ==========================================================
     RENDER
     ========================================================== */

  function renderOrders() {
    const list = document.getElementById(
      "customer-orders-list"
    );

    const empty = document.getElementById(
      "customer-orders-empty"
    );

    if (!list || !empty) {
      return;
    }

    let filteredOrders = state.orders.slice();


    if (state.filter === "active") {
      filteredOrders = filteredOrders.filter(function (order) {
        return (
          order.status === "pending" ||
          order.status === "processing"
        );
      });
    } else if (state.filter !== "all") {
      filteredOrders = filteredOrders.filter(function (order) {
        return order.status === state.filter;
      });
    }


    if (state.search) {
      filteredOrders = filteredOrders.filter(function (order) {
        const haystack = [
          order.id,
          order.service,
          order.status
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(state.search);
      });
    }


    filteredOrders.sort(function (a, b) {
      const first = new Date(a.date).getTime();
      const second = new Date(b.date).getTime();

      return state.newestFirst
        ? second - first
        : first - second;
    });


    if (!filteredOrders.length) {
      list.hidden = true;
      list.innerHTML = "";

      empty.hidden = false;

      return;
    }


    empty.hidden = true;
    list.hidden = false;

    list.innerHTML = filteredOrders
      .map(renderOrderRow)
      .join("");
  }


  function renderOrderRow(order) {
    return `
      <article class="customer-order-row">

        <div class="customer-order-service">

          <div class="customer-order-service-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="2"
              ></rect>
              <path d="M7 3v4"></path>
              <path d="M17 3v4"></path>
              <path d="M7 11h10"></path>
            </svg>
          </div>

          <div class="customer-order-service-copy">
            <strong>${escapeHtml(order.service)}</strong>
            <span>${escapeHtml(order.id)}</span>
          </div>

        </div>


        <div class="customer-order-meta">
          <span class="customer-order-meta-label">
            Order Date
          </span>

          <span class="customer-order-meta-value">
            ${formatDate(order.date)}
          </span>
        </div>


        <div class="customer-order-meta">
          <span class="customer-order-meta-label">
            Status
          </span>

          <span
            class="customer-order-status ${escapeHtml(order.status)}"
          >
            ${formatStatus(order.status)}
          </span>
        </div>


        <a
          href="customer-order-details.html?id=${encodeURIComponent(order.id)}"
          class="customer-order-view"
        >
          View Order

          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </a>

      </article>
    `;
  }


  /* ==========================================================
     HELPERS
     ========================================================== */

  function showLoading(isLoading) {
    const loading = document.getElementById(
      "customer-orders-loading"
    );

    if (loading) {
      loading.hidden = !isLoading;
    }
  }


  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }


  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    ).format(date);
  }


  function formatStatus(status) {
    return String(status || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });
  }


  function escapeHtml(value) {
    const element = document.createElement("div");

    element.textContent = String(value ?? "");

    return element.innerHTML;
  }


  function wait(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

})();
