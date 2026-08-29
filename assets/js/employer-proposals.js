/* ============================================================
   SCREENINGS4U — EMPLOYER PROPOSALS
   employer-proposals.js

   Supabase tables:
   - proposals
   - proposal_items
   - proposal_events
   - employer_profiles

   The final live query must resolve the authenticated employer
   organization first and never trust a browser-supplied employer ID.
   ============================================================ */

(function () {
  "use strict";

  const state = {
    proposals: []
  };

  document.addEventListener("DOMContentLoaded", initializeEmployerProposals);

  function initializeEmployerProposals() {
    bindControls();
    loadProposals();
  }

  function bindControls() {
    const search = document.getElementById("proposal-search");
    const filter = document.getElementById("proposal-status-filter");

    if (search) search.addEventListener("input", renderProposals);
    if (filter) filter.addEventListener("change", renderProposals);

    bindClick("request-proposal-btn", requestProposal);
    bindClick("empty-request-proposal-btn", requestProposal);
    bindClick("custom-proposal-btn", requestProposal);

    document.querySelectorAll("[data-close-proposal-modal]").forEach(function (element) {
      element.addEventListener("click", closeProposalModal);
    });
  }

  async function loadProposals() {
    /*
      FINAL LIVE FLOW

      1. Get authenticated Supabase session.
      2. Resolve the user's employer membership/profile.
      3. Query proposals belonging to that employer.
      4. Load proposal_items and proposal_events as needed.
      5. RLS must enforce employer ownership.

      Example data shape expected by the renderer:

      {
        id,
        proposal_number,
        title,
        status,
        created_at,
        expires_at,
        total_amount,
        proposal_items: [...]
      }

      No mock business records are inserted here.
    */

    state.proposals = [];
    updateSummary();
    renderProposals();
  }

  function getFilteredProposals() {
    const search = getValue("proposal-search").toLowerCase();
    const selectedStatus = getValue("proposal-status-filter") || "all";

    return state.proposals.filter(function (proposal) {
      const number = String(proposal.proposal_number || proposal.id || "").toLowerCase();
      const title = String(proposal.title || "").toLowerCase();
      const status = normalizeStatus(proposal.status);

      const matchesSearch =
        !search ||
        number.includes(search) ||
        title.includes(search);

      const matchesStatus =
        selectedStatus === "all" ||
        status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  function renderProposals() {
    const tbody = document.getElementById("proposal-table-body");
    if (!tbody) return;

    const proposals = getFilteredProposals();

    if (!proposals.length) {
      const isEmpty = state.proposals.length === 0;

      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="proposal-empty-state">
              <div class="proposal-empty-icon">▤</div>
              <h3>${isEmpty ? "No proposals available" : "No proposals match your filters"}</h3>
              <p>${isEmpty ? "Proposals prepared for your organization will appear here." : "Try changing your search or status filter."}</p>
              ${isEmpty ? '<button type="button" class="proposal-secondary-btn" id="empty-request-proposal-btn">Request a Proposal</button>' : ""}
            </div>
          </td>
        </tr>
      `;

      bindClick("empty-request-proposal-btn", requestProposal);
      return;
    }

    tbody.innerHTML = proposals.map(function (proposal) {
      const itemCount = Array.isArray(proposal.proposal_items)
        ? proposal.proposal_items.length
        : (proposal.item_count || 0);

      const status = normalizeStatus(proposal.status);

      return `
        <tr>
          <td>
            <span class="proposal-number">${escapeHtml(proposal.proposal_number || "Proposal")}</span>
            <span class="proposal-name">${escapeHtml(proposal.title || "Service Proposal")}</span>
          </td>
          <td>${escapeHtml(formatDate(proposal.created_at))}</td>
          <td>${escapeHtml(formatDate(proposal.expires_at))}</td>
          <td>${itemCount || "—"}</td>
          <td class="proposal-total">${escapeHtml(formatCurrency(proposal.total_amount))}</td>
          <td>
            <span class="proposal-status proposal-status-${escapeAttribute(status)}">
              ${escapeHtml(formatStatus(status))}
            </span>
          </td>
          <td>
            <button type="button" class="proposal-view-btn" data-proposal-id="${escapeAttribute(proposal.id)}">
              View
            </button>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll("[data-proposal-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        openProposalModal(button.dataset.proposalId);
      });
    });
  }

  function updateSummary() {
    const total = state.proposals.length;

    const active = state.proposals.filter(function (proposal) {
      const status = normalizeStatus(proposal.status);
      return status === "sent" || status === "viewed";
    }).length;

    const accepted = state.proposals.filter(function (proposal) {
      return normalizeStatus(proposal.status) === "accepted";
    }).length;

    const pending = active;

    const totalValue = state.proposals.reduce(function (sum, proposal) {
      return sum + Number(proposal.total_amount || 0);
    }, 0);

    setText("proposal-stat-active", active || "—");
    setText("proposal-stat-accepted", accepted || "—");
    setText("proposal-stat-pending", pending || "—");
    setText("proposal-stat-value", total ? formatCurrency(totalValue) : "—");
  }

  function openProposalModal(proposalId) {
    const proposal = state.proposals.find(function (item) {
      return String(item.id) === String(proposalId);
    });

    if (!proposal) return;

    const modal = document.getElementById("proposal-modal");
    const title = document.getElementById("proposal-modal-title");
    const content = document.getElementById("proposal-modal-content");
    const actions = document.getElementById("proposal-modal-actions");

    if (!modal || !content || !actions) return;

    if (title) {
      title.textContent = proposal.proposal_number || proposal.title || "Proposal";
    }

    const items = Array.isArray(proposal.proposal_items)
      ? proposal.proposal_items
      : [];

    content.innerHTML = `
      <div class="proposal-detail-grid">
        <div class="proposal-detail-item">
          <span>Status</span>
          <strong>${escapeHtml(formatStatus(normalizeStatus(proposal.status)))}</strong>
        </div>
        <div class="proposal-detail-item">
          <span>Created</span>
          <strong>${escapeHtml(formatDate(proposal.created_at))}</strong>
        </div>
        <div class="proposal-detail-item">
          <span>Total</span>
          <strong>${escapeHtml(formatCurrency(proposal.total_amount))}</strong>
        </div>
      </div>

      <h3 class="proposal-items-heading">Services & Items</h3>

      ${
        items.length
          ? items.map(function (item) {
              return `
                <div class="proposal-item-row">
                  <span>${escapeHtml(item.description || item.name || "Proposal Item")}</span>
                  <strong>${escapeHtml(formatCurrency(item.amount || item.total_amount))}</strong>
                </div>
              `;
            }).join("")
          : '<div class="proposal-item-row"><span>Proposal line items will load here.</span><strong>—</strong></div>'
      }
    `;

    actions.innerHTML = `
      <button type="button" class="proposal-secondary-btn" data-close-proposal-modal>Close</button>
    `;

    actions.querySelectorAll("[data-close-proposal-modal]").forEach(function (button) {
      button.addEventListener("click", closeProposalModal);
    });

    modal.hidden = false;
  }

  function closeProposalModal() {
    const modal = document.getElementById("proposal-modal");
    if (modal) modal.hidden = true;
  }

  function requestProposal() {
    /*
      Final routing decision:
      - employer-request-service.html, OR
      - employer catalog with a "Request Proposal" workflow.

      For now, keep the portal flow functional without inventing
      a page that has not been built yet.
    */
    alert("The proposal request workflow will be connected to the employer service request flow.");
  }

  function normalizeStatus(value) {
    const status = String(value || "draft")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");

    const allowed = ["draft", "sent", "viewed", "accepted", "declined", "expired"];
    return allowed.includes(status) ? status : "draft";
  }

  function formatStatus(status) {
    return {
      draft: "Draft",
      sent: "Sent",
      viewed: "Viewed",
      accepted: "Accepted",
      declined: "Declined",
      expired: "Expired"
    }[status] || "Draft";
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
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "—";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
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
