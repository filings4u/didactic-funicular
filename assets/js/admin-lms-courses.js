/* screenings4u — admin-lms-courses.js */

(() => {
"use strict";

const PAGE_SIZE = 20;

let client = null;
let courses = [], sections = [], lessons = [], enrollments = [], filtered = [];
let page = 1;
let pendingDeleteCourse = null;

const el = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
    cache();
    bind();

    try {
        client = await waitForClient();
        if (!client) throw new Error("Supabase client was not found.");

        await requireSession();
        await loadAll();
    } catch (error) {
        console.error(error);
        tableError(error.message || "Unable to load courses.");
    }
}

function cache() {
    [
        "courseMetricTotal",
        "courseMetricPublished",
        "courseMetricDraft",
        "courseMetricArchived",
        "courseCount",
        "courseSearch",
        "courseStatus",
        "courseSort",
        "courseClear",
        "courseTableBody",
        "courseResults",
        "coursePrevious",
        "courseNext",
        "coursePage",
        "courseDeleteModal",
        "courseDeleteName",
        "courseDeleteConfirm"
    ].forEach(id => el[id] = document.getElementById(id));
}

function bind() {
    el.courseSearch?.addEventListener("input", () => {
        page = 1;
        render();
    });

    el.courseStatus?.addEventListener("change", () => {
        page = 1;
        render();
    });

    el.courseSort?.addEventListener("change", () => {
        page = 1;
        render();
    });

    el.courseClear?.addEventListener("click", () => {
        el.courseSearch.value = "";
        el.courseStatus.value = "";
        el.courseSort.value = "newest";
        page = 1;
        render();
    });

    el.coursePrevious?.addEventListener("click", () => {
        if (page > 1) {
            page--;
            renderPage();
        }
    });

    el.courseNext?.addEventListener("click", () => {
        const max = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        if (page < max) {
            page++;
            renderPage();
        }
    });

    el.courseTableBody?.addEventListener("click", event => {
        const button = event.target.closest("[data-delete-course]");
        if (!button) return;

        const course = courses.find(item => item.id === button.dataset.deleteCourse);
        if (course) openDeleteModal(course);
    });

    document.querySelectorAll("[data-course-delete-close]").forEach(button => {
        button.addEventListener("click", closeDeleteModal);
    });

    el.courseDeleteConfirm?.addEventListener("click", deleteCourse);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !el.courseDeleteModal?.hidden) {
            closeDeleteModal();
        }
    });
}

async function waitForClient(timeout = 3500) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const c = await getClient();
        if (c?.from) return c;
        await new Promise(resolve => setTimeout(resolve, 75));
    }

    return null;
}

async function getClient() {
    try {
        if (typeof window.getScreenings4uSupabase === "function") {
            const c = await window.getScreenings4uSupabase();
            if (c?.from) return c;
        }
    } catch (_) {}

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

    return null;
}

async function requireSession() {
    if (window.S4UAuth?.requireSession) {
        const session = await window.S4UAuth.requireSession("admin-login.html");
        if (!session) throw new Error("Authentication required.");
        return;
    }

    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    if (!data?.session?.user) {
        location.replace("admin-login.html");
        throw new Error("Authentication required.");
    }
}

async function loadAll() {
    loading();

    const results = await Promise.all([
        client
            .from("lms_courses")
            .select("id,slug,title,short_description,description,status,certificate_enabled,passing_score,navigation_mode,published_at,created_at,updated_at")
            .order("created_at", { ascending: false }),

        client
            .from("lms_sections")
            .select("id,course_id,title,sort_order,is_published"),

        client
            .from("lms_lessons")
            .select("id,section_id,title,status,sort_order"),

        client
            .from("lms_enrollments")
            .select("id,course_id,status")
    ]);

    const errors = results.map(result => result.error).filter(Boolean);
    if (errors.length) throw new Error(errors[0].message);

    [courses, sections, lessons, enrollments] = results.map(result => result.data || []);

    fillStatusFilter();
    updateMetrics();

    page = 1;
    render();
}

function fillStatusFilter() {
    const current = el.courseStatus.value;

    const statuses = [
        ...new Set(
            courses
                .map(course => String(course.status || "").toLowerCase())
                .filter(Boolean)
        )
    ].sort();

    el.courseStatus.innerHTML =
        '<option value="">All statuses</option>' +
        statuses
            .map(status => `<option value="${esc(status)}">${esc(human(status))}</option>`)
            .join("");

    if (statuses.includes(current)) {
        el.courseStatus.value = current;
    }
}

function updateMetrics() {
    const status = value =>
        courses.filter(course =>
            String(course.status || "").toLowerCase() === value
        ).length;

    el.courseMetricTotal.textContent = courses.length.toLocaleString();
    el.courseMetricPublished.textContent = status("published").toLocaleString();
    el.courseMetricDraft.textContent = status("draft").toLocaleString();
    el.courseMetricArchived.textContent = status("archived").toLocaleString();
}

function render() {
    const q = String(el.courseSearch.value || "").trim().toLowerCase();
    const status = el.courseStatus.value;

    filtered = courses.filter(course => {
        const hay = [
            course.title,
            course.slug,
            course.short_description,
            course.description,
            course.status
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return (
            (!q || hay.includes(q)) &&
            (!status || String(course.status).toLowerCase() === status)
        );
    });

    const mode = el.courseSort.value;

    filtered.sort((a, b) => {
        if (mode === "oldest") {
            return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        }

        if (mode === "name") {
            return String(a.title || "").localeCompare(String(b.title || ""));
        }

        if (mode === "updated") {
            return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
        }

        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    el.courseCount.textContent =
        `${filtered.length} Course${filtered.length === 1 ? "" : "s"}`;

    const max = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > max) page = max;

    renderPage();
}

function renderPage() {
    if (!filtered.length) {
        el.courseTableBody.innerHTML =
            '<tr><td colspan="7" class="course-empty">No courses match these filters.</td></tr>';

        el.courseResults.textContent = "0 courses";
        el.coursePage.textContent = "1";
        el.coursePrevious.disabled = true;
        el.courseNext.disabled = true;
        return;
    }

    const start = (page - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);

    el.courseTableBody.innerHTML = rows.map(course => {
        const courseSections = sections.filter(section => section.course_id === course.id);
        const sectionIds = new Set(courseSections.map(section => section.id));
        const lessonCount = lessons.filter(lesson => sectionIds.has(lesson.section_id)).length;
        const enrollmentCount = enrollments.filter(enrollment => enrollment.course_id === course.id).length;

        const status = String(course.status || "").toLowerCase();
        const statusClass = ["published", "draft", "archived"].includes(status)
            ? status
            : "";

        const build =
            `admin-lms-course-builder.html?course=${encodeURIComponent(course.id)}`;

        return `<tr>
            <td>
                <div class="course-name">
                    <strong>${esc(course.title || "Untitled Course")}</strong>
                    <small>${esc(course.short_description || course.slug || "No description")}</small>
                </div>
            </td>

            <td>
                <span class="course-badge ${esc(statusClass)}">
                    ${esc(human(course.status))}
                </span>
            </td>

            <td>${courseSections.length.toLocaleString()}</td>
            <td>${lessonCount.toLocaleString()}</td>
            <td>${enrollmentCount.toLocaleString()}</td>
            <td>${esc(dateTime(course.updated_at || course.created_at))}</td>

            <td>
                <div class="course-row-actions">
                    <button
                        class="course-row-btn danger"
                        type="button"
                        data-delete-course="${esc(course.id)}"
                    >Delete Course</button>

                    <a class="course-row-btn" href="${build}">Edit</a>
                </div>
            </td>
        </tr>`;
    }).join("");

    el.courseResults.textContent =
        `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} ` +
        `of ${filtered.length} course${filtered.length === 1 ? "" : "s"}`;

    el.coursePage.textContent = String(page);
    el.coursePrevious.disabled = page <= 1;
    el.courseNext.disabled = page >= Math.ceil(filtered.length / PAGE_SIZE);
}

function openDeleteModal(course) {
    pendingDeleteCourse = course;

    if (el.courseDeleteName) {
        el.courseDeleteName.textContent = course.title || "this course";
    }

    if (el.courseDeleteModal) {
        el.courseDeleteModal.hidden = false;
    }

    document.body.classList.add("course-delete-open");

    setTimeout(() => {
        el.courseDeleteConfirm?.focus();
    }, 0);
}

function closeDeleteModal() {
    pendingDeleteCourse = null;

    if (el.courseDeleteModal) {
        el.courseDeleteModal.hidden = true;
    }

    document.body.classList.remove("course-delete-open");

    if (el.courseDeleteConfirm) {
        el.courseDeleteConfirm.disabled = false;
        el.courseDeleteConfirm.textContent = "Delete Course";
    }
}

async function deleteCourse() {
    const course = pendingDeleteCourse;
    if (!course) return;

    try {
        el.courseDeleteConfirm.disabled = true;
        el.courseDeleteConfirm.textContent = "Deleting...";

        /*
         * Delete the parent course record.
         * The LMS schema's course-owned curriculum records use cascading
         * foreign keys. If Supabase reports a relationship that prevents
         * deletion, we surface that real database error instead of silently
         * removing only part of the course.
         */
        const { error } = await client
            .from("lms_courses")
            .delete()
            .eq("id", course.id);

        if (error) throw error;

        closeDeleteModal();

        courses = courses.filter(item => item.id !== course.id);
        sections = sections.filter(item => item.course_id !== course.id);
        enrollments = enrollments.filter(item => item.course_id !== course.id);

        const remainingSectionIds = new Set(sections.map(item => item.id));
        lessons = lessons.filter(item => remainingSectionIds.has(item.section_id));

        fillStatusFilter();
        updateMetrics();
        render();

    } catch (error) {
        console.error("[Delete Course]", error);

        el.courseDeleteConfirm.disabled = false;
        el.courseDeleteConfirm.textContent = "Delete Course";

        alert(error.message || "Unable to delete this course.");
    }
}

function loading() {
    el.courseTableBody.innerHTML =
        '<tr><td colspan="7" class="course-loading">Loading courses...</td></tr>';
}

function tableError(text) {
    el.courseTableBody.innerHTML =
        `<tr><td colspan="7" class="course-error">${esc(text)}</td></tr>`;
}

function human(value) {
    return String(value || "—")
        .replace(/_/g, " ")
        .replace(/\b\w/g, character => character.toUpperCase());
}

function dateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
}

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

})();
