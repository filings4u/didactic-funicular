document.addEventListener("DOMContentLoaded", async () => {
  try {
    const session = await window.S4UAuth.requireSession("admin-login.html");
    if (!session) return;
    const client = window.S4UAuth.getClient();

    async function check() {
      const auth = await window.S4UAuth.getSession();
      document.getElementById("authStatus").textContent = auth?.user ? "Connected" : "Not signed in";
      document.getElementById("authStatus").className = `s4u-status ${auth?.user ? "success" : "danger"}`;
      if (!auth?.user) return;

      const checks = [
        ["rbacStatus", "has_permission", { requested_permission: "dashboard.read", requested_organization: null }],
        ["auditStatus", "audit_log", null],
        ["eventStatus", "system_events", null],
        ["documentStatus", "documents", null]
      ];

      for (const [id, target, args] of checks) {
        try {
          let ok = false;
          if (target === "has_permission") {
            const { data, error } = await client.rpc(target, args);
            if (error) throw error;
            ok = data === true;
          } else {
            const { error } = await client.from(target).select("id").limit(1);
            if (error) throw error;
            ok = true;
          }
          document.getElementById(id).textContent = ok ? "Ready" : "Unavailable";
          document.getElementById(id).className = `s4u-status ${ok ? "success" : "danger"}`;
        } catch (error) {
          console.error(target, error);
          document.getElementById(id).textContent = "Needs configuration";
          document.getElementById(id).className = "s4u-status warning";
        }
      }
    }
    document.getElementById("foundationCheck").addEventListener("click", check);
    await check();
  } catch (error) {
    console.error(error);
    window.S4UUI.toast(error.message || "Unable to run foundation checks.", "error");
  }
});