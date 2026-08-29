/* ============================================================
   screenings4u — SESSION SECURITY
   Shared inactivity timeout protection for authenticated portals.
   Requires core-auth.js and S4UAuth.signOut()

   BODY OPTIONS:
   data-login-page="customer-login.html"
   data-session-timeout="600000"
   data-session-warning="60000"
   ============================================================ */

(() => {
  "use strict";

  const DEFAULT_TIMEOUT = 10 * 60 * 1000;
  const DEFAULT_WARNING = 60 * 1000;

  const loginPage =
    document.body?.dataset?.loginPage || "customer-login.html";

  const inactivityTimeout =
    Number(document.body?.dataset?.sessionTimeout) || DEFAULT_TIMEOUT;

  const warningDuration =
    Number(document.body?.dataset?.sessionWarning) || DEFAULT_WARNING;

  let inactivityTimer = null;
  let warningTimer = null;
  let countdownTimer = null;
  let warningVisible = false;
  let secondsRemaining = Math.ceil(warningDuration / 1000);
  let isSigningOut = false;

  const activityEvents = [
    "mousemove",
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
    "pointerdown"
  ];

  function clearTimers() {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    clearInterval(countdownTimer);

    inactivityTimer = null;
    warningTimer = null;
    countdownTimer = null;
  }

  function getModal() {
    return document.getElementById("s4u-session-warning");
  }

  function removeModal() {
    const modal = getModal();
    if (modal) modal.remove();
    warningVisible = false;
  }

  async function signOut() {
    if (isSigningOut) return;

    isSigningOut = true;
    clearTimers();
    removeModal();

    try {
      if (
        window.S4UAuth &&
        typeof window.S4UAuth.signOut === "function"
      ) {
        await window.S4UAuth.signOut({
          redirectTo: loginPage
        });
        return;
      }

      console.error(
        "S4UAuth.signOut() is unavailable. Check script loading order."
      );

      window.location.replace(loginPage);
    } catch (error) {
      console.error("Session sign-out failed:", error);
      window.location.replace(loginPage);
    } finally {
      isSigningOut = false;
    }
  }

  function updateCountdown() {
    const countdown = document.querySelector(
      "[data-s4u-session-countdown]"
    );

    if (countdown) {
      countdown.textContent = secondsRemaining;
    }
  }

  function showWarning() {
    if (warningVisible || isSigningOut) return;

    warningVisible = true;
    secondsRemaining = Math.ceil(warningDuration / 1000);

    getModal()?.remove();

    const modal = document.createElement("div");
    modal.id = "s4u-session-warning";
    modal.className = "s4u-session-overlay";

    modal.innerHTML = `
      <div class="s4u-session-modal"
           role="dialog"
           aria-modal="true"
           aria-labelledby="s4u-session-title">
        <div class="s4u-session-icon" aria-hidden="true">⏱</div>

        <h2 id="s4u-session-title">Are You Still There?</h2>

        <p>
          For your security, you will be signed out due to inactivity.
        </p>

        <p class="s4u-session-countdown-text">
          You will be signed out in
          <strong data-s4u-session-countdown>
            ${secondsRemaining}
          </strong>
          seconds.
        </p>

        <div class="s4u-session-actions">
          <button type="button"
                  class="s4u-session-stay"
                  data-s4u-session-stay>
            Stay Logged In
          </button>

          <button type="button"
                  class="s4u-session-signout"
                  data-s4u-session-signout>
            Sign Out Now
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelector("[data-s4u-session-stay]")
      ?.addEventListener("click", resetSessionTimer);

    modal
      .querySelector("[data-s4u-session-signout]")
      ?.addEventListener("click", signOut);

    countdownTimer = setInterval(() => {
      secondsRemaining -= 1;
      updateCountdown();

      if (secondsRemaining <= 0) {
        signOut();
      }
    }, 1000);
  }

  function resetSessionTimer() {
    if (isSigningOut) return;

    clearTimers();
    removeModal();

    secondsRemaining = Math.ceil(warningDuration / 1000);

    const warningDelay = Math.max(
      inactivityTimeout - warningDuration,
      1000
    );

    warningTimer = setTimeout(
      showWarning,
      warningDelay
    );

    inactivityTimer = setTimeout(
      signOut,
      inactivityTimeout
    );
  }

  function handleActivity() {
    if (warningVisible || isSigningOut) return;
    resetSessionTimer();
  }

  function bindActivityListeners() {
    activityEvents.forEach(eventName => {
      document.addEventListener(
        eventName,
        handleActivity,
        { passive: true }
      );
    });
  }

  function start() {
    if (
      !window.S4UAuth ||
      typeof window.S4UAuth.initialize !== "function"
    ) {
      console.error(
        "Session Security requires core-auth.js to load first."
      );
      return;
    }

    bindActivityListeners();
    resetSessionTimer();
  }

  function stop() {
    clearTimers();
    removeModal();

    activityEvents.forEach(eventName => {
      document.removeEventListener(
        eventName,
        handleActivity
      );
    });
  }

  window.S4USessionSecurity = Object.freeze({
    start,
    stop,
    reset: resetSessionTimer,
    signOut
  });

  document.addEventListener("DOMContentLoaded", start);
})();