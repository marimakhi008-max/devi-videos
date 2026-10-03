const backdrop=document.getElementById("modalBackdrop"),titleEl=document.getElementById("modalTitle"),msgEl=document.getElementById("modalMessage"),iconEl=document.getElementById("modalIcon");
function showModal(t,m,i="✓"){titleEl.textContent=t;msgEl.textContent=m;iconEl.textContent=i;backdrop.classList.remove("hidden")}
function closeModal(){backdrop.classList.add("hidden")}
document.getElementById("modalClose").onclick=closeModal;document.getElementById("modalOk").onclick=closeModal;
backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModal()});

function setMembership(plan){localStorage.setItem("devi_membership",JSON.stringify({...plan,purchasedAt:new Date().toISOString()}));renderMembership()}
function renderMembership(){
  const raw=localStorage.getItem("devi_membership"),s=document.getElementById("memberStatus"),t=document.getElementById("memberText");
  if(!raw){s.textContent="Not subscribed";t.textContent="Complete a plan purchase to see your membership here.";return}
  try{const m=JSON.parse(raw);s.textContent=`${m.name} • Active`;t.textContent=`Duration: ${m.duration} • Payment: ${m.payment_id||"Verified"} • Purchased: ${new Date(m.purchasedAt).toLocaleString()}`}
  catch{localStorage.removeItem("devi_membership")}
}

async function createOrder(planId){
  const r=await fetch("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({planId})});
  const raw=await r.text();let d;try{d=JSON.parse(raw)}catch{d={error:raw||`HTTP ${r.status}`}}
  if(!r.ok||!d.success)throw new Error(d.error||d.message||`Unable to create order (HTTP ${r.status})`);
  return d;
}
async function verifyPayment(payment){
  const r=await fetch("/api/verify-payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payment)});
  const raw=await r.text();let d;try{d=JSON.parse(raw)}catch{d={error:raw||`HTTP ${r.status}`}}
  if(!r.ok||!d.success)throw new Error(d.error||d.message||"Payment verification failed.");
  return d;
}
async function startCheckout(planId){
  try{
    if(typeof Razorpay==="undefined")throw new Error("Razorpay Checkout could not be loaded. Check your internet connection.");
    const d=await createOrder(planId);
    const options={
      key:d.key_id,amount:d.order.amount,currency:d.order.currency,name:"Devi Videos",
      description:`${d.plan.name} membership`,order_id:d.order.id,theme:{color:"#8b5cf6"},
      handler:async function(payment){
        try{
          const v=await verifyPayment(payment);
          setMembership({...d.plan,payment_id:v.payment_id});
          showModal("Payment successful",`Your ${d.plan.name} membership has been activated on this browser.\nPayment ID: ${v.payment_id}`,"✓");
          document.getElementById("membership").scrollIntoView({behavior:"smooth"});
        }catch(e){showModal("Verification failed",e.message||"Payment verification failed.","!")}
      }
    };
    const checkout=new Razorpay(options);
    checkout.on("payment.failed",response=>{
      const description=response?.error?.description||response?.error?.reason||response?.error?.code||"Payment failed. Please try again.";
      showModal("Payment failed",description,"!");
    });
    checkout.open();
  }catch(e){console.error(e);showModal("Unable to start payment",e.message||"Something went wrong.","!")}
}
document.querySelectorAll(".subscribe-btn").forEach(b=>b.addEventListener("click",()=>startCheckout(b.dataset.plan)));
document.getElementById("memberBtn").onclick=()=>document.getElementById("membership").scrollIntoView({behavior:"smooth"});
document.getElementById("clearMembership").onclick=()=>{localStorage.removeItem("devi_membership");renderMembership()};
document.getElementById("year").textContent=new Date().getFullYear();renderMembership();
