/* =========================================================
   screenings4u — Customer Management
   File: admin-customers.js
   ========================================================= */

(() => {
  "use strict";

  const PAGE_SIZE = 50;
  const state = {
    supabase: null,
    customers: [],
    filteredCustomers: [],
    selectedCustomer: null
  };

  const $ = (selector) => document.querySelector(selector);

  function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase && typeof window.supabase.from === "function") return window.supabase;
    return null;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
  }

  function showToast(message, type = "success") {
    const toast = $("#customerToast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = `customer-toast show ${type}`;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.className = "customer-toast";
    }, 4200);
  }

  function setLoading(isLoading) {
    const button = $("#saveCustomerBtn");
    if (!button) return;
    button.disabled = isLoading;
    button.textContent = isLoading ? "Saving..." : "Save Customer";
  }

  function getCustomerName(row) {
    return (
      row.full_name ||
      row.company_name ||
      row.name ||
      [row.first_name, row.last_name].filter(Boolean).join(" ") ||
      "Unnamed Customer"
    );
  }

  function getStatus(row) {
    if (row.status) return String(row.status).toLowerCase();
    if (row.is_active === false) return "inactive";
    return "active";
  }

  async function loadCustomers() {
    const tbody = $("#customersTableBody");

    if (!state.supabase) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="customer-empty">
            Supabase client is not available.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="customer-loading">
          Loading customers...
        </td>
      </tr>`;

    const { data, error } = await state.supabase
      .from("client_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error("Customer load error:", error);
      showToast(error.message, "error");
      state.customers = [];
      state.filteredCustomers = [];
      renderCustomers();
      return;
    }

    state.customers = data || [];
    state.filteredCustomers = [...state.customers];
    updateMetrics();
    renderCustomers();
  }

  function updateMetrics() {
    const total = state.customers.length;
    const active = state.customers.filter(
      row => getStatus(row) === "active"
    ).length;
    const inactive = state.customers.filter(
      row => getStatus(row) === "inactive"
    ).length;
    const recent = state.customers.filter(row => {
      if (!row.created_at) return false;
      const created = new Date(row.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return created >= thirtyDaysAgo;
    }).length;

    $("#metricTotal").textContent = total;
    $("#metricActive").textContent = active;
    $("#metricInactive").textContent = inactive;
    $("#metricRecent").textContent = recent;
  }

  function renderCustomers() {
    const tbody = $("#customersTableBody");

    if (!state.filteredCustomers.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="customer-empty">
            No customers found.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = state.filteredCustomers
      .map(row => {
        const status = getStatus(row);
        return `
          <tr data-customer-id="${escapeHtml(row.id)}">
            <td>
              <div class="customer-primary">
                <strong>${escapeHtml(getCustomerName(row))}</strong>
                <span>${escapeHtml(row.id || "—")}</span>
              </div>
            </td>
            <td>${escapeHtml(row.company_name || "—")}</td>
            <td>${escapeHtml(row.email || "—")}</td>
            <td>${escapeHtml(row.phone || "—")}</td>
            <td>
              <span class="customer-status ${escapeHtml(status)}">
                ${escapeHtml(status)}
              </span>
            </td>
            <td>${formatDate(row.created_at)}</td>
            <td class="customer-actions-cell">
              <button
                class="customer-icon-btn edit-customer-btn"
                type="button"
                data-id="${escapeHtml(row.id)}"
                aria-label="Edit customer"
              >Edit</button>
            </td>
          </tr>`;
      })
      .join("");

    document.querySelectorAll(".edit-customer-btn").forEach(button => {
      button.addEventListener("click", () => {
        const customer = state.customers.find(
          row => String(row.id) === String(button.dataset.id)
        );
        if (customer) openCustomerModal(customer);
      });
    });
  }

  function filterCustomers() {
    const query = ($("#customerSearch").value || "").trim().toLowerCase();
    const status = $("#customerStatusFilter").value;

    state.filteredCustomers = state.customers.filter(row => {
      const haystack = [
        getCustomerName(row),
        row.company_name,
        row.email,
        row.phone,
        row.id
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const statusMatch =
        !status || getStatus(row) === status.toLowerCase();

      return (!query || haystack.includes(query)) && statusMatch;
    });

    renderCustomers();
  }

  function resetCustomerForm() {
    $("#customerForm").reset();
    $("#customerId").value = "";
    $("#customerModalTitle").textContent = "Add Customer";
    $("#customerModalSubtitle").textContent =
      "Create a customer record for the screenings4u platform.";
    $("#customerStatus").value = "active";
    state.selectedCustomer = null;
  }

  function openCustomerModal(customer = null) {
    resetCustomerForm();

    if (customer) {
      state.selectedCustomer = customer;
      $("#customerModalTitle").textContent = "Edit Customer";
      $("#customerModalSubtitle").textContent =
        "Update customer information and account status.";

      $("#customerId").value = customer.id || "";
      $("#customerFirstName").value = customer.first_name || "";
      $("#customerLastName").value = customer.last_name || "";
      $("#customerFullName").value = customer.full_name || "";
      $("#customerCompanyName").value = customer.company_name || "";
      $("#customerEmail").value = customer.email || "";
      $("#customerPhone").value = customer.phone || "";
      $("#customerStatus").value = getStatus(customer);
    }

    $("#customerModal").classList.add("is-open");
    document.body.classList.add("modal-open");
    $("#customerFirstName").focus();
  }

  function closeCustomerModal() {
    $("#customerModal").classList.remove("is-open");
    document.body.classList.remove("modal-open");
    resetCustomerForm();
  }

  async function saveCustomer(event) {
    event.preventDefault();

    if (!state.supabase) {
      showToast("Supabase client is not available.", "error");
      return;
    }

    const id = $("#customerId").value.trim();
    const firstName = $("#customerFirstName").value.trim();
    const lastName = $("#customerLastName").value.trim();
    const fullName =
      $("#customerFullName").value.trim() ||
      [firstName, lastName].filter(Boolean).join(" ");
    const companyName = $("#customerCompanyName").value.trim();
    const email = $("#customerEmail").value.trim();
    const phone = $("#customerPhone").value.trim();
    const status = $("#customerStatus").value;

    const payload = {
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: fullName || null,
      company_name: companyName || null,
      email: email || null,
      phone: phone || null,
      status,
      is_active: status === "active"
    };

    setLoading(true);

    let result;

    if (id) {
      result = await state.supabase
        .from("client_profiles")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
    } else {
      result = await state.supabase
        .from("client_profiles")
        .insert(payload)
        .select()
        .single();
    }

    setLoading(false);

    if (result.error) {
      console.error("Customer save error:", result.error);
      showToast(result.error.message, "error");
      return;
    }

    showToast(id ? "Customer updated successfully." : "Customer created successfully.");
    closeCustomerModal();
    await loadCustomers();
  }

  async function refreshCustomers() {
    await loadCustomers();
    showToast("Customer records refreshed.");
  }

  function bindEvents() {
    $("#addCustomerBtn").addEventListener("click", () => openCustomerModal());
    $("#refreshCustomersBtn").addEventListener("click", refreshCustomers);

    $("#customerSearch").addEventListener("input", filterCustomers);
    $("#customerStatusFilter").addEventListener("change", filterCustomers);

    $("#customerForm").addEventListener("submit", saveCustomer);

    $("#closeCustomerModalBtn").addEventListener("click", closeCustomerModal);
    $("#cancelCustomerBtn").addEventListener("click", closeCustomerModal);

    $("#customerModal").addEventListener("click", event => {
      if (event.target === $("#customerModal")) closeCustomerModal();
    });

    document.addEventListener("keydown", event => {
      if (
        event.key === "Escape" &&
        $("#customerModal").classList.contains("is-open")
      ) {
        closeCustomerModal();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    state.supabase = getClient();
    bindEvents();
    await loadCustomers();
  });
})();
