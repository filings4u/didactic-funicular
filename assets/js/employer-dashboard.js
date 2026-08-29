/* ============================================================
   SCREENINGS4U — EMPLOYER DASHBOARD
   Ready for Supabase wiring.
   ============================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    await loadEmployerDashboard();
  }

  async function loadEmployerDashboard() {
    /*
      FINAL SUPABASE WIRING PLAN

      1. Get authenticated user from Supabase Auth.
      2. Resolve the user's employer organization.
      3. Load employer-scoped data only.

      Primary tables already identified:
      - employer_profiles
      - employer_members
      - employer_employees
      - orders
      - invoices
      - lms_enrollments
      - lms_courses
      - dot_random_programs
      - notifications

      IMPORTANT:
      We will inspect exact columns and relationships before writing
      production queries. Employer RLS must prevent cross-company access.
    */

    renderEmptyDashboard();
  }

  function renderEmptyDashboard() {
    setText("employer-welcome-name", "Welcome back");

    setText("stat-total-employees", "—");
    setText("stat-active-employees", "Employee records will load here");
    setText("stat-training-progress", "—");
    setText("stat-active-programs", "—");
    setText("stat-open-orders", "—");

    setText("training-completion-rate", "—");
    setText("training-assigned-count", "—");
    setText("training-completed-count", "—");
    setText("training-attention-count", "—");
  }

  /*
    After schema verification, dashboard queries will be separated into
    focused functions such as:

    loadEmployerProfile()
    loadEmployeeMetrics()
    loadTrainingMetrics()
    loadProgramMetrics()
    loadOrderMetrics()
    loadRecentActivity()
    loadOpenItems()

    This prevents one failed query from breaking the entire dashboard.
  */

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }
})();
