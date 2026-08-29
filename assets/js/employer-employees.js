/* ============================================================
   SCREENINGS4U — EMPLOYER EMPLOYEES
   employer-employees.js

   Ready for Supabase wiring.

   Primary tables already identified:
   - employer_profiles
   - employer_members
   - employer_employees
   - lms_enrollments
   ============================================================ */

(function () {
  "use strict";

  const state = {
    employees: [],
    filteredEmployees: [],
    selectedEmployeeId: null
  };


  document.addEventListener(
    "DOMContentLoaded",
    initializeEmployerEmployees
  );


  function initializeEmployerEmployees() {
    bindControls();
    loadEmployees();
  }


  function bindControls() {
    const search =
      document.getElementById(
        "employee-search"
      );

    const statusFilter =
      document.getElementById(
        "employee-status-filter"
      );

    const trainingFilter =
      document.getElementById(
        "employee-training-filter"
      );

    const addButton =
      document.getElementById(
        "employer-add-employee-btn"
      );

    const form =
      document.getElementById(
        "employee-form"
      );


    if (search) {
      search.addEventListener(
        "input",
        applyFilters
      );
    }


    if (statusFilter) {
      statusFilter.addEventListener(
        "change",
        applyFilters
      );
    }


    if (trainingFilter) {
      trainingFilter.addEventListener(
        "change",
        applyFilters
      );
    }


    if (addButton) {
      addButton.addEventListener(
        "click",
        function () {
          openEmployeeModal();
        }
      );
    }


    if (form) {
      form.addEventListener(
        "submit",
        handleEmployeeSave
      );
    }


    bindModalControls();
  }


  function bindModalControls() {
    bindClick(
      "employee-modal-close",
      closeEmployeeModal
    );

    bindClick(
      "employee-modal-cancel",
      closeEmployeeModal
    );

    bindClick(
      "employee-modal-backdrop",
      closeEmployeeModal
    );

    bindClick(
      "employee-details-close",
      closeEmployeeDetails
    );

    bindClick(
      "employee-details-done",
      closeEmployeeDetails
    );

    bindClick(
      "employee-details-backdrop",
      closeEmployeeDetails
    );

    bindClick(
      "employee-details-edit",
      editSelectedEmployee
    );
  }


  async function loadEmployees() {
    /*
      FINAL SUPABASE WIRING

      We must first verify exact columns in employer_employees
      and the organization ownership relationship.

      Intended secure flow:

      1. Get the authenticated Supabase user.
      2. Resolve their employer organization.
      3. Query only employees belonging to that employer.
      4. Load training assignment summaries separately.

      IMPORTANT:
      The browser must never provide a different employer ID
      to gain access to another organization's employees.

      RLS must enforce organization ownership.
    */


    state.employees = [];

    updateMetrics();
    applyFilters();
  }


  function applyFilters() {
    const searchTerm =
      getValue(
        "employee-search"
      ).toLowerCase();

    const status =
      getValue(
        "employee-status-filter"
      ) || "all";

    const training =
      getValue(
        "employee-training-filter"
      ) || "all";


    state.filteredEmployees =
      state.employees.filter(
        function (employee) {

          const name =
            (
              String(
                employee.first_name || ""
              ) +
              " " +
              String(
                employee.last_name || ""
              )
            ).toLowerCase();

          const email =
            String(
              employee.email || ""
            ).toLowerCase();


          const matchesSearch =
            !searchTerm ||
            name.includes(searchTerm) ||
            email.includes(searchTerm);


          const matchesStatus =
            status === "all" ||
            String(
              employee.status || "active"
            ).toLowerCase() === status;


          const hasTraining =
            Number(
              employee.training_count || 0
            ) > 0;


          const matchesTraining =
            training === "all" ||
            (
              training === "assigned" &&
              hasTraining
            ) ||
            (
              training === "none" &&
              !hasTraining
            );


          return (
            matchesSearch &&
            matchesStatus &&
            matchesTraining
          );
        }
      );


    renderEmployees();
    updateResultCount();
  }


  function renderEmployees() {
    const body =
      document.getElementById(
        "employee-table-body"
      );


    if (!body) {
      return;
    }


    if (
      state.filteredEmployees.length === 0
    ) {
      body.innerHTML =
        '<tr><td colspan="6">' +
        '<div class="employer-table-empty">' +
        (
          state.employees.length === 0
            ? "Employee records will appear here once connected to your organization."
            : "No employees match your current filters."
        ) +
        "</div></td></tr>";

      return;
    }


    body.innerHTML =
      state.filteredEmployees
        .map(
          function (employee) {

            const fullName =
              getEmployeeName(employee);

            const initials =
              getInitials(employee);

            const status =
              String(
                employee.status || "active"
              ).toLowerCase();

            const trainingCount =
              Number(
                employee.training_count || 0
              );


            return `
              <tr>
                <td>
                  <div class="employer-table-employee">
                    <div class="employer-table-avatar">
                      ${escapeHtml(initials)}
                    </div>

                    <div>
                      <strong>
                        ${escapeHtml(fullName)}
                      </strong>

                      <span>
                        ${escapeHtml(
                          employee.employee_number ||
                          "Employee"
                        )}
                      </span>
                    </div>
                  </div>
                </td>

                <td>
                  ${escapeHtml(
                    employee.email || "—"
                  )}
                </td>

                <td>
                  <span class="employer-status-badge ${
                    status === "active"
                      ? "employer-status-active"
                      : "employer-status-inactive"
                  }">
                    ${escapeHtml(
                      capitalize(status)
                    )}
                  </span>
                </td>

                <td>
                  <span class="employer-training-label">
                    ${
                      trainingCount > 0
                        ? trainingCount + " assigned"
                        : "No training"
                    }
                  </span>
                </td>

                <td>
                  ${escapeHtml(
                    formatDate(
                      employee.created_at
                    )
                  )}
                </td>

                <td>
                  <div class="employer-row-actions">
                    <button
                      type="button"
                      class="employer-row-action"
                      data-action="view"
                      data-id="${escapeAttribute(employee.id)}"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      class="employer-row-action"
                      data-action="edit"
                      data-id="${escapeAttribute(employee.id)}"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }
        )
        .join("");


    body
      .querySelectorAll(
        "[data-action]"
      )
      .forEach(
        function (button) {
          button.addEventListener(
            "click",
            handleRowAction
          );
        }
      );
  }


  function handleRowAction(event) {
    const button =
      event.currentTarget;

    const employeeId =
      button.dataset.id;

    const action =
      button.dataset.action;


    if (action === "view") {
      openEmployeeDetails(
        employeeId
      );
    }


    if (action === "edit") {
      openEmployeeModal(
        employeeId
      );
    }
  }


  function openEmployeeModal(employeeId) {
    const modal =
      document.getElementById(
        "employee-modal"
      );

    const title =
      document.getElementById(
        "employee-modal-title"
      );

    const form =
      document.getElementById(
        "employee-form"
      );


    if (!modal || !form) {
      return;
    }


    form.reset();

    setValue(
      "employee-id",
      ""
    );


    if (employeeId) {
      const employee =
        findEmployee(
          employeeId
        );

      if (employee) {
        if (title) {
          title.textContent =
            "Edit Employee";
        }

        populateEmployeeForm(
          employee
        );
      }
    } else {
      if (title) {
        title.textContent =
          "Add Employee";
      }
    }


    modal.hidden = false;
  }


  function closeEmployeeModal() {
    const modal =
      document.getElementById(
        "employee-modal"
      );

    if (modal) {
      modal.hidden = true;
    }
  }


  async function handleEmployeeSave(event) {
    event.preventDefault();


    const employeeId =
      getValue(
        "employee-id"
      );


    const employeeData = {
      id:
        employeeId || null,

      first_name:
        getValue(
          "employee-first-name"
        ),

      last_name:
        getValue(
          "employee-last-name"
        ),

      email:
        getValue(
          "employee-email"
        ),

      phone:
        getValue(
          "employee-phone"
        ),

      status:
        getValue(
          "employee-status"
        ) || "active"
    };


    /*
      FINAL SUPABASE INSERT / UPDATE

      Before wiring this, we need the exact employer_employees
      column list.

      Intended behavior:

      CREATE:
      - Insert employee into employer_employees.
      - Automatically associate with authenticated employer.
      - Never accept employer_id directly from untrusted UI.

      EDIT:
      - Update employee only when the employee belongs to
        the authenticated employer.

      Employee portal access will be handled separately from
      simply creating an employee CRM record.
    */


    console.log(
      "Employee ready to save:",
      employeeData
    );


    window.alert(
      "Employee saving will be connected to Supabase during the wiring phase."
    );
  }


  function openEmployeeDetails(employeeId) {
    const employee =
      findEmployee(
        employeeId
      );


    if (!employee) {
      return;
    }


    state.selectedEmployeeId =
      employeeId;


    setText(
      "employee-details-name",
      getEmployeeName(employee)
    );

    setText(
      "employee-details-email",
      employee.email || "—"
    );

    setText(
      "employee-details-status",
      capitalize(
        employee.status || "active"
      )
    );

    setText(
      "employee-details-phone",
      employee.phone || "—"
    );

    setText(
      "employee-details-training",
      Number(
        employee.training_count || 0
      ) > 0
        ? employee.training_count +
          " assigned"
        : "No training assigned"
    );

    setText(
      "employee-details-added",
      formatDate(
        employee.created_at
      )
    );


    const modal =
      document.getElementById(
        "employee-details-modal"
      );

    if (modal) {
      modal.hidden = false;
    }
  }


  function closeEmployeeDetails() {
    const modal =
      document.getElementById(
        "employee-details-modal"
      );

    if (modal) {
      modal.hidden = true;
    }
  }


  function editSelectedEmployee() {
    const employeeId =
      state.selectedEmployeeId;


    closeEmployeeDetails();


    if (employeeId) {
      openEmployeeModal(
        employeeId
      );
    }
  }


  function populateEmployeeForm(employee) {
    setValue(
      "employee-id",
      employee.id || ""
    );

    setValue(
      "employee-first-name",
      employee.first_name || ""
    );

    setValue(
      "employee-last-name",
      employee.last_name || ""
    );

    setValue(
      "employee-email",
      employee.email || ""
    );

    setValue(
      "employee-phone",
      employee.phone || ""
    );

    setValue(
      "employee-status",
      employee.status || "active"
    );
  }


  function updateMetrics() {
    const total =
      state.employees.length;

    const active =
      state.employees.filter(
        function (employee) {
          return (
            String(
              employee.status || "active"
            ).toLowerCase() ===
            "active"
          );
        }
      ).length;

    const training =
      state.employees.filter(
        function (employee) {
          return (
            Number(
              employee.training_count || 0
            ) > 0
          );
        }
      ).length;

    const attention =
      state.employees.filter(
        function (employee) {
          return Boolean(
            employee.needs_attention
          );
        }
      ).length;


    setText(
      "employee-total-count",
      total || "—"
    );

    setText(
      "employee-active-count",
      active || "—"
    );

    setText(
      "employee-training-count",
      training || "—"
    );

    setText(
      "employee-attention-count",
      attention || "—"
    );
  }


  function updateResultCount() {
    const element =
      document.getElementById(
        "employee-results-count"
      );

    if (!element) {
      return;
    }


    const count =
      state.filteredEmployees.length;


    element.textContent =
      count +
      " employee" +
      (count === 1 ? "" : "s");
  }


  function findEmployee(employeeId) {
    return state.employees.find(
      function (employee) {
        return String(
          employee.id
        ) === String(
          employeeId
        );
      }
    );
  }


  function getEmployeeName(employee) {
    const name =
      [
        employee.first_name,
        employee.last_name
      ]
        .filter(Boolean)
        .join(" ")
        .trim();


    return name ||
      employee.email ||
      "Employee";
  }


  function getInitials(employee) {
    const initials =
      [
        employee.first_name,
        employee.last_name
      ]
        .filter(Boolean)
        .map(
          function (value) {
            return String(value)
              .trim()
              .charAt(0)
              .toUpperCase();
          }
        )
        .join("");


    return initials || "EM";
  }


  function formatDate(value) {
    if (!value) {
      return "—";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }


    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    ).format(date);
  }


  function capitalize(value) {
    const text =
      String(value || "");


    return (
      text.charAt(0).toUpperCase() +
      text.slice(1)
    );
  }


  function bindClick(id, handler) {
    const element =
      document.getElementById(id);

    if (element) {
      element.addEventListener(
        "click",
        handler
      );
    }
  }


  function getValue(id) {
    const element =
      document.getElementById(id);

    return element
      ? String(
          element.value || ""
        ).trim()
      : "";
  }


  function setValue(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.value =
        value == null
          ? ""
          : value;
    }
  }


  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        value == null
          ? ""
          : value;
    }
  }


  function escapeHtml(value) {
    return String(
      value == null
        ? ""
        : value
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }


  function escapeAttribute(value) {
    return escapeHtml(value);
  }

})();
