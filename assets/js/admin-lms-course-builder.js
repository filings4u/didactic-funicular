/* screenings4u — admin-lms-course-builder.js */
(() => {
"use strict";

let client=null, courseId="", course=null, sections=[], lessons=[], media=[];
let editingSectionId="";
const el={};

document.addEventListener("DOMContentLoaded",init);

async function init(){
    cache(); bind();
    try{
        client=await waitForClient();
        if(!client)throw new Error("Supabase client was not found.");
        await requireSession();
        courseId=new URLSearchParams(location.search).get("course")||"";
        await loadMedia();
        if(courseId)await loadCourse();
        else renderSummary();
    }catch(error){
        console.error(error); show(error.message||"Unable to load course builder.","error");
    }
}

function cache(){
    ["cbHeading","cbMessage","cbTitle","cbSlug","cbStatus","cbShortDescription","cbDescription","cbThumbnail","cbMediaPreview","cbUploadZone","cbImageUpload","cbUploadProgress","cbUploadStatus",
     "cbPassingScore","cbNavigationMode","cbVideoPercent","cbCertificate","cbRequireLessons","cbRequireAssessments","cbDownloads","cbPreview",
     "cbAddSection","cbCurriculum","cbSummaryMode","cbSummaryStatus","cbSummarySections","cbSummaryLessons","cbSummarySaved",
     "cbCourseManagerLink","cbLessonBuilderLink","cbSaveDraft","cbPublish","cbSaveDraftBottom","cbPublishBottom",
     "cbSectionModal","cbSectionModalTitle","cbSectionTitle","cbSectionDescription","cbSectionOrder","cbSectionPublished","cbSaveSection"
    ].forEach(id=>el[id]=document.getElementById(id));
}

function bind(){
    let slugTouched=false;
    el.cbTitle.addEventListener("input",()=>{if(!slugTouched)el.cbSlug.value=slugify(el.cbTitle.value);renderSummary();});
    el.cbSlug.addEventListener("input",()=>{slugTouched=true;});
    el.cbStatus.addEventListener("change",renderSummary);
    [el.cbSaveDraft,el.cbSaveDraftBottom].forEach(b=>b.addEventListener("click",()=>saveCourse(false)));
    [el.cbPublish,el.cbPublishBottom].forEach(b=>b.addEventListener("click",()=>saveCourse(true)));
    el.cbThumbnail.addEventListener("change",renderMediaPreview);
    el.cbImageUpload?.addEventListener("change",event=>{
        const file=event.target.files?.[0];
        if(file)uploadCourseImage(file);
    });
    ["dragenter","dragover"].forEach(type=>el.cbUploadZone?.addEventListener(type,event=>{
        event.preventDefault();event.stopPropagation();el.cbUploadZone.classList.add("dragover");
    }));
    ["dragleave","drop"].forEach(type=>el.cbUploadZone?.addEventListener(type,event=>{
        event.preventDefault();event.stopPropagation();el.cbUploadZone.classList.remove("dragover");
    }));
    el.cbUploadZone?.addEventListener("drop",event=>{
        const file=event.dataTransfer?.files?.[0];
        if(file)uploadCourseImage(file);
    });
    el.cbAddSection.addEventListener("click",()=>openSectionModal());
    el.cbSaveSection.addEventListener("click",saveSection);
    document.querySelectorAll("[data-cb-close]").forEach(x=>x.addEventListener("click",closeSectionModal));
    el.cbSectionModal.addEventListener("click",e=>{if(e.target===el.cbSectionModal)closeSectionModal();});
    el.cbCurriculum.addEventListener("click",async e=>{
        const edit=e.target.closest("[data-edit-section]");
        if(edit)return openSectionModal(edit.dataset.editSection);
        const del=e.target.closest("[data-delete-section]");
        if(del)return deleteSection(del.dataset.deleteSection);
        const addLesson=e.target.closest("[data-add-lesson]");
        if(addLesson){
            location.href=`admin-lms-lesson-builder.html?course=${encodeURIComponent(courseId)}&section=${encodeURIComponent(addLesson.dataset.addLesson)}`;
        }
    });
}

async function waitForClient(timeout=3500){
    const start=Date.now();
    while(Date.now()-start<timeout){const c=await getClient();if(c?.from)return c;await new Promise(r=>setTimeout(r,75));}
    return null;
}
async function getClient(){
    try{if(typeof window.getScreenings4uSupabase==="function"){const c=await window.getScreenings4uSupabase();if(c?.from)return c;}}catch(_){}
    if(window.screenings4uSupabase?.from)return window.screenings4uSupabase;
    if(window.supabaseClient?.from)return window.supabaseClient;
    if(window.supabase?.createClient&&window.SCREENINGS4U_SUPABASE_URL&&window.SCREENINGS4U_SUPABASE_ANON_KEY){
        window.supabaseClient=window.supabase.createClient(window.SCREENINGS4U_SUPABASE_URL,window.SCREENINGS4U_SUPABASE_ANON_KEY);return window.supabaseClient;
    }
    return null;
}
async function requireSession(){
    if(window.S4UAuth?.requireSession){const s=await window.S4UAuth.requireSession("admin-login.html");if(!s)throw new Error("Authentication required.");return;}
    const {data,error}=await client.auth.getSession();if(error)throw error;if(!data?.session?.user){location.replace("admin-login.html");throw new Error("Authentication required.");}
}

async function loadMedia(){
    const {data,error}=await client.from("lms_media").select("id,media_type,original_filename,title,storage_bucket,storage_path,thumbnail_url,playback_url,mime_type,file_size_bytes,created_at").order("created_at",{ascending:false});
    if(error)throw error;
    media=data||[];
    refreshMediaSelect();
    if(el.cbUploadStatus && !el.cbUploadStatus.textContent.trim()) el.cbUploadStatus.textContent="Ready to upload a course image.";
}

async function loadCourse(){
    const [{data:c,error:ce},{data:s,error:se},{data:l,error:le}]=await Promise.all([
        client.from("lms_courses").select("*").eq("id",courseId).single(),
        client.from("lms_sections").select("*").eq("course_id",courseId).order("sort_order",{ascending:true}),
        client.from("lms_lessons").select("*").order("sort_order",{ascending:true})
    ]);
    if(ce)throw ce;if(se)throw se;if(le)throw le;
    course=c;sections=s||[];const ids=new Set(sections.map(x=>x.id));lessons=(l||[]).filter(x=>ids.has(x.section_id));
    fillCourse();renderCurriculum();renderSummary();
}

function fillCourse(){
    el.cbHeading.textContent="Edit Course";
    el.cbTitle.value=course.title||"";
    el.cbSlug.value=course.slug||"";
    el.cbStatus.value=course.status||"draft";
    el.cbShortDescription.value=course.short_description||"";
    el.cbDescription.value=course.description||"";
    el.cbThumbnail.value=course.thumbnail_media_id||"";
    el.cbPassingScore.value=course.passing_score??80;
    el.cbNavigationMode.value=course.navigation_mode||"free";
    el.cbVideoPercent.value=course.video_completion_percent??90;
    el.cbCertificate.checked=!!course.certificate_enabled;
    el.cbRequireLessons.checked=course.require_all_required_lessons!==false;
    el.cbRequireAssessments.checked=course.require_required_assessments!==false;
    el.cbDownloads.checked=!!course.allow_student_downloads;
    el.cbPreview.checked=!!course.preview_enabled;
    renderMediaPreview();
}

function collect(publish){
    const title=el.cbTitle.value.trim();
    if(!title)throw new Error("Course title is required.");
    const slug=el.cbSlug.value.trim()||slugify(title);
    if(!slug)throw new Error("Course slug is required.");
    const status=publish?"published":el.cbStatus.value;
    return {
        slug,title,
        short_description:el.cbShortDescription.value.trim()||null,
        description:el.cbDescription.value.trim()||null,
        thumbnail_media_id:el.cbThumbnail.value||null,
        status,
        certificate_enabled:el.cbCertificate.checked,
        passing_score:numOrNull(el.cbPassingScore.value),
        navigation_mode:el.cbNavigationMode.value||null,
        video_completion_percent:numOrNull(el.cbVideoPercent.value),
        require_all_required_lessons:el.cbRequireLessons.checked,
        require_required_assessments:el.cbRequireAssessments.checked,
        allow_student_downloads:el.cbDownloads.checked,
        preview_enabled:el.cbPreview.checked,
        published_at:status==="published"?(course?.published_at||new Date().toISOString()):course?.published_at||null,
        updated_at:new Date().toISOString()
    };
}

async function saveCourse(publish){
    const buttons=[el.cbSaveDraft,el.cbPublish,el.cbSaveDraftBottom,el.cbPublishBottom];
    buttons.forEach(b=>b.disabled=true);
    try{
        const payload=collect(publish);
        let result;
        if(courseId){
            result=await client.from("lms_courses").update(payload).eq("id",courseId).select("*").single();
        }else{
            payload.created_at=new Date().toISOString();
            result=await client.from("lms_courses").insert(payload).select("*").single();
        }
        if(result.error)throw result.error;
        course=result.data;courseId=course.id;
        const url=new URL(location.href);url.searchParams.set("course",courseId);history.replaceState({},"",url);
        el.cbStatus.value=course.status;
        el.cbHeading.textContent="Edit Course";
        updateLinks();
        renderSummary();
        renderCurriculum();
        show(publish?"Course published successfully.":"Course saved successfully.","ok");
    }catch(error){
        console.error(error);show(error.message||"Unable to save course.","error");
    }finally{buttons.forEach(b=>b.disabled=false);}
}

function updateLinks(){
    if(!courseId)return;
    const id=encodeURIComponent(courseId);
    el.cbCourseManagerLink.href=`admin-lms-course-manager.html?course=${id}`;
    el.cbLessonBuilderLink.href=`admin-lms-lesson-builder.html?course=${id}`;
}

async function renderMediaPreview(){
    const id=el.cbThumbnail.value;
    const item=media.find(m=>m.id===id);
    if(!item){
        el.cbMediaPreview.innerHTML="No course image selected.";
        return;
    }

    let src=item.thumbnail_url||item.playback_url||"";
    if(!src&&item.storage_bucket&&item.storage_path){
        const {data,error}=await client.storage.from(item.storage_bucket).createSignedUrl(item.storage_path,3600);
        if(!error)src=data?.signedUrl||"";
    }

    el.cbMediaPreview.innerHTML=src
        ?`<img src="${esc(src)}" alt="${esc(item.title||item.original_filename||"Course image")}">`
        :"Image uploaded, but a preview URL could not be generated.";
}

async function uploadCourseImage(file){
    clearUploadStatus();

    const allowed=["image/jpeg","image/png","image/webp"];
    if(!allowed.includes(file.type)){
        return uploadStatus("Please choose a JPG, PNG, or WebP image.","error");
    }

    const maxBytes=15*1024*1024;
    if(file.size>maxBytes){
        return uploadStatus("The course image must be 15 MB or smaller.","error");
    }

    el.cbUploadProgress?.classList.add("show");
    if(el.cbImageUpload)el.cbImageUpload.disabled=true;

    let uploadedPath="";
    try{
        const {data:userData,error:userError}=await client.auth.getUser();
        if(userError)throw userError;
        const user=userData?.user;
        if(!user)throw new Error("You must be signed in to upload an image.");

        const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
        const safeBase=(file.name.replace(/\.[^.]+$/,"")||"course-image")
            .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70)||"course-image";
        const folder=courseId?`course-images/${courseId}`:`course-images/unassigned/${user.id}`;
        uploadedPath=`${folder}/${Date.now()}-${crypto.randomUUID()}-${safeBase}.${ext}`;

        uploadStatus("Uploading image to storage...","success");

        const {error:uploadError}=await client.storage
            .from("lms-media")
            .upload(uploadedPath,file,{cacheControl:"3600",upsert:false,contentType:file.type});
        if(uploadError)throw uploadError;

        const {data:mediaRow,error:mediaError}=await client.from("lms_media").insert({
            uploaded_by:user.id,
            media_type:"image",
            original_filename:file.name,
            storage_bucket:"lms-media",
            storage_path:uploadedPath,
            mime_type:file.type,
            file_size_bytes:file.size,
            title:file.name.replace(/\.[^.]+$/,""),
            provider:"supabase_storage",
            metadata:{source:"course_builder",course_id:courseId||null}
        }).select("id,media_type,original_filename,title,storage_bucket,storage_path,thumbnail_url,playback_url,mime_type,file_size_bytes,created_at").single();
        if(mediaError)throw mediaError;

        media.unshift(mediaRow);
        refreshMediaSelect(mediaRow.id);

        if(courseId){
            const {data:updated,error:updateError}=await client.from("lms_courses")
                .update({thumbnail_media_id:mediaRow.id,updated_at:new Date().toISOString()})
                .eq("id",courseId)
                .select("*")
                .single();
            if(updateError)throw updateError;
            course=updated;
        }

        await renderMediaPreview();
        renderSummary();
        uploadStatus(`Image uploaded successfully: ${file.name}`,"success");
        show("Course image uploaded successfully.","ok");
    }catch(error){
        console.error("Course image upload failed:",error);
        if(uploadedPath){
            try{await client.storage.from("lms-media").remove([uploadedPath]);}catch(_){}
        }
        uploadStatus(error.message||"Unable to upload the course image.","error");
    }finally{
        el.cbUploadProgress?.classList.remove("show");
        if(el.cbImageUpload){
            el.cbImageUpload.disabled=false;
            el.cbImageUpload.value="";
        }
    }
}

function refreshMediaSelect(selectedId=""){
    const images=media.filter(m=>String(m.media_type||"").toLowerCase()==="image"||String(m.mime_type||"").startsWith("image/"));
    el.cbThumbnail.innerHTML='<option value="">No thumbnail</option>'+images.map(m=>`<option value="${esc(m.id)}">${esc(m.title||m.original_filename||"Image")}</option>`).join("");
    if(selectedId)el.cbThumbnail.value=selectedId;
}

function uploadStatus(text,type){
    if(!el.cbUploadStatus)return;
    el.cbUploadStatus.textContent=text;
    el.cbUploadStatus.className=`cb-upload-status show ${type||""}`.trim();
}
function clearUploadStatus(){
    if(!el.cbUploadStatus)return;
    el.cbUploadStatus.textContent="Ready to upload a course image.";
    el.cbUploadStatus.className="cb-upload-status";
}

function renderCurriculum(){
    updateLinks();
    if(!courseId){
        el.cbCurriculum.innerHTML='<div class="cb-empty">Save the course first, then add sections and lessons.</div>';
        el.cbAddSection.disabled=true;return;
    }
    el.cbAddSection.disabled=false;
    if(!sections.length){
        el.cbCurriculum.innerHTML='<div class="cb-empty">No sections yet. Click <strong>Add Section</strong> to begin building the curriculum.</div>';return;
    }
    el.cbCurriculum.innerHTML=sections.map((s,i)=>{
        const ls=lessons.filter(l=>l.section_id===s.id);
        return `<section class="cb-section">
        <header class="cb-section-head"><span class="cb-section-num">${String(i+1).padStart(2,"0")}</span><div class="cb-section-copy"><strong>${esc(s.title||"Untitled Section")}</strong><small>${ls.length} lesson${ls.length===1?"":"s"} · ${s.is_published?"Published":"Not published"}</small></div>
        <button class="cb-btn cb-mini" type="button" data-edit-section="${esc(s.id)}">Edit</button><button class="cb-btn cb-mini danger" type="button" data-delete-section="${esc(s.id)}">Delete</button></header>
        <div class="cb-lessons">${ls.length?ls.map(l=>`<div class="cb-lesson"><div class="cb-lesson-copy"><strong>${esc(l.title||"Untitled Lesson")}</strong><small>${esc(human(l.status))}${l.estimated_minutes?` · ${l.estimated_minutes} min`:""}</small></div><a class="cb-btn cb-mini" href="admin-lms-lesson-builder.html?lesson=${encodeURIComponent(l.id)}&course=${encodeURIComponent(courseId)}">Edit Lesson</a></div>`).join(""):'<div class="cb-empty" style="padding:12px 0">No lessons in this section.</div>'}
        <div style="padding-top:7px"><button class="cb-btn cb-mini primary" type="button" data-add-lesson="${esc(s.id)}">+ Add Lesson</button></div></div></section>`;
    }).join("");
}

function openSectionModal(id=""){
    if(!courseId){show("Save the course before adding sections.","error");return;}
    editingSectionId=id;
    const s=sections.find(x=>x.id===id);
    el.cbSectionModalTitle.textContent=s?"Edit Section":"Add Section";
    el.cbSectionTitle.value=s?.title||"";
    el.cbSectionDescription.value=s?.description||"";
    el.cbSectionOrder.value=s?.sort_order??sections.length+1;
    el.cbSectionPublished.checked=s?.is_published!==false;
    el.cbSectionModal.classList.add("open");
    setTimeout(()=>el.cbSectionTitle.focus(),50);
}
function closeSectionModal(){el.cbSectionModal.classList.remove("open");editingSectionId="";}

async function saveSection(){
    const title=el.cbSectionTitle.value.trim();
    if(!title){el.cbSectionTitle.focus();return;}
    const payload={course_id:courseId,title,description:el.cbSectionDescription.value.trim()||null,sort_order:Number(el.cbSectionOrder.value)||1,is_published:el.cbSectionPublished.checked,updated_at:new Date().toISOString()};
    try{
        let result;
        if(editingSectionId)result=await client.from("lms_sections").update(payload).eq("id",editingSectionId).select("*").single();
        else{payload.created_at=new Date().toISOString();result=await client.from("lms_sections").insert(payload).select("*").single();}
        if(result.error)throw result.error;
        const idx=sections.findIndex(x=>x.id===result.data.id);
        if(idx>=0)sections[idx]=result.data;else sections.push(result.data);
        sections.sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
        closeSectionModal();renderCurriculum();renderSummary();show("Section saved.","ok");
    }catch(error){console.error(error);show(error.message||"Unable to save section.","error");}
}

async function deleteSection(id){
    const s=sections.find(x=>x.id===id);if(!s)return;
    const linked=lessons.filter(l=>l.section_id===id);
    if(linked.length){show("This section still contains lessons. Remove or move the lessons before deleting the section.","error");return;}
    if(!confirm(`Delete "${s.title}"?`))return;
    const {error}=await client.from("lms_sections").delete().eq("id",id);
    if(error){show(error.message,"error");return;}
    sections=sections.filter(x=>x.id!==id);renderCurriculum();renderSummary();show("Section deleted.","ok");
}

function renderSummary(){
    el.cbSummaryMode.textContent=courseId?"Editing Existing Course":"New Course";
    el.cbSummaryStatus.textContent=human(el.cbStatus.value||course?.status||"draft");
    el.cbSummarySections.textContent=sections.length.toLocaleString();
    el.cbSummaryLessons.textContent=lessons.length.toLocaleString();
    el.cbSummarySaved.textContent=course?.updated_at?dateTime(course.updated_at):"Not saved";
    updateLinks();
}

function show(text,type="ok"){el.cbMessage.textContent=text;el.cbMessage.className=`cb-message show ${type}`;clearTimeout(show.timer);show.timer=setTimeout(()=>el.cbMessage.className="cb-message",5000);}
function slugify(v){return String(v||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
function numOrNull(v){if(v===""||v==null)return null;const n=Number(v);return Number.isFinite(n)?n:null;}
function human(v){return String(v||"—").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());}
function dateTime(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?"—":d.toLocaleString(undefined,{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
})();
