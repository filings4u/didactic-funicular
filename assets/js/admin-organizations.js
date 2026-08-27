(() => {
  'use strict';
  let organizations = [];
  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const client = () => window.S4UAuth.getClient();
  async function load(){
    const {data,error}=await client().from('organizations').select('id,name,legal_name,organization_type,status,email,phone,created_at').order('name');
    if(error) throw error; organizations=data||[]; render();
  }
  function render(){
    const q=document.getElementById('search').value.trim().toLowerCase(), st=document.getElementById('status').value;
    const list=organizations.filter(o=>(!q||[o.name,o.legal_name,o.email].some(v=>String(v||'').toLowerCase().includes(q)))&&(!st||o.status===st));
    document.getElementById('rows').innerHTML=list.length?list.map(o=>`<tr><td><strong>${esc(o.name)}</strong><br><small>${esc(o.legal_name||'')}</small></td><td>${esc(o.organization_type)}</td><td><span class="s4u-status ${o.status==='active'?'success':o.status==='suspended'?'danger':'warning'}">${esc(o.status)}</span></td><td>${esc(o.email||'—')}<br>${esc(o.phone||'')}</td><td>${new Date(o.created_at).toLocaleDateString()}</td><td><button class="s4u-button" data-edit="${o.id}">Edit</button></td></tr>`).join(''):`<tr><td colspan="6">No organizations match the current filters.</td></tr>`;
  }
  function newOrg(){
    window.S4UUI.formModal({title:'Create Organization',message:'Create the company record first. Users and access can be assigned afterward.',fields:[{name:'name',label:'Organization Name',required:true},{name:'legal_name',label:'Legal Name'},{name:'email',label:'Primary Email',type:'email'},{name:'phone',label:'Phone'},{name:'organization_type',label:'Type',type:'select',value:'client',options:[{value:'client',label:'Client'},{value:'employer',label:'Employer'},{value:'consortium',label:'Consortium'},{value:'partner',label:'Partner'},{value:'internal',label:'Internal'}]}],onSubmit:async v=>{const {data,error}=await client().rpc('create_client_organization',{org_name:v.name,org_legal_name:v.legal_name||null,org_email:v.email||null,org_phone:v.phone||null,org_type:v.organization_type});if(error)throw error;window.S4UUI.toast('Organization created.','success');await load();}});
  }
  async function editOrg(id){const o=organizations.find(x=>x.id===id);if(!o)return;window.S4UUI.formModal({title:'Edit Organization',fields:[{name:'name',label:'Organization Name',value:o.name,required:true},{name:'legal_name',label:'Legal Name',value:o.legal_name||''},{name:'email',label:'Primary Email',type:'email',value:o.email||''},{name:'phone',label:'Phone',value:o.phone||''},{name:'status',label:'Status',type:'select',value:o.status,options:['active','prospect','inactive','suspended'].map(x=>({value:x,label:x[0].toUpperCase()+x.slice(1)}))}],onSubmit:async v=>{const {error}=await client().rpc('update_organization',{target_org:id,org_name:v.name,org_legal_name:v.legal_name||null,org_email:v.email||null,org_phone:v.phone||null,org_status:v.status});if(error)throw error;window.S4UUI.toast('Organization updated.','success');await load();}});}
  document.getElementById('search').addEventListener('input',render);document.getElementById('status').addEventListener('change',render);document.getElementById('refreshButton').addEventListener('click',load);document.getElementById('newButton').addEventListener('click',newOrg);document.getElementById('rows').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b)editOrg(b.dataset.edit)});document.getElementById('logoutButton').addEventListener('click',()=>window.S4UUI.modal({title:'Sign out?',message:'Your administrator session will be closed.',showCancel:true,onConfirm:()=>window.S4UAuth.signOut()}));
  (async()=>{try{const s=await window.S4UAuth.requireSession('admin-login.html');if(!s)return;if(!await window.S4UPermissions.requirePermission('customers.read','admin-dashboard.html'))return;await load();}catch(e){console.error(e);window.S4UUI.toast(e.message||'Unable to load organizations.','error')}})();
})();
