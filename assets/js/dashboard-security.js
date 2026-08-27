/* ============================================================
   screenings4u — DASHBOARD SECURITY
   Shared inactivity timeout and automatic logout protection.
   ============================================================ */

(function () {
  "use strict";

  /* ------------------------------------------------------------
     DEFAULT CONFIGURATION
     ------------------------------------------------------------ */

  const DEFAULT_CONFIG = {
    timeoutMinutes: 10,
    warningSeconds: 60,
    loginPage: "index.html",
    enabled: true
  };


  /* ------------------------------------------------------------
     STATE
     ------------------------------------------------------------ */

  let config = {
    ...DEFAULT_CONFIG
  };

  let inactivityTimer = null;
  let countdownTimer = null;

  let warningVisible = false;
  let remainingSeconds = 0;

  let modal = null;
  let countdownElement = null;


  /* ------------------------------------------------------------
     INITIALIZATION
     ------------------------------------------------------------ */

  function initializeSecurity(customConfig = {}) {
    if (
      window.__screenings4uDashboardSecurityInitialized
    ) {
      return;
    }

    window.__screenings4uDashboardSecurityInitialized =
      true;

    config = {
      ...DEFAULT_CONFIG,
      ...customConfig
    };

    if (!config.enabled) {
      return;
    }

    injectSecurityStyles();
    createSecurityModal();
    bindActivityListeners();
    startInactivityTimer();

    console.log(
      `[Security] Dashboard inactivity timeout enabled: ${config.timeoutMinutes} minutes.`
    );
  }


  /* ------------------------------------------------------------
     SECURITY MODAL STYLES
     ------------------------------------------------------------ */

  function injectSecurityStyles() {
    if (
      document.getElementById(
        "dashboardSecurityStyles"
      )
    ) {
      return;
    }

    const style = document.createElement(
      "style"
    );

    style.id = "dashboardSecurityStyles";

    style.textContent = `
      #dashboardSecurityModal.dashboard-security-modal {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
      }

      #dashboardSecurityModal.dashboard-security-modal.is-visible {
        display: flex;
      }

      #dashboardSecurityModal .dashboard-security-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.52);
        backdrop-filter: blur(3px);
      }

      #dashboardSecurityModal .dashboard-security-dialog {
        position: relative;
        z-index: 1;
        width: min(100%, 460px);
        background: #ffffff;
        border-radius: 18px;
        padding: 32px;
        box-sizing: border-box;
        box-shadow:
          0 24px 80px rgba(15, 23, 42, 0.28);
        text-align: center;
        color: #1f2937;
        font-family:
          Inter,
          Arial,
          sans-serif;
      }

      #dashboardSecurityModal .dashboard-security-icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #fff3e8;
        border: 1px solid #ffd7ba;
        color: #ff6b00;
        font-size: 28px;
        font-weight: 800;
        line-height: 1;
      }

      #dashboardSecurityModal .dashboard-security-icon span {
        transform: translateY(-1px);
      }

      #dashboardSecurityModal h2 {
        margin: 0 0 12px;
        color: #243f6b;
        font-size: 24px;
        line-height: 1.25;
        font-weight: 700;
      }

      #dashboardSecurityModal p {
        margin: 0 auto;
        max-width: 360px;
        color: #667085;
        font-size: 15px;
        line-height: 1.6;
      }

      #dashboardSecurityModal .dashboard-security-countdown {
        margin: 24px 0;
        padding: 16px;
        border: 1px solid #e4e7ec;
        border-radius: 12px;
        background: #f8fafc;
      }

      #dashboardSecurityModal
      .dashboard-security-countdown span {
        display: block;
        margin-bottom: 6px;
        color: #667085;
        font-size: 13px;
      }

      #dashboardSecurityModal
      .dashboard-security-countdown strong {
        display: block;
        color: #243f6b;
        font-size: 28px;
        line-height: 1;
        font-variant-numeric:
          tabular-nums;
      }

      #dashboardSecurityModal .dashboard-security-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      #dashboardSecurityModal button {
        appearance: none;
        border: none;
        border-radius: 10px;
        min-height: 44px;
        padding: 0 18px;
        cursor: pointer;
        font: inherit;
        font-size: 14px;
        font-weight: 700;
        transition:
          transform 0.15s ease,
          box-shadow 0.15s ease,
          background 0.15s ease;
      }

      #dashboardSecurityModal button:hover {
        transform: translateY(-1px);
      }

      #dashboardSecurityModal button:focus-visible {
        outline: 3px solid rgba(50, 90, 163, 0.25);
        outline-offset: 2px;
      }

      #dashboardSecurityModal
      .dashboard-security-stay {
        flex: 1;
        color: #ffffff;
        background: #325aa3;
        box-shadow:
          0 8px 18px rgba(50, 90, 163, 0.22);
      }

      #dashboardSecurityModal
      .dashboard-security-stay:hover {
        background: #294d8d;
      }

      #dashboardSecurityModal
      .dashboard-security-signout {
        flex: 1;
        color: #475467;
        background: #ffffff;
        border: 1px solid #d0d5dd;
      }

      #dashboardSecurityModal
      .dashboard-security-signout:hover {
        background: #f9fafb;
      }

      @media (max-width: 560px) {
        #dashboardSecurityModal.dashboard-security-modal {
          padding: 16px;
        }

        #dashboardSecurityModal .dashboard-security-dialog {
          padding: 26px 20px;
          border-radius: 16px;
        }

        #dashboardSecurityModal .dashboard-security-actions {
          flex-direction: column;
        }

        #dashboardSecurityModal button {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }


  /* ------------------------------------------------------------
     ACTIVITY TRACKING
     ------------------------------------------------------------ */

  function bindActivityListeners() {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click"
    ];

    events.forEach((eventName) => {
      document.addEventListener(
        eventName,
        handleUserActivity,
        {
          passive: true
        }
      );
    });

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
  }


  function handleUserActivity() {
    if (!config.enabled) {
      return;
    }

    if (warningVisible) {
      return;
    }

    resetInactivityTimer();
  }


  function handleVisibilityChange() {
    if (!config.enabled) {
      return;
    }

    if (
      !document.hidden &&
      !warningVisible
    ) {
      resetInactivityTimer();
    }
  }


  /* ------------------------------------------------------------
     INACTIVITY TIMER
     ------------------------------------------------------------ */

  function startInactivityTimer() {
    clearTimeout(inactivityTimer);

    const timeoutMilliseconds =
      Number(config.timeoutMinutes) *
      60 *
      1000;

    const warningMilliseconds =
      Number(config.warningSeconds) *
      1000;

    const timeBeforeWarning =
      timeoutMilliseconds -
      warningMilliseconds;

    inactivityTimer = setTimeout(
      showWarningModal,
      Math.max(timeBeforeWarning, 0)
    );
  }


  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);

    if (!warningVisible) {
      startInactivityTimer();
    }
  }


  /* ------------------------------------------------------------
     WARNING MODAL
     ------------------------------------------------------------ */

  function createSecurityModal() {
    const existingModal =
      document.getElementById(
        "dashboardSecurityModal"
      );

    if (existingModal) {
      modal = existingModal;

      countdownElement =
        modal.querySelector(
          "#dashboardSecurityCountdown"
        );

      return;
    }

    const modalMarkup = `
      <div
        id="dashboardSecurityModal"
        class="dashboard-security-modal"
        aria-hidden="true"
      >
        <div
          class="dashboard-security-backdrop"
          aria-hidden="true"
        ></div>

        <div
          class="dashboard-security-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboardSecurityTitle"
          aria-describedby="dashboardSecurityDescription"
        >

          <div
            class="dashboard-security-icon"
            aria-hidden="true"
          >
            <span>!</span>
          </div>

          <h2 id="dashboardSecurityTitle">
            Are You Still There?
          </h2>

          <p id="dashboardSecurityDescription">
            For your security, your session will automatically
            end due to inactivity.
          </p>

          <div class="dashboard-security-countdown">
            <span>
              You will be signed out in
            </span>

            <strong id="dashboardSecurityCountdown">
              01:00
            </strong>
          </div>

          <div class="dashboard-security-actions">

            <button
              type="button"
              id="dashboardSecurityStayLoggedIn"
              class="dashboard-security-stay"
            >
              Stay Logged In
            </button>

            <button
              type="button"
              id="dashboardSecuritySignOut"
              class="dashboard-security-signout"
            >
              Sign Out Now
            </button>

          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML(
      "beforeend",
      modalMarkup
    );

    modal =
      document.getElementById(
        "dashboardSecurityModal"
      );

    countdownElement =
      document.getElementById(
        "dashboardSecurityCountdown"
      );

    const stayLoggedInButton =
      document.getElementById(
        "dashboardSecurityStayLoggedIn"
      );

    const signOutButton =
      document.getElementById(
        "dashboardSecuritySignOut"
      );

    if (stayLoggedInButton) {
      stayLoggedInButton.addEventListener(
        "click",
        stayLoggedIn
      );
    }

    if (signOutButton) {
      signOutButton.addEventListener(
        "click",
        performLogout
      );
    }
  }


  /* ------------------------------------------------------------
     SHOW WARNING
     ------------------------------------------------------------ */

  function showWarningModal() {
    if (
      warningVisible ||
      !modal
    ) {
      return;
    }

    warningVisible = true;

    clearTimeout(inactivityTimer);

    remainingSeconds =
      Number(config.warningSeconds);

    modal.classList.add(
      "is-visible"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    updateCountdown();

    const stayLoggedInButton =
      document.getElementById(
        "dashboardSecurityStayLoggedIn"
      );

    if (stayLoggedInButton) {
      stayLoggedInButton.focus();
    }

    clearInterval(countdownTimer);

    countdownTimer = setInterval(() => {
      remainingSeconds -= 1;

      updateCountdown();

      if (remainingSeconds <= 0) {
        clearInterval(countdownTimer);
        performLogout();
      }

    }, 1000);
  }


  /* ------------------------------------------------------------
     COUNTDOWN
     ------------------------------------------------------------ */

  function updateCountdown() {
    if (!countdownElement) {
      return;
    }

    const safeSeconds =
      Math.max(
        0,
        remainingSeconds
      );

    const minutes =
      Math.floor(
        safeSeconds / 60
      );

    const seconds =
      safeSeconds % 60;

    countdownElement.textContent =
      `${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
  }


  /* ------------------------------------------------------------
     STAY LOGGED IN
     ------------------------------------------------------------ */

  function stayLoggedIn() {
    clearInterval(countdownTimer);

    warningVisible = false;

    remainingSeconds = 0;

    if (modal) {
      modal.classList.remove(
        "is-visible"
      );

      modal.setAttribute(
        "aria-hidden",
        "true"
      );
    }

    startInactivityTimer();
  }


  /* ------------------------------------------------------------
     LOGOUT
     ------------------------------------------------------------ */

  async function performLogout() {
    clearTimeout(inactivityTimer);
    clearInterval(countdownTimer);

    console.log(
      "[Security] Signing out inactive user."
    );

    try {
      if (
        window.S4UAuth &&
        typeof window.S4UAuth.signOut ===
          "function"
      ) {
        await window.S4UAuth.signOut();

      } else {
        let client = null;

        if (
          typeof window.getScreenings4uSupabase ===
          "function"
        ) {
          client =
            window.getScreenings4uSupabase();

        } else if (
          window.supabaseClient
        ) {
          client =
            window.supabaseClient;

        } else if (
          window.screenings4uSupabase
        ) {
          client =
            window.screenings4uSupabase;
        }

        if (
          client &&
          client.auth &&
          typeof client.auth.signOut ===
            "function"
        ) {
          const { error } =
            await client.auth.signOut();

          if (error) {
            throw error;
          }
        }
      }

    } catch (error) {
      console.error(
        "[Security] Logout error:",
        error
      );

    } finally {
      warningVisible = false;

      window.location.replace(
        config.loginPage
      );
    }
  }


  /* ------------------------------------------------------------
     PUBLIC API
     ------------------------------------------------------------ */

  window.S4UDashboardSecurity = {
    initialize: initializeSecurity,

    resetTimer: resetInactivityTimer,

    logout: performLogout,

    getConfig() {
      return {
        ...config
      };
    }
  };


  /* ------------------------------------------------------------
     AUTO-INITIALIZE
     ------------------------------------------------------------ */

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      if (
        window.S4U_DASHBOARD_SECURITY_CONFIG
      ) {
        initializeSecurity(
          window.S4U_DASHBOARD_SECURITY_CONFIG
        );
      }
    }
  );

})();