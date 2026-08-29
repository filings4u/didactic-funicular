/* screenings4u — admin-lms-courses.js */
(() => {
"use strict";

const PAGE_SIZE = 20;
let client = null;
let courses = [], sections = [], lessons = [], enrollments = [], filtered = [];
let page = 1;
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
    ["courseMetricTotal","courseMetricPublished","courseMetricDraft","courseMetricArchived","courseCount",
     "courseSearch","courseStatus","courseSort","courseClear","courseTableBody","courseResults",
     "coursePrevious","courseNext","coursePage"].forEach(id => el[id] = document.getElementById(id));
}

function bind() {
    el.courseSearch?.addEventListener("input", () => { page = 1; render(); });
    el.courseStatus?.addEventListener("change", () => { page = 1; render(); });
    el.courseSort?.addEventListener("change", () => { page = 1; render(); });
    el.courseClear?.addEventListener("click", () => {
        el.courseSearch.value = "";
        el.courseStatus.value = "";
        el.courseSort.value = "newest";
        page = 1;
        render();
    });
    el.coursePrevious?.addEventListener("click", () => { if(page > 1){ page--; renderPage(); }});
    el.courseNext?.addEventListener("click", () => {
        const max = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        if(page < max){ page++; renderPage(); }
    });
}

async function waitForClient(timeout=3500) {
    const start=Date.now();
    while(Date.now()-start<timeout){
        const c=await getClient();
        if(c?.from)return c;
        await new Promise(r=>setTimeout(r,75));
    }
    return null;
}

async function getClient() {
    try {
        if(typeof window.getScreenings4uSupabase==="function"){
            const c=await window.getScreenings4uSupabase();
            if(c?.from)return c;
        }
    } catch(_){}
    if(window.screenings4uSupabase?.from)return window.screenings4uSupabase;
    if(window.supabaseClient?.from)return window.supabaseClient;
    if(window.supabase?.createClient && window.SCREENINGS4U_SUPABASE_URL && window.SCREENINGS4U_SUPABASE_ANON_KEY){
        window.supabaseClient=window.supabase.createClient(window.SCREENINGS4U_SUPABASE_URL,window.SCREENINGS4U_SUPABASE_ANON_KEY);
        return window.supabaseClient;
    }
    return null;
}

async function requireSession() {
    if(window.S4UAuth?.requireSession){
        const session=await window.S4UAuth.requireSession("admin-login.html");
        if(!session)throw new Error("Authentication required.");
        return;
    }
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    if(!data?.session?.user){location.replace("admin-login.html");throw new Error("Authentication required.");}
}

async function loadAll() {
    loading();
    const results = await Promise.all([
        client.from("lms_courses").select("id,slug,title,short_description,description,status,certificate_enabled,passing_score,navigation_mode,published_at,created_at,updated_at").order("created_at",{ascending:false}),
        client.from("lms_sections").select("id,course_id,title,sort_order,is_published"),
        client.from("lms_lessons").select("id,section_id,title,status,sort_order"),
        client.from("lms_enrollments").select("id,course_id,status")
    ]);
    const errors = results.map(r => r.error).filter(Boolean);
    if(errors.length)throw new Error(errors[0].message);
    [courses,sections,lessons,enrollments] = results.map(r => r.data || []);
    fillStatusFilter();
    updateMetrics();
    page = 1;
    render();
}

function fillStatusFilter() {
    const current = el.courseStatus.value;
    const statuses=[...new Set(courses.map(c=>String(c.status||"").toLowerCase()).filter(Boolean))].sort();
    el.courseStatus.innerHTML='<option value="">All statuses</option>'+statuses.map(s=>`<option value="${esc(s)}">${esc(human(s))}</option>`).join("");
    if(statuses.includes(current))el.courseStatus.value=current;
}

function updateMetrics() {
    const status = s => courses.filter(c => String(c.status||"").toLowerCase()===s).length;
    el.courseMetricTotal.textContent = courses.length.toLocaleString();
    el.courseMetricPublished.textContent = status("published").toLocaleString();
    el.courseMetricDraft.textContent = status("draft").toLocaleString();
    el.courseMetricArchived.textContent = status("archived").toLocaleString();
}

function render() {
    const q=String(el.courseSearch.value||"").trim().toLowerCase();
    const status=el.courseStatus.value;
    filtered=courses.filter(c=>{
        const hay=[c.title,c.slug,c.short_description,c.description,c.status].filter(Boolean).join(" ").toLowerCase();
        return (!q||hay.includes(q)) && (!status||String(c.status).toLowerCase()===status);
    });

    const mode=el.courseSort.value;
    filtered.sort((a,b)=>{
        if(mode==="oldest")return new Date(a.created_at||0)-new Date(b.created_at||0);
        if(mode==="name")return String(a.title||"").localeCompare(String(b.title||""));
        if(mode==="updated")return new Date(b.updated_at||0)-new Date(a.updated_at||0);
        return new Date(b.created_at||0)-new Date(a.created_at||0);
    });

    el.courseCount.textContent=`${filtered.length} Course${filtered.length===1?"":"s"}`;
    const max=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)); if(page>max)page=max;
    renderPage();
}

function renderPage() {
    if(!filtered.length){
        el.courseTableBody.innerHTML='<tr><td colspan="7" class="course-empty">No courses match these filters.</td></tr>';
        el.courseResults.textContent="0 courses";el.coursePage.textContent="1";el.coursePrevious.disabled=true;el.courseNext.disabled=true;return;
    }
    const start=(page-1)*PAGE_SIZE, rows=filtered.slice(start,start+PAGE_SIZE);

    el.courseTableBody.innerHTML=rows.map(c=>{
        const courseSections=sections.filter(s=>s.course_id===c.id);
        const sectionIds=new Set(courseSections.map(s=>s.id));
        const lessonCount=lessons.filter(l=>sectionIds.has(l.section_id)).length;
        const enrollmentCount=enrollments.filter(e=>e.course_id===c.id).length;
        const status=String(c.status||"").toLowerCase();
        const statusClass=["published","draft","archived"].includes(status)?status:"";
        const manage=`admin-lms-course-manager.html?course=${encodeURIComponent(c.id)}`;
        const build=`admin-lms-course-builder.html?course=${encodeURIComponent(c.id)}`;
        return `<tr>
        <td><div class="course-name"><strong>${esc(c.title||"Untitled Course")}</strong><small>${esc(c.short_description||c.slug||"No description")}</small></div></td>
        <td><span class="course-badge ${esc(statusClass)}">${esc(human(c.status))}</span></td>
        <td>${courseSections.length.toLocaleString()}</td>
        <td>${lessonCount.toLocaleString()}</td>
        <td>${enrollmentCount.toLocaleString()}</td>
        <td>${esc(dateTime(c.updated_at||c.created_at))}</td>
        <td><div class="course-row-actions"><a class="course-row-btn primary" href="${manage}">Manage</a><a class="course-row-btn" href="${build}">Edit</a></div></td>
        </tr>`;
    }).join("");

    el.courseResults.textContent=`Showing ${start+1}–${Math.min(start+PAGE_SIZE,filtered.length)} of ${filtered.length} course${filtered.length===1?"":"s"}`;
    el.coursePage.textContent=String(page);
    el.coursePrevious.disabled=page<=1;
    el.courseNext.disabled=page>=Math.ceil(filtered.length/PAGE_SIZE);
}

function loading(){el.courseTableBody.innerHTML='<tr><td colspan="7" class="course-loading">Loading courses...</td></tr>';}
function tableError(text){el.courseTableBody.innerHTML=`<tr><td colspan="7" class="course-error">${esc(text)}</td></tr>`;}
function human(v){return String(v||"—").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());}
function dateTime(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?"—":d.toLocaleString(undefined,{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
})();
