(function(){'use strict';
const state={certificates:[],completedCourses:[]};
document.addEventListener('DOMContentLoaded',init);
function init(){document.getElementById('cert-search')?.addEventListener('input',render);document.getElementById('modal-close')?.addEventListener('click',closeModal);loadCertificates();}
async function loadCertificates(){
/* SUPABASE WIRING:
1. Resolve authenticated employee identity.
2. Load lms_enrollments belonging to that employee.
3. Load lms_certificates joined to lms_enrollments and, where applicable, lms_courses.
4. Join lms_media through certificate_media_id for the actual certificate file.
5. Load completed eligible enrollments separately for the completed-training metric.
Important: certificate availability must be based on lms_certificates records and course completion rules, not simply a front-end percentage.
*/
render();
}
function render(){
const q=(document.getElementById('cert-search')?.value||'').toLowerCase();
const list=state.certificates.filter(c=>((c.course_title||'')+' '+(c.certificate_number||'')).toLowerCase().includes(q));
const recent=state.certificates.filter(c=>c.issued_at&&Date.now()-new Date(c.issued_at).getTime()<=30*86400000).length;
setText('cert-total',state.certificates.length);setText('cert-recent',recent);setText('training-completed',state.completedCourses.length);
const grid=document.getElementById('cert-list'),empty=document.getElementById('cert-empty');
grid.innerHTML=list.map(card).join('');grid.hidden=!list.length;empty.hidden=!!list.length;
grid.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>openCertificate(b.dataset.view)));
grid.querySelectorAll('[data-download]').forEach(b=>b.addEventListener('click',()=>downloadCertificate(b.dataset.download)));
}
function card(c){return '<article class="cert-card"><div class="cert-top"><div class="cert-icon">✓</div><div class="cert-title"><h3>'+esc(c.course_title||'Training Certificate')+'</h3><p>Successfully completed training</p></div></div><div class="cert-meta"><div><small>ISSUED</small><strong>'+esc(formatDate(c.issued_at))+'</strong></div><div><small>CERTIFICATE ID</small><strong>'+esc(c.certificate_number||'Available in record')+'</strong></div></div><div class="cert-actions"><button class="primary-btn" data-view="'+esc(c.id||'')+'" type="button">View Certificate</button><button class="secondary-btn" data-download="'+esc(c.id||'')+'" type="button">Download</button></div></article>';}
function openCertificate(id){const c=state.certificates.find(x=>String(x.id)===String(id));if(!c){showModal('Certificate Access','Certificate viewing will be available after the LMS certificate media records are connected.');return;}if(c.media_url){window.open(c.media_url,'_blank','noopener');return;}showModal('Certificate Ready','This certificate is recorded in your account. The certificate document link will be connected through lms_media.');}
function downloadCertificate(id){const c=state.certificates.find(x=>String(x.id)===String(id));if(c?.download_url){window.location.href=c.download_url;return;}showModal('Download Certificate','The secure certificate download will be connected to the certificate media record.');}
function formatDate(v){if(!v)return 'Not available';const d=new Date(v);return Number.isNaN(d.getTime())?'Not available':d.toLocaleDateString();}
function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
function esc(v){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function showModal(t,m){document.getElementById('modal-title').textContent=t;document.getElementById('modal-message').textContent=m;document.getElementById('cert-modal').hidden=false;}
function closeModal(){document.getElementById('cert-modal').hidden=true;}
})();