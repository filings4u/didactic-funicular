/* ============================================================
   screenings4u — RANDOM PROGRAM MANAGEMENT
   ============================================================ */

(function () {
  "use strict";


  /* ==========================================================
     STATE
     ========================================================== */

  let allPrograms = [];


  /* ==========================================================
     DOM READY
     ========================================================== */

  document.addEventListener(
    "DOMContentLoaded",
    async function () {

      try {

        await requireAdminSession();

        bindEvents();

        await loadRandomPrograms();

      } catch (error) {

        console.error(
          "random-programs.js initialization failed:",
          error
        );

        showInitializationError();

      }

    }
  );


  /* ==========================================================
     AUTHENTICATION
     ========================================================== */

  async function requireAdminSession() {

    if (
      window.S4UAuth &&
      typeof window.S4UAuth.requireSession === "function"
    ) {

      const session =
        await window.S4UAuth.requireSession(
          "admin-login.html"
        );

      if (!session) {

        throw new Error(
          "No authenticated admin session."
        );

      }

    }

  }


  /* ==========================================================
     EVENTS
     ========================================================== */

  function bindEvents() {

    const refreshButton =
      document.getElementById(
        "refreshProgramsBtn"
      );


    const programTypeFilter =
      document.getElementById(
        "programTypeFilter"
      );


    const poolTypeFilter =
      document.getElementById(
        "poolTypeFilter"
      );


    if (refreshButton) {

      refreshButton.addEventListener(
        "click",
        async function () {

          await loadRandomPrograms();

        }
      );

    }


    if (programTypeFilter) {

      programTypeFilter.addEventListener(
        "change",
        renderFilteredPrograms
      );

    }


    if (poolTypeFilter) {

      poolTypeFilter.addEventListener(
        "change",
        renderFilteredPrograms
      );

    }

  }


  /* ==========================================================
     LOAD PROGRAMS
     ========================================================== */

  async function loadRandomPrograms() {

    setLoadingState(true);


    const supabase =
      getSupabaseClient();


    if (!supabase) {

      throw new Error(
        "Supabase client is not available."
      );

    }


    /*
     * Load all programs.
     *
     * Employer and employee counts are calculated
     * separately to avoid relying on nested Supabase
     * aggregates that may not be enabled.
     */

    const programResult =
      await supabase
        .from("dot_random_programs")
        .select(`
          id,
          name,
          program_year,
          drug_rate,
          alcohol_rate,
          status,
          dot_agency,
          program_type,
          pool_type,
          dedicated_employer_id
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (programResult.error) {

      throw programResult.error;

    }


    const programs =
      programResult.data || [];


    const enrichedPrograms =
      await Promise.all(

        programs.map(

          async function (program) {

            const counts =
              await loadProgramCounts(
                supabase,
                program
              );


            return {

              ...program,

              employer_count:
                counts.employerCount,

              eligible_employee_count:
                counts.eligibleEmployeeCount

            };

          }

        )

      );


    allPrograms =
      enrichedPrograms;


    updateKPIs();

    renderFilteredPrograms();

    setLoadingState(false);

  }


  /* ==========================================================
     LOAD PROGRAM COUNTS
     ========================================================== */

  async function loadProgramCounts(
    supabase,
    program
  ) {

    let employerCount = 0;

    let eligibleEmployeeCount = 0;


    /*
     * ----------------------------------------------------------
     * CONSORTIUM PROGRAM
     *
     * Count active enrolled employers and their employees.
     * ----------------------------------------------------------
     */

    if (
      program.pool_type === "CONSORTIUM"
    ) {

      const employerResult =
        await supabase
          .from("dot_random_program_employers")
          .select(
            "employer_id",
            {
              count: "exact"
            }
          )
          .eq(
            "program_id",
            program.id
          )
          .eq(
            "status",
            "active"
          );


      if (employerResult.error) {

        console.error(
          "Unable to count employers:",
          employerResult.error
        );

      } else {

        employerCount =
          employerResult.count || 0;


        const employerIds =
          (
            employerResult.data || []
          ).map(

            function (row) {

              return row.employer_id;

            }

          );


        if (
          employerIds.length > 0
        ) {

          eligibleEmployeeCount =
            await countEligibleEmployees(
              supabase,
              employerIds,
              program
            );

        }

      }

    }


    /*
     * ----------------------------------------------------------
     * DEDICATED PROGRAM
     *
     * The dedicated employer is stored directly
     * on the program record.
     * ----------------------------------------------------------
     */

    if (
      program.pool_type === "DEDICATED" &&
      program.dedicated_employer_id
    ) {

      employerCount = 1;


      eligibleEmployeeCount =
        await countEligibleEmployees(
          supabase,
          [
            program.dedicated_employer_id
          ],
          program
        );

    }


    return {

      employerCount:
        employerCount,

      eligibleEmployeeCount:
        eligibleEmployeeCount

    };

  }


  /* ==========================================================
     COUNT ELIGIBLE EMPLOYEES
     ========================================================== */

  async function countEligibleEmployees(
    supabase,
    employerIds,
    program
  ) {

    let query =
      supabase
        .from("employer_employees")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .in(
          "employer_id",
          employerIds
        )
        .eq(
          "employment_status",
          "active"
        );


    /*
     * DOT programs only include DOT-regulated
     * employees in the eligible pool.
     */

    if (
      program.program_type === "DOT"
    ) {

      query =
        query.eq(
          "is_dot_regulated",
          true
        );

    }


    const result =
      await query;


    if (result.error) {

      console.error(
        "Unable to count eligible employees:",
        result.error
      );

      return 0;

    }


    return result.count || 0;

  }


  /* ==========================================================
     KPI UPDATES
     ========================================================== */

  function updateKPIs() {

    const totalPrograms =
      allPrograms.length;


    const activePrograms =
      allPrograms.filter(

        function (program) {

          return (
            program.status === "active"
          );

        }

      ).length;


    const consortiumPrograms =
      allPrograms.filter(

        function (program) {

          return (
            program.pool_type ===
            "CONSORTIUM"
          );

        }

      ).length;


    const dedicatedPrograms =
      allPrograms.filter(

        function (program) {

          return (
            program.pool_type ===
            "DEDICATED"
          );

        }

      ).length;


    const eligibleEmployees =
      allPrograms.reduce(

        function (
          total,
          program
        ) {

          return (
            total +
            (
              Number(
                program.eligible_employee_count
              ) || 0
            )
          );

        },

        0

      );


    setElementText(
      "totalProgramsCount",
      formatNumber(totalPrograms)
    );


    setElementText(
      "activeProgramsCount",
      formatNumber(activePrograms)
    );


    setElementText(
      "consortiumProgramsCount",
      formatNumber(consortiumPrograms)
    );


    setElementText(
      "dedicatedProgramsCount",
      formatNumber(dedicatedPrograms)
    );


    setElementText(
      "eligibleEmployeesCount",
      formatNumber(eligibleEmployees)
    );

  }


  /* ==========================================================
     FILTER PROGRAMS
     ========================================================== */

  function renderFilteredPrograms() {

    const programType =
      getElementValue(
        "programTypeFilter"
      );


    const poolType =
      getElementValue(
        "poolTypeFilter"
      );


    const filteredPrograms =
      allPrograms.filter(

        function (program) {

          const matchesProgramType =
            !programType ||
            program.program_type ===
              programType;


          const matchesPoolType =
            !poolType ||
            program.pool_type ===
              poolType;


          return (
            matchesProgramType &&
            matchesPoolType
          );

        }

      );


    renderPrograms(
      filteredPrograms
    );

  }


  /* ==========================================================
     RENDER PROGRAM TABLE
     ========================================================== */

  function renderPrograms(
    programs
  ) {

    const tableBody =
      document.getElementById(
        "randomProgramsTableBody"
      );


    if (!tableBody) {

      return;

    }


    if (
      programs.length === 0
    ) {

      tableBody.innerHTML = `
        <tr>
          <td
            colspan="10"
            class="s4u-table-empty">
            No random programs found.
          </td>
        </tr>
      `;

      return;

    }


    tableBody.innerHTML =
      programs.map(

        function (program) {

          return buildProgramRow(
            program
          );

        }

      ).join("");

  }


  /* ==========================================================
     BUILD PROGRAM ROW
     ========================================================== */

  function buildProgramRow(
    program
  ) {

    const typeLabel =
      program.program_type === "DOT"
        ? "DOT"
        : "NON-DOT";


    const agencyLabel =
      program.program_type === "DOT"
        ? (
            program.dot_agency ||
            "—"
          )
        : "NON-DOT";


    const poolLabel =
      program.pool_type === "DEDICATED"
        ? "Dedicated"
        : "Consortium";


    const drugRate =
      formatRate(
        program.drug_rate
      );


    const alcoholRate =
      formatRate(
        program.alcohol_rate
      );


    const statusClass =
      getStatusClass(
        program.status
      );


    return `
      <tr>

        <td>

          <strong>
            ${escapeHtml(program.name)}
          </strong>

        </td>


        <td>

          ${escapeHtml(
            String(
              program.program_year || "—"
            )
          )}

        </td>


        <td>

          <span class="s4u-status ${getProgramTypeClass(program.program_type)}">
            ${escapeHtml(typeLabel)}
          </span>

        </td>


        <td>

          ${escapeHtml(
            agencyLabel
          )}

        </td>


        <td>

          ${escapeHtml(
            poolLabel
          )}

        </td>


        <td>

          <div>
            Drug:
            <strong>
              ${drugRate}
            </strong>
          </div>

          <div>
            Alcohol:
            <strong>
              ${alcoholRate}
            </strong>
          </div>

        </td>


        <td>

          ${formatNumber(
            program.employer_count
          )}

        </td>


        <td>

          ${formatNumber(
            program.eligible_employee_count
          )}

        </td>


        <td>

          <span class="s4u-status ${statusClass}">
            ${escapeHtml(
              formatStatus(
                program.status
              )
            )}
          </span>

        </td>


        <td>

          <div class="dot-table-actions">

            <a
              class="s4u-button s4u-button-small"
              href="admin-random-program-detail.html?id=${encodeURIComponent(program.id)}">

              View

            </a>

          </div>

        </td>

      </tr>
    `;

  }


  /* ==========================================================
     HELPERS
     ========================================================== */

  function getSupabaseClient() {

    if (
      window.supabaseClient
    ) {

      return window.supabaseClient;

    }


    if (
      window.supabase &&
      typeof window.supabase
        .from === "function"
    ) {

      return window.supabase;

    }


    return null;

  }


  function getElementValue(
    id
  ) {

    const element =
      document.getElementById(id);


    if (!element) {

      return "";

    }


    return element.value;

  }


  function setElementText(
    id,
    value
  ) {

    const element =
      document.getElementById(id);


    if (element) {

      element.textContent =
        value;

    }

  }


  function formatNumber(
    value
  ) {

    return new Intl.NumberFormat(
      "en-US"
    ).format(

      Number(value) || 0

    );

  }


  function formatRate(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return "—";

    }


    return (
      Number(value) + "%"
    );

  }


  function formatStatus(
    status
  ) {

    if (!status) {

      return "Unknown";

    }


    return (
      status
        .replace(
          /_/g,
          " "
        )
        .replace(
          /\b\w/g,
          function (character) {

            return character.toUpperCase();

          }
        )
    );

  }


  function getStatusClass(
    status
  ) {

    const normalized =
      String(
        status || ""
      ).toLowerCase();


    if (
      normalized === "active"
    ) {

      return "s4u-status-success";

    }


    if (
      normalized === "inactive"
    ) {

      return "s4u-status-muted";

    }


    if (
      normalized === "pending"
    ) {

      return "s4u-status-warning";

    }


    return "s4u-status-muted";

  }


  function getProgramTypeClass(
    programType
  ) {

    if (
      programType === "DOT"
    ) {

      return "s4u-status-info";

    }


    return "s4u-status-muted";

  }


  function escapeHtml(
    value
  ) {

    return String(
      value ?? ""
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


  function setLoadingState(
    isLoading
  ) {

    const refreshButton =
      document.getElementById(
        "refreshProgramsBtn"
      );


    if (refreshButton) {

      refreshButton.disabled =
        isLoading;

    }


    if (
      isLoading
    ) {

      const tableBody =
        document.getElementById(
          "randomProgramsTableBody"
        );


      if (tableBody) {

        tableBody.innerHTML = `
          <tr>
            <td
              colspan="10"
              class="s4u-table-empty">
              Loading random programs…
            </td>
          </tr>
        `;

      }

    }

  }


  function showInitializationError() {

    const tableBody =
      document.getElementById(
        "randomProgramsTableBody"
      );


    if (!tableBody) {

      return;

    }


    tableBody.innerHTML = `
      <tr>
        <td
          colspan="10"
          class="s4u-table-empty">
          Unable to load random programs.
          Please refresh the page.
        </td>
      </tr>
    `;

  }


})();