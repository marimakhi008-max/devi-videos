require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const app = express();
const PORT = process.env.PORT || 10000;
app.use(express.json({limit:"100kb"}));
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpay = (keyId && keySecret) ? new Razorpay({key_id:keyId,key_secret:keySecret}) : null;

const PLANS = {
  monthly:{id:"monthly",name:"Monthly",amount:99,duration:"1 month"},
  premium:{id:"premium",name:"Premium",amount:249,duration:"3 months"}
};

app.get("/health",(req,res)=>res.json({
  ok:true, service:"devi-videos", razorpayConfigured:Boolean(razorpay),
  time:new Date().toISOString()
}));

app.get("/api/config",(req,res)=>res.json({
  key_id:keyId||null, currency:"INR", plans:PLANS
}));

app.post("/api/create-order",async(req,res)=>{
  try{
    if(!razorpay) return res.status(500).json({
      success:false,
      error:"Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Render."
    });
    const plan=PLANS[String(req.body?.planId||"")];
    if(!plan) return res.status(400).json({success:false,error:"Invalid plan selected."});

    const order=await razorpay.orders.create({
      amount:plan.amount*100,
      currency:"INR",
      receipt:`dv_${plan.id}_${Date.now()}`,
      notes:{plan_id:plan.id,plan_name:plan.name,duration:plan.duration}
    });

    res.json({
      success:true,
      order:{id:order.id,amount:order.amount,currency:order.currency},
      key_id:keyId, plan
    });
  }catch(error){
    console.error("CREATE ORDER ERROR:",error);
    res.status(500).json({
      success:false,
      error:error?.error?.description||error?.description||error?.message||"Unable to create Razorpay order."
    });
  }
});

app.post("/api/verify-payment",(req,res)=>{
  try{
    const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body||{};
    if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature)
      return res.status(400).json({success:false,error:"Missing Razorpay payment details."});

    const expected=crypto.createHmac("sha256",keySecret||"")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");

    const valid=expected.length===String(razorpay_signature).length &&
      crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(String(razorpay_signature)));

    if(!valid) return res.status(400).json({success:false,error:"Payment signature verification failed."});
    res.json({success:true,message:"Payment verified successfully.",payment_id:razorpay_payment_id,order_id:razorpay_order_id});
  }catch(error){
    console.error("VERIFY PAYMENT ERROR:",error);
    res.status(500).json({success:false,error:"Unable to verify payment."});
  }
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`Devi Videos running on port ${PORT}`));
