(() => {
  "use strict";

  let db = null;
  let current = null;
  let employers = [];
  let profiles = [];
  let attendees = [];

  const E = {};
  const $ = (id) => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", init);

  async function client() {
    for (let i = 0; i < 40; i += 1) {
      try {
        if (typeof window.getScreenings4uSupabase === "function") {
          const c = await window.getScreenings4uSupabase();
          if (c?.functions) return c;
        }
        if (window.screenings4uSupabase?.functions) return window.screenings4uSupabase;
      } catch (_) {}
      await new Promise((resolve) => setTimeout(resolve, 75));
    }
    return null;
  }

  async function call(body, fn = "scheduling-actions") {
    const { data, error } = await db.functions.invoke(fn, { body });

    if (error) {
      let message = error.message || "Action failed.";
      try {
        const json = await error.context?.clone?.().json();
        if (json?.error) message = json.error;
      } catch (_) {}
      throw new Error(message);
    }

    if (data?.error) throw new Error(data.error);
    return data;
  }

  function cache() {
    [
      "message","pageTitle","title","status","startAt","endAt","timezone","description",
      "recipientType","recipient","attendeeName","attendeeEmail","attendeePhone",
      "meetingUrl","meetingId","meetingProvider","createTeams","joinMeeting",
      "locationName","locationAddress","phoneNumber","phoneExtension",
      "hostName","hostEmail","agenda","internalNotes","addAttendee","attendees",
      "tracking","cancelAppointment","save","summaryType","summaryStatus",
      "summaryRecipient","summaryWhen"
    ].forEach((id) => E[id] = $(id));
  }

  async function init() {
    cache();
    bind();

    try {
      db = await client();
      if (!db) throw new Error("Supabase client not found.");

      const page = document.querySelector("[data-schedule-type]");
      const type = page?.dataset.scheduleType || "";
      const data = await call({ action: "list", appointment_type: type });

      employers = data.employers || [];
      profiles = data.profiles || [];
      recipients();

      const id = new URLSearchParams(location.search).get("id");

      if (id) {
        current = (data.appointments || []).find((x) => x.id === id);
        if (!current) throw new Error("Appointment not found.");
        fill(current);
      } else {
        defaults();
      }

      updateSummary();
    } catch (error) {
      msg(error.message || "Unable to load appointment.", "error");
    }
  }

  function bind() {
    E.recipientType?.addEventListener("change", () => {
      recipients();
      updateSummary();
    });
    E.recipient?.addEventListener("change", recipientChanged);
    E.startAt?.addEventListener("change", updateSummary);
    E.endAt?.addEventListener("change", updateSummary);
    E.status?.addEventListener("change", updateSummary);
    E.attendeeName?.addEventListener("input", updateSummary);

    E.addAttendee?.addEventListener("click", () => {
      attendees.push({ name:"", email:"", phone:"", attendee_role:"required" });
      drawAttendees();
    });

    E.attendees?.addEventListener("input", attendeeInput);
    E.attendees?.addEventListener("change", attendeeInput);
    E.attendees?.addEventListener("click", attendeeClick);
    E.save?.addEventListener("click", save);
    E.cancelAppointment?.addEventListener("click", cancel);
    E.createTeams?.addEventListener("click", createTeams);
  }

  function defaults() {
    const start = new Date(Date.now() + 3600000);
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
    const end = new Date(start.getTime() + 1800000);

    if (E.startAt) E.startAt.value = local(start);
    if (E.endAt) E.endAt.value = local(end);

    const type = document.querySelector("[data-schedule-type]")?.dataset.scheduleType || "";
    if (E.meetingProvider && type === "teams") E.meetingProvider.value = "microsoft_teams";
    if (E.meetingProvider && type === "online" && !E.meetingProvider.value) E.meetingProvider.value = "external";

    drawAttendees();
    updateSummary();
  }

  function recipients() {
    if (!E.recipient) return;

    if (E.recipientType.value === "employer") {
      E.recipient.innerHTML =
        '<option value="">Select employer...</option>' +
        employers.map((x) =>
          `<option value="${esc(x.id)}">${esc(x.employer_name || "Employer")}</option>`
        ).join("");
    } else {
      E.recipient.innerHTML =
        '<option value="">Manual / new customer</option>' +
        profiles.filter((x) => x.email && x.is_active !== false).map((x) => {
          const label = x.display_name ||
            [x.first_name,x.last_name].filter(Boolean).join(" ") ||
            x.email;
          return `<option value="${esc(x.id)}">${esc(label)}</option>`;
        }).join("");
    }
  }

  function recipientChanged() {
    const employer = E.recipientType.value === "employer";
    const item = employer
      ? employers.find((x) => x.id === E.recipient.value)
      : profiles.find((x) => x.id === E.recipient.value);

    if (!item) {
      updateSummary();
      return;
    }

    E.attendeeName.value = employer
      ? item.employer_name || ""
      : item.display_name || [item.first_name,item.last_name].filter(Boolean).join(" ");

    E.attendeeEmail.value = employer
      ? item.billing_email || item.email || ""
      : item.email || "";

    E.attendeePhone.value = item.phone || "";
    updateSummary();
  }

  function fill(x) {
    if (E.pageTitle) E.pageTitle.textContent = `${x.tracking_number} — ${x.title}`;
    if (E.tracking) E.tracking.textContent = x.tracking_number || "APPOINTMENT";

    [
      "title","status","timezone","description","attendeeName","attendeeEmail","attendeePhone",
      "meetingUrl","meetingId","meetingProvider","locationName","locationAddress",
      "phoneNumber","phoneExtension","hostName","hostEmail","agenda","internalNotes"
    ].forEach((id) => {
      if (E[id]) E[id].value = x[camelToSnake(id)] ?? x[id] ?? "";
    });

    if (E.startAt && x.start_at) E.startAt.value = local(new Date(x.start_at));
    if (E.endAt && x.end_at) E.endAt.value = local(new Date(x.end_at));

    E.recipientType.value = x.employer_id ? "employer" : "customer";
    recipients();
    E.recipient.value = x.employer_id || x.customer_user_id || "";

    attendees = (x.attendees || []).map((a) => ({ ...a }));
    drawAttendees();

    if (E.cancelAppointment) E.cancelAppointment.hidden = x.status === "cancelled";

    if (E.joinMeeting) {
      if (x.meeting_url) {
        E.joinMeeting.href = x.meeting_url;
        E.joinMeeting.hidden = false;
      } else {
        E.joinMeeting.hidden = true;
      }
    }

    updateSummary();
  }

  function drawAttendees() {
    if (!E.attendees) return;

    E.attendees.innerHTML = attendees.map((x,i) => `
      <div class="scheduling-attendee">
        <input data-i="${i}" data-k="name" placeholder="Name" value="${esc(x.name || "")}">
        <input data-i="${i}" data-k="email" placeholder="Email" value="${esc(x.email || "")}">
        <input data-i="${i}" data-k="phone" placeholder="Phone" value="${esc(x.phone || "")}">
        <select data-i="${i}" data-k="attendee_role">
          <option value="required" ${x.attendee_role === "required" ? "selected" : ""}>Required</option>
          <option value="optional" ${x.attendee_role === "optional" ? "selected" : ""}>Optional</option>
          <option value="host" ${x.attendee_role === "host" ? "selected" : ""}>Host</option>
        </select>
        <button class="scheduling-button danger" type="button" data-remove="${i}">Remove</button>
      </div>
    `).join("");
  }

  function attendeeInput(event) {
    const i = Number(event.target.dataset.i);
    const key = event.target.dataset.k;
    if (attendees[i] && key) attendees[i][key] = event.target.value;
  }

  function attendeeClick(event) {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    attendees.splice(Number(button.dataset.remove), 1);
    drawAttendees();
  }

  function payload() {
    const type = document.querySelector("[data-schedule-type]")?.dataset.scheduleType || "";

    return {
      action: current ? "update" : "create",
      id: current?.id,
      appointment_type: type,
      title: E.title.value.trim(),
      status: E.status.value,
      start_at: new Date(E.startAt.value).toISOString(),
      end_at: new Date(E.endAt.value).toISOString(),
      timezone: E.timezone.value,
      description: E.description.value.trim() || null,
      customer_user_id: E.recipientType.value === "customer" ? E.recipient.value || null : null,
      employer_id: E.recipientType.value === "employer" ? E.recipient.value || null : null,
      attendee_name: E.attendeeName.value.trim() || null,
      attendee_email: E.attendeeEmail.value.trim() || null,
      attendee_phone: E.attendeePhone.value.trim() || null,
      meeting_url: E.meetingUrl?.value.trim() || null,
      meeting_id: E.meetingId?.value.trim() || null,
      meeting_provider: E.meetingProvider?.value.trim() || null,
      location_name: E.locationName?.value.trim() || null,
      location_address: E.locationAddress?.value.trim() || null,
      phone_number: E.phoneNumber?.value.trim() || null,
      phone_extension: E.phoneExtension?.value.trim() || null,
      host_name: E.hostName.value.trim() || null,
      host_email: E.hostEmail.value.trim() || null,
      agenda: E.agenda.value.trim() || null,
      internal_notes: E.internalNotes.value.trim() || null,
      attendees
    };
  }

  async function save() {
    if (!E.title.value.trim() || !E.startAt.value || !E.endAt.value) {
      msg("Title, start and end are required.", "error");
      return;
    }

    const start = new Date(E.startAt.value);
    const end = new Date(E.endAt.value);

    if (!(end > start)) {
      msg("End time must be after the start time.", "error");
      return;
    }

    try {
      E.save.disabled = true;
      E.save.textContent = "Saving...";

      const data = await call(payload());
      current = data.appointment;

      history.replaceState(
        null,
        "",
        `${location.pathname.split("/").pop()}?id=${encodeURIComponent(current.id)}`
      );

      fill(current);
      msg(`${current.tracking_number} saved.`, "ok");
    } catch (error) {
      msg(error.message || "Unable to save appointment.", "error");
    } finally {
      E.save.disabled = false;
      E.save.textContent = "Save Appointment";
    }
  }

  async function cancel() {
    if (!current || !confirm("Cancel this appointment?")) return;

    try {
      const data = await call({
        action: "status",
        id: current.id,
        status: "cancelled"
      });

      current = data.appointment;
      fill(current);
      msg("Appointment cancelled.", "ok");
    } catch (error) {
      msg(error.message || "Unable to cancel appointment.", "error");
    }
  }

  async function createTeams() {
    if (!E.title.value.trim() || !E.startAt.value || !E.endAt.value) {
      msg("Enter title, start and end before creating a Teams meeting.", "error");
      return;
    }

    try {
      E.createTeams.disabled = true;
      E.createTeams.textContent = "Creating Teams Meeting...";

      const data = await call({
        action: "create",
        title: E.title.value.trim(),
        start_at: new Date(E.startAt.value).toISOString(),
        end_at: new Date(E.endAt.value).toISOString()
      }, "teams-meeting-actions");

      E.meetingUrl.value = data.meeting_url || "";
      E.meetingId.value = data.meeting_id || "";
      E.meetingProvider.value = "microsoft_teams";

      if (E.joinMeeting && data.meeting_url) {
        E.joinMeeting.href = data.meeting_url;
        E.joinMeeting.hidden = false;
      }

      msg("Microsoft Teams meeting created. Save the appointment to store it.", "ok");
    } catch (error) {
      msg(
        error.message ||
        "Teams API is not configured. You can paste a Teams join URL manually.",
        "error"
      );
    } finally {
      E.createTeams.disabled = false;
      E.createTeams.textContent = "Create Teams Meeting";
    }
  }

  function updateSummary() {
    const type = document.querySelector("[data-schedule-type]")?.dataset.scheduleLabel || "Appointment";
    if (E.summaryType) E.summaryType.textContent = type;
    if (E.summaryStatus) E.summaryStatus.textContent = human(E.status?.value || "scheduled");
    if (E.summaryRecipient) E.summaryRecipient.textContent =
      E.attendeeName?.value.trim() || "Not selected";

    if (E.summaryWhen) {
      if (E.startAt?.value) {
        const d = new Date(E.startAt.value);
        E.summaryWhen.textContent = Number.isNaN(d.getTime())
          ? "Not scheduled"
          : d.toLocaleString([], { dateStyle:"medium", timeStyle:"short" });
      } else {
        E.summaryWhen.textContent = "Not scheduled";
      }
    }
  }

  function camelToSnake(value) {
    return value.replace(/[A-Z]/g, (match) => "_" + match.toLowerCase());
  }

  function local(date) {
    const p = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
  }

  function human(value) {
    return String(value || "").replace(/_/g," ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }

  function msg(text, type = "ok") {
    if (!E.message) return;
    E.message.textContent = text;
    E.message.className = `scheduling-message show ${type}`;
  }
})();
