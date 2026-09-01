/* ============================================================
   SCREENINGS4U — MICROSOFT TEAMS APPOINTMENT BUILDER

   Backend:
   - scheduling-actions
   - teams-meeting-actions

   Stores the Teams join URL on the scheduling appointment so
   admin/customer portal pages can expose a simple Join button.
   ============================================================ */

(() => {
  "use strict";

  let db = null;
  let current = null;
  let employers = [];
  let profiles = [];
  let attendees = [];

  const E = {};

  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  async function client() {
    for (let i = 0; i < 40; i += 1) {
      try {
        if (
          typeof window
            .getScreenings4uSupabase ===
          "function"
        ) {
          const c =
            await window
              .getScreenings4uSupabase();

          if (c?.functions) {
            return c;
          }
        }

        if (
          window
            .screenings4uSupabase
            ?.functions
        ) {
          return window
            .screenings4uSupabase;
        }

        if (
          window
            .supabaseClient
            ?.functions
        ) {
          return window
            .supabaseClient;
        }
      } catch (_) {}

      await delay(75);
    }

    return null;
  }


  async function call(
    body,
    fn = "scheduling-actions"
  ) {
    const {
      data,
      error
    } = await db.functions
      .invoke(
        fn,
        {
          body
        }
      );

    if (error) {
      let message =
        error.message ||
        "Action failed.";

      try {
        const json =
          await error.context
            ?.clone?.()
            .json();

        if (json?.error) {
          message =
            json.error;
        }
      } catch (_) {}

      throw new Error(
        message
      );
    }

    if (data?.error) {
      throw new Error(
        data.error
      );
    }

    return data || {};
  }


  function cache() {
    [
      "message",
      "pageTitle",

      "title",
      "status",
      "startAt",
      "endAt",
      "timezone",
      "description",

      "recipientType",
      "recipient",
      "attendeeName",
      "attendeeEmail",
      "attendeePhone",

      "meetingUrl",
      "meetingId",
      "meetingProvider",
      "createTeams",
      "joinMeeting",

      "hostName",
      "hostEmail",
      "agenda",
      "internalNotes",

      "addAttendee",
      "attendees",

      "tracking",
      "cancelAppointment",
      "save",
      "saveBottom",

      "summaryType",
      "summaryStatus",
      "summaryRecipient",
      "summaryWhen"
    ].forEach(
      (id) => {
        E[id] =
          document.getElementById(
            id
          );
      }
    );
  }


  async function init() {
    cache();
    bind();

    try {
      db =
        await client();

      if (!db) {
        throw new Error(
          "Supabase client not found."
        );
      }

      const data =
        await call({
          action:
            "list",

          appointment_type:
            "teams"
        });

      employers =
        data.employers ||
        [];

      profiles =
        data.profiles ||
        [];

      recipients();

      const id =
        new URLSearchParams(
          window.location.search
        ).get("id");

      if (id) {
        current =
          (
            data.appointments ||
            []
          ).find(
            (appointment) =>
              appointment.id ===
              id
          );

        if (!current) {
          throw new Error(
            "Appointment not found."
          );
        }

        fill(
          current
        );
      } else {
        defaults();
      }

      updateSummary();

    } catch (error) {
      console.error(
        "[Teams Appointment]",
        error
      );

      msg(
        error?.message ||
        "Unable to load appointment.",
        "error"
      );
    }
  }


  function bind() {
    E.recipientType
      ?.addEventListener(
        "change",
        () => {
          recipients();
          updateSummary();
        }
      );

    E.recipient
      ?.addEventListener(
        "change",
        recipientChanged
      );

    E.title
      ?.addEventListener(
        "input",
        updateSummary
      );

    E.status
      ?.addEventListener(
        "change",
        updateSummary
      );

    E.startAt
      ?.addEventListener(
        "change",
        updateSummary
      );

    E.endAt
      ?.addEventListener(
        "change",
        updateSummary
      );

    E.attendeeName
      ?.addEventListener(
        "input",
        updateSummary
      );

    E.meetingUrl
      ?.addEventListener(
        "input",
        syncJoinButton
      );

    E.addAttendee
      ?.addEventListener(
        "click",
        () => {
          attendees.push({
            name: "",
            email: "",
            phone: "",
            attendee_role:
              "required"
          });

          drawAttendees();
        }
      );

    E.attendees
      ?.addEventListener(
        "input",
        attendeeInput
      );

    E.attendees
      ?.addEventListener(
        "change",
        attendeeInput
      );

    E.attendees
      ?.addEventListener(
        "click",
        attendeeClick
      );

    E.save
      ?.addEventListener(
        "click",
        save
      );

    E.saveBottom
      ?.addEventListener(
        "click",
        save
      );

    E.cancelAppointment
      ?.addEventListener(
        "click",
        cancel
      );

    E.createTeams
      ?.addEventListener(
        "click",
        createTeams
      );
  }


  function defaults() {
    const start =
      new Date(
        Date.now() +
        3600000
      );

    start.setMinutes(
      Math.ceil(
        start.getMinutes() /
        15
      ) * 15,
      0,
      0
    );

    const end =
      new Date(
        start.getTime() +
        1800000
      );

    E.startAt.value =
      local(start);

    E.endAt.value =
      local(end);

    E.status.value =
      "scheduled";

    E.meetingProvider.value =
      "microsoft_teams";

    attendees =
      [];

    drawAttendees();
    syncJoinButton();
    updateSummary();
  }


  function recipients() {
    if (!E.recipient) {
      return;
    }

    if (
      E.recipientType.value ===
      "employer"
    ) {
      E.recipient.innerHTML =
        '<option value="">Select employer...</option>' +
        employers
          .map(
            (item) =>
              `<option value="${esc(item.id)}">${esc(item.employer_name || "Employer")}</option>`
          )
          .join("");

      return;
    }

    E.recipient.innerHTML =
      '<option value="">Manual / new customer</option>' +
      profiles
        .filter(
          (item) =>
            item.email &&
            item.is_active !==
              false
        )
        .map(
          (item) => {
            const label =
              item.display_name ||
              [
                item.first_name,
                item.last_name
              ]
                .filter(Boolean)
                .join(" ") ||
              item.email;

            return `<option value="${esc(item.id)}">${esc(label)}</option>`;
          }
        )
        .join("");
  }


  function recipientChanged() {
    const employer =
      E.recipientType.value ===
      "employer";

    const item =
      employer
        ? employers.find(
            (value) =>
              value.id ===
              E.recipient.value
          )
        : profiles.find(
            (value) =>
              value.id ===
              E.recipient.value
          );

    if (!item) {
      updateSummary();
      return;
    }

    E.attendeeName.value =
      employer
        ? item.employer_name ||
          ""
        : item.display_name ||
          [
            item.first_name,
            item.last_name
          ]
            .filter(Boolean)
            .join(" ");

    E.attendeeEmail.value =
      employer
        ? item.billing_email ||
          item.email ||
          ""
        : item.email ||
          "";

    E.attendeePhone.value =
      item.phone ||
      "";

    updateSummary();
  }


  function fill(
    appointment
  ) {
    if (E.pageTitle) {
      E.pageTitle.textContent =
        `${appointment.tracking_number || "Appointment"} — ${appointment.title || "Microsoft Teams Meeting"}`;
    }

    if (E.tracking) {
      E.tracking.textContent =
        appointment
          .tracking_number ||
        "APPOINTMENT";
    }

    const mapping = {
      title:
        "title",

      status:
        "status",

      timezone:
        "timezone",

      description:
        "description",

      attendeeName:
        "attendee_name",

      attendeeEmail:
        "attendee_email",

      attendeePhone:
        "attendee_phone",

      meetingUrl:
        "meeting_url",

      meetingId:
        "meeting_id",

      meetingProvider:
        "meeting_provider",

      hostName:
        "host_name",

      hostEmail:
        "host_email",

      agenda:
        "agenda",

      internalNotes:
        "internal_notes"
    };

    Object.entries(
      mapping
    ).forEach(
      ([elementId, field]) => {
        if (E[elementId]) {
          E[elementId].value =
            appointment[field] ??
            "";
        }
      }
    );

    if (
      E.meetingProvider &&
      !E.meetingProvider.value
    ) {
      E.meetingProvider.value =
        "microsoft_teams";
    }

    if (
      E.startAt &&
      appointment.start_at
    ) {
      E.startAt.value =
        local(
          new Date(
            appointment.start_at
          )
        );
    }

    if (
      E.endAt &&
      appointment.end_at
    ) {
      E.endAt.value =
        local(
          new Date(
            appointment.end_at
          )
        );
    }

    E.recipientType.value =
      appointment.employer_id
        ? "employer"
        : "customer";

    recipients();

    E.recipient.value =
      appointment.employer_id ||
      appointment.customer_user_id ||
      "";

    attendees =
      (
        appointment.attendees ||
        []
      ).map(
        (item) => ({
          ...item
        })
      );

    drawAttendees();

    if (
      E.cancelAppointment
    ) {
      E.cancelAppointment.hidden =
        appointment.status ===
        "cancelled";
    }

    syncJoinButton();
    updateSummary();
  }


  function drawAttendees() {
    if (!E.attendees) {
      return;
    }

    if (!attendees.length) {
      E.attendees.innerHTML =
        '<div class="scheduling-empty">No additional attendees added.</div>';

      return;
    }

    E.attendees.innerHTML =
      attendees
        .map(
          (item, index) => `
            <div class="scheduling-attendee">
              <input
                data-i="${index}"
                data-k="name"
                placeholder="Name"
                value="${esc(item.name || "")}"
              >

              <input
                data-i="${index}"
                data-k="email"
                type="email"
                placeholder="Email"
                value="${esc(item.email || "")}"
              >

              <input
                data-i="${index}"
                data-k="phone"
                placeholder="Phone"
                value="${esc(item.phone || "")}"
              >

              <select
                data-i="${index}"
                data-k="attendee_role"
              >
                <option
                  value="required"
                  ${item.attendee_role === "required" ? "selected" : ""}
                >
                  Required
                </option>

                <option
                  value="optional"
                  ${item.attendee_role === "optional" ? "selected" : ""}
                >
                  Optional
                </option>

                <option
                  value="host"
                  ${item.attendee_role === "host" ? "selected" : ""}
                >
                  Host
                </option>
              </select>

              <button
                class="scheduling-button danger"
                type="button"
                data-remove="${index}"
              >
                Remove
              </button>
            </div>
          `
        )
        .join("");
  }


  function attendeeInput(
    event
  ) {
    const index =
      Number(
        event.target.dataset.i
      );

    const key =
      event.target.dataset.k;

    if (
      attendees[index] &&
      key
    ) {
      attendees[index][key] =
        event.target.value;
    }
  }


  function attendeeClick(
    event
  ) {
    const button =
      event.target.closest(
        "[data-remove]"
      );

    if (!button) {
      return;
    }

    attendees.splice(
      Number(
        button.dataset.remove
      ),
      1
    );

    drawAttendees();
  }


  function validate() {
    const title =
      E.title.value.trim();

    if (!title) {
      return "Title is required.";
    }

    if (
      !E.startAt.value ||
      !E.endAt.value
    ) {
      return "Start and end are required.";
    }

    const start =
      new Date(
        E.startAt.value
      );

    const end =
      new Date(
        E.endAt.value
      );

    if (
      Number.isNaN(
        start.getTime()
      ) ||
      Number.isNaN(
        end.getTime()
      )
    ) {
      return "Enter a valid start and end time.";
    }

    if (!(end > start)) {
      return "End time must be after the start time.";
    }

    const meetingUrl =
      E.meetingUrl.value.trim();

    if (
      meetingUrl &&
      !validHttpUrl(
        meetingUrl
      )
    ) {
      return "Enter a valid Microsoft Teams join URL.";
    }

    return "";
  }


  function payload() {
    return {
      action:
        current
          ? "update"
          : "create",

      id:
        current?.id,

      appointment_type:
        "teams",

      title:
        E.title.value.trim(),

      status:
        E.status.value,

      start_at:
        new Date(
          E.startAt.value
        ).toISOString(),

      end_at:
        new Date(
          E.endAt.value
        ).toISOString(),

      timezone:
        E.timezone.value,

      description:
        E.description.value
          .trim() ||
        null,

      customer_user_id:
        E.recipientType.value ===
        "customer"
          ? E.recipient.value ||
            null
          : null,

      employer_id:
        E.recipientType.value ===
        "employer"
          ? E.recipient.value ||
            null
          : null,

      attendee_name:
        E.attendeeName.value
          .trim() ||
        null,

      attendee_email:
        E.attendeeEmail.value
          .trim() ||
        null,

      attendee_phone:
        E.attendeePhone.value
          .trim() ||
        null,

      meeting_url:
        E.meetingUrl.value
          .trim() ||
        null,

      meeting_id:
        E.meetingId.value
          .trim() ||
        null,

      meeting_provider:
        "microsoft_teams",

      location_name:
        null,

      location_address:
        null,

      phone_number:
        null,

      phone_extension:
        null,

      host_name:
        E.hostName.value
          .trim() ||
        null,

      host_email:
        E.hostEmail.value
          .trim() ||
        null,

      agenda:
        E.agenda.value
          .trim() ||
        null,

      internal_notes:
        E.internalNotes.value
          .trim() ||
        null,

      attendees:
        attendees
          .map(
            (item) => ({
              name:
                String(
                  item.name ||
                  ""
                ).trim(),

              email:
                String(
                  item.email ||
                  ""
                ).trim(),

              phone:
                String(
                  item.phone ||
                  ""
                ).trim(),

              attendee_role:
                item.attendee_role ||
                "required"
            })
          )
          .filter(
            (item) =>
              item.name ||
              item.email ||
              item.phone
          )
    };
  }


  async function save() {
    const problem =
      validate();

    if (problem) {
      msg(
        problem,
        "error"
      );

      return;
    }

    setSaveBusy(
      true
    );

    try {
      const data =
        await call(
          payload()
        );

      if (!data.appointment) {
        throw new Error(
          "Scheduling service did not return the saved appointment."
        );
      }

      current =
        data.appointment;

      window.history
        .replaceState(
          null,
          "",
          `${window.location.pathname.split("/").pop()}?id=${encodeURIComponent(current.id)}`
        );

      fill(
        current
      );

      msg(
        `${current.tracking_number || "Appointment"} saved.`,
        "ok"
      );

    } catch (error) {
      console.error(
        "[Save Teams Appointment]",
        error
      );

      msg(
        error?.message ||
        "Unable to save appointment.",
        "error"
      );

    } finally {
      setSaveBusy(
        false
      );
    }
  }


  async function cancel() {
    if (!current) {
      return;
    }

    if (
      !window.confirm(
        "Cancel this appointment?"
      )
    ) {
      return;
    }

    try {
      const data =
        await call({
          action:
            "status",

          id:
            current.id,

          status:
            "cancelled"
        });

      current =
        data.appointment ||
        {
          ...current,
          status:
            "cancelled"
        };

      fill(
        current
      );

      msg(
        "Appointment cancelled.",
        "ok"
      );

    } catch (error) {
      console.error(
        "[Cancel Teams Appointment]",
        error
      );

      msg(
        error?.message ||
        "Unable to cancel appointment.",
        "error"
      );
    }
  }


  async function createTeams() {
    const title =
      E.title.value.trim();

    if (
      !title ||
      !E.startAt.value ||
      !E.endAt.value
    ) {
      msg(
        "Enter the title, start time, and end time before creating the Teams meeting.",
        "error"
      );

      return;
    }

    const start =
      new Date(
        E.startAt.value
      );

    const end =
      new Date(
        E.endAt.value
      );

    if (!(end > start)) {
      msg(
        "End time must be after the start time.",
        "error"
      );

      return;
    }

    setTeamsBusy(
      true
    );

    try {
      const data =
        await call(
          {
            action:
              "create",

            appointment_id:
              current?.id ||
              null,

            title,

            start_at:
              start.toISOString(),

            end_at:
              end.toISOString(),

            timezone:
              E.timezone.value,

            attendee_name:
              E.attendeeName.value
                .trim() ||
              null,

            attendee_email:
              E.attendeeEmail.value
                .trim() ||
              null,

            host_name:
              E.hostName.value
                .trim() ||
              null,

            host_email:
              E.hostEmail.value
                .trim() ||
              null
          },
          "teams-meeting-actions"
        );

      const meetingUrl =
        data.meeting_url ||
        data.join_url ||
        data.joinWebUrl ||
        "";

      const meetingId =
        data.meeting_id ||
        data.id ||
        "";

      if (!meetingUrl) {
        throw new Error(
          "Teams meeting was created but no join URL was returned."
        );
      }

      E.meetingUrl.value =
        meetingUrl;

      E.meetingId.value =
        meetingId;

      E.meetingProvider.value =
        "microsoft_teams";

      syncJoinButton();

      msg(
        "Microsoft Teams meeting created. Save the appointment to store the meeting link.",
        "ok"
      );

    } catch (error) {
      console.error(
        "[Create Teams Meeting]",
        error
      );

      msg(
        error?.message ||
        "Teams API is not configured. You can paste a Teams join URL manually.",
        "error"
      );

    } finally {
      setTeamsBusy(
        false
      );
    }
  }


  function syncJoinButton() {
    if (!E.joinMeeting) {
      return;
    }

    const url =
      E.meetingUrl
        ?.value
        .trim() ||
      "";

    if (
      url &&
      validHttpUrl(url)
    ) {
      E.joinMeeting.href =
        url;

      E.joinMeeting.hidden =
        false;

      return;
    }

    E.joinMeeting.removeAttribute(
      "href"
    );

    E.joinMeeting.hidden =
      true;
  }


  function updateSummary() {
    if (E.summaryType) {
      E.summaryType.textContent =
        "Microsoft Teams Meeting";
    }

    if (E.summaryStatus) {
      E.summaryStatus.textContent =
        human(
          E.status?.value ||
          "scheduled"
        );
    }

    if (E.summaryRecipient) {
      E.summaryRecipient.textContent =
        E.attendeeName
          ?.value
          .trim() ||
        "Not selected";
    }

    if (E.summaryWhen) {
      if (
        E.startAt?.value
      ) {
        const date =
          new Date(
            E.startAt.value
          );

        E.summaryWhen.textContent =
          Number.isNaN(
            date.getTime()
          )
            ? "Not scheduled"
            : date.toLocaleString(
                [],
                {
                  dateStyle:
                    "medium",

                  timeStyle:
                    "short"
                }
              );

      } else {
        E.summaryWhen.textContent =
          "Not scheduled";
      }
    }
  }


  function setSaveBusy(
    busy
  ) {
    [
      E.save,
      E.saveBottom
    ]
      .filter(Boolean)
      .forEach(
        (button) => {
          button.disabled =
            busy;

          button.textContent =
            busy
              ? "Saving..."
              : "Save Appointment";
        }
      );
  }


  function setTeamsBusy(
    busy
  ) {
    if (!E.createTeams) {
      return;
    }

    E.createTeams.disabled =
      busy;

    E.createTeams.textContent =
      busy
        ? "Creating Teams Meeting..."
        : "Create Teams Meeting";
  }


  function validHttpUrl(
    value
  ) {
    try {
      const url =
        new URL(
          value
        );

      return (
        url.protocol ===
          "https:" ||
        url.protocol ===
          "http:"
      );

    } catch (_) {
      return false;
    }
  }


  function local(
    date
  ) {
    const pad =
      (number) =>
        String(
          number
        ).padStart(
          2,
          "0"
        );

    return (
      `${date.getFullYear()}-` +
      `${pad(date.getMonth() + 1)}-` +
      `${pad(date.getDate())}T` +
      `${pad(date.getHours())}:` +
      `${pad(date.getMinutes())}`
    );
  }


  function human(
    value
  ) {
    return String(
      value ||
      ""
    )
      .replace(
        /_/g,
        " "
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }


  function esc(
    value
  ) {
    return String(
      value ??
      ""
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


  function msg(
    text,
    type = "ok"
  ) {
    if (!E.message) {
      return;
    }

    E.message.textContent =
      text;

    E.message.className =
      `scheduling-message show ${type}`;

    window.clearTimeout(
      msg.timer
    );

    msg.timer =
      window.setTimeout(
        () => {
          E.message
            ?.classList
            .remove(
              "show"
            );
        },
        5000
      );
  }


  function delay(
    milliseconds
  ) {
    return new Promise(
      (resolve) =>
        window.setTimeout(
          resolve,
          milliseconds
        )
    );
  }

})();
