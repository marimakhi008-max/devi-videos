require("dotenv").config();
const express=require("express"), session=require("express-session"), Database=require("better-sqlite3"), Razorpay=require("razorpay"), crypto=require("crypto"), path=require("path");
const app=express(), db=new Database("devi-videos.db");
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,plan TEXT,expires_at TEXT,active INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS payments(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,order_id TEXT,payment_id TEXT,plan TEXT,amount INTEGER,status TEXT,created_at TEXT);`);
app.use(express.json()); app.use(express.urlencoded({extended:true}));
app.use(session({secret:process.env.SESSION_SECRET||"dev-secret",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax"}}));
app.use(express.static(path.join(__dirname,"public")));

const plans={monthly:{name:"Monthly",amount:9900,days:30},quarterly:{name:"Premium 3 Months",amount:24900,days:90},yearly:{name:"Yearly",amount:79900,days:365}};
const rz=(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET)?new Razorpay({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET}):null;

app.post("/api/login",(req,res)=>{const email=String(req.body.email||"").trim().toLowerCase();if(!email||!email.includes("@"))return res.status(400).json({error:"Valid email required"});let u=db.prepare("SELECT * FROM users WHERE email=?").get(email);if(!u){const r=db.prepare("INSERT INTO users(email) VALUES(?)").run(email);u=db.prepare("SELECT * FROM users WHERE id=?").get(r.lastInsertRowid)}req.session.userId=u.id;res.json({ok:true,user:u});});
app.get("/api/me",(req,res)=>{if(!req.session.userId)return res.json({user:null});res.json({user:db.prepare("SELECT id,email,plan,expires_at,active FROM users WHERE id=?").get(req.session.userId)});});
app.post("/api/create-order",(req,res)=>{if(!req.session.userId)return res.status(401).json({error:"Login required"});if(!rz)return res.status(503).json({error:"Payment gateway is not configured. Add Razorpay keys to .env."});const p=plans[req.body.plan];if(!p)return res.status(400).json({error:"Invalid plan"});rz.orders.create({amount:p.amount,currency:"INR",receipt:"devi_"+Date.now(),notes:{user_id:String(req.session.userId),plan:req.body.plan}}).then(o=>{db.prepare("INSERT INTO payments(user_id,order_id,plan,amount,status,created_at) VALUES(?,?,?,?,?,datetime('now'))").run(req.session.userId,o.id,req.body.plan,p.amount,"created");res.json({order:o,key:process.env.RAZORPAY_KEY_ID});}).catch(e=>res.status(500).json({error:e.message}));});
app.post("/api/verify-payment",(req,res)=>{if(!req.session.userId)return res.status(401).json({error:"Login required"});const {razorpay_order_id,razorpay_payment_id,razorpay_signature,plan}=req.body;const expected=crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id+"|"+razorpay_payment_id).digest("hex");if(expected!==razorpay_signature)return res.status(400).json({error:"Payment verification failed"});const p=plans[plan];const expiry=new Date(Date.now()+p.days*86400000).toISOString();db.prepare("UPDATE users SET plan=?,expires_at=?,active=1 WHERE id=?").run(p.name,expiry,req.session.userId);db.prepare("UPDATE payments SET payment_id=?,status='paid' WHERE order_id=?").run(razorpay_payment_id,razorpay_order_id);res.json({ok:true});});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.listen(process.env.PORT||3000,()=>console.log("Devi Videos running on http://localhost:"+(process.env.PORT||3000)));
