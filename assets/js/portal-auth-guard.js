/* SCREENINGS4U — STRICT PORTAL AUTH GUARD */
(() => {
 "use strict";
 async function protectPortal({portal,loginPage=null}={}){
  if(!portal) throw new Error("Portal name is required.");
  const destination=loginPage||window.S4UAuth?.getLoginForPortal?.(portal)||`${portal}-login.html`;
  try{
   const state=await window.S4UAuth.requireAuth({portal,loginPage:destination});
   if(!state)return null;
   document.documentElement.classList.remove("s4u-auth-pending");
   document.documentElement.classList.add("s4u-authenticated");
   window.dispatchEvent(new CustomEvent("s4u:authenticated",{detail:state}));
   return state;
  }catch(error){console.error(`[${portal} portal guard]`,error);try{await window.S4UAuth?.signOutSilently?.();}catch(_){}window.location.replace(destination);return null;}
 }
 window.S4UPortalGuard=Object.freeze({protectPortal});
})();
