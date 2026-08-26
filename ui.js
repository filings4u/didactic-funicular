/* ============================================================
   screenings4u — CORE UI
   Replaces browser alert()/confirm() for application actions.
   ============================================================ */

(() => {
  "use strict";

  let activeModal = null;

  function ensureRoot() {
    let root = document.getElementById("s4uModalRoot");

    if (!root) {
      root = document.createElement("div");
      root.id = "s4uModalRoot";
      root.className = "s4u-modal-root";
      document.body.appendChild(root);
    }

    return root;
  }

  function close() {
    if (!activeModal) return;

    activeModal.remove();
    activeModal = null;
    document.body.classList.remove("s4u-modal-open");
  }

  function modal({
    title = "screenings4u",
    message = "",
    type = "info",
    confirmText = "Continue",
    cancelText = "Cancel",
    showCancel = false,
    onConfirm = null
  } = {}) {
    close();

    const root = ensureRoot();
    const wrapper = document.createElement("div");

    wrapper.className = `s4u-modal ${type}`;
    wrapper.setAttribute("role", "dialog");
    wrapper.setAttribute("aria-modal", "true");

    wrapper.innerHTML = `
      <div class="s4u-modal-backdrop" data-modal-close></div>
      <section class="s4u-modal-panel">
        <div class="s4u-modal-icon" aria-hidden="true"></div>
        <div class="s4u-modal-content">
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(message)}</p>
        </div>
        <div class="s4u-modal-actions">
          ${showCancel ? `<button class="s4u-modal-button secondary" type="button" data-modal-cancel>${escapeHtml(cancelText)}</button>` : ""}
          <button class="s4u-modal-button primary" type="button" data-modal-confirm>${escapeHtml(confirmText)}</button>
        </div>
      </section>
    `;

    root.appendChild(wrapper);
    activeModal = wrapper;
    document.body.classList.add("s4u-modal-open");

    wrapper.querySelector("[data-modal-close]")?.addEventListener("click", close);
    wrapper.querySelector("[data-modal-cancel]")?.addEventListener("click", close);

    wrapper.querySelector("[data-modal-confirm]")?.addEventListener("click", async () => {
      const button = wrapper.querySelector("[data-modal-confirm]");
      button.disabled = true;

      try {
        if (typeof onConfirm === "function") {
          await onConfirm();
        }
        close();
      } catch (error) {
        button.disabled = false;
        throw error;
      }
    });

    return { close };
  }

  function toast(message, type = "info") {
    let root = document.getElementById("s4uToastRoot");

    if (!root) {
      root = document.createElement("div");
      root.id = "s4uToastRoot";
      root.className = "s4u-toast-root";
      document.body.appendChild(root);
    }

    const item = document.createElement("div");
    item.className = `s4u-toast ${type}`;
    item.textContent = message;
    root.appendChild(item);

    requestAnimationFrame(() => item.classList.add("show"));

    setTimeout(() => {
      item.classList.remove("show");
      setTimeout(() => item.remove(), 180);
    }, 4200);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.S4UUI = Object.freeze({
    modal,
    toast,
    closeModal: close
  });
})();
