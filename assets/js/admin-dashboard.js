/* ============================================================
   screenings4u — ADMIN DASHBOARD
   Live dashboard metrics and recent system activity.
   ============================================================ */

(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", initializeAdminDashboard);

  async function initializeAdminDashboard() {
    const client = getClient();

    if (!client) {
      console.error("Supabase client was not found.");
      setDashboardErrorState();
      return;
    }

    try {
      await loadDashboard(client);
    } catch (error) {
      console.error("Admin dashboard initialization failed:", error);
      setDashboardErrorState();
    }
  }

  function getClient() {
    try {
      if (typeof window.getScreenings4uSupabase === "function") {
        return window.getScreenings4uSupabase();
      }

      if (window.screenings4uSupabase?.from) {
        return window.screenings4uSupabase;
      }

      if (window.supabaseClient?.from) {
        return window.supabaseClient;
      }
    } catch (error) {
      console.error("Unable to obtain Supabase client:", error);
    }

    return null;
  }

  async function loadDashboard(client) {
    const results = await Promise.allSettled([
      countActiveEmployers(client),
      countActiveEmployees(client),
      countDotTests(client),
      countOpenSupportTickets(client),
      loadRecentActivity(client)
    ]);

    const [
      employersResult,
      employeesResult,
      dotTestsResult,
      supportTicketsResult,
      activityResult
    ] = results;

    setStat(
      "employers",
      employersResult.status === "fulfilled" ? employersResult.value : 0
    );

    setStat(
      "employees",
      employeesResult.status === "fulfilled" ? employeesResult.value : 0
    );

    setStat(
      "dot-tests",
      dotTestsResult.status === "fulfilled" ? dotTestsResult.value : 0
    );

    setStat(
      "support-tickets",
      supportTicketsResult.status === "fulfilled" ? supportTicketsResult.value : 0
    );

    if (activityResult.status === "fulfilled") {
      renderActivity(activityResult.value);
    } else {
      console.error("Unable to load system activity:", activityResult.reason);
      renderEmptyActivity();
    }
  }

  async function countActiveEmployers(client) {
    const { count, error } = await client
      .from("employer_profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (error) throw error;

    return Number(count || 0);
  }

  async function countActiveEmployees(client) {
    let query = client
      .from("employer_employees")
      .select("*", { count: "exact", head: true });

    const { count, error } = await query.eq("employment_status", "active");

    if (!error) {
      return Number(count || 0);
    }

    /* Fallback for older data that may not use "active" consistently. */
    const fallback = await client
      .from("employer_employees")
      .select("*", { count: "exact", head: true });

    if (fallback.error) throw fallback.error;

    return Number(fallback.count || 0);
  }

  async function countDotTests(client) {
    const { count, error } = await client
      .from("dot_tests")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    return Number(count || 0);
  }

  async function countOpenSupportTickets(client) {
    /*
      The current database structure does not include a support_tickets table.
      Keep this metric at zero until that module/table is added.
    */
    return 0;
  }

  async function loadRecentActivity(client) {
    const sources = await Promise.allSettled([
      client
        .from("system_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),

      client
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)
    ]);

    const events = [];
    const audit = [];

    if (sources[0].status === "fulfilled") {
      const result = sources[0].value;

      if (!result.error && Array.isArray(result.data)) {
        events.push(...result.data);
      } else if (result.error) {
        console.warn("system_events could not be loaded:", result.error.message);
      }
    }

    if (sources[1].status === "fulfilled") {
      const result = sources[1].value;

      if (!result.error && Array.isArray(result.data)) {
        audit.push(...result.data);
      } else if (result.error) {
        console.warn("audit_log could not be loaded:", result.error.message);
      }
    }

    return [...events, ...audit]
      .map(normalizeActivity)
      .sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      })
      .slice(0, 8);
  }

  function normalizeActivity(row) {
    const title =
      row.event_name ||
      row.event_type ||
      row.action ||
      row.operation ||
      row.event ||
      row.table_name ||
      "System activity";

    const description =
      row.description ||
      row.message ||
      row.summary ||
      buildAuditDescription(row) ||
      "System record updated.";

    return {
      title: humanize(title),
      description,
      createdAt:
        row.created_at ||
        row.updated_at ||
        row.occurred_at ||
        row.event_at ||
        null
    };
  }

  function buildAuditDescription(row) {
    if (!row || typeof row !== "object") return "";

    const table =
      row.table_name ||
      row.entity_type ||
      row.resource ||
      "";

    const action =
      row.action ||
      row.operation ||
      "";

    if (table && action) {
      return `${humanize(action)} record in ${humanize(table)}.`;
    }

    return "";
  }

  function renderActivity(items) {
    const target = document.getElementById("admin-system-activity-target");

    if (!target) return;

    if (!items.length) {
      renderEmptyActivity();
      return;
    }

    target.innerHTML = items
      .map((item, index) => {
        const number = String(index + 1).padStart(2, "0");

        return `
          <div class="admin-activity">
            <div class="admin-activity-icon">${escapeHtml(number)}</div>

            <div class="admin-activity-copy">
              <div class="admin-activity-title">
                ${escapeHtml(item.title)}
              </div>

              <div class="admin-activity-text">
                ${escapeHtml(item.description)}
              </div>
            </div>

            <div class="admin-activity-time">
              ${escapeHtml(formatRelativeTime(item.createdAt))}
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderEmptyActivity() {
    const target = document.getElementById("admin-system-activity-target");

    if (!target) return;

    target.innerHTML = `
      <div class="admin-activity">
        <div class="admin-activity-icon">01</div>

        <div class="admin-activity-copy">
          <div class="admin-activity-title">
            Management Portal Ready
          </div>

          <div class="admin-activity-text">
            No recent system activity is available yet.
          </div>
        </div>

        <div class="admin-activity-time">Now</div>
      </div>
    `;
  }

  function setStat(name, value) {
    const target = document.querySelector(
      `[data-admin-stat="${name}"]`
    );

    if (target) {
      target.textContent = Number(value || 0).toLocaleString();
    }
  }

  function setDashboardErrorState() {
    setStat("employers", 0);
    setStat("employees", 0);
    setStat("dot-tests", 0);
    setStat("support-tickets", 0);

    renderEmptyActivity();
  }

  function humanize(value) {
    return String(value || "")
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatRelativeTime(value) {
    if (!value) return "Recently";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Recently";

    const seconds = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 1000)
    );

    if (seconds < 60) return "Now";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
