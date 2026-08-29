/* ============================================================
   SCREENINGS4U
   CUSTOMER RESULTS
   customer-results.js

   UI DATA ONLY FOR NOW.
   Supabase wiring will be added after the portal data flow is wired.
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener(
    "DOMContentLoaded",
    initializeCustomerResults
  );

  const state = {
    filter: "all",
    search: "",
    newestFirst: true,
    results: []
  };


  function initializeCustomerResults() {
    bindResultControls();
    loadResults();
  }


  function bindResultControls() {
    const filters = document.querySelectorAll(
      ".customer-results-filter"
    );

    filters.forEach(function (button) {
      button.addEventListener("click", function () {
        state.filter = button.dataset.resultFilter || "all";

        filters.forEach(function (item) {
          const active = item === button;

          item.classList.toggle("is-active", active);
          item.setAttribute(
            "aria-selected",
            active ? "true" : "false"
          );
        });

        renderResults();
      });
    });


    const searchInput = document.getElementById(
      "customer-results-search-input"
    );

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.search = searchInput.value
          .trim()
          .toLowerCase();

        renderResults();
      });
    }


    const sortButton = document.getElementById(
      "customer-results-sort"
    );

    if (sortButton) {
      sortButton.addEventListener("click", function () {
        state.newestFirst = !state.newestFirst;

        const label = sortButton.querySelector("span");

        if (label) {
          label.textContent = state.newestFirst
            ? "Newest First"
            : "Oldest First";
        }

        renderResults();
      });
    }
  }


  async function loadResults() {
    showLoading(true);

    /*
      SUPABASE WIRING POINT

      Results should only be loaded from the final secure data source
      after the customer identity and result access rules are wired.

      We intentionally leave the page data empty at this stage.
    */

    await wait(350);

    state.results = [];

    updateSummary();
    renderResults();

    showLoading(false);
  }


  function updateSummary() {
    const available = state.results.filter(function (result) {
      return result.status === "available";
    }).length;

    const pending = state.results.filter(function (result) {
      return result.status === "pending";
    }).length;

    setText("results-available-count", available);
    setText("results-pending-count", pending);
    setText("results-total-count", state.results.length);
  }


  function renderResults() {
    const list = document.getElementById(
      "customer-results-list"
    );

    const empty = document.getElementById(
      "customer-results-empty"
    );

    if (!list || !empty) {
      return;
    }

    let filtered = state.results.slice();

    if (state.filter !== "all") {
      filtered = filtered.filter(function (result) {
        return result.status === state.filter;
      });
    }

    if (state.search) {
      filtered = filtered.filter(function (result) {
        const haystack = [
          result.id,
          result.service,
          result.status
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(state.search);
      });
    }

    filtered.sort(function (a, b) {
      const first = new Date(a.date).getTime();
      const second = new Date(b.date).getTime();

      return state.newestFirst
        ? second - first
        : first - second;
    });

    if (!filtered.length) {
      list.hidden = true;
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    list.hidden = false;

    list.innerHTML = filtered
      .map(renderResultRow)
      .join("");
  }


  function renderResultRow(result) {
    const action = result.status === "available"
      ? `
        <a
          href="customer-result-details.html?id=${encodeURIComponent(result.id)}"
          class="customer-result-view"
        >
          View Result
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </a>
      `
      : `
        <span class="customer-result-view" aria-disabled="true">
          Processing
        </span>
      `;

    return `
      <article class="customer-result-row">

        <div class="customer-result-service">

          <div class="customer-result-service-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="3" width="14" height="18" rx="2"></rect>
              <path d="M9 8h6"></path>
              <path d="M9 12h6"></path>
            </svg>
          </div>

          <div class="customer-result-service-copy">
            <strong>${escapeHtml(result.service)}</strong>
            <span>${escapeHtml(result.id)}</span>
          </div>

        </div>

        <div class="customer-result-meta">
          <span class="customer-result-meta-label">
            Released
          </span>

          <span class="customer-result-meta-value">
            ${result.status === "available"
              ? formatDate(result.date)
              : "Processing"}
          </span>
        </div>

        <div class="customer-result-meta">
          <span class="customer-result-meta-label">
            Status
          </span>

          <span class="customer-result-status ${escapeHtml(result.status)}">
            ${formatStatus(result.status)}
          </span>
        </div>

        ${action}

      </article>
    `;
  }


  function showLoading(isLoading) {
    const loading = document.getElementById(
      "customer-results-loading"
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
