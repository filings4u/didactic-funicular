/* ============================================================
   SCREENINGS4U — ADMIN LMS COURSE PARTICIPANTS
   ============================================================ */

(function () {
  "use strict";

  const TABLES = Object.freeze({
    courses: "lms_courses",
    enrollments: "lms_enrollments",
    profiles: "user_profiles",
    certificates: "lms_certificates",
    products: "products"
  });

  const state = {
    courseId: "",
    course: null,
    enrollments: [],
    profiles: [],
    profileMap: new Map(),
    certificates: [],
    certificateMap: new Map(),
    products: [],
    selectedEnrollmentId: "",
    filters: {
      search: "",
      status: "",
      progress: ""
    }
  };

  const $ = (id) => document.getElementById(id);

  document.addEventListener(
    "DOMContentLoaded",
    initializeParticipants
  );


  /* ============================================================
     INITIALIZE
     ============================================================ */

  async function initializeParticipants() {
    try {
      bindStaticUi();

      const params =
        new URLSearchParams(
          window.location.search
        );

      state.courseId =
        params.get("course") ||
        params.get("course_id") ||
        params.get("id") ||
        "";

      if (!state.courseId) {
        throw new Error(
          "Open Participants from a course record so the course ID is available."
        );
      }

      applyCourseLinks();

      await loadPageData();

      renderAll();

      if (
        new URLSearchParams(
          window.location.search
        ).get("invite") === "1"
      ) {
        openInviteModal();
      }

    } catch (error) {
      console.error(
        "[Course Participants]",
        error
      );

      showToast(
        error?.message ||
        "Unable to load course participants.",
        "error"
      );

      setLoading(false);
    }
  }


  /* ============================================================
     DATABASE
     ============================================================ */

  function db() {
    const candidates = [
      window.supabaseClient,
      window.supabaseAdmin,
      window.supabase
    ];

    const client =
      candidates.find(
        (value) =>
          value &&
          typeof value.from === "function"
      );

    if (!client) {
      throw new Error(
        "Supabase client is unavailable."
      );
    }

    return client;
  }


  async function loadPageData() {
    setLoading(true);

    const [
      courseResult,
      enrollmentResult,
      profileResult,
      certificateResult,
      productResult
    ] =
      await Promise.all([
        db()
          .from(TABLES.courses)
          .select("*")
          .eq("id", state.courseId)
          .single(),

        db()
          .from(TABLES.enrollments)
          .select("*")
          .eq("course_id", state.courseId)
          .order(
            "enrolled_at",
            { ascending: false }
          ),

        db()
          .from(TABLES.profiles)
          .select(
            "id,first_name,last_name,display_name,email,avatar_url,is_active"
          )
          .order(
            "last_name",
            { ascending: true }
          ),

        db()
          .from(TABLES.certificates)
          .select(
            "id,enrollment_id,certificate_number,issued_at,certificate_url,revoked_at"
          ),

        db()
          .from(TABLES.products)
          .select("id,name,price,is_active,training_course_id")
          .eq("training_course_id", state.courseId)
      ]);


    if (courseResult.error) {
      throw courseResult.error;
    }

    if (enrollmentResult.error) {
      throw enrollmentResult.error;
    }

    if (profileResult.error) {
      throw profileResult.error;
    }


    state.course =
      courseResult.data;

    state.enrollments =
      enrollmentResult.data || [];

    state.profiles =
      profileResult.data || [];


    state.profileMap =
      new Map(
        state.profiles.map(
          (profile) => [
            profile.id,
            profile
          ]
        )
      );


    if (certificateResult.error) {
      console.warn(
        "[Course Participants] Certificate data unavailable:",
        certificateResult.error
      );

      state.certificates = [];
    } else {
      state.certificates =
        certificateResult.data || [];
    }


    state.certificateMap =
      new Map(
        state.certificates.map(
          (certificate) => [
            certificate.enrollment_id,
            certificate
          ]
        )
      );


    state.products =
      productResult.error
        ? []
        : (productResult.data || []);


    setLoading(false);
  }


  /* ============================================================
     RENDER
     ============================================================ */

  function renderAll() {
    renderHeader();
    renderTable();
    populateInviteUsers();
  }


  function renderHeader() {
    const course =
      state.course || {};

    const title =
      course.title ||
      "Course";

    setText(
      "participantsCourseTitle",
      title
    );

    setText(
      "participantsBreadcrumbCourse",
      title
    );


    const status =
      normalizeStatus(
        course.status
      );

    setText(
      "participantsCourseStatus",
      titleCase(status)
    );

    const statusBadge =
      $("participantsCourseStatus");

    if (statusBadge) {
      statusBadge.classList.toggle(
        "active",
        status === "published"
      );
    }


    setText(
      "participantsAccessStatus",
      status === "archived"
        ? "Archived"
        : "Active"
    );
  }


  function renderTable() {
    const rows =
      getFilteredRows();

    setText(
      "participantCountHeading",
      rows.length
    );

    const loading =
      $("participantsLoading");

    const empty =
      $("participantsEmpty");

    const wrap =
      $("participantsTableWrap");

    if (loading) {
      loading.hidden = true;
    }


    if (!rows.length) {
      if (empty) {
        empty.hidden = false;
      }

      if (wrap) {
        wrap.hidden = true;
      }

      return;
    }


    if (empty) {
      empty.hidden = true;
    }

    if (wrap) {
      wrap.hidden = false;
    }


    const body =
      $("participantsTableBody");

    if (!body) {
      return;
    }


    body.innerHTML =
      rows
        .map(
          participantRowTemplate
        )
        .join("");


    bindRowActions();
  }


  function participantRowTemplate(enrollment) {
    const profile =
      state.profileMap.get(
        enrollment.user_id
      ) || {};

    const certificate =
      state.certificateMap.get(
        enrollment.id
      );

    const name =
      getProfileName(profile);

    const progress =
      clampProgress(
        enrollment.progress_percent
      );

    const performance =
      getPerformanceLabel(
        progress
      );

    const status =
      normalizeStatus(
        enrollment.status
      );

    const certificateText =
      getCertificateText(
        certificate,
        enrollment
      );

    const pricing =
      getPricingLabel();


    return `
      <tr>
        <td>
          <div class="participant-name-cell">

            <span
              class="participant-avatar"
              title="${esc(name)}"
            >
              ${esc(getInitials(name))}
            </span>

            <div class="participant-name-copy">
              <strong>${esc(name)}</strong>

              <div class="participant-name-badges">
                <span class="participant-mini-badge progress">
                  ${esc(getShortStatusLabel(status))}
                </span>

                <span class="participant-mini-badge plan">
                  ${esc(pricing.short)}
                </span>
              </div>
            </div>

          </div>
        </td>


        <td>
          <div class="participant-progress">
            <strong>${progress}%</strong>
            <small class="${performance.className}">
              ${esc(performance.label)}
            </small>
          </div>
        </td>


        <td>
          ${esc(
            formatDate(
              enrollment.last_activity_at ||
              enrollment.started_at ||
              enrollment.enrolled_at
            )
          )}
        </td>


        <td>
          ${esc(
            formatDate(
              enrollment.enrolled_at ||
              enrollment.created_at
            )
          )}
        </td>


        <td>
          <span class="participant-pricing">
            ${esc(pricing.label)}
            <span
              class="participant-pricing-info"
              title="${esc(pricing.title)}"
            >i</span>
          </span>
        </td>


        <td>
          <span class="participant-certificate ${certificate ? "issued" : ""}">
            ${esc(certificateText)}
          </span>
        </td>


        <td>
          <button
            type="button"
            class="participant-row-action"
            data-participant-menu="${esc(enrollment.id)}"
            aria-label="Participant actions"
          >
            •••
          </button>
        </td>
      </tr>
    `;
  }


  function getPricingLabel() {
    const product =
      state.products.find(
        (item) =>
          item.is_active !== false
      ) ||
      state.products[0];

    if (!product) {
      return {
        label: "Pricing Plan",
        short: "Plan",
        title:
          "No linked pricing product was found for this course."
      };
    }

    const price =
      Number(product.price);

    const priceText =
      Number.isFinite(price)
        ? new Intl.NumberFormat(
            undefined,
            {
              style: "currency",
              currency: "USD"
            }
          ).format(price)
        : "Pricing Plan";

    return {
      label: "Pricing Plan",
      short: "Paid",
      title:
        (product.name || "Linked training product") +
        " · " +
        priceText
    };
  }


  function getShortStatusLabel(status) {
    if (
      status === "active" ||
      status === "in_progress" ||
      status === "in-progress"
    ) {
      return "In progress";
    }

    if (status === "completed") {
      return "Completed";
    }

    if (status === "expired") {
      return "Expired";
    }

    return titleCase(status);
  }

  /* ============================================================
     FILTERING
     ============================================================ */

  function getFilteredRows() {
    const query =
      state.filters.search
        .trim()
        .toLowerCase();

    return state.enrollments.filter(
      function (enrollment) {
        const enrollmentStatus =
          normalizeStatus(
            enrollment.status
          );

        if (
          !state.filters.status &&
          enrollmentStatus !== "active"
        ) {
          return false;
        }
        const profile =
          state.profileMap.get(
            enrollment.user_id
          ) || {};

        const name =
          getProfileName(profile);

        const email =
          String(
            profile.email || ""
          );

        const status =
          enrollmentStatus;

        const progress =
          clampProgress(
            enrollment.progress_percent
          );


        if (
          query &&
          !(
            name
              .toLowerCase()
              .includes(query) ||
            email
              .toLowerCase()
              .includes(query)
          )
        ) {
          return false;
        }


        if (
          state.filters.status &&
          status !==
            state.filters.status
        ) {
          return false;
        }


        if (
          state.filters.progress ===
            "not-started" &&
          progress !== 0
        ) {
          return false;
        }


        if (
          state.filters.progress ===
            "in-progress" &&
          !(
            progress > 0 &&
            progress < 100
          )
        ) {
          return false;
        }


        if (
          state.filters.progress ===
            "completed" &&
          progress < 100 &&
          status !== "completed"
        ) {
          return false;
        }


        return true;
      }
    );
  }


  /* ============================================================
     INVITE / ENROLL
     ============================================================ */

  function populateInviteUsers() {
    const select =
      $("inviteParticipantUser");

    if (!select) {
      return;
    }


    const enrolledUserIds =
      new Set(
        state.enrollments.map(
          (row) =>
            row.user_id
        )
      );


    const available =
      state.profiles.filter(
        (profile) =>
          profile.is_active !== false &&
          !enrolledUserIds.has(
            profile.id
          )
      );


    select.innerHTML =
      '<option value="">Select an existing user</option>' +
      available
        .map(
          function (profile) {
            return `
              <option value="${esc(profile.id)}">
                ${esc(getProfileName(profile))}
                ${profile.email ? " — " + esc(profile.email) : ""}
              </option>
            `;
          }
        )
        .join("");
  }


  function openInviteModal() {
    const modal = $("inviteParticipantModal");
    if (modal) modal.hidden = false;
  }

  function closeInviteModal() {
    const modal = $("inviteParticipantModal");
    if (modal) modal.hidden = true;
  }

  function openAddParticipantModal() {
    closeInviteModal();
    $("inviteParticipantUser").value = "";
    $("inviteParticipantStatus").value = "active";
    renderSelectedUserPreview("");
    $("addParticipantModal").hidden = false;
  }

  function closeAddParticipantModal() {
    $("addParticipantModal").hidden = true;
  }

  function openEmailInviteModal() {
    closeInviteModal();
    $("participantInviteEmails").value = "";
    $("emailInviteModal").hidden = false;
  }

  function closeEmailInviteModal() {
    $("emailInviteModal").hidden = true;
  }

  async function copyInviteLink() {
    const url =
      new URL(
        "training-login.html",
        window.location.href
      );

    url.searchParams.set(
      "course",
      state.courseId
    );

    try {
      await navigator.clipboard.writeText(url.href);
      showToast("Course invite link copied.", "success");
    } catch (error) {
      window.prompt("Copy this invite link:", url.href);
    }
  }


  function renderSelectedUserPreview(userId) {
    const target =
      $("selectedUserPreview");

    if (!target) {
      return;
    }


    if (!userId) {
      target.textContent =
        "Select a user to view their account details.";

      return;
    }


    const profile =
      state.profileMap.get(
        userId
      );

    if (!profile) {
      target.textContent =
        "User profile not found.";

      return;
    }


    target.innerHTML = `
      <strong>${esc(getProfileName(profile))}</strong>
      <small>${esc(profile.email || "No email address")}</small>
    `;
  }


  async function saveParticipantEnrollment() {
    const userId =
      $("inviteParticipantUser")
        ?.value || "";

    const status =
      $("inviteParticipantStatus")
        ?.value || "active";


    if (!userId) {
      showToast(
        "Select a participant.",
        "error"
      );

      return;
    }


    const button =
      $("saveParticipantEnrollment");

    if (button) {
      button.disabled = true;
    }


    try {
      const result =
        await db()
          .from(TABLES.enrollments)
          .insert({
            user_id: userId,
            course_id: state.courseId,
            status: status,
            progress_percent:
              status === "completed"
                ? 100
                : 0
          })
          .select("*")
          .single();


      if (result.error) {
        throw result.error;
      }


      closeAddParticipantModal();

      await reloadParticipantData();

      showToast(
        "Participant added to the course.",
        "success"
      );

    } catch (error) {
      console.error(
        "[Course Participants] Add participant:",
        error
      );

      showToast(
        error?.message ||
        "Unable to add participant.",
        "error"
      );

    } finally {
      if (button) {
        button.disabled = false;
      }
    }
  }


  async function reloadParticipantData() {
    const [
      enrollmentResult,
      certificateResult,
      productResult
    ] =
      await Promise.all([
        db()
          .from(TABLES.enrollments)
          .select("*")
          .eq("course_id", state.courseId)
          .order(
            "enrolled_at",
            { ascending: false }
          ),

        db()
          .from(TABLES.certificates)
          .select(
            "id,enrollment_id,certificate_number,issued_at,certificate_url,revoked_at"
          ),

        db()
          .from(TABLES.products)
          .select("id,name,price,is_active,training_course_id")
          .eq("training_course_id", state.courseId)
      ]);


    if (enrollmentResult.error) {
      throw enrollmentResult.error;
    }


    state.enrollments =
      enrollmentResult.data || [];


    if (!certificateResult.error) {
      state.certificates =
        certificateResult.data || [];

      state.certificateMap =
        new Map(
          state.certificates.map(
            (certificate) => [
              certificate.enrollment_id,
              certificate
            ]
          )
        );
    }


    renderTable();
    populateInviteUsers();
  }


  /* ============================================================
     ROW ACTIONS
     ============================================================ */

  function bindRowActions() {
    document
      .querySelectorAll(
        "[data-participant-menu]"
      )
      .forEach(
        function (button) {
          button.addEventListener(
            "click",
            function (event) {
              event.stopPropagation();

              openRowMenu(
                button,
                button.dataset.participantMenu
              );
            }
          );
        }
      );
  }


  function openRowMenu(
    button,
    enrollmentId
  ) {
    const menu =
      $("participantRowMenu");

    if (!menu) {
      return;
    }

    state.selectedEnrollmentId =
      enrollmentId || "";

    const rect =
      button.getBoundingClientRect();

    menu.style.top =
      Math.min(
        window.innerHeight - 190,
        rect.bottom + 5
      ) + "px";

    menu.style.left =
      Math.max(
        10,
        rect.right - 180
      ) + "px";

    menu.hidden = false;
  }


  function closeRowMenu() {
    const menu =
      $("participantRowMenu");

    if (menu) {
      menu.hidden = true;
    }

    state.selectedEnrollmentId = "";
  }


  async function handleRowAction(action) {
    const enrollment =
      state.enrollments.find(
        (row) =>
          row.id ===
          state.selectedEnrollmentId
      );


    if (!enrollment) {
      closeRowMenu();
      return;
    }


    if (action === "view") {
      const url =
        "admin-student-detail.html" +
        "?user=" +
        encodeURIComponent(
          enrollment.user_id
        ) +
        "&course=" +
        encodeURIComponent(
          state.courseId
        );

      window.location.href =
        url;

      return;
    }


    if (action === "message") {
      closeRowMenu();

      showToast(
        "Participant messaging will connect to the Engagement workflow.",
        "success"
      );

      return;
    }

      await updateEnrollment(
        enrollment.id,
        {
          progress_percent: 100,
          status: "completed",
          completed_at:
            new Date().toISOString()
        },
        "Participant marked completed."
      );

      return;
    }


    if (action === "remove") {
      const confirmed =
        window.confirm(
          "Remove this participant from the course? This deletes the enrollment record."
        );

      if (!confirmed) {
        closeRowMenu();
        return;
      }

      try {
        const result =
          await db()
            .from(TABLES.enrollments)
            .delete()
            .eq(
              "id",
              enrollment.id
            );

        if (result.error) {
          throw result.error;
        }

        closeRowMenu();

        await reloadParticipantData();

        showToast(
          "Participant removed from the course.",
          "success"
        );

      } catch (error) {
        console.error(
          "[Course Participants] Remove:",
          error
        );

        showToast(
          error?.message ||
          "Unable to remove participant.",
          "error"
        );
      }
    }
  }


  async function updateEnrollment(
    enrollmentId,
    payload,
    successMessage
  ) {
    try {
      const result =
        await db()
          .from(TABLES.enrollments)
          .update(payload)
          .eq(
            "id",
            enrollmentId
          )
          .select("*")
          .single();

      if (result.error) {
        throw result.error;
      }

      closeRowMenu();

      await reloadParticipantData();

      showToast(
        successMessage,
        "success"
      );

    } catch (error) {
      console.error(
        "[Course Participants] Enrollment update:",
        error
      );

      showToast(
        error?.message ||
        "Unable to update enrollment.",
        "error"
      );
    }
  }


  /* ============================================================
     EXPORT
     ============================================================ */

  function exportParticipantsCsv() {
    const rows =
      getFilteredRows();

    if (!rows.length) {
      showToast(
        "There are no participants to export.",
        "error"
      );

      return;
    }


    const columns = [
      "Name",
      "Email",
      "Progress",
      "Status",
      "Last Activity",
      "Date Joined",
      "Completed At",
      "Certificate"
    ];


    const csvRows = [
      columns
    ];


    rows.forEach(
      function (enrollment) {
        const profile =
          state.profileMap.get(
            enrollment.user_id
          ) || {};

        const certificate =
          state.certificateMap.get(
            enrollment.id
          );

        csvRows.push([
          getProfileName(profile),
          profile.email || "",
          clampProgress(
            enrollment.progress_percent
          ) + "%",
          titleCase(
            normalizeStatus(
              enrollment.status
            )
          ),
          formatDate(
            enrollment.last_activity_at
          ),
          formatDate(
            enrollment.enrolled_at ||
            enrollment.created_at
          ),
          formatDate(
            enrollment.completed_at
          ),
          getCertificateText(
            certificate,
            enrollment
          )
        ]);
      }
    );


    const csv =
      csvRows
        .map(
          (row) =>
            row
              .map(csvCell)
              .join(",")
        )
        .join("\r\n");


    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      url;

    anchor.download =
      slugify(
        state.course?.title ||
        "course"
      ) +
      "-participants.csv";


    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      url
    );


    closeCourseMenu();

    showToast(
      "Participant export created.",
      "success"
    );
  }


  /* ============================================================
     STATIC UI
     ============================================================ */

  function bindStaticUi() {
    $("participantsMoreButton")
      ?.addEventListener(
        "click",
        function (event) {
          event.stopPropagation();

          const menu =
            $("participantsMoreMenu");

          const button =
            $("participantsMoreButton");

          if (!menu || !button) {
            return;
          }

          const opening =
            menu.hidden;

          menu.hidden =
            !opening;

          button.setAttribute(
            "aria-expanded",
            opening
              ? "true"
              : "false"
          );
        }
      );


    $("participantFilterButton")
      ?.addEventListener(
        "click",
        function (event) {
          event.stopPropagation();

          const menu =
            $("participantFilterMenu");

          const button =
            $("participantFilterButton");

          if (!menu || !button) {
            return;
          }

          const opening =
            menu.hidden;

          menu.hidden =
            !opening;

          button.setAttribute(
            "aria-expanded",
            opening
              ? "true"
              : "false"
          );
        }
      );


    $("participantFilterMenu")
      ?.addEventListener(
        "click",
        function (event) {
          event.stopPropagation();
        }
      );


    document.addEventListener(
      "click",
      function () {
        closeCourseMenu();
        closeFilterMenu();
        closeRowMenu();
      }
    );


    $("participantSearch")
      ?.addEventListener(
        "input",
        function () {
          state.filters.search =
            this.value || "";

          renderTable();
        }
      );


    $("participantStatusFilter")
      ?.addEventListener(
        "change",
        function () {
          state.filters.status =
            this.value || "";

          renderTable();
        }
      );


    $("participantProgressFilter")
      ?.addEventListener(
        "change",
        function () {
          state.filters.progress =
            this.value || "";

          renderTable();
        }
      );


    $("clearParticipantFilters")
      ?.addEventListener(
        "click",
        function () {
          state.filters = {
            search: "",
            status: "",
            progress: ""
          };

          $("participantSearch").value = "";
          $("participantStatusFilter").value = "";
          $("participantProgressFilter").value = "";

          renderTable();
        }
      );


    $("participantsExportQuickButton")
      ?.addEventListener(
        "click",
        exportParticipantsCsv
      );


    $("inviteParticipantsButton")
      ?.addEventListener(
        "click",
        openInviteModal
      );


    $("emptyInviteParticipantsButton")
      ?.addEventListener(
        "click",
        openInviteModal
      );


    $("addToProgramButton")
      ?.addEventListener(
        "click",
        openAddParticipantModal
      );

    $("inviteToProgramButton")
      ?.addEventListener(
        "click",
        openEmailInviteModal
      );

    $("copyProgramInviteLink")
      ?.addEventListener(
        "click",
        copyInviteLink
      );

    document
      .querySelectorAll(
        "[data-close-add-modal]"
      )
      .forEach(
        function (button) {
          button.addEventListener(
            "click",
            closeAddParticipantModal
          );
        }
      );

    document
      .querySelectorAll(
        "[data-close-email-modal]"
      )
      .forEach(
        function (button) {
          button.addEventListener(
            "click",
            closeEmailInviteModal
          );
        }
      );

    $("sendParticipantInvites")
      ?.addEventListener(
        "click",
        function () {
          const emails =
            $("participantInviteEmails")
              ?.value
              .trim();

          if (!emails) {
            showToast(
              "Enter at least one email address.",
              "error"
            );
            return;
          }

          closeEmailInviteModal();

          showToast(
            "Invitation list prepared. Connect this button to your email/notification workflow before production sending.",
            "success"
          );
        }
      );


    document
      .querySelectorAll(
        "[data-close-participant-modal]"
      )
      .forEach(
        function (button) {
          button.addEventListener(
            "click",
            closeInviteModal
          );
        }
      );


    $("inviteParticipantModal")
      ?.addEventListener(
        "click",
        function (event) {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeInviteModal();
          }
        }
      );


    $("inviteParticipantUser")
      ?.addEventListener(
        "change",
        function () {
          renderSelectedUserPreview(
            this.value
          );
        }
      );


    $("saveParticipantEnrollment")
      ?.addEventListener(
        "click",
        saveParticipantEnrollment
      );


    $("participantRowMenu")
      ?.addEventListener(
        "click",
        function (event) {
          event.stopPropagation();

          const button =
            event.target.closest(
              "[data-row-action]"
            );

          if (!button) {
            return;
          }

          handleRowAction(
            button.dataset.rowAction
          );
        }
      );


    $("participantsExportButton")
      ?.addEventListener(
        "click",
        exportParticipantsCsv
      );


    $("participantsBulkMessageButton")
      ?.addEventListener(
        "click",
        function () {
          closeCourseMenu();

          showToast(
            "Bulk participant messaging will connect to the Engagement page.",
            "success"
          );
        }
      );


    document
      .querySelectorAll(
        "[data-course-tab]"
      )
      .forEach(
        function (tab) {
          tab.addEventListener(
            "click",
            function (event) {
              event.preventDefault();

              navigateTab(
                tab.dataset.courseTab
              );
            }
          );
        }
      );
  }


  /* ============================================================
     COURSE LINKS
     ============================================================ */

  function applyCourseLinks() {
    const encoded =
      encodeURIComponent(
        state.courseId
      );

    const preview =
      $("participantsPreviewButton");

    if (preview) {
      preview.href =
        "admin-lms-course-preview.html?course=" +
        encoded;
    }
  }


  function navigateTab(tab) {
    const pages = {
      overview:
        "admin-lms-course-overview.html",

      content:
        "admin-lms-course-builder.html",

      participants:
        "admin-lms-course-participants.html",

      settings:
        "admin-lms-course-settings.html",

      engagement:
        "admin-lms-course-engagement.html"
    };

    const page =
      pages[tab];

    if (!page) {
      return;
    }

    window.location.href =
      page +
      "?course=" +
      encodeURIComponent(
        state.courseId
      );
  }


  /* ============================================================
     UI HELPERS
     ============================================================ */

  function closeCourseMenu() {
    const menu =
      $("participantsMoreMenu");

    const button =
      $("participantsMoreButton");

    if (menu) {
      menu.hidden = true;
    }

    if (button) {
      button.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  }


  function closeFilterMenu() {
    const menu =
      $("participantFilterMenu");

    const button =
      $("participantFilterButton");

    if (menu) {
      menu.hidden = true;
    }

    if (button) {
      button.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  }


  function setLoading(show) {
    const loading =
      $("participantsLoading");

    if (loading) {
      loading.hidden =
        !show;
    }
  }


  function showToast(
    message,
    type
  ) {
    const toast =
      $("participantsToast");

    if (!toast) {
      return;
    }

    toast.textContent =
      message;

    toast.className =
      "participants-toast show " +
      (type || "success");

    clearTimeout(
      showToast.timer
    );

    showToast.timer =
      setTimeout(
        function () {
          toast.classList.remove(
            "show"
          );
        },
        3400
      );
  }


  /* ============================================================
     DATA HELPERS
     ============================================================ */

  function getProfileName(profile) {
    const display =
      String(
        profile?.display_name ||
        ""
      ).trim();

    if (display) {
      return display;
    }


    const first =
      String(
        profile?.first_name ||
        ""
      ).trim();

    const last =
      String(
        profile?.last_name ||
        ""
      ).trim();

    const full =
      [first, last]
        .filter(Boolean)
        .join(" ");

    return (
      full ||
      profile?.email ||
      "Participant"
    );
  }


  function getPerformanceLabel(progress) {
    if (progress >= 90) {
      return {
        label: "Exceptional",
        className: "high"
      };
    }

    if (progress >= 70) {
      return {
        label: "High",
        className: "high"
      };
    }

    if (progress >= 40) {
      return {
        label: "Moderate",
        className: "medium"
      };
    }

    return {
      label: progress === 0
        ? "Not started"
        : "Low",
      className: "low"
    };
  }


  function getCertificateText(
    certificate,
    enrollment
  ) {
    if (
      certificate &&
      !certificate.revoked_at
    ) {
      return (
        certificate.certificate_number ||
        "Issued"
      );
    }

    if (
      normalizeStatus(
        enrollment.status
      ) === "completed"
    ) {
      return "Not issued";
    }

    return "Not issued";
  }


  function clampProgress(value) {
    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(number)
      )
    );
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

    return date.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );
  }


  function normalizeStatus(value) {
    return String(
      value ||
      "active"
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  }


  function titleCase(value) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(
        /\b\w/g,
        function (character) {
          return character.toUpperCase();
        }
      );
  }


  function getInitials(value) {
    const parts =
      String(value || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) {
      return "--";
    }

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[
        parts.length - 1
      ].charAt(0)
    ).toUpperCase();
  }


  function setText(
    id,
    value
  ) {
    const node =
      $(id);

    if (node) {
      node.textContent =
        value ?? "";
    }
  }


  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      ) || "course";
  }


  function csvCell(value) {
    const string =
      String(value ?? "");

    return (
      '"' +
      string.replace(
        /"/g,
        '""'
      ) +
      '"'
    );
  }


  function esc(value) {
    return String(value ?? "")
      .replace(
        /[&<>"']/g,
        function (character) {
          return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
          }[character];
        }
      );
  }

})();
