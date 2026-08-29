/* ============================================================
   SCREENINGS4U
   CUSTOMER BILLING & RECEIPTS
   customer-billing.js

   Ready for Supabase wiring.

   Existing architecture references:
   - orders
   - payments
   - payment_refunds
   - invoices

   The authenticated customer must only see records that belong to
   their own account.
   ============================================================ */

(function () {
  "use strict";

  const state = {
    records: [],
    search: "",
    status: "all"
  };


  document.addEventListener(
    "DOMContentLoaded",
    initializeCustomerBilling
  );


  function initializeCustomerBilling() {
    bindControls();
    loadBillingHistory();
  }


  function bindControls() {
    const search =
      document.getElementById("billing-search");

    const statusFilter =
      document.getElementById("billing-status-filter");

    const refresh =
      document.getElementById("billing-refresh");

    const help =
      document.getElementById("billing-help-btn");


    if (search) {
      search.addEventListener(
        "input",
        function () {
          state.search =
            search.value.trim().toLowerCase();

          renderBillingHistory();
        }
      );
    }


    if (statusFilter) {
      statusFilter.addEventListener(
        "change",
        function () {
          state.status =
            statusFilter.value || "all";

          renderBillingHistory();
        }
      );
    }


    if (refresh) {
      refresh.addEventListener(
        "click",
        loadBillingHistory
      );
    }


    if (help) {
      help.addEventListener(
        "click",
        function () {
          window.alert(
            "Billing support will be connected to the Screenings4u support workflow during wiring."
          );
        }
      );
    }
  }


  async function loadBillingHistory() {
    setLoading(true);

    /*
      FINAL SUPABASE WIRING

      We already know the database contains:
      - orders
      - payments
      - payment_refunds
      - invoices
      - customer_profiles

      During wiring we need to inspect the actual columns and RLS
      policies before writing the production query.

      Intended flow:

      1. Get authenticated auth user.
      2. Resolve that user's customer_profiles record.
      3. Retrieve only orders and payments owned by that customer.
      4. Determine receipt availability from the completed payment/order.
      5. Display refunds without exposing unrelated records.

      IMPORTANT:
      Do not use fake billing data.
      Do not expose payment records belonging to another customer.
    */

    try {
      await wait(300);

      state.records = [];

      updateSummary();
      renderBillingHistory();

    } catch (error) {
      console.error(
        "Unable to load customer billing history:",
        error
      );

      state.records = [];

      updateSummary();
      renderBillingHistory();
    } finally {
      setLoading(false);
    }
  }


  function getFilteredRecords() {
    return state.records.filter(
      function (record) {
        const statusMatch =
          state.status === "all" ||
          normalizeStatus(record.status) === state.status;

        const searchableText = [
          record.purchase_name,
          record.order_number,
          record.receipt_number
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const searchMatch =
          !state.search ||
          searchableText.includes(state.search);

        return statusMatch && searchMatch;
      }
    );
  }


  function renderBillingHistory() {
    const tableBody =
      document.getElementById("billing-table-body");

    const tableWrap =
      document.getElementById("billing-table-wrap");

    const mobileList =
      document.getElementById("billing-mobile-list");

    const empty =
      document.getElementById("billing-empty");

    const emptyText =
      document.getElementById("billing-empty-text");


    if (
      !tableBody ||
      !tableWrap ||
      !mobileList ||
      !empty
    ) {
      return;
    }


    const records =
      getFilteredRecords();


    tableBody.innerHTML = "";
    mobileList.innerHTML = "";


    if (!records.length) {
      tableWrap.hidden = true;
      mobileList.hidden = true;
      empty.hidden = false;

      if (emptyText) {
        emptyText.textContent =
          state.records.length
            ? "No billing records match your current filters."
            : "Your completed purchases and receipts will appear here.";
      }

      return;
    }


    empty.hidden = true;
    tableWrap.hidden = false;
    mobileList.hidden = false;


    records.forEach(function (record) {
      tableBody.appendChild(
        createTableRow(record)
      );

      mobileList.appendChild(
        createMobileCard(record)
      );
    });
  }


  function createTableRow(record) {
    const row =
      document.createElement("tr");


    row.innerHTML = [
      "<td>",
      '<div class="customer-billing-purchase">',
      "<strong></strong>",
      "<span></span>",
      "</div>",
      "</td>",

      '<td class="customer-billing-order"></td>',

      "<td></td>",

      '<td class="customer-billing-amount"></td>',

      "<td>",
      '<span class="customer-billing-status"></span>',
      "</td>",

      "<td>",
      '<button type="button" class="customer-billing-receipt" aria-label="Download receipt">',
      '<svg viewBox="0 0 24 24" aria-hidden="true">',
      '<path d="M12 3v12"></path>',
      '<path d="m7 10 5 5 5-5"></path>',
      '<path d="M5 21h14"></path>',
      "</svg>",
      "</button>",
      "</td>"
    ].join("");


    const purchase =
      row.querySelector(
        ".customer-billing-purchase"
      );

    purchase.querySelector("strong").textContent =
      record.purchase_name || "Screenings4u Purchase";

    purchase.querySelector("span").textContent =
      record.receipt_number ||
      "Receipt available";


    row.querySelector(
      ".customer-billing-order"
    ).textContent =
      record.order_number || "—";


    row.children[2].textContent =
      formatDate(record.date);


    row.querySelector(
      ".customer-billing-amount"
    ).textContent =
      formatCurrency(record.amount);


    const status =
      row.querySelector(
        ".customer-billing-status"
      );

    const normalizedStatus =
      normalizeStatus(record.status);

    status.textContent =
      formatStatus(normalizedStatus);

    status.classList.add(
      normalizedStatus
    );


    row.querySelector(
      ".customer-billing-receipt"
    ).addEventListener(
      "click",
      function () {
        downloadReceipt(record);
      }
    );


    return row;
  }


  function createMobileCard(record) {
    const card =
      document.createElement("article");

    card.className =
      "customer-billing-mobile-card";


    card.innerHTML = [
      '<div class="customer-billing-mobile-top">',
      "<div>",
      "<h3></h3>",
      "<p></p>",
      "</div>",
      '<span class="customer-billing-status"></span>',
      "</div>",

      '<div class="customer-billing-mobile-bottom">',
      '<div class="customer-billing-mobile-meta">',
      "<span></span>",
      "<span></span>",
      "</div>",

      '<button type="button" class="customer-billing-receipt" aria-label="Download receipt">',
      '<svg viewBox="0 0 24 24" aria-hidden="true">',
      '<path d="M12 3v12"></path>',
      '<path d="m7 10 5 5 5-5"></path>',
      '<path d="M5 21h14"></path>',
      "</svg>",
      "</button>",
      "</div>"
    ].join("");


    card.querySelector("h3").textContent =
      record.purchase_name ||
      "Screenings4u Purchase";

    card.querySelector("p").textContent =
      record.order_number || "Order";

    const status =
      card.querySelector(
        ".customer-billing-status"
      );

    const normalizedStatus =
      normalizeStatus(record.status);

    status.textContent =
      formatStatus(normalizedStatus);

    status.classList.add(
      normalizedStatus
    );


    const meta =
      card.querySelectorAll(
        ".customer-billing-mobile-meta span"
      );

    meta[0].textContent =
      formatDate(record.date);

    meta[1].textContent =
      formatCurrency(record.amount);


    card.querySelector(
      ".customer-billing-receipt"
    ).addEventListener(
      "click",
      function () {
        downloadReceipt(record);
      }
    );


    return card;
  }


  function updateSummary() {
    const completedRecords =
      state.records.filter(function (record) {
        return (
          normalizeStatus(record.status) ===
          "completed"
        );
      });


    const totalPaid =
      completedRecords.reduce(
        function (total, record) {
          return (
            total +
            Number(record.amount || 0)
          );
        },
        0
      );


    const paymentMethods =
      new Set(
        completedRecords
          .map(function (record) {
            return record.payment_method;
          })
          .filter(Boolean)
      );


    setText(
      "billing-total-paid",
      state.records.length
        ? formatCurrency(totalPaid)
        : "—"
    );

    setText(
      "billing-purchase-count",
      state.records.length
        ? completedRecords.length
        : "—"
    );

    setText(
      "billing-payment-methods",
      state.records.length
        ? paymentMethods.size
        : "—"
    );
  }


  function downloadReceipt(record) {
    /*
      FINAL RECEIPT WIRING

      Depending on the final architecture, this action can:
      - open a stored invoice/receipt document
      - generate a receipt from the completed order/payment
      - redirect to the payment provider's hosted receipt

      We will connect this after reviewing the exact columns and
      relationships in payments, orders, invoices, and documents.
    */

    if (!record) {
      return;
    }


    window.alert(
      "Receipt downloading will be connected when the billing records are wired to Supabase."
    );
  }


  function setLoading(isLoading) {
    const loading =
      document.getElementById("billing-loading");

    const tableWrap =
      document.getElementById("billing-table-wrap");

    const mobileList =
      document.getElementById("billing-mobile-list");

    const empty =
      document.getElementById("billing-empty");


    if (loading) {
      loading.hidden = !isLoading;
    }


    if (isLoading) {
      if (tableWrap) {
        tableWrap.hidden = true;
      }

      if (mobileList) {
        mobileList.hidden = true;
      }

      if (empty) {
        empty.hidden = true;
      }
    }
  }


  function normalizeStatus(status) {
    const value =
      String(status || "completed")
        .trim()
        .toLowerCase();

    if (
      value === "pending" ||
      value === "processing"
    ) {
      return "pending";
    }

    if (
      value === "refunded" ||
      value === "refund"
    ) {
      return "refunded";
    }

    return "completed";
  }


  function formatStatus(status) {
    const labels = {
      completed: "Completed",
      pending: "Pending",
      refunded: "Refunded"
    };

    return labels[status] || "Completed";
  }


  function formatCurrency(value) {
    const amount =
      Number(value || 0);

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD"
      }
    ).format(amount);
  }


  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

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


  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        String(value);
    }
  }


  function wait(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(
        resolve,
        milliseconds
      );
    });
  }

})();
