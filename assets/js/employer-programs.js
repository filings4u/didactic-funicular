/* ============================================================
   SCREENINGS4U — EMPLOYER PROGRAMS
   employer-programs.js

   Designed around the existing DOT program tables:
   - dot_random_programs
   - dot_random_program_employers
   - dot_random_program_year_stats
   - dot_random_selections
   - dot_random_selection_employees

   Exact column verification is required before final Supabase
   queries and inserts are connected.
   ============================================================ */

(function () {
  "use strict";

  const state = {
    programs: [],
    filteredPrograms: []
  };

  document.addEventListener("DOMContentLoaded", initializePrograms);

  function initializePrograms() {
    bindControls();
    loadPrograms();
  }

  function bindControls() {
    bindClick("create-program-btn", openProgramModal);
    bindClick("empty-create-program-btn", openProgramModal);
    bindClick("program-modal-close", closeProgramModal);
    bindClick("program-modal-cancel", closeProgramModal);
    bindClick("program-modal-backdrop", closeProgramModal);

    const search = document.getElementById("program-search");
    const statusFilter = document.getElementById("program-status-filter");
    const form = document.getElementById("program-form");

    if (search) {
      search.addEventListener("input", applyFilters);
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", applyFilters);
    }

    if (form) {
      form.addEventListener("submit", saveProgram);
    }
  }

  async function loadPrograms() {
    /*
      SUPABASE WIRING PLAN

      1. Resolve authenticated user.
      2. Resolve the employer organization from employer_profiles.
      3. Query only programs associated with that employer.
      4. Query program-year statistics where appropriate.
      5. RLS must independently enforce employer ownership.

      IMPORTANT:
      Do not trust an employer ID supplied by the browser.
    */

    state.programs = [];

    updateMetrics();
    applyFilters();
  }

  function applyFilters() {
    const term = getValue("program-search").toLowerCase();
    const status = getValue("program-status-filter") || "all";

    state.filteredPrograms = state.programs.filter(function (program) {
      const name = String(program.name || "").toLowerCase();
      const type = String(program.type || "").toLowerCase();
      const programStatus = String(program.status || "active").toLowerCase();

      const matchesSearch =
        !term ||
        name.includes(term) ||
        type.includes(term);

      const matchesStatus =
        status === "all" ||
        programStatus === status;

      return matchesSearch && matchesStatus;
    });

    renderPrograms();
  }

  function renderPrograms() {
    const grid = document.getElementById("program-grid");

    if (!grid) return;

    if (state.filteredPrograms.length === 0) {
      grid.innerHTML = `
        <div class="program-empty-state">
          <div class="program-empty-icon">▦</div>
          <h3>${
            state.programs.length === 0
              ? "Your programs will appear here"
              : "No programs match your filters"
          }</h3>
          <p>${
            state.programs.length === 0
              ? "Connect this page to your employer program data to begin managing workplace compliance programs."
              : "Try changing your search or status filter."
          }</p>
          ${
            state.programs.length === 0
              ? '<button type="button" class="programs-secondary-btn" id="empty-create-program-btn">Create Program</button>'
              : ""
          }
        </div>
      `;

      bindClick("empty-create-program-btn", openProgramModal);
      return;
    }

    grid.innerHTML = state.filteredPrograms.map(function (program) {
      const status = String(program.status || "active").toLowerCase();

      return `
        <article class="program-card">
          <div class="program-card-top">
            <div>
              <span class="program-card-type">
                ${escapeHtml(formatProgramType(program.type))}
              </span>
              <h3>${escapeHtml(program.name || "Untitled Program")}</h3>
            </div>

            <span class="program-status ${
              status === "active"
                ? "program-status-active"
                : "program-status-inactive"
            }">
              ${escapeHtml(capitalize(status))}
            </span>
          </div>

          <div class="program-card-stats">
            <div>
              <span>Employees</span>
              <strong>${Number(program.employee_count || 0)}</strong>
            </div>
            <div>
              <span>Selections</span>
              <strong>${Number(program.selection_count || 0)}</strong>
            </div>
          </div>

          <div class="program-card-footer">
            <span>${escapeHtml(program.year ? "Program year " + program.year : "Program")}</span>
            <button
              type="button"
              class="program-card-action"
              data-program-id="${escapeAttribute(program.id)}"
            >
              Manage
            </button>
          </div>
        </article>
      `;
    }).join("");

    grid.querySelectorAll("[data-program-id]").forEach(function (button) {
      button.addEventListener("click", function () {
        openProgramModal(button.dataset.programId);
      });
    });
  }

  function openProgramModal(programId) {
    const modal = document.getElementById("program-modal");
    const form = document.getElementById("program-form");
    const title = document.getElementById("program-modal-title");

    if (!modal || !form) return;

    form.reset();
    setValue("program-id", "");

    if (programId) {
      const program = state.programs.find(function (item) {
        return String(item.id) === String(programId);
      });

      if (program) {
        if (title) title.textContent = "Edit Program";

        setValue("program-id", program.id || "");
        setValue("program-name", program.name || "");
        setValue("program-type", program.type || "");
        setValue("program-status", program.status || "active");
        setValue("program-year", program.year || "");
        setValue("program-notes", program.notes || "");
      }
    } else if (title) {
      title.textContent = "Create Program";
      setValue("program-year", new Date().getFullYear());
    }

    modal.hidden = false;
  }

  function closeProgramModal() {
    const modal = document.getElementById("program-modal");
    if (modal) modal.hidden = true;
  }

  async function saveProgram(event) {
    event.preventDefault();

    const programData = {
      id: getValue("program-id") || null,
      name: getValue("program-name"),
      type: getValue("program-type"),
      status: getValue("program-status") || "active",
      year: getValue("program-year") || null,
      notes: getValue("program-notes")
    };

    /*
      FINAL DATABASE WIRING

      Program creation must be mapped to the exact existing schema.

      For the DOT Random Program flow, the relationship likely
      involves dot_random_programs plus
      dot_random_program_employers.

      We will verify:
      - exact columns
      - whether programs are globally defined or employer-owned
      - how the employer relationship is stored
      - current RLS policies

      before inserting anything.
    */

    console.log("Program ready to save:", programData);

    window.alert(
      "Program saving will be connected to Supabase during the database wiring phase."
    );
  }

  function updateMetrics() {
    const active = state.programs.filter(function (program) {
      return String(program.status || "active").toLowerCase() === "active";
    }).length;

    const employees = state.programs.reduce(function (total, program) {
      return total + Number(program.employee_count || 0);
    }, 0);

    const selections = state.programs.reduce(function (total, program) {
      return total + Number(program.selection_count || 0);
    }, 0);

    const attention = state.programs.filter(function (program) {
      return Boolean(program.needs_attention);
    }).length;

    setText("stat-active-programs", active || "—");
    setText("stat-enrolled-employees", employees || "—");
    setText("stat-year-selections", selections || "—");
    setText("stat-attention-programs", attention || "—");
  }

  function formatProgramType(type) {
    const types = {
      dot_random: "DOT RANDOM PROGRAM",
      workplace_testing: "WORKPLACE TESTING",
      custom: "CUSTOM PROGRAM"
    };

    return types[type] || String(type || "PROGRAM").toUpperCase();
  }

  function capitalize(value) {
    const text = String(value || "");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function bindClick(id, handler) {
    const element = document.getElementById(id);
    if (element) element.addEventListener("click", handler);
  }

  function getValue(id) {
    const element = document.getElementById(id);
    return element ? String(element.value || "").trim() : "";
  }

  function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value == null ? "" : value;
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
