/* ============================================================
   screenings4u — ADMIN DASHBOARD
   Real operational dashboard.
   Foundation / audit checks remain on System / Audit pages.
   ============================================================ */

document.addEventListener("DOMContentLoaded", initializeDashboard);

let dashboardClockTimer = null;


/* ============================================================
   INITIALIZATION
   ============================================================ */

async function initializeDashboard() {
  startDashboardClock();

  const refreshButton =
    document.getElementById("dashboardRefresh");

  if (refreshButton) {
    refreshButton.addEventListener(
      "click",
      async () => {
        await loadDashboard();
      }
    );
  }

  await loadDashboard();
}


/* ============================================================
   DASHBOARD CLOCK
   ============================================================ */

function startDashboardClock() {
  updateDashboardClock();

  if (dashboardClockTimer) {
    clearInterval(dashboardClockTimer);
  }

  dashboardClockTimer = setInterval(
    updateDashboardClock,
    1000
  );
}


function updateDashboardClock() {
  const dateElement =
    document.getElementById("dashboardDate");

  const timeElement =
    document.getElementById("dashboardTime");

  if (!dateElement && !timeElement) return;

  const now = new Date();

  if (dateElement) {
    dateElement.textContent =
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(now);
  }

  if (timeElement) {
    timeElement.textContent =
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short"
      }).format(now);
  }
}


/* ============================================================
   DASHBOARD LOADING
   ============================================================ */

async function loadDashboard() {
  setHealth("Checking");

  setStatusMessage(
    "Checking platform services..."
  );

  const refreshButton =
    document.getElementById("dashboardRefresh");

  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.classList.add("is-loading");
  }

  const client =
    window.S4UAuth?.getClient?.();

  if (!client) {
    setHealth("Unavailable");

    setStatusMessage(
      "Unable to connect to the administrative services."
    );

    finishRefreshButton(refreshButton);

    return;
  }

  try {
    const auth =
      await window.S4UAuth.getSession();

    const user = auth?.user;

    if (!user) {
      setHealth("Sign in required");

      setStatusMessage(
        "Please sign in to access the administrative dashboard."
      );

      renderEmptyActivity(
        "Sign in to view recent activity."
      );

      return;
    }


    /* --------------------------------------------------------
       METRICS

       IMPORTANT:
       These table names match the existing Supabase schema.

       customers           → existing
       customer_profiles   → replaces accounts
       orders              → existing
       billing_accounts    → replaces billing
       employer_employees  → replaces dot_drivers
       lms_courses         → existing
       -------------------------------------------------------- */

    const metricResults =
      await Promise.all([
  loadMetric(client, "metricCustomers", "customer_profiles"),

        loadMetric(
          client,
          "metricAccounts",
          "customer_profiles"
        ),

        loadMetric(
          client,
          "metricOrders",
          "orders"
        ),

        loadMetric(
          client,
          "metricBilling",
          "billing_accounts"
        ),

        loadMetric(
          client,
          "metricDrivers",
          "employer_employees"
        ),

        loadMetric(
          client,
          "metricCourses",
          "lms_courses"
        )
      ]);


    const [
      databaseReady,
      permissionsReady,
      auditReady
    ] = await Promise.all([
      checkDatabase(client),
      checkPermissions(client),
      checkAudit(client)
    ]);


    await loadRecentActivity(client);


    const operational =
      metricResults.every(Boolean) &&
      databaseReady &&
      permissionsReady &&
      auditReady;


    if (operational) {
      setHealth("Operational");

      setStatusMessage(
        "All systems are running normally."
      );
    } else {
      setHealth("Attention required");

      setStatusMessage(
        "One or more platform services need attention."
      );
    }

  } catch (error) {
    console.error(
      "Dashboard load failed:",
      error
    );

    setHealth("Attention required");

    setStatusMessage(
      "Some dashboard data could not be loaded."
    );

  } finally {
    finishRefreshButton(refreshButton);
  }
}


/* ============================================================
   REFRESH BUTTON
   ============================================================ */

function finishRefreshButton(button) {
  if (!button) return;

  button.disabled = false;

  button.classList.remove(
    "is-loading"
  );
}


/* ============================================================
   METRICS
   ============================================================ */

async function loadMetric(
  client,
  elementId,
  table
) {
  const element =
    document.getElementById(elementId);

  if (!element) return false;

  try {
    const {
      count,
      error
    } = await client
      .from(table)
      .select("*", {
        count: "exact",
        head: true
      });

    if (error) {
      throw error;
    }

    element.textContent =
      formatNumber(count ?? 0);

    return true;

  } catch (error) {
    console.warn(
      `Unable to load ${table}:`,
      error
    );

    element.textContent = "—";

    return false;
  }
}


/* ============================================================
   PLATFORM CHECKS
   ============================================================ */

async function checkDatabase(client) {
  try {
    const { error } = await client
      .from("system_events")
      .select("id")
      .limit(1);

    if (error) {
      throw error;
    }

    return true;

  } catch (error) {
    console.warn(
      "Database check failed:",
      error
    );

    return false;
  }
}


async function checkPermissions(client) {
  try {
    const {
      data,
      error
    } = await client.rpc(
      "has_permission",
      {
        requested_permission:
          "dashboard.read",

        requested_organization:
          null
      }
    );

    if (error) {
      throw error;
    }

    return data === true;

  } catch (error) {
    console.warn(
      "Permission check failed:",
      error
    );

    return false;
  }
}


async function checkAudit(client) {
  try {
    const { error } = await client
      .from("audit_log")
      .select("id")
      .limit(1);

    if (error) {
      throw error;
    }

    return true;

  } catch (error) {
    console.warn(
      "Audit check failed:",
      error
    );

    return false;
  }
}


/* ============================================================
   RECENT ACTIVITY
   ============================================================ */

async function loadRecentActivity(client) {
  const container =
    document.getElementById(
      "recentActivity"
    );

  if (!container) return;

  try {
    const {
      data,
      error
    } = await client
      .from("audit_log")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(5);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      renderEmptyActivity(
        "No recent activity to display.",
        "Activity will appear here once available."
      );

      return;
    }


    container.innerHTML =
      data.map((item) => {
        const action =
          item.action ||
          item.event_type ||
          item.operation ||
          "Administrative activity";


        const subject =
          item.resource_type ||
          item.entity_type ||
          item.table_name ||
          "System";


        const time =
          item.created_at
            ? formatRelativeTime(
                item.created_at
              )
            : "";


        return `
          <div class="dashboard-activity-row">

            <span
              class="dashboard-activity-dot"
            ></span>

            <div
              class="dashboard-activity-text"
            >
              <strong>
                ${escapeHtml(
                  String(action)
                )}
              </strong>

              <small>
                ${escapeHtml(
                  String(subject)
                )}
              </small>
            </div>

            <span
              class="dashboard-activity-time"
            >
              ${escapeHtml(time)}
            </span>

          </div>
        `;
      }).join("");

  } catch (error) {
    console.warn(
      "Recent activity unavailable:",
      error
    );

    renderEmptyActivity(
      "No recent activity is available.",
      "Activity will appear here once available."
    );
  }
}


/* ============================================================
   EMPTY ACTIVITY STATE
   ============================================================ */

function renderEmptyActivity(
  title = "No recent activity to display.",
  message = "Activity will appear here once available."
) {
  const container =
    document.getElementById(
      "recentActivity"
    );

  if (!container) return;

  container.innerHTML = `
    <div class="dashboard-empty">

      <span
        class="dashboard-empty-icon"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
        >
          <path
            d="M12 5h18l9 9v27H12z"
          ></path>

          <path
            d="M30 5v10h9"
          ></path>

          <circle
            cx="32"
            cy="32"
            r="7"
          ></circle>

          <path
            d="M32 28.5v4l2.5 1.5"
          ></path>
        </svg>
      </span>

      <div>
        <strong>
          ${escapeHtml(title)}
        </strong>

        <small>
          ${escapeHtml(message)}
        </small>
      </div>

    </div>
  `;
}


/* ============================================================
   DASHBOARD HEALTH
   ============================================================ */

function setHealth(text) {
  const element =
    document.getElementById(
      "dashboardHealth"
    );

  const light =
    document.getElementById(
      "dashboardStatusLight"
    );


  if (element) {
    element.textContent =
      text.toUpperCase();
  }


  if (light) {
    light.className =
      "dashboard-status-light";


    if (text === "Operational") {
      light.classList.add(
        "success"
      );

    } else if (
      text === "Attention required" ||
      text === "Unavailable"
    ) {
      light.classList.add(
        "danger"
      );

    } else if (
      text === "Sign in required"
    ) {
      light.classList.add(
        "warning"
      );
    }
  }


  if (element) {
    element.style.color =
      text === "Operational"
        ? "#16804d"
        : text === "Checking"
          ? "#667085"
          : text === "Sign in required"
            ? "#9a5b00"
            : "#b42318";
  }
}


/* ============================================================
   STATUS MESSAGE
   ============================================================ */

function setStatusMessage(text) {
  const element =
    document.getElementById(
      "dashboardStatusMessage"
    );

  if (element) {
    element.textContent = text;
  }
}


/* ============================================================
   FORMATTERS
   ============================================================ */

function formatNumber(value) {
  return Number(
    value || 0
  ).toLocaleString();
}


function formatRelativeTime(dateValue) {
  const timestamp =
    new Date(dateValue).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }


  const seconds =
    Math.max(
      0,
      Math.floor(
        (Date.now() - timestamp) /
        1000
      )
    );


  if (seconds < 60) {
    return "Just now";
  }


  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }


  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }


  const days =
    Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }


  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric"
    }
  ).format(
    new Date(dateValue)
  );
}


/* ============================================================
   HTML ESCAPING
   ============================================================ */

function escapeHtml(value) {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}