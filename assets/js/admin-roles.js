/* =========================================================
   screenings4u — Admin Roles & Permissions
   ========================================================= */

(() => {
  "use strict";

  let supabaseClient = null;

  let roles = [];
  let permissions = [];
  let rolePermissions = [];

  const $ = (id) =>
    document.getElementById(id);

  async function getClient() {

    if (supabaseClient) {
      return supabaseClient;
    }

    if (
      window.supabaseClient &&
      typeof window.supabaseClient.from === "function"
    ) {
      supabaseClient =
        window.supabaseClient;

      return supabaseClient;
    }

    if (
      window.SCREENINGS4U_SUPABASE_URL &&
      window.SCREENINGS4U_SUPABASE_ANON_KEY &&
      window.supabase &&
      typeof window.supabase.createClient === "function"
    ) {
      supabaseClient =
        window.supabase.createClient(
          window.SCREENINGS4U_SUPABASE_URL,
          window.SCREENINGS4U_SUPABASE_ANON_KEY
        );

      return supabaseClient;
    }

    throw new Error(
      "Supabase client could not be initialized."
    );
  }

  function escapeHtml(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showMessage(
    message,
    type = "error"
  ) {

    const box =
      $("roleMessage");

    if (!box) return;

    box.textContent =
      message;

    box.className =
      `message ${type}`;
  }

  async function loadRoles() {

    const tbody =
      $("roleTableBody");

    try {

      const client =
        await getClient();

      const rolesResponse =
        await client
          .from("app_permissions")
          .select("*")
          .order("permission_key");

      if (
        rolesResponse.error
      ) {
        throw rolesResponse.error;
      }

      permissions =
        rolesResponse.data || [];

      const roleResponse =
        await client
          .from("app_role_permissions")
          .select("*");

      if (
        roleResponse.error
      ) {
        throw roleResponse.error;
      }

      rolePermissions =
        roleResponse.data || [];

      /*
       * The verified database contains role/permission
       * infrastructure, but the exact role catalog should
       * come from the existing live tables rather than
       * inventing role names here.
       *
       * Build role names from assignments where available.
       */

      const assignmentResponse =
        await client
          .from("user_role_assignments")
          .select("*");

      if (
        assignmentResponse.error
      ) {
        throw assignmentResponse.error;
      }

      const roleNames =
        new Set();

      (
        assignmentResponse.data || []
      ).forEach(
        (assignment) => {

          if (
            assignment.role
          ) {
            roleNames.add(
              assignment.role
            );
          }

          if (
            assignment.role_name
          ) {
            roleNames.add(
              assignment.role_name
            );
          }
        }
      );

      roles =
        Array.from(
          roleNames
        ).map(
          (name) => ({
            name
          })
        );

      renderRoles();

    } catch (error) {

      console.error(
        "Role load error:",
        error
      );

      tbody.innerHTML = `
        <tr>
          <td
            colspan="3"
            class="error-cell"
          >
            Unable to load roles.
          </td>
        </tr>
      `;

      showMessage(
        error.message ||
        "Unable to load roles."
      );
    }
  }

  function renderRoles() {

    const tbody =
      $("roleTableBody");

    if (!roles.length) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="3"
            class="empty-cell"
          >
            No role assignments currently exist.
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML =
      roles.map(
        (role) => {

          const name =
            role.name;

          const permissionCount =
            permissions.length;

          return `
            <tr>

              <td>
                <strong>
                  ${escapeHtml(name)}
                </strong>
              </td>

              <td>
                System role
              </td>

              <td>
                <span
                  class="status-badge success"
                >
                  ${permissionCount}
                  permissions available
                </span>
              </td>

            </tr>
          `;
        }
      ).join("");
  }

  function bindEvents() {

    $("signOutBtn")
      ?.addEventListener(
        "click",
        async () => {

          try {

            const client =
              await getClient();

            await client.auth.signOut();

            window.location.href =
              "index.html";

          } catch (error) {

            console.error(
              "Sign out error:",
              error
            );
          }
        }
      );
  }

  async function init() {

    bindEvents();

    await loadRoles();
  }

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();