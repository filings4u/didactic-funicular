(() => {
"use strict";
const S={db:null,user:null,profile:null,orders:[],results:[],documents:[],notifications:[],donorPasses:[]};
const $=id=>document.getElementById(id);
document.addEventListener("DOMContentLoaded",init);

async function init(){
  try{
    await waitForShell();
    S.db=await getScreenings4uSupabase();
    const {data:{user},error}=await S.db.auth.getUser();
    if(error||!user) return;
    S.user=user;
    const d=await invoke();
    S.profile=d.profile||null;
    S.orders=d.orders||[];
    S.results=d.results||[];
    S.documents=d.documents||[];
    S.notifications=d.notifications||[];
    S.donorPasses=d.donor_passes||[];
    render();
  }catch(e){console.error("[Customer Dashboard]",e);showError();}
}
function waitForShell(){return new Promise(r=>setTimeout(r,60))}
async function invoke(){
  const {data,error}=await S.db.functions.invoke("customer-dashboard-actions",{body:{action:"dashboard"}});
  if(error){let m=error.message;try{const j=await error.context?.clone?.().json();if(j?.error)m=j.error}catch{}throw Error(m)}
  if(data?.error)throw Error(data.error);return data||{};
}
function render(){renderWelcome();renderStats();renderOrders();renderResults();renderDocuments();renderNotifications();renderDonorFeature()}
function renderWelcome(){text("customer-welcome-name",displayName())}
function displayName(){return S.profile?.first_name||S.profile?.display_name||S.user?.user_metadata?.first_name||pretty((S.user?.email||"Customer").split("@")[0])}
function renderStats(){
  const active=S.orders.filter(o=>!["completed","cancelled","refunded"].includes(String(o.fulfillment_status||o.status||"").toLowerCase())).length;
  text("customer-stat-active-orders",active);
  text("customer-stat-results",S.results.length);
  text("customer-stat-donor-passes",S.donorPasses.filter(p=>!["completed","cancelled","expired","used"].includes(String(p.status||"").toLowerCase())).length);
  text("customer-stat-documents",S.documents.length);
}
function renderOrders(){
  const box=$("customer-recent-orders"),empty=$("customer-orders-empty"),load=$("customer-orders-loading"); if(load)load.remove(); if(!box)return;
  const rows=S.orders.slice(0,5); box.querySelectorAll(".customer-order-item").forEach(x=>x.remove());
  if(!rows.length){if(empty)empty.hidden=false;return} if(empty)empty.hidden=true;
  rows.forEach(o=>{const item=document.createElement("article");item.className="customer-order-item";const serviceNames=(o.order_items||[]).map(i=>i.services?.name||i.metadata?.service_name||i.metadata?.name).filter(Boolean);const name=serviceNames.length?serviceNames.join(", "):labelType(o.fulfillment_type);const status=String(o.fulfillment_status||o.status||"pending").toLowerCase();item.innerHTML=`<div class="customer-order-icon">${icon("order")}</div><div class="customer-order-copy"><div class="customer-order-name"></div><div class="customer-order-meta"></div></div><div class="customer-order-status"></div>`;item.querySelector(".customer-order-name").textContent=name;item.querySelector(".customer-order-meta").textContent=`${o.order_number||"Order"} · ${date(o.created_at)}`;const st=item.querySelector(".customer-order-status");st.textContent=pretty(status);st.classList.add(statusClass(status));box.appendChild(item)})
}
function renderResults(){
 const box=$("customer-recent-results"),empty=$("customer-results-empty"),load=$("customer-results-loading");if(load)load.remove();if(!box)return;const rows=S.results.slice(0,5);box.querySelectorAll(".customer-result-item").forEach(x=>x.remove());if(!rows.length){if(empty)empty.hidden=false;return}if(empty)empty.hidden=true;rows.forEach(r=>{const el=document.createElement("article");el.className="customer-result-item";el.innerHTML=`<div class="customer-result-icon">${icon("result")}</div><div class="customer-result-copy"><div class="customer-result-name"></div><div class="customer-result-meta"></div></div><a class="customer-result-action" href="customer-results.html">View</a>`;el.querySelector(".customer-result-name").textContent=r.title||"Screening Result";el.querySelector(".customer-result-meta").textContent=date(r.updated_at||r.created_at);box.appendChild(el)})
}
function renderDocuments(){
 const box=$("customer-recent-documents"),empty=$("customer-documents-empty"),load=$("customer-documents-loading");if(load)load.remove();if(!box)return;const rows=S.documents.slice(0,5);box.querySelectorAll(".customer-document-item").forEach(x=>x.remove());if(!rows.length){if(empty)empty.hidden=false;return}if(empty)empty.hidden=true;rows.forEach(d=>{const el=document.createElement("article");el.className="customer-document-item";el.innerHTML=`<div class="customer-document-icon">${icon("document")}</div><div class="customer-document-copy"><div class="customer-document-name"></div><div class="customer-document-meta"></div></div><a class="customer-document-action" href="customer-documents.html">View</a>`;el.querySelector(".customer-document-name").textContent=d.title||"Document";el.querySelector(".customer-document-meta").textContent=`${pretty(d.document_type||"document")} · ${date(d.created_at)}`;box.appendChild(el)})
}
function renderNotifications(){
 const box=$("customer-dashboard-notifications"),empty=$("customer-notifications-empty"),load=$("customer-notifications-loading");if(load)load.remove();if(!box)return;const rows=S.notifications.slice(0,5);box.querySelectorAll(".customer-notification-item").forEach(x=>x.remove());if(!rows.length){if(empty)empty.hidden=false;return}if(empty)empty.hidden=true;rows.forEach(n=>{const el=document.createElement("article");el.className="customer-notification-item";el.innerHTML=`<div class="customer-notification-dot"></div><div class="customer-notification-copy"><strong></strong><p></p><span></span></div>`;el.querySelector("strong").textContent=n.subject||"Account Notification";el.querySelector("p").textContent=n.body||"";el.querySelector("span").textContent=date(n.sent_at||n.created_at);box.appendChild(el)})
}
function renderDonorFeature(){const el=$("customer-dashboard-donor-feature");if(!el)return;const active=S.donorPasses.filter(p=>!["completed","cancelled","expired","used"].includes(String(p.status||"").toLowerCase()));const copy=el.querySelector(".customer-donor-feature-copy p");if(copy&&active.length){const p=active[0];copy.textContent=p.location_name?`Your donor pass is ready. Assigned collection site: ${p.location_name}.`:`You have ${active.length} active donor pass${active.length===1?"":"es"} ready to review.`}}
function showError(){["customer-orders-loading","customer-results-loading","customer-documents-loading","customer-notifications-loading"].forEach(id=>$(id)?.remove());["customer-orders-empty","customer-results-empty","customer-documents-empty","customer-notifications-empty"].forEach(id=>{if($(id))$(id).hidden=false})}
function statusClass(v){if(v.includes("complete")||v.includes("fulfilled"))return"completed";if(v.includes("cancel")||v.includes("refund"))return"cancelled";return"pending"}
function labelType(v){return pretty(String(v||"Service").replaceAll("_"," "))}
function pretty(v){return String(v||"").replace(/[._-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
function date(v){const d=new Date(v);return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(d)}
function text(id,v){if($(id))$(id).textContent=String(v)}
function icon(t){return t==="result"?`<svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"></path><path d="M14 3v5h5"></path><path d="m9 13 2 2 4-4"></path></svg>`:t==="document"?`<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path></svg>`:`<svg viewBox="0 0 24 24"><path d="M6 3h12"></path><path d="M6 7h12"></path><path d="M6 11h12"></path><path d="M6 15h8"></path></svg>`}
})();