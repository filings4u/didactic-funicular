/* ============================================================
   screenings4u — DOT CONSORTIUM
   Page controller
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", initializeDotConsortium);

  async function initializeDotConsortium() {
    const refreshButton = document.getElementById("refreshDotBtn");

    if (refreshButton) {
      refreshButton.addEventListener("click", loadDotConsortium);
    }

    await loadDotConsortium();
  }

  async function loadDotConsortium() {
    setLoadingState(true);

    try {
      if (
        !window.S4UAuth ||
        typeof window.S4UAuth.requireSession !== "function"
      ) {
        throw new Error("Authentication system is unavailable.");
      }

      const session = await window.S4UAuth.requireSession("../admin-login.html");

      if (!session) {
        return;
      }

      if (
        !window.S4UPermissions ||
        typeof window.S4UPermissions.requirePermission !== "function"
      ) {
        throw new Error("Permission system is unavailable.");
      }

      const allowed = await window.S4UPermissions.requirePermission(
        "dot.view",
        "../admin-dashboard.html"
      );

      if (!allowed) {
        return;
      }

      const client = window.S4UAuth.getClient();

      if (!client) {
        throw new Error("Supabase client is unavailable.");
      }

      const [programs, employers, drivers] = await Promise.all([
        getCount(client, "dot_consortiums"),
        getCount(client, "dot_consortium_employers"),
        getCount(client, "dot_consortium_drivers")
      ]);

      setText("programCount", programs);
      setText("employerCount", employers);
      setText("driverCount", drivers);

      setText("dotStatusValue", "READY");
      setText("dotStatusNote", "DOT data services available");
    } catch (error) {
      console.error("DOT Consortium load failed:", error);

      setText("programCount", "—");
      setText("employerCount", "—");
      setText("driverCount", "—");

      setText("dotStatusValue", "ERROR");
      setText("dotStatusNote", "Unable to load DOT data");

      showToast(
        error && error.message
          ? error.message
          : "Unable to load DOT consortium data.",
        "error"
      );
    } finally {
      setLoadingState(false);
    }
  }

  async function getCount(client, tableName) {
    const result = await client
      .from(tableName)
      .select("id", { count: "exact", head: true });

    if (result.error) {
      throw result.error;
    }

    return result.count ?? 0;
  }

  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = String(value);
    }
  }

  function setLoadingState(isLoading) {
    const button = document.getElementById("refreshDotBtn");

    if (!button) {
      return;
    }

    button.disabled = isLoading;
    button.setAttribute("aria-busy", String(isLoading));

    const label = isLoading ? "Loading..." : "Refresh";
    const textNodes = Array.from(button.childNodes).filter(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );

    if (textNodes.length) {
      textNodes[textNodes.length - 1].textContent = ` ${label}`;
    }
  }

  function showToast(message, type) {
    if (
      window.S4UUI &&
      typeof window.S4UUI.toast === "function"
    ) {
      window.S4UUI.toast(message, type || "error");
      return;
    }

    console.error(message);
  }
})();
