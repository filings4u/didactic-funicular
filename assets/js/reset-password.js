/* ============================================================
   screenings4u — RESET PASSWORD
   Supabase recovery-session password update
   ============================================================ */

(() => {
  "use strict";

  const LOGIN_PAGE = "customer-login.html";
  const $ = id => document.getElementById(id);

  let recoveryReady = false;

  function getClient() {
    return window.supabaseClient || window.S4USupabase?.client || null;
  }

  function setStatus(message = "", type = "") {
    const el = $("resetStatus");
    if (!el) return;
    el.textContent = message;
    el.className = "login-status";
    if (type) el.classList.add(type);
  }

  function setLoading(loading) {
    const btn = $("resetButton");
    if (!btn) return;
    btn.disabled = loading || !recoveryReady;
    btn.textContent = loading ? "UPDATING PASSWORD..." : "UPDATE PASSWORD";
  }

  function showModal(message) {
    $("modalMessage").textContent = message;
    $("s4uModal").classList.add("is-open");
  }

  async function finishAndReturnToLogin() {
    try {
      await getClient()?.auth?.signOut?.();
    } catch (error) {
      console.warn("[Reset Password] Sign-out after reset failed:", error);
    }
    window.location.replace(LOGIN_PAGE);
  }

  function bindToggles() {
    document.querySelectorAll("[data-toggle]").forEach(button => {
      button.addEventListener("click", () => {
        const input = $(button.dataset.toggle);
        if (!input) return;
        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
      });
    });
  }

  async function establishRecoverySession() {
    const client = getClient();

    if (!client?.auth) {
      setStatus("The secure password service is unavailable. Please return to password recovery and try again.", "error");
      return;
    }

    try {
      /*
       * Supabase recovery links may arrive as:
       * 1) a PKCE ?code=... URL, or
       * 2) a URL that has already established the recovery session.
       */
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code && typeof client.auth.exchangeCodeForSession === "function") {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (error) throw error;

        // Remove the one-time code from the visible URL after exchange.
        url.searchParams.delete("code");
        history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      }

      const { data, error } = await client.auth.getSession();
      if (error) throw error;

      if (!data?.session?.user) {
        recoveryReady = false;
        setStatus(
          "This password recovery link is invalid or has expired. Please request a new password reset link.",
          "error"
        );
        setLoading(false);
        return;
      }

      recoveryReady = true;
      setStatus("Recovery link verified. You can now choose a new password.", "success");
      setLoading(false);

    } catch (error) {
      console.error("[Reset Password] Recovery verification failed:", error);
      recoveryReady = false;
      setStatus(
        "This password recovery link is invalid or has expired. Please request a new password reset link.",
        "error"
      );
      setLoading(false);
    }
  }

  async function handleReset(event) {
    event.preventDefault();

    if (!recoveryReady) {
      setStatus("Please request a new password recovery link before changing your password.", "error");
      return;
    }

    const password = $("newPassword")?.value || "";
    const confirm = $("confirmPassword")?.value || "";

    if (password.length < 8) {
      setStatus("Your new password must contain at least 8 characters.", "error");
      return;
    }

    if (password !== confirm) {
      setStatus("The passwords do not match. Please enter them again.", "error");
      return;
    }

    const client = getClient();
    setLoading(true);
    setStatus("");

    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;

      recoveryReady = false;
      setStatus("Your password has been updated successfully.", "success");
      showModal("Your password has been changed. You can now sign in with your new password.");

    } catch (error) {
      console.error("[Reset Password] Password update failed:", error);
      setStatus(
        error?.message || "We could not update your password. Please request a new recovery link and try again.",
        "error"
      );
      recoveryReady = true;
      setLoading(false);
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    $("currentYear").textContent = new Date().getFullYear();

    bindToggles();
    $("resetPasswordForm")?.addEventListener("submit", handleReset);
    $("modalButton")?.addEventListener("click", finishAndReturnToLogin);

    setLoading(false);
    await establishRecoverySession();
  });
})();