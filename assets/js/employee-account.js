(function(){'use strict';
const state={profile:null,preferences:{}};
document.addEventListener('DOMContentLoaded',init);
function init(){bind();loadAccount();}
function bind(){
document.querySelectorAll('.account-tab').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
document.getElementById('profile-form')?.addEventListener('submit',saveProfile);
document.getElementById('password-form')?.addEventListener('submit',updatePassword);
document.getElementById('preferences-form')?.addEventListener('submit',savePreferences);
document.getElementById('modal-close')?.addEventListener('click',closeModal);
}
async function loadAccount(){
/* SUPABASE WIRING:
1. Resolve auth user with supabase.auth.getUser().
2. Load the matching user_profiles row.
3. Resolve employee relationship through employer_employees as needed.
4. Populate only fields confirmed by the actual schema.
5. Notification preference storage needs confirmation. The existing notifications table
   may represent delivered notifications rather than user preference settings.
*/
populate();
}
function populate(){if(!state.profile)return;setVal('first-name',state.profile.first_name);setVal('last-name',state.profile.last_name);setVal('email',state.profile.email);setVal('phone',state.profile.phone);setCheck('pref-training',!!state.preferences.training);setCheck('pref-certificates',!!state.preferences.certificates);setCheck('pref-account',!!state.preferences.account);}
function showTab(tab){document.querySelectorAll('.account-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelectorAll('.account-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===tab));}
async function saveProfile(e){e.preventDefault();const payload={first_name:val('first-name'),last_name:val('last-name'),phone:val('phone')};/* Update confirmed editable profile columns here after schema-column verification. */show('Profile Ready','Your profile changes have been validated. The final Supabase update will be connected to the confirmed user profile columns.');}
async function updatePassword(e){e.preventDefault();const current=val('current-password'),next=val('new-password'),confirm=val('confirm-password');if(!current||!next||!confirm){show('Password Required','Please complete all password fields.');return;}if(next!==confirm){show('Passwords Do Not Match','Your new password and confirmation must match.');return;}if(next.length<8){show('Choose a Stronger Password','Your new password must contain at least 8 characters.');return;}/* Re-authentication policy may be required before supabase.auth.updateUser({password: next}). */show('Password Update Ready','Your password request has been validated. The final authentication update will use Supabase Auth with the appropriate security checks.');e.target.reset();}
async function savePreferences(e){e.preventDefault();state.preferences={training:checked('pref-training'),certificates:checked('pref-certificates'),account:checked('pref-account')};/* Connect to confirmed preference storage model. Do not insert these into notifications unless that table is explicitly designed for preferences. */show('Preferences Ready','Your notification preferences have been updated locally and are ready to connect to the approved account preferences data model.');}
function val(id){return document.getElementById(id).value.trim();}function setVal(id,v){const e=document.getElementById(id);if(e)e.value=v||'';}function checked(id){return document.getElementById(id).checked;}function setCheck(id,v){const e=document.getElementById(id);if(e)e.checked=v;}function show(t,m){document.getElementById('modal-title').textContent=t;document.getElementById('modal-message').textContent=m;document.getElementById('account-modal').hidden=false;}function closeModal(){document.getElementById('account-modal').hidden=true;}
})();