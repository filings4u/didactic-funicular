/* ============================================================
   SCREENINGS4U - CUSTOMER MY ACCOUNT
   Live Supabase wiring
   ============================================================ */
(() => {
  "use strict";

  const state = { db:null, user:null, profile:null, originalProfile:null, preferences:null, editing:false };
  const $ = id => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bind();
    try {
      state.db = await getClient();
      const { data:{ user }, error } = await state.db.auth.getUser();
      if (error) throw error;
      if (!user) return;
      state.user = user;
      await loadAccount();
    } catch (e) {
      console.error("customer-account:", e);
      notify(e.message || "Unable to load your account.", true);
    }
  }

  async function getClient() {
    if (typeof window.getScreenings4uSupabase === "function") return await window.getScreenings4uSupabase();
    if (window.screenings4uSupabase) return window.screenings4uSupabase;
    throw new Error("Screenings4u Supabase client is unavailable.");
  }

  function bind() {
    $("customer-edit-profile-btn")?.addEventListener("click", () => setEditing(true));
    $("customer-cancel-profile-btn")?.addEventListener("click", () => {
      state.profile = clone(state.originalProfile);
      render();
      setEditing(false);
    });
    $("customer-profile-form")?.addEventListener("submit", saveProfile);
    $("customer-save-notifications")?.addEventListener("click", savePreferences);
    $("customer-password-btn")?.addEventListener("click", openPasswordModal);
    $("customer-password-modal-close")?.addEventListener("click", closePasswordModal);
    $("customer-password-modal-done")?.addEventListener("click", sendPasswordReset);
    document.querySelector(".customer-account-modal-backdrop")?.addEventListener("click", closePasswordModal);
    $("customer-account-support-btn")?.addEventListener("click", () => {
      window.location.href = "customer-support.html";
    });
  }

  async function loadAccount() {
    const uid = state.user.id;

    const [profileResult, prefResult] = await Promise.all([
      state.db.from("user_profiles")
        .select("id,first_name,last_name,display_name,email,phone,is_active,created_at,updated_at,company_name,address_line_1,address_line_2,city,state,postal_code")
        .eq("id", uid).maybeSingle(),
      state.db.from("customer_account_preferences")
        .select("*").eq("user_id", uid).maybeSingle()
    ]);

    if (profileResult.error) throw profileResult.error;

    state.profile = profileResult.data || {
      id: uid,
      first_name: state.user.user_metadata?.first_name || "",
      last_name: state.user.user_metadata?.last_name || "",
      display_name: state.user.user_metadata?.display_name || "",
      email: state.user.email || "",
      phone: state.user.phone || "",
      is_active: true,
      created_at: state.user.created_at
    };

    // Auth email is authoritative for sign-in identity.
    state.profile.email = state.user.email || state.profile.email || "";
    state.originalProfile = clone(state.profile);

    if (prefResult.error) {
      console.warn("Unable to load notification preferences:", prefResult.error);
    }

    state.preferences = prefResult.data || {
      user_id: uid,
      email_notifications: true,
      service_notifications: true
    };

    render();
    setEditing(false);
  }

  function render() {
    const p = state.profile || {};
    const pref = state.preferences || {};

    setValue("customer-first-name", p.first_name);
    setValue("customer-last-name", p.last_name);
    setValue("customer-email", p.email);
    setValue("customer-phone", p.phone);

    const fullName = [p.first_name,p.last_name].filter(Boolean).join(" ") || p.display_name || "Your Name";
    setText("customer-account-name", fullName);
    setText("customer-account-email", p.email || "—");
    setText("customer-member-since", p.created_at ? formatDate(p.created_at) : "—");
    setText("customer-account-id", p.id ? shortenId(p.id) : "—");
    setText("customer-account-avatar", initials(p.first_name,p.last_name));

    if ($("customer-email-notifications")) $("customer-email-notifications").checked = pref.email_notifications !== false;
    if ($("customer-service-notifications")) $("customer-service-notifications").checked = pref.service_notifications !== false;

    const activeBadge = document.querySelector(".customer-account-active");
    if (activeBadge) activeBadge.textContent = p.is_active === false ? "Inactive Account" : "Active Account";
  }

  function setEditing(on) {
    state.editing = !!on;
    ["customer-first-name","customer-last-name","customer-phone",
     "customer-email-notifications","customer-service-notifications"].forEach(id => {
      const el=$(id); if(el) el.disabled=!state.editing;
    });
    if ($("customer-email")) $("customer-email").disabled = true;
    if ($("customer-profile-actions")) $("customer-profile-actions").hidden = !state.editing;
    if ($("customer-notification-actions")) $("customer-notification-actions").hidden = !state.editing;
    if ($("customer-edit-profile-btn")) $("customer-edit-profile-btn").hidden = state.editing;
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!state.user) return;

    const patch = {
      first_name: value("customer-first-name"),
      last_name: value("customer-last-name"),
      phone: value("customer-phone") || null,
      display_name: [value("customer-first-name"),value("customer-last-name")].filter(Boolean).join(" ") || null,
      updated_at: new Date().toISOString()
    };

    const submit = event.submitter;
    setBusy(submit,true,"Saving...");
    try {
      const { data,error } = await state.db.from("user_profiles")
        .update(patch).eq("id",state.user.id)
        .select("id,first_name,last_name,display_name,email,phone,is_active,created_at,updated_at,company_name,address_line_1,address_line_2,city,state,postal_code")
        .single();
      if(error) throw error;

      state.profile = {...data,email:state.user.email || data.email};
      state.originalProfile = clone(state.profile);
      render();
      setEditing(false);
      notify("Account information updated.");
    } catch(e) {
      console.error(e);
      notify(e.message || "Unable to save account information.",true);
    } finally { setBusy(submit,false,"Save Changes"); }
  }

  async function savePreferences() {
    if(!state.user) return;
    const button=$("customer-save-notifications");
    setBusy(button,true,"Saving...");
    const record = {
      user_id: state.user.id,
      email_notifications: checked("customer-email-notifications"),
      service_notifications: checked("customer-service-notifications"),
      updated_at: new Date().toISOString()
    };
    try {
      const {data,error}=await state.db.from("customer_account_preferences")
        .upsert(record,{onConflict:"user_id"}).select().single();
      if(error) throw error;
      state.preferences=data;
      notify("Notification preferences updated.");
    } catch(e) {
      console.error(e); notify(e.message || "Unable to save notification preferences.",true);
    } finally { setBusy(button,false,"Save Preferences"); }
  }

  function openPasswordModal() {
    const m=$("customer-password-modal"); if(m) m.hidden=false;
    const copy=document.querySelector("#customer-password-modal p");
    if(copy) copy.textContent="We will send a secure password-reset link to your account email. Your current password is never displayed.";
    const done=$("customer-password-modal-done"); if(done) done.textContent="Send Reset Email";
  }
  function closePasswordModal(){const m=$("customer-password-modal");if(m)m.hidden=true;}

  async function sendPasswordReset() {
    const email=state.user?.email;
    if(!email) return notify("No sign-in email is available for this account.",true);
    const button=$("customer-password-modal-done");
    setBusy(button,true,"Sending...");
    try {
      const redirectTo=new URL("reset-password.html",window.location.href).href;
      const {error}=await state.db.auth.resetPasswordForEmail(email,{redirectTo});
      if(error) throw error;
      closePasswordModal();
      notify("Password reset email sent.");
    } catch(e) {
      console.error(e); notify(e.message || "Unable to send password reset email.",true);
    } finally { setBusy(button,false,"Send Reset Email"); }
  }

  function notify(message,error=false) {
    if (window.Screenings4uUI?.toast) return window.Screenings4uUI.toast(message,{type:error?"error":"success"});
    if (window.showToast) return window.showToast(message,error?"error":"success");
    window.alert(message);
  }
  function setBusy(el,on,text){if(!el)return;if(!el.dataset.originalText)el.dataset.originalText=el.textContent;el.disabled=on;el.textContent=on?text:(el.dataset.originalText||text);}
  function value(id){return $(id)?.value.trim()||""}
  function checked(id){return !!$(id)?.checked}
  function setValue(id,v){const e=$(id);if(e)e.value=v??""}
  function setText(id,v){const e=$(id);if(e)e.textContent=String(v??"")}
  function clone(v){return v?JSON.parse(JSON.stringify(v)):null}
  function initials(a,b){return [a,b].filter(Boolean).map(v=>String(v).trim()[0]?.toUpperCase()).join("")||"CU"}
  function shortenId(id){const v=String(id);return v.length<=12?v:`${v.slice(0,8)}…${v.slice(-4)}`}
  function formatDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat("en-US",{month:"short",year:"numeric"}).format(d)}
})();