(() => {
  "use strict";

  let settings = [];
  let prices = [];

  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  async function load() {
    const client = window.S4UAuth.getClient();

    const { data: settingsData, error: settingsError } =
      await client.rpc("get_global_settings", {
        requested_category: null,
        public_only: false
      });

    if (settingsError) throw settingsError;
    settings = settingsData || [];

    const { data: pricesData, error: pricesError } =
      await client
        .from("global_prices")
        .select("id,price_key,category,label,description,amount,currency,is_active")
        .order("category")
        .order("label");

    if (pricesError) throw pricesError;
    prices = pricesData || [];

    populateCategories();
    render();
  }

  function populateCategories() {
    const select = document.getElementById("categoryFilter");
    const current = select.value;
    const categories = [...new Set(settings.map(s => s.category))].sort();

    select.innerHTML =
      `<option value="">All Categories</option>` +
      categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");

    select.value = categories.includes(current) ? current : "";
  }

  function render() {
    const filter = document.getElementById("categoryFilter").value;
    const rows = settings.filter(s => !filter || s.category === filter);

    document.getElementById("settingsBody").innerHTML = rows.length
      ? rows.map(settingRow).join("")
      : `<tr><td colspan="5">No settings found.</td></tr>`;

    document.getElementById("pricesBody").innerHTML = prices.length
      ? prices.map(priceRow).join("")
      : `<tr><td colspan="5">No global prices have been configured yet.</td></tr>`;
  }

  function settingRow(s) {
    const value = s.value_type === "boolean"
      ? (s.value ? "Enabled" : "Disabled")
      : `${s.value ?? ""}${s.unit ? " " + s.unit : ""}`;

    return `
      <tr>
        <td>${esc(s.category)}</td>
        <td><strong>${esc(s.label)}</strong><br><small>${esc(s.key)}</small></td>
        <td>${esc(s.description || "")}</td>
        <td><strong>${esc(value)}</strong></td>
        <td>
          <button class="s4u-button primary" type="button"
            data-setting="${esc(s.key)}"
            data-type="${esc(s.value_type)}"
            data-value="${esc(JSON.stringify(s.value))}">
            Edit
          </button>
        </td>
      </tr>
    `;
  }

  function priceRow(p) {
    return `
      <tr>
        <td>${esc(p.category)}</td>
        <td><strong>${esc(p.label)}</strong><br><small>${esc(p.price_key)}</small></td>
        <td><strong>${esc(p.currency)} ${Number(p.amount).toFixed(2)}</strong></td>
        <td><span class="s4u-status ${p.is_active ? "success" : "warning"}">${p.is_active ? "Active" : "Inactive"}</span></td>
        <td>
          <button class="s4u-button primary" type="button" data-price="${esc(p.price_key)}"
            data-amount="${esc(p.amount)}" data-currency="${esc(p.currency)}">Edit</button>
        </td>
      </tr>
    `;
  }

  async function editSetting(button) {
    const key = button.dataset.setting;
    const type = button.dataset.type;
    const current = JSON.parse(button.dataset.value || "null");
    const inputType = type === "integer" || type === "decimal" ? "number" : type === "boolean" ? "select" : "text";
    const fields = inputType === "select"
      ? [{ name: "value", label: "Value", type: "select", value: String(current), options: [{value:"true",label:"Enabled"},{value:"false",label:"Disabled"}] }]
      : [{ name: "value", label: "Value", type: inputType, value: current ?? "", required: true, ...(type === "integer" ? {step:1} : {}), ...(type === "decimal" ? {step:"0.01"} : {}) }];

    window.S4UUI.formModal({
      title: "Edit Global Setting",
      message: key,
      fields,
      confirmText: "Save Setting",
      onSubmit: async values => {
        let value = values.value;
        if (type === "integer") value = Number.parseInt(value, 10);
        if (type === "decimal") value = Number.parseFloat(value);
        if (type === "boolean") value = value === "true";
        if ((type === "integer" || type === "decimal") && Number.isNaN(value)) throw new Error("Enter a valid number.");

        const { error } = await window.S4UAuth.getClient().rpc("set_global_setting", { setting_key: key, new_value: value });
        if (error) throw error;
        window.S4UUI.toast("Global setting updated.", "success");
        await load();
      }
    });
  }

  async function editPrice(button) {
    const key = button.dataset.price;
    window.S4UUI.formModal({
      title: "Edit Global Price",
      message: key,
      fields: [{ name: "amount", label: "Amount", type: "number", value: button.dataset.amount, required: true, min: 0, step: "0.01" }],
      confirmText: "Save Price",
      onSubmit: async values => {
        const numeric = Number.parseFloat(values.amount);
        if (Number.isNaN(numeric) || numeric < 0) throw new Error("Enter a valid non-negative price.");
        const { error } = await window.S4UAuth.getClient().rpc("set_global_price", { requested_price_key: key, new_amount: numeric, new_currency: button.dataset.currency || "USD" });
        if (error) throw error;
        window.S4UUI.toast("Global price updated.", "success");
        await load();
      }
    });
  }

  document.addEventListener("click", event => {
    const settingButton = event.target.closest("[data-setting]");
    const priceButton = event.target.closest("[data-price]");

    if (settingButton) editSetting(settingButton);
    if (priceButton) editPrice(priceButton);
  });

  document.getElementById("categoryFilter").addEventListener("change", render);
  document.getElementById("reloadButton").addEventListener("click", load);

  document.getElementById("adminNavigationLogout").addEventListener("click", () => {
    window.S4UUI.modal({
      title: "Sign out?",
      message: "Your administrator session will be closed.",
      showCancel: true,
      onConfirm: () => window.S4UAuth.signOut()
    });
  });

  (async () => {
    try {
      const session = await window.S4UAuth.requireSession("admin-login.html");
      if (!session) return;

      const allowed = await window.S4UPermissions.requirePermission(
        "system.manage",
        "admin-dashboard.html"
      );

      if (!allowed) return;

      await load();
    } catch (error) {
      console.error(error);
      window.S4UUI.toast(error.message || "Unable to load global settings.", "error");
    }
  })();
})();