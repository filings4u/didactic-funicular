/* ============================================================
   SCREENINGS4U — EMPLOYER TRAINING MANAGEMENT
   employer-training-management.js

   Live database tables:
   - employer_profiles
   - employer_members
   - employer_employees
   - lms_courses
   - lms_enrollments
   - lms_lesson_progress
   - lms_certificates
   - orders / order_items (purchased course access)
   - training credit balance storage (to be finalized)

   IMPORTANT:
   Training credits still need a final database implementation.
   The UI is ready, but no credit balance is fabricated or written.
   ============================================================ */

(function () {
  "use strict";

  const state = {
    assignments: [],
    employees: [],
    courses: [],
    trainingCredits: null
  };

  document.addEventListener("DOMContentLoaded", initializeTrainingManagement);

  function initializeTrainingManagement() {
    bindControls();
    loadTrainingManagement();
  }

  function bindControls() {
    const search = document.getElementById("training-search");
    const filter = document.getElementById("training-status-filter");

    if (search) search.addEventListener("input", renderAssignments);
    if (filter) filter.addEventListener("change", renderAssignments);

    bindClick("assign-training-btn", openAssignmentModal);
    bindClick("empty-assign-training-btn", openAssignmentModal);

    bindClick("browse-courses-btn", openTrainingCatalog);
    bindClick("purchase-training-btn", openTrainingCatalog);
    bindClick("purchase-credits-btn", openTrainingCatalog);

    document.querySelectorAll("[data-close-training-modal]").forEach(function (element) {
      element.addEventListener("click", closeAssignmentModal);
    });

    const form = document.getElementById("assign-training-form");
    if (form) form.addEventListener("submit", submitAssignment);
  }

  async function loadTrainingManagement() {
    /*
      FINAL SUPABASE FLOW

      1. Get authenticated user/session.
      2. Resolve employer organization.
      3. Load employer_employees for that employer.
      4. Load available course access:
         - directly purchased courses
         - purchased training credits
         - future package rules
      5. Load lms_enrollments associated with employees.
      6. Calculate progress from lms_lesson_progress.
      7. Enforce employer ownership and permissions with RLS.

      Do not trust a browser-provided employer_id.
    */

    state.assignments = [];
    state.employees = [];
    state.courses = [];
    state.trainingCredits = null;

    updateSummary();
    populateAssignmentSelects();
    renderAssignments();
  }

  function getFilteredAssignments() {
    const search = getValue("training-search").toLowerCase();
    const status = getValue("training-status-filter") || "all";

    return state.assignments.filter(function (assignment) {
      const employee = String(assignment.employee_name || "").toLowerCase();
      const email = String(assignment.employee_email || "").toLowerCase();
      const course = String(assignment.course_name || "").toLowerCase();
      const assignmentStatus = normalizeStatus(assignment.status);

      const matchesSearch =
        !search ||
        employee.includes(search) ||
        email.includes(search) ||
        course.includes(search);

      const matchesStatus =
        status === "all" ||
        assignmentStatus === status;

      return matchesSearch && matchesStatus;
    });
  }

  function renderAssignments() {
    const tbody = document.getElementById("training-table-body");
    if (!tbody) return;

    const assignments = getFilteredAssignments();

    if (!assignments.length) {
      const noAssignments = state.assignments.length === 0;

      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="training-empty-state">
              <div class="training-empty-icon">◫</div>
              <h3>${noAssignments ? "No training assignments yet" : "No assignments match your filters"}</h3>
              <p>${
                noAssignments
                  ? "When courses are assigned to employees, their progress will appear here."
                  : "Try changing your search or training status."
              }</p>
              ${
                noAssignments
                  ? '<button type="button" class="training-secondary-btn" id="empty-assign-training-btn">Assign Training</button>'
                  : ""
              }
            </div>
          </td>
        </tr>
      `;

      bindClick("empty-assign-training-btn", openAssignmentModal);
      return;
    }

    tbody.innerHTML = assignments.map(function (assignment) {
      const progress = Math.max(0, Math.min(100, Number(assignment.progress || 0)));
      const status = normalizeStatus(assignment.status);

      return `
        <tr>
          <td>
            <span class="training-employee-name">${escapeHtml(assignment.employee_name || "Employee")}</span>
            <span class="training-employee-email">${escapeHtml(assignment.employee_email || "")}</span>
          </td>
          <td class="training-course-name">${escapeHtml(assignment.course_name || "Course")}</td>
          <td>${escapeHtml(formatDate(assignment.assigned_at || assignment.created_at))}</td>
          <td>
            <div class="training-progress-wrap">
              <div class="training-progress-bar">
                <span style="width:${progress}%"></span>
              </div>
              <span class="training-progress-value">${progress}%</span>
            </div>
          </td>
          <td>
            <span class="training-status training-status-${escapeAttribute(status)}">
              ${escapeHtml(formatStatus(status))}
            </span>
          </td>
          <td>
            <button type="button" class="training-view-btn" data-enrollment-id="${escapeAttribute(assignment.id)}">
              View
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  function updateSummary() {
    const total = state.assignments.length;

    const active = state.assignments.filter(function (item) {
      const status = normalizeStatus(item.status);
      return status === "not_started" || status === "in_progress";
    }).length;

    const completed = state.assignments.filter(function (item) {
      return normalizeStatus(item.status) === "completed";
    }).length;

    const completionRate = total
      ? Math.round((completed / total) * 100) + "%"
      : "—";

    setText("stat-training-credits",
      state.trainingCredits === null ? "—" : state.trainingCredits
    );

    setText("stat-active-enrollments", active || "—");
    setText("stat-completed-training", completed || "—");
    setText("stat-completion-rate", completionRate);
  }

  function populateAssignmentSelects() {
    const employeeSelect = document.getElementById("training-employee");
    const courseSelect = document.getElementById("training-course");

    if (employeeSelect) {
      employeeSelect.innerHTML =
        '<option value="">Select an employee</option>' +
        state.employees.map(function (employee) {
          return `<option value="${escapeAttribute(employee.id)}">${escapeHtml(employee.name || employee.email || "Employee")}</option>`;
        }).join("");
    }

    if (courseSelect) {
      courseSelect.innerHTML =
        '<option value="">Select a course</option>' +
        state.courses.map(function (course) {
          return `<option value="${escapeAttribute(course.id)}">${escapeHtml(course.title || "Course")}</option>`;
        }).join("");
    }
  }

  function openAssignmentModal() {
    const modal = document.getElementById("assign-training-modal");
    if (modal) modal.hidden = false;
  }

  function closeAssignmentModal() {
    const modal = document.getElementById("assign-training-modal");
    if (modal) modal.hidden = true;
  }

  async function submitAssignment(event) {
    event.preventDefault();

    const employeeId = getValue("training-employee");
    const courseId = getValue("training-course");

    if (!employeeId || !courseId) return;

    /*
      FINAL ASSIGNMENT TRANSACTION MUST:

      - Validate employer permission.
      - Verify employee belongs to employer.
      - Verify course is available to employer.
      - Verify direct course seat OR available credit.
      - Consume exactly one credit only when applicable.
      - Create lms_enrollments record.
      - Log the assignment.
      - Perform credit consumption atomically server-side.

      This should be implemented with an RPC/function or another
      server-side transaction pattern, not multiple unsafe client writes.
    */
  }

  function openTrainingCatalog() {
    /*
      The final destination can be:
      - employer-catalog.html filtered to training, OR
      - training.screenings4u.com catalog

      Keep this centralized once the final catalog flow is wired.
    */
    window.location.href = "employer-catalog.html";
  }

  function normalizeStatus(value) {
    const status = String(value || "not_started")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");

    if (["not_started", "in_progress", "completed"].includes(status)) {
      return status;
    }

    return "not_started";
  }

  function formatStatus(status) {
    return {
      not_started: "Not Started",
      in_progress: "In Progress",
      completed: "Completed"
    }[status] || "Not Started";
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function bindClick(id, handler) {
    const element = document.getElementById(id);
    if (element) element.addEventListener("click", handler);
  }

  function getValue(id) {
    const element = document.getElementById(id);
    return element ? String(element.value || "").trim() : "";
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value == null ? "" : value;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

})();
