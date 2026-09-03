/**
 * screenings4u — Portal Session Security
 *
 * Automatically signs authenticated portal users out after inactivity.
 * This is a browser-side safety control; Supabase RLS remains responsible
 * for protecting database records and operations.
 *
 * Required protected-page body attribute:
 *   <body data-s4u-portal="customer">
 *
 * Supported values:
 *   admin | customer | employer | employee | training
 */

(() => {
  "use strict";

  const IDLE_LIMITS = Object.freeze({
    admin: 15 * 60 * 1000,
    customer: 10 * 60 * 1000,
    employer: 10 * 60 * 1000,
    employee: 10 * 60 * 1000,
    training: 10 * 60 * 1000
  });

  const WARNING_DURATION = 60 * 1000;
  const ACTIVITY_THROTTLE = 1000;
  const ACTIVITY_EVENTS = Object.freeze([
    "pointerdown",
    "keydown",
    "touchstart",
    "scroll"
  ]);

  const WARNING_ID = "s4u-session-warning";
  const ACTIVITY_KEY = "s4u-last-activity";
  const AUTH_STORAGE_KEY = "s4u-auth-session";

  let logoutTimer = null;
  let warningTimer = null;
  let countdownTimer = null;
  let lastActivity = 0;
  let started = false;
  let signingOut = false;

  function getPortal() {
    return String(
      document.body?.dataset?.s4uPortal ||
      document.documentElement?.dataset?.s4uPortal ||
      ""
    )
      .trim()
      .toLowerCase();
  }

  function getIdleLimit() {
    return IDLE_LIMITS[getPortal()] || null;
  }

  function getLoginPage() {
    const portal = getPortal();

    return (
      window.S4UAuth?.getLoginForPortal?.(portal) ||
      (portal === "training"
        ? "training-login.html"
        : `${portal || "customer"}-login.html`)
    );
  }

  function clearTimers() {
    window.clearTimeout(logoutTimer);
    window.clearTimeout(warningTimer);
    window.clearInterval(countdownTimer);

    logoutTimer = null;
    warningTimer = null;
    countdownTimer = null;
  }

  function removeWarning() {
    document.getElementById(WARNING_ID)?.remove();
  }

  function clearApplicationSessionStorage() {
    try {
      window.sessionStorage.removeItem(ACTIVITY_KEY);
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error(
        "[Session security] Unable to clear application session storage:",
        error
      );
    }
  }

  async function signOut() {
    if (signingOut) {
      return;
    }

    signingOut = true;
    clearTimers();
    removeWarning();

    const destination = getLoginPage();

    try {
      if (typeof window.S4UAuth?.signOut === "function") {
        await window.S4UAuth.signOut({
          redirectTo: destination
        });
        return;
      }

      const client =
        window.screenings4uSupabase ||
        window.supabaseClient;

      if (client?.auth?.signOut) {
        await client.auth.signOut();
      }
    } catch (error) {
      console.error(
        "[Session security] Sign-out failed:",
        error
      );
    }

    // Emergency fallback: remove only screenings4u session keys.
    clearApplicationSessionStorage();
    window.location.replace(destination);
  }

  function createButton(label, action, primary = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.cssText = [
      "min-height:44px",
      "padding:0 18px",
      "border-radius:8px",
      primary
        ? "border:1px solid #ff6b00"
        : "border:1px solid #325aa3",
      primary
        ? "background:#ff6b00"
        : "background:#ffffff",
      primary ? "color:#ffffff" : "color:#325aa3",
      "font:700 14px Inter,Arial,sans-serif",
      "cursor:pointer"
    ].join(";");
    button.addEventListener("click", action);
    return button;
  }

  function showWarning() {
    if (signingOut || document.getElementById(WARNING_ID)) {
      return;
    }

    let secondsRemaining = Math.ceil(
      WARNING_DURATION / 1000
    );

    const overlay = document.createElement("div");
    overlay.id = WARNING_ID;
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "display:grid",
      "place-items:center",
      "padding:24px",
      "background:rgba(17,36,67,.72)",
      "font-family:Inter,Arial,sans-serif"
    ].join(";");

    const modal = document.createElement("section");
    modal.setAttribute("role", "alertdialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "s4u-session-title");
    modal.setAttribute(
      "aria-describedby",
      "s4u-session-description"
    );
    modal.style.cssText = [
      "width:min(460px,100%)",
      "padding:30px",
      "border-radius:14px",
      "background:#ffffff",
      "box-shadow:0 18px 50px rgba(0,0,0,.22)",
      "text-align:center"
    ].join(";");

    const title = document.createElement("h2");
    title.id = "s4u-session-title";
    title.textContent = "Are you still there?";
    title.style.cssText =
      "margin:0 0 12px;color:#24467f;font-size:24px;";

    const description = document.createElement("p");
    description.id = "s4u-session-description";
    description.textContent =
      "For your security, you will be signed out due to inactivity.";
    description.style.cssText =
      "margin:0 0 10px;color:#667892;line-height:1.6;";

    const countdownText = document.createElement("p");
    countdownText.style.cssText =
      "margin:0 0 22px;color:#1d2d45;line-height:1.6;";
    countdownText.append("Signing out in ");

    const countdown = document.createElement("strong");
    countdown.textContent = String(secondsRemaining);
    countdownText.append(countdown, " seconds.");

    const actions = document.createElement("div");
    actions.style.cssText =
      "display:flex;justify-content:center;gap:10px;flex-wrap:wrap;";

    const stayButton = createButton(
      "Stay Logged In",
      () => resetActivity(true),
      true
    );
    const signOutButton = createButton(
      "Sign Out Now",
      signOut
    );

    actions.append(stayButton, signOutButton);
    modal.append(title, description, countdownText, actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    stayButton.focus();

    countdownTimer = window.setInterval(() => {
      secondsRemaining -= 1;
      countdown.textContent = String(
        Math.max(0, secondsRemaining)
      );

      if (secondsRemaining <= 0) {
        signOut();
      }
    }, 1000);
  }

  function scheduleTimers() {
    const idleLimit = getIdleLimit();

    if (!idleLimit || signingOut) {
      return;
    }

    clearTimers();
    removeWarning();

    const elapsed = Math.max(
      0,
      Date.now() - lastActivity
    );
    const timeUntilLogout = Math.max(
      0,
      idleLimit - elapsed
    );
    const timeUntilWarning = Math.max(
      0,
      timeUntilLogout - WARNING_DURATION
    );

    if (timeUntilLogout === 0) {
      signOut();
      return;
    }

    if (timeUntilWarning === 0) {
      showWarning();
    } else {
      warningTimer = window.setTimeout(
        showWarning,
        timeUntilWarning
      );
    }

    logoutTimer = window.setTimeout(
      signOut,
      timeUntilLogout
    );
  }

  function saveActivityTime(value) {
    try {
      window.sessionStorage.setItem(
        ACTIVITY_KEY,
        String(value)
      );
    } catch (error) {
      console.error(
        "[Session security] Unable to save activity time:",
        error
      );
    }
  }

  function resetActivity(force = false) {
    if (!started || signingOut) {
      return;
    }

    const now = Date.now();

    if (
      !force &&
      now - lastActivity < ACTIVITY_THROTTLE
    ) {
      return;
    }

    lastActivity = now;
    saveActivityTime(now);
    scheduleTimers();
  }

  function handleActivity() {
    resetActivity(false);
  }

  function checkElapsedTime() {
    if (
      document.visibilityState === "visible" &&
      started &&
      !signingOut
    ) {
      scheduleTimers();
    }
  }

  function start() {
    if (started || signingOut) {
      return;
    }

    if (!getIdleLimit()) {
      console.error(
        "[Session security] Missing or invalid data-s4u-portal value."
      );
      return;
    }

    started = true;
    lastActivity = Date.now();
    saveActivityTime(lastActivity);

    ACTIVITY_EVENTS.forEach((eventName) => {
      document.addEventListener(
        eventName,
        handleActivity,
        { passive: true }
      );
    });

    document.addEventListener(
      "visibilitychange",
      checkElapsedTime
    );

    scheduleTimers();
  }

  function stop() {
    clearTimers();
    removeWarning();

    ACTIVITY_EVENTS.forEach((eventName) => {
      document.removeEventListener(
        eventName,
        handleActivity
      );
    });

    document.removeEventListener(
      "visibilitychange",
      checkElapsedTime
    );

    started = false;
  }

  // Start only after the shared portal guard has authorized the user.
  window.addEventListener(
    "s4u:authenticated",
    start
  );

  // Also support pages where this file loads after authorization completed.
  function startIfAlreadyAuthenticated() {
    if (
      document.documentElement.classList.contains(
        "s4u-authenticated"
      )
    ) {
      start();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      startIfAlreadyAuthenticated,
      { once: true }
    );
  } else {
    startIfAlreadyAuthenticated();
  }

  window.S4USessionSecurity = Object.freeze({
    start,
    stop,
    reset: () => resetActivity(true),
    signOut
  });
})();
