(function(){
"use strict";
const TABLES={courses:"lms_courses",products:"products"};
const state={courseId:"",course:null,products:[]};
const $=id=>document.getElementById(id);
document.addEventListener("DOMContentLoaded",init);

function db(){const c=[window.supabaseClient,window.supabaseAdmin,window.supabase].find(v=>v&&typeof v.from==="function");if(!c)throw new Error("Supabase client is unavailable.");return c}

async function init(){
  try{
    bind();
    const p=new URLSearchParams(location.search);
    state.courseId=p.get("course")||p.get("course_id")||p.get("id")||"";
    if(!state.courseId)throw new Error("Open Settings from a course record so the course ID is available.");
    links();
    await load();
    render();
  }catch(e){console.error("[Course Settings]",e);toast(e?.message||"Unable to load course settings.","error");setLoading(false)}
}

async function load(){
  setLoading(true);
  const [courseRes,productRes]=await Promise.all([
    db().from(TABLES.courses).select("*").eq("id",state.courseId).single(),
    db().from(TABLES.products).select("id,name,price,is_active,training_course_id").eq("training_course_id",state.courseId)
  ]);
  if(courseRes.error)throw courseRes.error;
  state.course=courseRes.data;
  if(productRes.error){console.warn("[Course Settings] Product lookup unavailable:",productRes.error);state.products=[]}else state.products=productRes.data||[];
  setLoading(false);
}

function render(){
  const c=state.course||{};
  set("settingsCourseTitle",c.title||"Course");set("settingsBreadcrumbCourse",c.title||"Course");
  const st=String(c.status||"draft").toLowerCase();set("settingsCourseStatus",title(st));set("settingsAccessStatus",st==="archived"?"Archived":"Active");
  set("settingName",c.title||"—");set("settingDescription",c.short_description||c.description||"—");set("settingSlug",c.slug||"—");
  set("settingNavigation",String(c.navigation_mode||"free").toLowerCase()==="sequential"?"Sequential":"Any order");
  set("settingVideoPercent",`${Number(c.video_completion_percent??90)}%`);
  set("settingRequiredLessons",c.require_all_required_lessons!==false?"On":"Off");
  set("settingRequiredAssessments",c.require_required_assessments!==false?"On":"Off");
  set("settingDownloads",c.allow_student_downloads!==false?"On":"Off");
  set("settingPreview",c.preview_enabled!==false?"On":"Off");
  set("settingPassingScore",`${Number(c.passing_score??80)}%`);
  set("settingCertificate",c.certificate_enabled?"Enabled":"Disabled");
  set("settingVisibility",st==="published"?"Published course":title(st));
  set("settingSeoTitle",c.title||"Uses course title");set("settingSeoDescription",c.short_description||"Uses course description");
  set("settingPricing",pricingText());
  fillModals();
  $("settingsContent").hidden=false;
}

function pricingText(){
  if(!state.products.length)return "No linked product";
  return state.products.map(p=>{
    const price=Number(p.price);
    const amount=Number.isFinite(price)?new Intl.NumberFormat(undefined,{style:"currency",currency:"USD"}).format(price):"Price unavailable";
    return `${amount}${p.name?` · ${p.name}`:""}`;
  }).join(" / ");
}

function fillModals(){
  const c=state.course||{};
  $("basicCourseTitle").value=c.title||"";$("basicShortDescription").value=c.short_description||"";$("basicDescription").value=c.description||"";$("basicSlug").value=c.slug||"";
  $("contentNavigationMode").value=c.navigation_mode||"free";$("contentVideoPercent").value=c.video_completion_percent??90;
  $("contentRequireLessons").checked=c.require_all_required_lessons!==false;$("contentRequireAssessments").checked=c.require_required_assessments!==false;
  $("contentDownloads").checked=c.allow_student_downloads!==false;$("contentPreview").checked=c.preview_enabled!==false;
  $("completionPassingScore").value=c.passing_score??80;$("completionCertificate").checked=!!c.certificate_enabled;
}

function bind(){
  document.querySelectorAll("[data-course-tab]").forEach(a=>a.onclick=e=>{e.preventDefault();nav(a.dataset.courseTab)});
  document.querySelectorAll("[data-close-settings-modal]").forEach(b=>b.onclick=closeModals);
  document.querySelectorAll("[data-edit-card]").forEach(b=>b.onclick=()=>editCard(b.dataset.editCard));
  $("saveBasicSettings").onclick=saveBasic;$("saveContentSettings").onclick=saveContent;$("saveCompletionSettings").onclick=saveCompletion;
}

function editCard(kind){
  if(kind==="basic")return open("basicSettingsModal");
  if(kind==="content")return open("contentSettingsModal");
  if(kind==="completion")return open("completionSettingsModal");
  if(kind==="payment"){toast("Pricing is managed on the linked product, not on the LMS course.","success");return}
  if(kind==="schedule"){toast("Schedule/time-limit fields are not in the current lms_courses schema yet.","success");return}
  if(kind==="instructors"){toast("Instructor assignment needs a confirmed course-instructor relationship table before wiring.","success");return}
  if(kind==="seo"){toast("Dedicated course SEO columns are not in the current lms_courses schema. The course title, slug and description are used now.","success")}
}

async function saveBasic(){
  const titleVal=$("basicCourseTitle").value.trim(),slugVal=$("basicSlug").value.trim();
  if(!titleVal)return toast("Course name is required.","error");
  const payload={title:titleVal,slug:slugVal||slugify(titleVal),short_description:$("basicShortDescription").value.trim()||null,description:$("basicDescription").value.trim()||null,updated_at:new Date().toISOString()};
  await update(payload,"Basic information saved.");
}

async function saveContent(){
  const payload={navigation_mode:$("contentNavigationMode").value,video_completion_percent:num($("contentVideoPercent").value,90),require_all_required_lessons:$("contentRequireLessons").checked,require_required_assessments:$("contentRequireAssessments").checked,allow_student_downloads:$("contentDownloads").checked,preview_enabled:$("contentPreview").checked,updated_at:new Date().toISOString()};
  await update(payload,"Content settings saved.");
}

async function saveCompletion(){
  const payload={passing_score:num($("completionPassingScore").value,80),certificate_enabled:$("completionCertificate").checked,updated_at:new Date().toISOString()};
  await update(payload,"Completion settings saved.");
}

async function update(payload,msg){
  try{
    const r=await db().from(TABLES.courses).update(payload).eq("id",state.courseId).select("*").single();
    if(r.error)throw r.error;state.course=r.data;closeModals();render();toast(msg,"success")
  }catch(e){console.error(e);toast(e?.message||"Unable to save settings.","error")}
}

function open(id){$(id).hidden=false}
function closeModals(){document.querySelectorAll(".settings-modal-backdrop").forEach(m=>m.hidden=true)}
function links(){
  $("settingsPreviewButton").href=`admin-lms-course-preview.html?course=${encodeURIComponent(state.courseId)}`;
  $("settingsInviteButton").href=`admin-lms-course-participants.html?course=${encodeURIComponent(state.courseId)}&invite=1`;
  $("settingsAutomationsButton").href=`admin-lms-course-engagement.html?course=${encodeURIComponent(state.courseId)}`;
}
function nav(tab){const pages={overview:"admin-lms-course-overview.html",content:"admin-lms-course-builder.html",participants:"admin-lms-course-participants.html",settings:"admin-lms-course-settings.html",engagement:"admin-lms-course-engagement.html"};if(pages[tab])location.href=`${pages[tab]}?course=${encodeURIComponent(state.courseId)}`}
function setLoading(v){$("settingsLoading").hidden=!v}
function set(id,v){if($(id))$(id).textContent=v??""}
function toast(m,t){const n=$("settingsToast");n.textContent=m;n.className=`settings-toast show ${t||"success"}`;clearTimeout(toast.timer);toast.timer=setTimeout(()=>n.classList.remove("show"),3300)}
function title(v){return String(v||"").replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
function slugify(v){return String(v||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}
function num(v,f){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(100,n)):f}
})();