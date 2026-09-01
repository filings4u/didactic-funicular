/* ============================================================
   SCREENINGS4U — ADMIN LMS COURSE SETTINGS
   Course image source of truth:
   lms_courses.thumbnail_media_id -> lms_media -> lms-media Storage
   ============================================================ */
(function () {
  "use strict";

  const TABLES = Object.freeze({
    courses: "lms_courses",
    media: "lms_media",
    services: "services",
    prices: "service_prices"
  });

  const STORAGE_BUCKET = "lms-media";

  const state = {
    courseId: "",
    course: null,
    service: null,
    prices: [],
    thumbnailMedia: null,
    thumbnailUrl: "",
    client: null,
    uploadingImage: false
  };

  const $ = (id) => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    try {
      bind();

      state.client = await waitForClient();

      const params =
        new URLSearchParams(location.search);

      state.courseId =
        params.get("course") ||
        params.get("course_id") ||
        params.get("id") ||
        "";

      if (!isUuid(state.courseId)) {
        throw new Error(
          "Open Settings from a course record so the course ID is available."
        );
      }

      links();
      ensureCourseImageUi();

      await load();
      render();
    } catch (error) {
      console.error(
        "[Course Settings]",
        error
      );

      toast(
        error?.message ||
          "Unable to load course settings.",
        "error"
      );

      setLoading(false);
    }
  }

  async function waitForClient(timeout = 5000) {
    const started = Date.now();

    while (Date.now() - started < timeout) {
      const client = await resolveClient();

      if (client?.from) {
        return client;
      }

      await delay(75);
    }

    throw new Error(
      "Supabase client is unavailable."
    );
  }

  async function resolveClient() {
    try {
      if (
        typeof window.getScreenings4uSupabase === "function"
      ) {
        const client =
          await window.getScreenings4uSupabase();

        if (client?.from) {
          return client;
        }
      }
    } catch (_) {}

    return [
      window.screenings4uSupabase,
      window.supabaseClient,
      window.supabaseAdmin,
      window.supabase
    ].find(
      (value) =>
        value &&
        typeof value.from === "function"
    ) || null;
  }

  function db() {
    if (!state.client?.from) {
      throw new Error(
        "Supabase client is unavailable."
      );
    }

    return state.client;
  }

  async function load() {
    setLoading(true);

    const courseResult =
      await db()
        .from(TABLES.courses)
        .select("*")
        .eq("id", state.courseId)
        .single();

    if (courseResult.error) {
      throw courseResult.error;
    }

    state.course =
      courseResult.data;

    await Promise.all([
      loadPricing(),
      loadThumbnail()
    ]);

    setLoading(false);
  }

  async function loadPricing() {
    const serviceResult =
      await db()
        .from(TABLES.services)
        .select("id,name,product_type,active,training_course_id")
        .eq(
          "training_course_id",
          state.courseId
        )
        .eq("active", true)
        .limit(1)
        .maybeSingle();

    if (serviceResult.error) {
      console.warn(
        "[Course Settings] Service lookup unavailable:",
        serviceResult.error
      );

      state.service = null;
      state.prices = [];
      return;
    }

    state.service =
      serviceResult.data || null;

    if (!state.service?.id) {
      state.prices = [];
      return;
    }

    const priceResult =
      await db()
        .from(TABLES.prices)
        .select("*")
        .eq(
          "service_id",
          state.service.id
        )
        .order("active", { ascending: false })
        .order("effective_from", { ascending: false, nullsFirst: false });

    if (priceResult.error) {
      console.warn(
        "[Course Settings] Pricing lookup unavailable:",
        priceResult.error
      );

      state.prices = [];
      return;
    }

    state.prices =
      priceResult.data || [];
  }

  async function loadThumbnail() {
    state.thumbnailMedia = null;
    state.thumbnailUrl = "";

    const mediaId =
      state.course?.thumbnail_media_id || "";

    if (!mediaId) {
      return;
    }

    try {
      if (
        window.S4UCourseImage?.resolveMedia
      ) {
        const resolved =
          await window.S4UCourseImage
            .resolveMedia(mediaId);

        state.thumbnailMedia =
          resolved?.media || null;

        state.thumbnailUrl =
          resolved?.url || "";

        return;
      }

      const { data, error } =
        await db()
          .from(TABLES.media)
          .select("*")
          .eq("id", mediaId)
          .single();

      if (error) {
        throw error;
      }

      state.thumbnailMedia = data;

      state.thumbnailUrl =
        await signedMediaUrl(data);
    } catch (error) {
      console.warn(
        "[Course Settings] Thumbnail lookup:",
        error
      );
    }
  }

  function render() {
    const course =
      state.course || {};

    set(
      "settingsCourseTitle",
      course.title || "Course"
    );

    set(
      "settingsBreadcrumbCourse",
      course.title || "Course"
    );

    const status =
      String(
        course.status || "draft"
      ).toLowerCase();

    set(
      "settingsCourseStatus",
      title(status)
    );

    set(
      "settingsAccessStatus",
      status === "archived"
        ? "Archived"
        : "Active"
    );

    set(
      "settingName",
      course.title || "—"
    );

    set(
      "settingDescription",
      course.short_description ||
        course.description ||
        "—"
    );

    set(
      "settingSlug",
      course.slug || "—"
    );

    set(
      "settingNavigation",
      String(
        course.navigation_mode || "free"
      ).toLowerCase() === "sequential"
        ? "Sequential"
        : "Any order"
    );

    set(
      "settingVideoPercent",
      `${Number(
        course.video_completion_percent ?? 90
      )}%`
    );

    set(
      "settingRequiredLessons",
      course.require_all_required_lessons !== false
        ? "On"
        : "Off"
    );

    set(
      "settingRequiredAssessments",
      course.require_required_assessments !== false
        ? "On"
        : "Off"
    );

    set(
      "settingDownloads",
      course.allow_student_downloads !== false
        ? "On"
        : "Off"
    );

    set(
      "settingPreview",
      course.preview_enabled !== false
        ? "On"
        : "Off"
    );

    set(
      "settingPassingScore",
      `${Number(
        course.passing_score ?? 80
      )}%`
    );

    set(
      "settingCertificate",
      course.certificate_enabled
        ? "Enabled"
        : "Disabled"
    );

    set(
      "settingVisibility",
      status === "published"
        ? "Published course"
        : title(status)
    );

    set(
      "settingSeoTitle",
      course.title ||
        "Uses course title"
    );

    set(
      "settingSeoDescription",
      course.short_description ||
        "Uses course description"
    );

    set(
      "settingPricing",
      pricingText()
    );

    fillModals();
    renderCourseImage();

    if ($("settingsContent")) {
      $("settingsContent").hidden = false;
    }
  }

  function pricingText() {
    if (!state.service) {
      return "No linked service";
    }

    if (!state.prices.length) {
      return state.service.name ||
        "Linked course service";
    }

    const prices =
      state.prices.some((price) => price.active === true)
        ? state.prices.filter((price) => price.active === true)
        : state.prices;

    return prices
      .map((price) => {
        const amount =
          Number(
            price.amount ??
            0
          );

        const currency =
          String(
            price.currency || "USD"
          ).toUpperCase();

        const formatted =
          Number.isFinite(amount)
            ? new Intl.NumberFormat(
                undefined,
                {
                  style: "currency",
                  currency
                }
              ).format(amount)
            : "Price unavailable";

        return formatted;
      })
      .join(" / ");
  }

  function fillModals() {
    const course =
      state.course || {};

    setValue(
      "basicCourseTitle",
      course.title || ""
    );

    setValue(
      "basicShortDescription",
      course.short_description || ""
    );

    setValue(
      "basicDescription",
      course.description || ""
    );

    setValue(
      "basicSlug",
      course.slug || ""
    );

    setValue(
      "contentNavigationMode",
      course.navigation_mode || "free"
    );

    setValue(
      "contentVideoPercent",
      course.video_completion_percent ?? 90
    );

    setChecked(
      "contentRequireLessons",
      course.require_all_required_lessons !== false
    );

    setChecked(
      "contentRequireAssessments",
      course.require_required_assessments !== false
    );

    setChecked(
      "contentDownloads",
      course.allow_student_downloads !== false
    );

    setChecked(
      "contentPreview",
      course.preview_enabled !== false
    );

    setValue(
      "completionPassingScore",
      course.passing_score ?? 80
    );

    setChecked(
      "completionCertificate",
      Boolean(
        course.certificate_enabled
      )
    );
  }

  function bind() {
    document
      .querySelectorAll("[data-course-tab]")
      .forEach((anchor) => {
        anchor.onclick = (event) => {
          event.preventDefault();
          nav(
            anchor.dataset.courseTab
          );
        };
      });

    document
      .querySelectorAll(
        "[data-close-settings-modal]"
      )
      .forEach((button) => {
        button.onclick = closeModals;
      });

    document
      .querySelectorAll("[data-edit-card]")
      .forEach((button) => {
        button.onclick = () =>
          editCard(
            button.dataset.editCard
          );
      });

    $("saveBasicSettings")
      ?.addEventListener(
        "click",
        saveBasic
      );

    $("saveContentSettings")
      ?.addEventListener(
        "click",
        saveContent
      );

    $("saveCompletionSettings")
      ?.addEventListener(
        "click",
        saveCompletion
      );

    document.addEventListener(
      "change",
      async function (event) {
        const input =
          event.target.closest(
            "#courseImageUpload"
          );

        if (!input) return;

        const file =
          input.files?.[0];

        if (!file) return;

        await uploadCourseImage(file);
      }
    );

    document.addEventListener(
      "click",
      async function (event) {
        const removeButton =
          event.target.closest(
            "#removeCourseImageButton"
          );

        if (removeButton) {
          event.preventDefault();
          await removeCourseImage();
          return;
        }

        const chooseButton =
          event.target.closest(
            "#chooseCourseImageButton"
          );

        if (chooseButton) {
          event.preventDefault();
          $("courseImageUpload")?.click();
        }
      }
    );
  }

  function editCard(kind) {
    if (kind === "basic") {
      ensureCourseImageUi();
      renderCourseImage();
      return open(
        "basicSettingsModal"
      );
    }

    if (kind === "content") {
      return open(
        "contentSettingsModal"
      );
    }

    if (kind === "completion") {
      return open(
        "completionSettingsModal"
      );
    }

    if (kind === "payment") {
      toast(
        "Pricing is managed on the linked course service.",
        "success"
      );
      return;
    }

    if (kind === "schedule") {
      toast(
        "Schedule and completion-window configuration is stored with the linked course service.",
        "success"
      );
      return;
    }

    if (kind === "instructors") {
      toast(
        "Instructor assignment needs a confirmed course-instructor relationship before wiring.",
        "error"
      );
      return;
    }

    if (kind === "seo") {
      toast(
        "Course title, slug, and description are currently used for course SEO.",
        "success"
      );
    }
  }

  async function saveBasic() {
    const titleValue =
      $("basicCourseTitle")
        ?.value.trim() || "";

    const slugValue =
      $("basicSlug")
        ?.value.trim() || "";

    if (!titleValue) {
      toast(
        "Course name is required.",
        "error"
      );
      return;
    }

    const payload = {
      title: titleValue,
      slug:
        slugValue ||
        slugify(titleValue),
      short_description:
        $("basicShortDescription")
          ?.value.trim() ||
        null,
      description:
        $("basicDescription")
          ?.value.trim() ||
        null,
      updated_at:
        new Date().toISOString()
    };

    await update(
      payload,
      "Basic information saved."
    );
  }

  async function saveContent() {
    const payload = {
      navigation_mode:
        $("contentNavigationMode")
          ?.value || "free",
      video_completion_percent:
        num(
          $("contentVideoPercent")
            ?.value,
          90
        ),
      require_all_required_lessons:
        $("contentRequireLessons")
          ?.checked !== false,
      require_required_assessments:
        $("contentRequireAssessments")
          ?.checked !== false,
      allow_student_downloads:
        $("contentDownloads")
          ?.checked !== false,
      preview_enabled:
        $("contentPreview")
          ?.checked !== false,
      updated_at:
        new Date().toISOString()
    };

    await update(
      payload,
      "Content settings saved."
    );
  }

  async function saveCompletion() {
    const payload = {
      passing_score:
        num(
          $("completionPassingScore")
            ?.value,
          80
        ),
      certificate_enabled:
        Boolean(
          $("completionCertificate")
            ?.checked
        ),
      updated_at:
        new Date().toISOString()
    };

    await update(
      payload,
      "Completion settings saved."
    );
  }

  async function update(payload, message) {
    try {
      const result =
        await db()
          .from(TABLES.courses)
          .update(payload)
          .eq("id", state.courseId)
          .select("*")
          .single();

      if (result.error) {
        throw result.error;
      }

      state.course =
        result.data;

      closeModals();
      render();

      toast(
        message,
        "success"
      );
    } catch (error) {
      console.error(
        "[Course Settings Save]",
        error
      );

      toast(
        error?.message ||
          "Unable to save settings.",
        "error"
      );
    }
  }

  /* ============================================================
     COURSE IMAGE
     ============================================================ */

  function ensureCourseImageUi() {
    if ($("courseImageManager")) {
      return;
    }

    const modal =
      $("basicSettingsModal");

    const body =
      modal?.querySelector(
        ".settings-modal-body"
      );

    if (!body) {
      return;
    }

    const wrapper =
      document.createElement("section");

    wrapper.id =
      "courseImageManager";

    wrapper.className =
      "settings-course-image-manager";

    wrapper.innerHTML = `
      <div class="settings-image-heading">
        <div>
          <span>COURSE IMAGE</span>
          <strong>Thumbnail / Cover Image</strong>
          <small>
            This is the primary image for this course throughout the LMS.
            Recommended: 1280 × 720, JPG, PNG, or WebP.
          </small>
        </div>
      </div>

      <div class="settings-image-grid">
        <div class="settings-image-current">
          <span class="settings-image-label">Current Image</span>

          <div
            class="settings-image-preview"
            id="courseImagePreview"
          >
            <div class="settings-image-placeholder">
              <strong>No course image</strong>
              <span>Upload a course cover image.</span>
            </div>
          </div>

          <div class="settings-image-current-actions">
            <button
              type="button"
              class="settings-image-button secondary"
              id="chooseCourseImageButton"
            >
              Upload / Replace Image
            </button>

            <button
              type="button"
              class="settings-image-button danger"
              id="removeCourseImageButton"
              hidden
            >
              Remove Image
            </button>
          </div>
        </div>

        <label
          class="settings-image-dropzone"
          for="courseImageUpload"
        >
          <input
            id="courseImageUpload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
          >

          <span class="settings-image-upload-icon">⇧</span>
          <strong>Upload Course Image</strong>
          <span>
            Click to choose a JPG, PNG, or WebP image.
          </span>
          <small>
            The image is stored once in LMS Media and linked to this course.
          </small>
        </label>
      </div>

      <div
        class="settings-image-progress"
        id="courseImageProgress"
        hidden
      >
        <div>
          <span id="courseImageProgressText">Uploading image...</span>
          <strong id="courseImageProgressPercent">0%</strong>
        </div>

        <i>
          <b id="courseImageProgressBar"></b>
        </i>
      </div>

      <div
        class="settings-image-status"
        id="courseImageStatus"
        role="status"
        aria-live="polite"
      ></div>
    `;

    body.appendChild(wrapper);
  }

  async function uploadCourseImage(file) {
    if (
      state.uploadingImage ||
      !file
    ) {
      return;
    }

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp"
      ].includes(file.type)
    ) {
      imageStatus(
        "Use a JPG, PNG, or WebP image.",
        "error"
      );
      resetImageInput();
      return;
    }

    const maxBytes =
      20 * 1024 * 1024;

    if (file.size > maxBytes) {
      imageStatus(
        "Course images must be 20 MB or smaller.",
        "error"
      );
      resetImageInput();
      return;
    }

    state.uploadingImage = true;

    let uploadedPath = "";

    try {
      showImageProgress(
        "Preparing image...",
        5
      );

      const sessionResult =
        await db().auth.getSession();

      if (
        sessionResult.error ||
        !sessionResult.data?.session?.user
      ) {
        throw (
          sessionResult.error ||
          new Error(
            "Authentication required."
          )
        );
      }

      const user =
        sessionResult.data.session.user;

      const filename =
        sanitizeFilename(
          file.name
        );

      uploadedPath =
        `courses/${state.courseId}/cover/` +
        `${uniqueToken()}-${filename}`;

      showImageProgress(
        "Uploading course image...",
        25
      );

      const uploadResult =
        await db().storage
          .from(STORAGE_BUCKET)
          .upload(
            uploadedPath,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                file.type
            }
          );

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      showImageProgress(
        "Creating media record...",
        70
      );

      const mediaResult =
        await db()
          .from(TABLES.media)
          .insert({
            uploaded_by: user.id,
            media_type: "image",
            original_filename:
              file.name,
            storage_bucket:
              STORAGE_BUCKET,
            storage_path:
              uploadedPath,
            mime_type:
              file.type,
            file_size_bytes:
              file.size,
            title:
              file.name.replace(
                /\.[^.]+$/,
                ""
              ),
            metadata: {
              source:
                "admin_lms_course_settings",
              course_id:
                state.courseId,
              purpose:
                "course_thumbnail"
            },
            provider:
              "supabase_storage",
            provider_status:
              "ready"
          })
          .select("*")
          .single();

      if (mediaResult.error) {
        throw mediaResult.error;
      }

      showImageProgress(
        "Applying image to course...",
        88
      );

      const courseResult =
        await db()
          .from(TABLES.courses)
          .update({
            thumbnail_media_id:
              mediaResult.data.id,
            updated_at:
              new Date().toISOString()
          })
          .eq(
            "id",
            state.courseId
          )
          .select("*")
          .single();

      if (courseResult.error) {
        throw courseResult.error;
      }

      state.course =
        courseResult.data;

      state.thumbnailMedia =
        mediaResult.data;

      state.thumbnailUrl =
        await signedMediaUrl(
          mediaResult.data
        );

      window.S4UCourseImage
        ?.clearCache?.();

      showImageProgress(
        "Course image updated.",
        100
      );

      renderCourseImage();

      imageStatus(
        "Course image updated. This image is now the course thumbnail source for the LMS.",
        "success"
      );

      toast(
        "Course image updated.",
        "success"
      );

      setTimeout(
        hideImageProgress,
        900
      );
    } catch (error) {
      console.error(
        "[Course Image Upload]",
        error
      );

      if (uploadedPath) {
        try {
          await db().storage
            .from(STORAGE_BUCKET)
            .remove([
              uploadedPath
            ]);
        } catch (_) {}
      }

      hideImageProgress();

      imageStatus(
        error?.message ||
          "Unable to upload the course image.",
        "error"
      );

      toast(
        error?.message ||
          "Unable to upload the course image.",
        "error"
      );
    } finally {
      state.uploadingImage = false;
      resetImageInput();
    }
  }

  async function removeCourseImage() {
    if (
      !state.course?.thumbnail_media_id
    ) {
      return;
    }

    const confirmed =
      await brandedCourseImageConfirm();

    if (!confirmed) {
      return;
    }

    try {
      const result =
        await db()
          .from(TABLES.courses)
          .update({
            thumbnail_media_id:
              null,
            updated_at:
              new Date().toISOString()
          })
          .eq(
            "id",
            state.courseId
          )
          .select("*")
          .single();

      if (result.error) {
        throw result.error;
      }

      state.course =
        result.data;

      state.thumbnailMedia =
        null;

      state.thumbnailUrl =
        "";

      window.S4UCourseImage
        ?.clearCache?.();

      renderCourseImage();

      imageStatus(
        "Course image removed. The media file remains in LMS Media and can be reused.",
        "success"
      );

      toast(
        "Course image removed.",
        "success"
      );
    } catch (error) {
      console.error(
        "[Remove Course Image]",
        error
      );

      toast(
        error?.message ||
          "Unable to remove the course image.",
        "error"
      );
    }
  }

  function renderCourseImage() {
    ensureCourseImageUi();

    const preview =
      $("courseImagePreview");

    const remove =
      $("removeCourseImageButton");

    if (!preview) {
      return;
    }

    if (
      state.thumbnailUrl
    ) {
      preview.innerHTML = `
        <img
          src="${escAttr(state.thumbnailUrl)}"
          alt="${escAttr(
            state.course?.title
              ? `${state.course.title} course image`
              : "Course image"
          )}"
        >
      `;

      preview.classList.add(
        "has-image"
      );

      if (remove) {
        remove.hidden = false;
      }
    } else {
      preview.innerHTML = `
        <div class="settings-image-placeholder">
          <strong>No course image</strong>
          <span>Upload a course cover image.</span>
        </div>
      `;

      preview.classList.remove(
        "has-image"
      );

      if (remove) {
        remove.hidden = true;
      }
    }

    renderHeaderCourseImage();
  }

  function renderHeaderCourseImage() {
    let image =
      $("settingsHeaderCourseImage");

    const titleRow =
      document.querySelector(
        ".settings-title-row"
      );

    if (
      !image &&
      titleRow
    ) {
      image =
        document.createElement(
          "div"
        );

      image.id =
        "settingsHeaderCourseImage";

      image.className =
        "settings-header-course-image";

      titleRow.prepend(image);
    }

    if (!image) return;

    if (state.thumbnailUrl) {
      image.innerHTML = `
        <img
          src="${escAttr(state.thumbnailUrl)}"
          alt=""
        >
      `;

      image.classList.add(
        "has-image"
      );
    } else {
      image.innerHTML =
        '<span>COURSE</span>';

      image.classList.remove(
        "has-image"
      );
    }
  }

  async function signedMediaUrl(media) {
    if (!media) {
      return "";
    }

    if (
      window.S4UCourseImage
        ?.resolveMedia
    ) {
      const resolved =
        await window.S4UCourseImage
          .resolveMedia(media);

      return resolved?.url || "";
    }

    if (
      media.thumbnail_url &&
      /^https?:\/\//i.test(
        media.thumbnail_url
      )
    ) {
      return media.thumbnail_url;
    }

    if (
      !media.storage_bucket ||
      !media.storage_path
    ) {
      return "";
    }

    const result =
      await db().storage
        .from(
          media.storage_bucket
        )
        .createSignedUrl(
          media.storage_path,
          3600
        );

    if (result.error) {
      throw result.error;
    }

    return result.data
      ?.signedUrl || "";
  }

  function showImageProgress(
    message,
    percent
  ) {
    const wrapper =
      $("courseImageProgress");

    if (!wrapper) return;

    wrapper.hidden = false;

    const safe =
      Math.max(
        0,
        Math.min(
          100,
          Number(percent) || 0
        )
      );

    set(
      "courseImageProgressText",
      message
    );

    set(
      "courseImageProgressPercent",
      `${Math.round(safe)}%`
    );

    if (
      $("courseImageProgressBar")
    ) {
      $("courseImageProgressBar")
        .style.width =
          `${safe}%`;
    }
  }

  function hideImageProgress() {
    const wrapper =
      $("courseImageProgress");

    if (wrapper) {
      wrapper.hidden = true;
    }
  }

  function imageStatus(
    message,
    type
  ) {
    const node =
      $("courseImageStatus");

    if (!node) return;

    node.textContent =
      message || "";

    node.className =
      `settings-image-status ${type || ""}`
        .trim();
  }

  function resetImageInput() {
    if ($("courseImageUpload")) {
      $("courseImageUpload").value = "";
    }
  }

  function brandedCourseImageConfirm() {
    let modal =
      $("settingsImageConfirm");

    if (!modal) {
      modal =
        document.createElement(
          "div"
        );

      modal.id =
        "settingsImageConfirm";

      modal.className =
        "settings-image-confirm";

      modal.hidden = true;

      modal.innerHTML = `
        <div
          class="settings-image-confirm-backdrop"
          data-image-confirm-cancel
        ></div>

        <section
          class="settings-image-confirm-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settingsImageConfirmTitle"
        >
          <header>
            <div>
              <span>COURSE IMAGE</span>
              <h2 id="settingsImageConfirmTitle">
                Remove course image?
              </h2>
              <p>
                The course will no longer have a thumbnail.
                The media file will remain available in LMS Media.
              </p>
            </div>

            <button
              type="button"
              data-image-confirm-cancel
              aria-label="Close"
            >×</button>
          </header>

          <footer>
            <button
              type="button"
              class="settings-image-confirm-secondary"
              data-image-confirm-cancel
            >
              Cancel
            </button>

            <button
              type="button"
              class="settings-image-confirm-danger"
              id="settingsImageConfirmRemove"
            >
              Remove Image
            </button>
          </footer>
        </section>
      `;

      document.body.appendChild(
        modal
      );
    }

    modal.hidden = false;

    return new Promise(
      (resolve) => {
        let settled = false;

        const finish =
          (value) => {
            if (settled) return;
            settled = true;
            modal.hidden = true;
            resolve(value);
          };

        modal
          .querySelectorAll(
            "[data-image-confirm-cancel]"
          )
          .forEach(
            (button) => {
              button.onclick =
                () =>
                  finish(false);
            }
          );

        $("settingsImageConfirmRemove")
          .onclick =
            () =>
              finish(true);
      }
    );
  }

  /* ============================================================
     EXISTING NAVIGATION / MODALS
     ============================================================ */

  function open(id) {
    const node = $(id);

    if (node) {
      node.hidden = false;
    }
  }

  function closeModals() {
    document
      .querySelectorAll(
        ".settings-modal-backdrop"
      )
      .forEach((modal) => {
        modal.hidden = true;
      });
  }

  function links() {
    if ($("settingsPreviewButton")) {
      $("settingsPreviewButton").href =
        `admin-lms-course-preview.html?course=${encodeURIComponent(state.courseId)}`;
    }

    if ($("settingsInviteButton")) {
      $("settingsInviteButton").href =
        `admin-lms-course-participants.html?course=${encodeURIComponent(state.courseId)}&invite=1`;
    }

    if ($("settingsAutomationsButton")) {
      $("settingsAutomationsButton").href =
        `admin-lms-course-engagement.html?course=${encodeURIComponent(state.courseId)}`;
    }
  }

  function nav(tab) {
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

    if (pages[tab]) {
      location.href =
        `${pages[tab]}?course=${encodeURIComponent(state.courseId)}`;
    }
  }

  function setLoading(value) {
    if ($("settingsLoading")) {
      $("settingsLoading").hidden =
        !value;
    }
  }

  function set(id, value) {
    if ($(id)) {
      $(id).textContent =
        value ?? "";
    }
  }

  function setValue(id, value) {
    if ($(id)) {
      $(id).value =
        value ?? "";
    }
  }

  function setChecked(id, value) {
    if ($(id)) {
      $(id).checked =
        Boolean(value);
    }
  }

  function toast(message, type) {
    const node =
      $("settingsToast");

    if (!node) {
      console[
        type === "error"
          ? "error"
          : "log"
      ](message);
      return;
    }

    node.textContent =
      message;

    node.className =
      `settings-toast show ${type || "success"}`;

    clearTimeout(
      toast.timer
    );

    toast.timer =
      setTimeout(
        () =>
          node.classList.remove(
            "show"
          ),
        3300
      );
  }

  function title(value) {
    return String(value || "")
      .replace(
        /[_-]+/g,
        " "
      )
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase()
      );
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
      );
  }

  function num(value, fallback) {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? Math.max(
          0,
          Math.min(
            100,
            number
          )
        )
      : fallback;
  }

  function sanitizeFilename(value) {
    return String(
      value || "course-image"
    )
      .trim()
      .replace(
        /[^a-zA-Z0-9._-]+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      ) || "course-image";
  }

  function uniqueToken() {
    return window.crypto
      ?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(
        String(value || "")
      );
  }

  function escAttr(value) {
    return String(value ?? "")
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

  function delay(ms) {
    return new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          ms
        )
    );
  }
})();
