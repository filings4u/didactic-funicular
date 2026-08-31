/* SCREENINGS4U — SESSION SECURITY */
(() => {
 "use strict";
 const LIMIT={admin:900000,customer:600000,employer:600000,employee:600000,training:600000},WARNING=60000;
 const events=["mousedown","keydown","touchstart","pointerdown","scroll"];let logoutTimer,warningTimer,countdownTimer,warning=false,signingOut=false,lastReset=0;
 const portal=()=>String(document.body?.dataset?.s4uPortal||"").toLowerCase();
 const login=()=>window.S4UAuth?.getLoginForPortal?.(portal())||(portal()==="training"?"training-login.html":`${portal()}-login.html`);
 function clear(){clearTimeout(logoutTimer);clearTimeout(warningTimer);clearInterval(countdownTimer);}
 function remove(){document.getElementById("s4u-session-warning")?.remove();warning=false;}
 async function signOut(){if(signingOut)return;signingOut=true;clear();remove();try{await window.S4UAuth?.signOut?.({redirectTo:login()});}catch(e){console.error(e);sessionStorage.clear();window.location.replace(login());}}
 function warn(){if(warning||signingOut)return;warning=true;let s=60;const x=document.createElement("div");x.id="s4u-session-warning";x.className="s4u-session-overlay";x.innerHTML=`<div class="s4u-session-modal" role="dialog" aria-modal="true"><h2>Are You Still There?</h2><p>For your security, you will be signed out due to inactivity.</p><p>Signing out in <strong data-count>${s}</strong> seconds.</p><div><button type="button" data-stay>Stay Logged In</button><button type="button" data-out>Sign Out Now</button></div></div>`;document.body.appendChild(x);x.querySelector("[data-stay]")?.addEventListener("click",reset);x.querySelector("[data-out]")?.addEventListener("click",signOut);countdownTimer=setInterval(()=>{s--;const n=x.querySelector("[data-count]");if(n)n.textContent=String(Math.max(0,s));if(s<=0)signOut();},1000);}
 function reset(){if(signingOut)return;const now=Date.now();if(now-lastReset<1000)return;lastReset=now;clear();remove();const t=LIMIT[portal()]||600000;warningTimer=setTimeout(warn,Math.max(1000,t-WARNING));logoutTimer=setTimeout(signOut,t);sessionStorage.setItem("s4u-last-activity",String(now));}
 function protectHistory(){if(document.body?.dataset?.s4uProtectHistory==="false")return;const here=location.href;history.replaceState({s4uProtected:true},"",here);history.pushState({s4uProtected:true},"",here);addEventListener("popstate",()=>history.pushState({s4uProtected:true},"",here));}
 function start(){if(!portal())return;events.forEach(e=>document.addEventListener(e,reset,{passive:true}));protectHistory();reset();}
 document.addEventListener("DOMContentLoaded",start);window.S4USessionSecurity=Object.freeze({start,reset,signOut});
})();
