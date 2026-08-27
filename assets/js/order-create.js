(function(){"use strict";
document.addEventListener("DOMContentLoaded",initialize);
const $=id=>document.getElementById(id);
function client(){return window.S4UAuth&&typeof window.S4UAuth.getClient==="function"?window.S4UAuth.getClient():null}
async function initialize(){
 try{
  if(!window.S4UAuth||typeof window.S4UAuth.requireSession!=="function")throw Error("Authentication system is unavailable.");
  const session=await window.S4UAuth.requireSession("admin-login.html");if(!session)return;
  if(window.S4UPermissions&&typeof window.S4UPermissions.requirePermission==="function"){const allowed=await window.S4UPermissions.requirePermission("orders.create","admin-orders.html");if(!allowed)return}
  $("orderForm").addEventListener("submit",save);
 }catch(error){notify(error.message||"Unable to initialize order creation.","error")}
}
function notify(message,type){if(window.S4UUI&&typeof window.S4UUI.toast==="function")window.S4UUI.toast(message,type||"info");else alert(message)}
async function save(event){
 event.preventDefault();
 const db=client();if(!db)return notify("Supabase client is unavailable.","error");
 const button=$("saveBtn"),payload={order_number:$("orderNumber").value.trim(),status:$("orderStatus").value,customer_first_name:$("firstName").value.trim()||null,customer_last_name:$("lastName").value.trim()||null,customer_email:$("email").value.trim(),customer_phone:$("customerPhone").value.trim()||null,payment_reference:$("paymentReference").value.trim()||null,notes:$("notes").value.trim()||null};
 if(!payload.order_number||!payload.customer_email)return notify("Order number and customer email are required.","error");
 button.disabled=true;button.textContent="Creating...";
 try{const {data,error}=await db.from("orders").insert(payload).select("id").single();if(error)throw error;window.location.href=`admin-order-manage.html?id=${encodeURIComponent(data.id)}&created=1`}
 catch(error){console.error(error);notify(error.message||"Unable to create order.","error");button.disabled=false;button.textContent="Create Order"}
}
})();