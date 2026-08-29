/* ============================================================
   SCREENINGS4U — EMPLOYER INVOICES & PAYMENTS
   employer-invoices.js

   Supabase tables:
   - invoices
   - invoice_items
   - payments
   - payment_refunds
   - employer_profiles

   Security:
   Employer identity must be resolved from the authenticated user
   and RLS must restrict all billing records to that employer.
   ============================================================ */

(function () {
  "use strict";

  const state = { invoices: [], payments: [] };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindEvents();
    loadBillingData();
  }

  function bindEvents() {
    const search = document.getElementById("invoice-search");
    const filter = document.getElementById("invoice-status-filter");

    if (search) search.addEventListener("input", renderInvoices);
    if (filter) filter.addEventListener("change", renderInvoices);

    bindClick("pay-invoices-btn", payOutstandingInvoices);
    bindClick("view-all-payments-btn", viewAllPayments);

    document.querySelectorAll("[data-close-invoice-modal]").forEach(function (el) {
      el.addEventListener("click", closeInvoiceModal);
    });
  }

  async function loadBillingData() {
    /*
      FINAL LIVE IMPLEMENTATION:

      1. Get authenticated session.
      2. Resolve employer organization.
      3. Query invoices for employer.
      4. Query invoice_items through invoice relationship.
      5. Query payments for employer.
      6. Never expose another employer's billing records.

      Expected invoice fields:
      id, invoice_number, description, issued_at,
      due_date, total_amount, balance_due, status

      Expected payment fields:
      id, amount, status, paid_at, invoice_id
    */

    state.invoices = [];
    state.payments = [];

    updateSummary();
    renderInvoices();
    renderPayments();
  }

  function filteredInvoices() {
    const term = value("invoice-search").toLowerCase();
    const selected = value("invoice-status-filter") || "all";

    return state.invoices.filter(function (invoice) {
      const number = String(invoice.invoice_number || invoice.id || "").toLowerCase();
      const description = String(invoice.description || "").toLowerCase();
      const status = normalizeStatus(invoice.status);

      return (!term || number.includes(term) || description.includes(term)) &&
        (selected === "all" || status === selected);
    });
  }

  function renderInvoices() {
    const tbody = document.getElementById("invoice-table-body");
    if (!tbody) return;

    const invoices = filteredInvoices();

    if (!invoices.length) {
      tbody.innerHTML = `
        <tr><td colspan="7">
          <div class="invoice-empty-state">
            <div class="invoice-empty-icon">$</div>
            <h3>${state.invoices.length ? "No invoices match your filters" : "No invoices available"}</h3>
            <p>${state.invoices.length ? "Try changing your search or status filter." : "Invoices issued to your organization will appear here."}</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = invoices.map(function (invoice) {
      const status = normalizeStatus(invoice.status);

      return `
        <tr>
          <td>
            <span class="invoice-number">${escapeHtml(invoice.invoice_number || "Invoice")}</span>
            <span class="invoice-description">${escapeHtml(invoice.description || "Billing Invoice")}</span>
          </td>
          <td>${escapeHtml(formatDate(invoice.issued_at || invoice.created_at))}</td>
          <td>${escapeHtml(formatDate(invoice.due_date))}</td>
          <td class="invoice-amount">${escapeHtml(currency(invoice.total_amount))}</td>
          <td class="invoice-amount">${escapeHtml(currency(invoice.balance_due))}</td>
          <td><span class="invoice-status invoice-status-${status}">${escapeHtml(statusLabel(status))}</span></td>
          <td><button class="invoice-view-btn" type="button" data-invoice-id="${escapeAttribute(invoice.id)}">View</button></td>
        </tr>`;
    }).join("");

    tbody.querySelectorAll("[data-invoice-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        openInvoiceModal(button.dataset.invoiceId);
      });
    });
  }

  function renderPayments() {
    const list = document.getElementById("payment-list");
    if (!list) return;

    if (!state.payments.length) {
      list.innerHTML = `<div class="payment-empty-state"><p>No payment activity is available yet.</p></div>`;
      return;
    }

    list.innerHTML = state.payments.slice(0, 5).map(function (payment) {
      return `
        <div class="payment-row">
          <div class="payment-main">
            <strong>${escapeHtml(payment.reference || payment.payment_reference || "Payment")}</strong>
            <span>${escapeHtml(formatDate(payment.paid_at || payment.created_at))}</span>
          </div>
          <div class="payment-amount">${escapeHtml(currency(payment.amount))}</div>
        </div>`;
    }).join("");
  }

  function updateSummary() {
    const open = state.invoices.filter(function (i) { return normalizeStatus(i.status) === "open"; });
    const pastDue = state.invoices.filter(function (i) { return normalizeStatus(i.status) === "past_due"; });

    const outstanding = open.concat(pastDue).reduce(function (sum, i) {
      return sum + Number(i.balance_due != null ? i.balance_due : i.total_amount || 0);
    }, 0);

    const paid = state.payments.reduce(function (sum, payment) {
      return sum + Number(payment.amount || 0);
    }, 0);

    setText("stat-outstanding", state.invoices.length ? currency(outstanding) : "—");
    setText("stat-open", open.length || "—");
    setText("stat-past-due", pastDue.length || "—");
    setText("stat-paid", state.payments.length ? currency(paid) : "—");
  }

  function openInvoiceModal(invoiceId) {
    const invoice = state.invoices.find(function (item) {
      return String(item.id) === String(invoiceId);
    });
    if (!invoice) return;

    const modal = document.getElementById("invoice-modal");
    const title = document.getElementById("invoice-modal-title");
    const content = document.getElementById("invoice-modal-content");
    const actions = document.getElementById("invoice-modal-actions");

    if (!modal || !content || !actions) return;

    if (title) title.textContent = invoice.invoice_number || "Invoice";

    const items = Array.isArray(invoice.invoice_items) ? invoice.invoice_items : [];

    content.innerHTML = `
      <div class="invoice-detail-grid">
        <div class="invoice-detail-item"><span>Status</span><strong>${escapeHtml(statusLabel(normalizeStatus(invoice.status)))}</strong></div>
        <div class="invoice-detail-item"><span>Due Date</span><strong>${escapeHtml(formatDate(invoice.due_date))}</strong></div>
        <div class="invoice-detail-item"><span>Balance</span><strong>${escapeHtml(currency(invoice.balance_due))}</strong></div>
      </div>

      <h3 class="invoice-items-heading">Invoice Items</h3>
      ${items.length ? items.map(function (item) {
        return `<div class="invoice-item-row">
          <span>${escapeHtml(item.description || item.name || "Invoice Item")}</span>
          <strong>${escapeHtml(currency(item.amount || item.total_amount))}</strong>
        </div>`;
      }).join("") : `<div class="invoice-item-row"><span>Invoice line items will load here.</span><strong>—</strong></div>`}
    `;

    const canPay = ["open", "past_due"].includes(normalizeStatus(invoice.status)) &&
      Number(invoice.balance_due != null ? invoice.balance_due : invoice.total_amount || 0) > 0;

    actions.innerHTML = `
      <button type="button" class="invoice-secondary-btn" data-close-invoice-modal>Close</button>
      ${canPay ? `<button type="button" class="invoice-primary-btn" id="modal-pay-invoice-btn">Pay Invoice</button>` : ""}
    `;

    actions.querySelectorAll("[data-close-invoice-modal]").forEach(function (button) {
      button.addEventListener("click", closeInvoiceModal);
    });

    bindClick("modal-pay-invoice-btn", function () {
      beginInvoicePayment(invoice.id);
    });

    modal.hidden = false;
  }

  function closeInvoiceModal() {
    const modal = document.getElementById("invoice-modal");
    if (modal) modal.hidden = true;
  }

  function payOutstandingInvoices() {
    const payable = state.invoices.filter(function (invoice) {
      const status = normalizeStatus(invoice.status);
      return ["open", "past_due"].includes(status) &&
        Number(invoice.balance_due != null ? invoice.balance_due : invoice.total_amount || 0) > 0;
    });

    if (!payable.length) {
      alert("There are currently no outstanding invoices available for payment.");
      return;
    }

    /*
      Final implementation should route to the Stripe checkout/payment
      workflow and create payment records only after verified payment.
    */
    alert("The secure invoice payment workflow will be connected here.");
  }

  function beginInvoicePayment(invoiceId) {
    /*
      Final implementation:
      - Server-side create checkout/payment intent.
      - Verify webhook.
      - Insert/update payment status.
      - Update invoice balance.
    */
    alert("The secure payment workflow for this invoice will be connected here.");
  }

  function viewAllPayments() {
    /*
      This page already supports the payment data structure.
      A dedicated payment-history page can be added later if needed.
    */
    document.getElementById("payment-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function normalizeStatus(value) {
    const status = String(value || "open").toLowerCase().trim()
      .replace(/\s+/g, "_").replace(/-/g, "_");

    return ["open", "paid", "past_due", "void"].includes(status) ? status : "open";
  }

  function statusLabel(status) {
    return { open:"Open", paid:"Paid", past_due:"Past Due", void:"Void" }[status] || "Open";
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-US", {
      month:"short", day:"numeric", year:"numeric"
    }).format(date);
  }

  function currency(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";
    return new Intl.NumberFormat("en-US", {
      style:"currency", currency:"USD"
    }).format(amount);
  }

  function value(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text == null ? "" : text;
  }

  function bindClick(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", handler);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
