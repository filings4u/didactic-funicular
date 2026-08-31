/* ============================================================
   SCREENINGS4U — ADMIN LMS COURSE BUILDER
   Course workspace + draggable curriculum
   ============================================================ */

(function () {
  "use strict";

  const TABLES = Object.freeze({
    courses: "lms_courses",
    sections: "lms_sections",
    lessons: "lms_lessons"
  });

  const state = {
    courseId: "",
    course: null,
    sections: [],
    activeSectionId: "",
    editingSectionId: "",
    pendingLessonType: "article",
    dragging: null
  };

  const $ = (id) => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", initialize);

  async function initialize() {
    try {
      bindStaticUi();

      const params = new URLSearchParams(window.location.search);
      state.courseId =
        params.get("course") ||
        params.get("course_id") ||
        params.get("id") ||
        "";

      if (!state.courseId) {
        showToast("Open this builder from a course record so a course ID is available.", "error");
        setLoading(false);
        return;
      }

      await loadCourse();
      render();
    } catch (error) {
      console.error("[Course Builder]", error);
      showToast(error?.message || "Unable to load course builder.", "error");
      setLoading(false);
    }
  }

  function db() {
    const candidates = [
      window.supabaseClient,
      window.supabaseAdmin,
      window.supabase
    ];

    const client = candidates.find(
      (value) => value && typeof value.from === "function"
    );

    if (!client) {
      throw new Error("Supabase client is unavailable.");
    }

    return client;
  }

  function bindStaticUi() {
    $("addContentButton")?.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleMenu("addContentMenu", "addContentButton");
    });

    $("courseMoreButton")?.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleMenu("courseMoreMenu", "courseMoreButton");
    });

    document.addEventListener("click", function () {
      closeMenu("addContentMenu", "addContentButton");
      closeMenu("courseMoreMenu", "courseMoreButton");
    });

    $("addContentMenu")?.addEventListener("click", function (event) {
      event.stopPropagation();

      const button = event.target.closest("[data-add-kind]");
      if (!button) return;

      const kind = button.dataset.addKind || "";
      closeMenu("addContentMenu", "addContentButton");

      if (kind === "section") {
        openSectionModal();
        return;
      }

      if (kind === "import") {
        showToast("Import UI is ready for the next wiring pass.", "success");
        return;
      }

      openLessonModal(kind);
    });

    $("emptyAddSectionButton")?.addEventListener("click", openSectionModal);

    document.querySelectorAll("[data-close-modal]").forEach(function (button) {
      button.addEventListener("click", closeModals);
    });

    $("saveSectionButton")?.addEventListener("click", saveSection);
    $("saveLessonButton")?.addEventListener("click", saveLesson);

    $("sectionModal")?.addEventListener("click", function (event) {
      if (event.target === event.currentTarget) closeModals();
    });

    $("lessonModal")?.addEventListener("click", function (event) {
      if (event.target === event.currentTarget) closeModals();
    });

    document.querySelectorAll("[data-course-tab]").forEach(function (tab) {
      tab.addEventListener("click", function (event) {
        event.preventDefault();
        const target = tab.dataset.courseTab;

        const destinations = {
          overview: "admin-lms-course-overview.html",
          content: "admin-lms-course-builder.html",
          participants: "admin-lms-course-participants.html",
          settings: "admin-lms-course-settings.html",
          engagement: "admin-lms-course-engagement.html"
        };

        const page = destinations[target];
        if (!page) return;

        window.location.href =
          `${page}?course=${encodeURIComponent(state.courseId)}`;
      });
    });

    $("participantsButton")?.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.href =
        `admin-lms-course-participants.html?course=${encodeURIComponent(state.courseId)}`;
    });

    $("previewCourseButton")?.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.href =
        `admin-lms-course-preview.html?course=${encodeURIComponent(state.courseId)}`;
    });

    $("archiveCourseButton")?.addEventListener("click", archiveCourse);
    $("duplicateCourseButton")?.addEventListener("click", duplicateCoursePlaceholder);

    $("createWithAiButton")?.addEventListener("click", aiPlaceholder);
    $("aiTutorButton")?.addEventListener("click", aiPlaceholder);
  }

  function toggleMenu(menuId, triggerId) {
    const menu = $(menuId);
    const trigger = $(triggerId);
    if (!menu || !trigger) return;

    const opening = menu.hidden;
    menu.hidden = !opening;
    trigger.setAttribute("aria-expanded", opening ? "true" : "false");
  }

  function closeMenu(menuId, triggerId) {
    const menu = $(menuId);
    const trigger = $(triggerId);

    if (menu) menu.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }

  async function loadCourse() {
    setLoading(true);

    const { data: course, error: courseError } = await db()
      .from(TABLES.courses)
      .select("*")
      .eq("id", state.courseId)
      .single();

    if (courseError) throw courseError;

    const { data: sections, error: sectionError } = await db()
      .from(TABLES.sections)
      .select(`
        *,
        lms_lessons (
          *
        )
      `)
      .eq("course_id", state.courseId)
      .order("sort_order", { ascending: true });

    if (sectionError) throw sectionError;

    state.course = course;
    state.sections = (sections || []).map(function (section) {
      return {
        ...section,
        lms_lessons: (section.lms_lessons || []).sort(function (a, b) {
          return number(a.sort_order) - number(b.sort_order);
        })
      };
    });

    state.activeSectionId =
      state.activeSectionId ||
      state.sections[0]?.id ||
      "";

    setLoading(false);
  }

  function render() {
    renderCourseHeader();
    renderCurriculum();
    populateSectionSelect();
  }

  function renderCourseHeader() {
    const course = state.course || {};
    const title = course.title || "Course";
    const status = String(course.status || "draft");

    setText("courseTitle", title);
    setText("courseBreadcrumb", title);
    setText(
      "courseStatusBadge",
      status.charAt(0).toUpperCase() + status.slice(1)
    );

    const statusBadge = $("courseStatusBadge");
    if (statusBadge) {
      statusBadge.classList.toggle("live", status === "published");
    }
  }

  function renderCurriculum() {
    const target = $("courseCurriculum");
    const empty = $("courseEmpty");
    if (!target || !empty) return;

    if (!state.sections.length) {
      target.hidden = true;
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    target.hidden = false;

    target.innerHTML = state.sections
      .map(sectionTemplate)
      .join("");

    bindCurriculumUi();
  }

  function sectionTemplate(section, sectionIndex) {
    const lessons = section.lms_lessons || [];
    const selected = state.activeSectionId === section.id;

    return `
      <article
        class="curriculum-section${selected ? " selected" : ""}"
        data-section-id="${esc(section.id)}"
        draggable="true"
      >
        <header class="curriculum-section-header">
          <span class="drag-handle" aria-hidden="true">⋮⋮</span>

          <div class="curriculum-section-copy">
            <div class="curriculum-section-title">
              ${esc(section.title || `Section ${sectionIndex + 1}`)}
            </div>
            <div class="curriculum-section-meta">
              ${lessons.length} step${lessons.length === 1 ? "" : "s"}
            </div>
          </div>

          <div class="curriculum-section-actions">
            ${selected ? `<button type="button" class="curriculum-action primary" data-edit-section="${esc(section.id)}">Edit</button>` : ""}
            <button type="button" class="curriculum-icon-action" data-section-more="${esc(section.id)}" aria-label="Section actions">•••</button>
            <button type="button" class="curriculum-icon-action" data-toggle-section="${esc(section.id)}" aria-label="Toggle section">⌃</button>
          </div>
        </header>

        <div class="curriculum-lessons" data-lessons-for="${esc(section.id)}">
          ${lessons.map(lessonTemplate).join("")}
        </div>

        <div class="section-add-row">
          <button type="button" data-add-lesson="${esc(section.id)}">＋ Add Step</button>
          <button type="button" data-import-lesson="${esc(section.id)}">⇩ Import Step</button>
        </div>
      </article>
    `;
  }

  function lessonTemplate(lesson) {
    const type = normalizeLessonType(lesson.lesson_type);

    return `
      <article
        class="curriculum-lesson"
        data-lesson-id="${esc(lesson.id)}"
        data-section-id="${esc(lesson.section_id)}"
        draggable="true"
      >
        <span class="drag-handle" aria-hidden="true">⋮⋮</span>

        <div class="curriculum-lesson-copy">
          <div class="curriculum-lesson-title">
            ${esc(lesson.title || "Untitled step")}
            <span class="lesson-type-badge">${esc(typeLabel(type))}</span>
          </div>

          <div class="curriculum-lesson-meta">
            ${lesson.is_published === false ? "Draft" : "Published"}
            ${lesson.is_required ? " · Required" : ""}
          </div>
        </div>

        <div class="curriculum-lesson-actions">
          <button type="button" class="curriculum-action" data-open-lesson="${esc(lesson.id)}">
            Edit
          </button>
          <button type="button" class="curriculum-icon-action" data-lesson-more="${esc(lesson.id)}" aria-label="Lesson actions">•••</button>
        </div>
      </article>
    `;
  }

  function bindCurriculumUi() {
    document.querySelectorAll("[data-section-id].curriculum-section").forEach(function (section) {
      section.addEventListener("click", function (event) {
        if (event.target.closest("button")) return;
        state.activeSectionId = section.dataset.sectionId || "";
        renderCurriculum();
      });

      section.addEventListener("dragstart", beginSectionDrag);
      section.addEventListener("dragover", overSectionDrag);
      section.addEventListener("dragleave", clearDragTarget);
      section.addEventListener("drop", dropSection);
      section.addEventListener("dragend", endDrag);
    });

    document.querySelectorAll("[data-lesson-id].curriculum-lesson").forEach(function (lesson) {
      lesson.addEventListener("dragstart", beginLessonDrag);
      lesson.addEventListener("dragover", overLessonDrag);
      lesson.addEventListener("dragleave", clearDragTarget);
      lesson.addEventListener("drop", dropLesson);
      lesson.addEventListener("dragend", endDrag);
    });

    document.querySelectorAll("[data-add-lesson]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.activeSectionId = button.dataset.addLesson || "";
        openLessonModal("article");
      });
    });

    document.querySelectorAll("[data-edit-section]").forEach(function (button) {
      button.addEventListener("click", function () {
        openSectionModal(button.dataset.editSection || "");
      });
    });

    document.querySelectorAll("[data-open-lesson]").forEach(function (button) {
      button.addEventListener("click", function () {
        const lessonId = button.dataset.openLesson || "";
        window.location.href =
          `admin-lms-lesson-editor.html?course=${encodeURIComponent(state.courseId)}&lesson=${encodeURIComponent(lessonId)}`;
      });
    });

    document.querySelectorAll("[data-toggle-section]").forEach(function (button) {
      button.addEventListener("click", function () {
        const id = button.dataset.toggleSection || "";
        const container = document.querySelector(`[data-lessons-for="${cssEsc(id)}"]`);
        if (container) container.hidden = !container.hidden;
      });
    });

    document.querySelectorAll("[data-import-lesson]").forEach(function (button) {
      button.addEventListener("click", function () {
        showToast("Import Step is ready for the next wiring pass.", "success");
      });
    });

    document.querySelectorAll("[data-section-more], [data-lesson-more]").forEach(function (button) {
      button.addEventListener("click", function () {
        showToast("Duplicate, move, delete, prerequisite, and drip controls belong in this action menu.", "success");
      });
    });
  }

  function beginSectionDrag(event) {
    if (event.target.closest(".curriculum-lesson")) {
      event.preventDefault();
      return;
    }

    const section = event.currentTarget;
    state.dragging = {
      kind: "section",
      id: section.dataset.sectionId
    };

    section.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  }

  function overSectionDrag(event) {
    if (state.dragging?.kind !== "section") return;
    event.preventDefault();
    event.currentTarget.classList.add("drag-target");
  }

  async function dropSection(event) {
    if (state.dragging?.kind !== "section") return;

    event.preventDefault();
    const targetId = event.currentTarget.dataset.sectionId;
    const sourceId = state.dragging.id;

    if (!sourceId || !targetId || sourceId === targetId) {
      endDrag();
      return;
    }

    reorderArray(state.sections, sourceId, targetId);
    renderCurriculum();

    try {
      await persistSectionOrder();
      showToast("Section order saved.", "success");
    } catch (error) {
      console.error(error);
      await loadCourse();
      render();
      showToast("Section order could not be saved.", "error");
    } finally {
      endDrag();
    }
  }

  function beginLessonDrag(event) {
    event.stopPropagation();

    const lesson = event.currentTarget;

    state.dragging = {
      kind: "lesson",
      id: lesson.dataset.lessonId,
      sectionId: lesson.dataset.sectionId
    };

    lesson.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  }

  function overLessonDrag(event) {
    if (state.dragging?.kind !== "lesson") return;

    const target = event.currentTarget;
    if (target.dataset.sectionId !== state.dragging.sectionId) return;

    event.preventDefault();
    event.stopPropagation();
    target.classList.add("drag-target");
  }

  async function dropLesson(event) {
    if (state.dragging?.kind !== "lesson") return;

    event.preventDefault();
    event.stopPropagation();

    const targetId = event.currentTarget.dataset.lessonId;
    const sectionId = event.currentTarget.dataset.sectionId;
    const sourceId = state.dragging.id;

    if (
      !sourceId ||
      !targetId ||
      sourceId === targetId ||
      sectionId !== state.dragging.sectionId
    ) {
      endDrag();
      return;
    }

    const section = state.sections.find((item) => item.id === sectionId);
    if (!section) return;

    reorderArray(section.lms_lessons, sourceId, targetId);
    renderCurriculum();

    try {
      await persistLessonOrder(section);
      showToast("Lesson order saved.", "success");
    } catch (error) {
      console.error(error);
      await loadCourse();
      render();
      showToast("Lesson order could not be saved.", "error");
    } finally {
      endDrag();
    }
  }

  function clearDragTarget(event) {
    event.currentTarget.classList.remove("drag-target");
  }

  function endDrag() {
    document.querySelectorAll(".dragging, .drag-target").forEach(function (node) {
      node.classList.remove("dragging", "drag-target");
    });

    state.dragging = null;
  }

  function reorderArray(items, sourceId, targetId) {
    const from = items.findIndex((item) => item.id === sourceId);
    const to = items.findIndex((item) => item.id === targetId);

    if (from < 0 || to < 0) return;

    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
  }

  async function persistSectionOrder() {
    for (let index = 0; index < state.sections.length; index += 1) {
      const section = state.sections[index];
      const { error } = await db()
        .from(TABLES.sections)
        .update({ sort_order: index + 1 })
        .eq("id", section.id);

      if (error) throw error;
      section.sort_order = index + 1;
    }
  }

  async function persistLessonOrder(section) {
    const lessons = section.lms_lessons || [];

    for (let index = 0; index < lessons.length; index += 1) {
      const lesson = lessons[index];
      const { error } = await db()
        .from(TABLES.lessons)
        .update({ sort_order: index + 1 })
        .eq("id", lesson.id);

      if (error) throw error;
      lesson.sort_order = index + 1;
    }
  }

  function openSectionModal(sectionId = "") {
    state.editingSectionId = sectionId;

    const section = state.sections.find((item) => item.id === sectionId);

    setText(
      "sectionModalTitle",
      section ? "Edit section" : "Add section"
    );

    $("sectionTitleInput").value = section?.title || "";
    $("sectionDescriptionInput").value = section?.description || "";

    $("sectionModal").hidden = false;
    setTimeout(() => $("sectionTitleInput")?.focus(), 0);
  }

  function openLessonModal(kind = "article") {
    if (!state.sections.length) {
      showToast("Add a section before creating a lesson.", "error");
      openSectionModal();
      return;
    }

    state.pendingLessonType = normalizeLessonType(kind);

    populateSectionSelect();

    $("lessonTitleInput").value = "";
    $("lessonTypeSelect").value = state.pendingLessonType;
    $("lessonRequiredInput").checked = true;

    if (state.activeSectionId) {
      $("lessonSectionSelect").value = state.activeSectionId;
    }

    $("lessonModal").hidden = false;
    setTimeout(() => $("lessonTitleInput")?.focus(), 0);
  }

  function closeModals() {
    $("sectionModal").hidden = true;
    $("lessonModal").hidden = true;
  }

  async function saveSection() {
    const title = $("sectionTitleInput").value.trim();
    const description = $("sectionDescriptionInput").value.trim();

    if (!title) {
      showToast("Enter a section name.", "error");
      return;
    }

    const button = $("saveSectionButton");
    button.disabled = true;

    try {
      let result;

      if (state.editingSectionId) {
        result = await db()
          .from(TABLES.sections)
          .update({
            title,
            description: description || null
          })
          .eq("id", state.editingSectionId)
          .select("*")
          .single();
      } else {
        result = await db()
          .from(TABLES.sections)
          .insert({
            course_id: state.courseId,
            title,
            description: description || null,
            sort_order: state.sections.length + 1,
            is_published: true
          })
          .select("*")
          .single();
      }

      if (result.error) throw result.error;

      closeModals();
      await loadCourse();
      state.activeSectionId = result.data.id;
      render();

      showToast(
        state.editingSectionId ? "Section updated." : "Section added.",
        "success"
      );

      state.editingSectionId = "";
    } catch (error) {
      console.error(error);
      showToast(error?.message || "Unable to save section.", "error");
    } finally {
      button.disabled = false;
    }
  }

  async function saveLesson() {
    const title = $("lessonTitleInput").value.trim();
    const sectionId = $("lessonSectionSelect").value;
    const lessonType = normalizeLessonType($("lessonTypeSelect").value);
    const required = $("lessonRequiredInput").checked;

    if (!title) {
      showToast("Enter a step name.", "error");
      return;
    }

    const section = state.sections.find((item) => item.id === sectionId);

    if (!section) {
      showToast("Choose a section.", "error");
      return;
    }

    const button = $("saveLessonButton");
    button.disabled = true;

    try {
      const { data, error } = await db()
        .from(TABLES.lessons)
        .insert({
          course_id: state.courseId,
          section_id: sectionId,
          title,
          lesson_type: lessonType,
          sort_order: (section.lms_lessons || []).length + 1,
          is_required: required,
          is_published: false
        })
        .select("*")
        .single();

      if (error) throw error;

      closeModals();
      await loadCourse();
      state.activeSectionId = sectionId;
      render();

      showToast("Step created. Opening the lesson editor...", "success");

      window.setTimeout(function () {
        window.location.href =
          `admin-lms-lesson-editor.html?course=${encodeURIComponent(state.courseId)}&lesson=${encodeURIComponent(data.id)}`;
      }, 350);
    } catch (error) {
      console.error(error);
      showToast(error?.message || "Unable to create lesson.", "error");
    } finally {
      button.disabled = false;
    }
  }

  function populateSectionSelect() {
    const select = $("lessonSectionSelect");
    if (!select) return;

    select.innerHTML = state.sections.map(function (section) {
      return `<option value="${esc(section.id)}">${esc(section.title || "Section")}</option>`;
    }).join("");
  }

  async function archiveCourse() {
    if (!state.courseId) return;

    const confirmed = window.confirm(
      "Archive this course? Learners should no longer see it as an active published course."
    );

    if (!confirmed) return;

    try {
      const { error } = await db()
        .from(TABLES.courses)
        .update({ status: "archived" })
        .eq("id", state.courseId);

      if (error) throw error;

      state.course.status = "archived";
      renderCourseHeader();
      closeMenu("courseMoreMenu", "courseMoreButton");
      showToast("Course archived.", "success");
    } catch (error) {
      console.error(error);
      showToast(error?.message || "Unable to archive course.", "error");
    }
  }

  function duplicateCoursePlaceholder() {
    closeMenu("courseMoreMenu", "courseMoreButton");
    showToast("Duplicate Course will copy the course, sections, lessons, assets and quizzes in the next data pass.", "success");
  }

  function aiPlaceholder() {
    showToast("AI authoring is positioned in the UI; connect it after the core curriculum workflow is finalized.", "success");
  }

  function normalizeLessonType(value) {
    const type = String(value || "article").toLowerCase();

    const aliases = {
      text: "article",
      document: "article",
      download: "file"
    };

    return aliases[type] || type;
  }

  function typeLabel(type) {
    const labels = {
      article: "Article",
      video: "Video",
      quiz: "Quiz",
      file: "File",
      embed: "Embed"
    };

    return labels[type] || "Lesson";
  }

  function setLoading(show) {
    const loading = $("courseLoading");
    if (loading) loading.hidden = !show;
  }

  function showToast(message, type) {
    const toast = $("courseToast");
    if (!toast) return;

    toast.textContent = message;
    toast.className = `course-toast show ${type || "success"}`;

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 3600);
  }

  function setText(id, value) {
    const node = $(id);
    if (node) node.textContent = value ?? "";
  }

  function number(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character];
    });
  }

  function cssEsc(value) {
    if (window.CSS?.escape) return window.CSS.escape(String(value));
    return String(value).replace(/["\\]/g, "\\$&");
  }
})();
