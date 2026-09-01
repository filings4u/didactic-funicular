/* ============================================================
   SCREENINGS4U — ADMIN LMS COURSE CREATION
   Creates:
     1) lms_courses
     2) services linked through training_course_id
     3) service_prices one-time price
   ============================================================ */

(() => {
  "use strict";

  const state = {
    step: 1,
    delivery: "",
    duration: "",
    pricing: "",
    creating: false
  };

  const $ = (id) => document.getElementById(id);

  const headings = {
    1: "What do you want to call your program?",
    2: "How should participants complete your program?",
    3: "How long do participants have to complete your program?",
    4: "Set the price for your program"
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bind();

    try {
      await requireSession();
    } catch (error) {
      console.error("[Course Creation Auth]", error);
      return;
    }

    render();
  }

  function bind() {
    $("courseName").addEventListener("input", () => {
      updateNameCount();
      updateReview();
      updateActions();
    });

    document.querySelectorAll("[data-choice-group]").forEach((button) => {
      button.addEventListener("click", () => {
        const group = button.dataset.choiceGroup;
        const value = button.dataset.choiceValue;

        document
          .querySelectorAll(`[data-choice-group="${group}"]`)
          .forEach((item) => item.classList.toggle("selected", item === button));

        state[group] = value;

        if (group === "delivery") {
          $("scheduledPanel").hidden = value !== "scheduled";
        }

        if (group === "duration") {
          $("timeLimitPanel").hidden = value !== "time_limit";
        }

        if (group === "pricing") {
          $("paidPanel").hidden = value !== "paid";
        }

        updateReview();
        updateActions();
      });
    });

    $("completionDays").addEventListener("input", () => {
      updateReview();
      updateActions();
    });

    $("coursePrice").addEventListener("input", () => {
      updateReview();
      updateActions();
    });

    $("creationBack").addEventListener("click", goBack);
    $("creationNext").addEventListener("click", goNext);
    $("creationCreate").addEventListener("click", createCourse);
  }

  async function requireSession() {
    if (window.S4UAuth?.requireSession) {
      const session = await window.S4UAuth.requireSession("admin-login.html");
      if (!session) throw new Error("Authentication required.");
      return session;
    }

    const client = await getClient();
    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    if (!data?.session?.user) {
      window.location.replace("admin-login.html");
      throw new Error("Authentication required.");
    }

    return data.session;
  }

  async function getClient() {
    if (typeof window.getScreenings4uSupabase === "function") {
      const client = await window.getScreenings4uSupabase();
      if (client?.from) return client;
    }

    if (window.screenings4uSupabase?.from) return window.screenings4uSupabase;
    if (window.supabaseClient?.from) return window.supabaseClient;

    if (
      window.supabase?.createClient &&
      window.SCREENINGS4U_SUPABASE_URL &&
      window.SCREENINGS4U_SUPABASE_ANON_KEY
    ) {
      window.supabaseClient = window.supabase.createClient(
        window.SCREENINGS4U_SUPABASE_URL,
        window.SCREENINGS4U_SUPABASE_ANON_KEY
      );
      return window.supabaseClient;
    }

    throw new Error("Supabase client is unavailable.");
  }

  function goNext() {
    if (!validateStep(state.step)) return;
    if (state.step >= 4) return;

    state.step += 1;
    render();
  }

  function goBack() {
    if (state.step <= 1) {
      window.location.href = "admin-lms-courses.html";
      return;
    }

    state.step -= 1;
    render();
  }

  function render() {
    document.querySelectorAll(".creation-step").forEach((section) => {
      section.classList.toggle(
        "active",
        Number(section.dataset.step) === state.step
      );
    });

    $("creationHeading").textContent = headings[state.step];
    $("creationStepLabel").textContent = `Step ${state.step} of 4`;
    $("creationProgressFill").style.width = `${state.step * 25}%`;

    $("creationBack").textContent =
      state.step === 1 ? "‹ Back to courses" : "‹ Back";

    const last = state.step === 4;
    $("creationNext").hidden = last;
    $("creationCreate").hidden = !last;

    updateNameCount();
    updateReview();
    updateActions();
  }

  function updateNameCount() {
    const value = $("courseName").value || "";
    $("courseNameCount").textContent = `${value.length} / 150`;
  }

  function updateActions() {
    $("creationNext").disabled = !validateStep(state.step, false);
    $("creationCreate").disabled =
      state.creating || !validateStep(4, false);
  }

  function validateStep(step, showError = true) {
    let message = "";

    if (step === 1) {
      if (!$("courseName").value.trim()) {
        message = "Enter a course name.";
      }
    }

    if (step === 2) {
      if (!state.delivery) {
        message = "Choose Self-Paced or Scheduled.";
      }
    }

    if (step === 3) {
      if (!state.duration) {
        message = "Choose Unlimited or Time Limit.";
      } else if (
        state.duration === "time_limit" &&
        Number($("completionDays").value) < 1
      ) {
        message = "Enter the number of days participants have to complete the course.";
      }
    }

    if (step === 4) {
      if (!state.pricing) {
        message = "Choose Free or Paid.";
      } else if (
        state.pricing === "paid" &&
        Number($("coursePrice").value) <= 0
      ) {
        message = "Enter a one-time price greater than $0.";
      }
    }

    if (message && showError) show(message, "error");
    return !message;
  }

  function updateReview() {
    const name = $("courseName").value.trim() || "—";

    $("reviewName").textContent = name;

    $("reviewDelivery").textContent =
      state.delivery === "self_paced"
        ? "Self-Paced"
        : state.delivery === "scheduled"
          ? "Scheduled"
          : "—";

    $("reviewDuration").textContent =
      state.duration === "unlimited"
        ? "Unlimited"
        : state.duration === "time_limit"
          ? `${Number($("completionDays").value || 0)} days`
          : "—";

    $("reviewPrice").textContent =
      state.pricing === "free"
        ? "Free"
        : state.pricing === "paid"
          ? money(Number($("coursePrice").value || 0))
          : "—";
  }

  async function createCourse() {
    for (let step = 1; step <= 4; step += 1) {
      if (!validateStep(step)) {
        state.step = step;
        render();
        return;
      }
    }

    state.creating = true;
    updateActions();

    const client = await getClient();

    let createdCourseId = "";
    let createdServiceId = "";
    let createdPriceId = "";

    try {
      show("Creating course...", "success");

      const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

      if (sessionError) throw sessionError;

      const userId = sessionData?.session?.user?.id || null;
      const title = $("courseName").value.trim();
      const baseSlug = slugify(title) || `course-${Date.now()}`;
      const courseSlug = await uniqueSlug(
        client,
        "lms_courses",
        baseSlug
      );

      const now = new Date().toISOString();

      const { data: course, error: courseError } = await client
        .from("lms_courses")
        .insert({
          title,
          slug: courseSlug,
          status: "draft",
          created_by: userId,
          updated_by: userId,
          updated_at: now
        })
        .select("id,title,slug,status")
        .single();

      if (courseError) throw courseError;

      createdCourseId = course.id;

      const serviceSlug = await uniqueSlug(
        client,
        "services",
        courseSlug
      );

      const serviceMetadata = {
        lms: {
          delivery_mode: state.delivery,
          completion_window:
            state.duration === "time_limit"
              ? {
                  type: "time_limit",
                  days: Number($("completionDays").value)
                }
              : {
                  type: "unlimited"
                },
          pricing_mode: state.pricing,
          created_from: "admin-lms-creation"
        }
      };

      const { data: service, error: serviceError } = await client
        .from("services")
        .insert({
          name: title,
          slug: serviceSlug,
          product_type: "course",
          active: true,
          taxable: state.pricing === "paid",
          training_course_id: createdCourseId,
          metadata: serviceMetadata,
          updated_at: now
        })
        .select("id")
        .single();

      if (serviceError) throw serviceError;

      createdServiceId = service.id;

      const amount =
        state.pricing === "paid"
          ? Number($("coursePrice").value)
          : 0;

      const { data: price, error: priceError } = await client
        .from("service_prices")
        .insert({
          service_id: createdServiceId,
          amount,
          currency: "USD",
          billing_interval: "one_time",
          active: true,
          metadata: {
            lms_course_id: createdCourseId,
            pricing_mode: state.pricing
          },
          updated_at: now
        })
        .select("id")
        .single();

      if (priceError) throw priceError;

      createdPriceId = price.id;

      show("Course created. Opening the Course Builder...", "success");

      window.setTimeout(() => {
        window.location.href =
          `admin-lms-course-builder.html?course=${encodeURIComponent(createdCourseId)}`;
      }, 350);

    } catch (error) {
      console.error("[Course Creation]", error);

      await rollbackCreation(
        client,
        createdPriceId,
        createdServiceId,
        createdCourseId
      );

      show(
        error?.message || "Unable to create the course.",
        "error"
      );

      state.creating = false;
      updateActions();
    }
  }

  async function rollbackCreation(client, priceId, serviceId, courseId) {
    try {
      if (priceId) {
        await client
          .from("service_prices")
          .delete()
          .eq("id", priceId);
      }

      if (serviceId) {
        await client
          .from("services")
          .delete()
          .eq("id", serviceId);
      }

      if (courseId) {
        await client
          .from("lms_courses")
          .delete()
          .eq("id", courseId);
      }
    } catch (rollbackError) {
      console.error("[Course Creation Rollback]", rollbackError);
    }
  }

  async function uniqueSlug(client, table, base) {
    let candidate = base;
    let attempt = 0;

    while (attempt < 20) {
      const { data, error } = await client
        .from(table)
        .select("id")
        .eq("slug", candidate)
        .limit(1);

      if (error) throw error;

      if (!data?.length) return candidate;

      attempt += 1;
      candidate = `${base}-${attempt + 1}`;
    }

    return `${base}-${Date.now().toString(36)}`;
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 170);
  }

  function money(value) {
    return Number(value || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    });
  }

  function show(text, type = "success") {
    const box = $("creationMessage");
    box.textContent = text;
    box.className = `creation-message show ${type}`;
  }
})();
