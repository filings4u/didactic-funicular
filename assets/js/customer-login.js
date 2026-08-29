/* ============================================================
   screenings4u — CUSTOMER LOGIN
   Uses the shared authentication system:
   - supabase-config.js
   - core-auth.js
   - core-ui.js (optional for toast/modal helpers)

   This file does NOT create a second Supabase client.
   ============================================================ */

(() => {
  "use strict";

  const DASHBOARD_PAGE = "customer-dashboard.html";
  const LOGIN_FORM_SELECTOR = "#customerLoginForm";
  const EMAIL_SELECTOR = "#email";
  const PASSWORD_SELECTOR = "#password";
  const LOGIN_BUTTON_SELECTOR = "#loginButton";
  const STATUS_SELECTOR = "#loginStatus";
  const PASSWORD_TOGGLE_SELECTOR = "#passwordToggle";
  const FORGOT_PASSWORD_SELECTOR = "#forgotPasswordBtn";

  function getElement(selector) {
    return document.querySelector(selector);
  }

  function setStatus(message = "", type = "") {
    const status = getElement(STATUS_SELECTOR);

    if (!status) return;

    status.textContent = message;
    status.className = "login-status";

    if (type) {
      status.classList.add(`is-${type}`);
    }

    status.hidden = !message;
  }

  function setLoading(isLoading) {
    const button = getElement(LOGIN_BUTTON_SELECTOR);

    if (!button) return;

    button.disabled = isLoading;
    button.setAttribute("aria-busy", String(isLoading));

    if (!button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }

    button.innerHTML = isLoading
      ? '<span class="login-button-loading">Signing In...</span>'
      : button.dataset.originalText;
  }

  function showError(message) {
    setStatus(message, "error");

    if (window.S4UUI?.toast) {
      window.S4UUI.toast(message, "error");
    }
  }

  function showSuccess(message) {
    setStatus(message, "success");
  }

  async function redirectIfAuthenticated() {
    try {
      const state = await window.S4UAuth.initialize();

      if (!state?.session || !state?.user) {
        return;
      }

      const access = await window.S4UAuth.verifyPortalAccess(
        state.user.id,
        "customer"
      );

      if (access.allowed) {
        window.location.replace(DASHBOARD_PAGE);
        return;
      }

      /*
       * A signed-in user who is not an authorized customer should not
       * remain authenticated on the customer login page.
       */
      await window.S4UAuth.signOut();
    } catch (error) {
      console.error(
        "[Customer Login] Existing session check failed:",
        error
      );
    }
  }

  function bindPasswordToggle() {
    const passwordInput = getElement(PASSWORD_SELECTOR);
    const toggleButton = getElement(PASSWORD_TOGGLE_SELECTOR);

    if (!passwordInput || !toggleButton) return;

    toggleButton.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";

      passwordInput.type = isPassword ? "text" : "password";

      toggleButton.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );

      toggleButton.setAttribute(
        "aria-pressed",
        String(isPassword)
      );
    });
  }

  function openForgotPassword() {
    /*
     * Preserve compatibility with the existing page.
     *
     * If the page already provides a custom modal, trigger its existing
     * controls instead of replacing the UI.
     */
    const existingModalTrigger =
      document.querySelector("[data-s4u-forgot-modal]") ||
      document.querySelector("[data-modal-target='forgot-password']");

    if (existingModalTrigger) {
      existingModalTrigger.click();
      return;
    }

    /*
     * Minimal fallback message. Password reset submission can be wired
     * to the existing modal/reset page without changing the login design.
     */
    setStatus(
      "Please use the password recovery option provided by your administrator.",
      "info"
    );
  }

  function bindForgotPassword() {
    const button = getElement(FORGOT_PASSWORD_SELECTOR);

    if (!button) return;

    button.addEventListener("click", event => {
      event.preventDefault();
      openForgotPassword();
    });
  }

  async function handleLogin(event) {
    event.preventDefault();

    const email = getElement(EMAIL_SELECTOR)?.value?.trim();
    const password = getElement(PASSWORD_SELECTOR)?.value;

    if (!email || !password) {
      showError("Please enter your email and password.");
      return;
    }

    setStatus("");
    setLoading(true);

    try {
      await window.S4UAuth.signIn(email, password);

      const state = await window.S4UAuth.initialize({
        force: true
      });

      if (!state?.user) {
        throw new Error(
          "We could not verify your account. Please try again."
        );
      }

      /*
       * core-auth.js centrally checks:
       * - customer profile existence
       * - active/inactive account status
       */
      const access = await window.S4UAuth.verifyPortalAccess(
        state.user.id,
        "customer"
      );

      if (!access.allowed) {
        await window.S4UAuth.signOut();

        throw new Error(
          access.reason ||
          "This account does not have access to the Customer Portal."
        );
      }

      showSuccess("Sign-in successful. Redirecting you now...");

      window.location.replace(DASHBOARD_PAGE);
    } catch (error) {
      console.error("[Customer Login] Sign-in failed:", error);

      const message =
        error?.message ||
        "Unable to sign in. Please check your credentials and try again.";

      showError(message);
      setLoading(false);
    }
  }

  function bindLoginForm() {
    const form = getElement(LOGIN_FORM_SELECTOR);

    if (!form) {
      console.error(
        "[Customer Login] #customerLoginForm was not found."
      );
      return;
    }

    form.addEventListener("submit", handleLogin);
  }

  async function initializeCustomerLogin() {
    if (
      !window.S4UAuth ||
      typeof window.S4UAuth.signIn !== "function"
    ) {
      console.error(
        "[Customer Login] core-auth.js must load before customer-login.js."
      );

      showError(
        "The secure login service is unavailable. Please refresh the page."
      );

      return;
    }

    bindLoginForm();
    bindPasswordToggle();
    bindForgotPassword();

    await redirectIfAuthenticated();
  }

  document.addEventListener(
    "DOMContentLoaded",
    initializeCustomerLogin
  );
})();