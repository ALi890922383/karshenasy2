"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],K="aieo03",OLD="aieo02",IDLE=10*60*1000;
const uid=p=>p+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fa=()=>new Date().toLocaleString("fa-IR");
const COLL=["cases","msgs","strategies","reports","reviews","tasks","knowledge","events"];
let d=null,KEY=null,SALT=null,saveT=null,idleT=null,ctl=null,lastAct=Date.now();

/* ---------- رمزنگاری محلی ---------- */
const enc=new TextEncoder(),dec=new TextDecoder();
const b64=u=>{let s="";const a=new Uint8Array(u);for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(s)};
const ub64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function derive(pass,salt){const km=await crypto.subtle.importKey("raw",enc.encode(pass),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:310000,hash:"SHA-256"},km,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
async function seal(){if(!d||!KEY)return;try{const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:"AES-GCM",iv},KEY,enc.encode(JSON.stringify(d)));localStorage.setItem(K,JSON.stringify({v:1,salt:b64(SALT),iv:b64(iv),ct:b64(ct)}))}catch(e){toast("ذخیره‌سازی ناموفق بود: "+e.message)}}
function fresh(){const o={settings:{key:"",model:"claude-sonnet-5-5",redact:true}};COLL.forEach(k=>o[k]=[]);return o}
function norm(o){const b=fresh();o=o||{};COLL.forEach(k=>{if(Array.isArray(o[k]))b[k]=o[k]});b.settings={...b.settings,...(o.settings||{})};return b}
function save(){render();clearTimeout(saveT);saveT=setTimeout(seal,60)}
function log(t){d.events.unshift({t,at:fa()})}
function toast(t){const x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2800)}

/* ---------- قفل و ورود ---------- */
function showLock(){const has=!!localStorage.getItem(K);$("#lkT").textContent=has?"ورود به سامانه":"ایجاد رمز عبور";$("#lp2").hidden=has;$("#lp2").required=!has;$("#lkH").textContent=has?"رمز خود را وارد کنید.":"داده‌های شما با این رمز رمزگذاری می‌شود. رمز قابل بازیابی نیست؛ آن را در جایی امن نگه دارید.";$("#lk").hidden=false;$("#lp").focus()}
const lerr=t=>{$("#le").textContent=t};
$("#lf").onsubmit=async e=>{e.preventDefault();lerr("");const p=$("#lp").value,has=!!localStorage.getItem(K);
 try{
  if(has){const o=JSON.parse(localStorage.getItem(K));SALT=ub64(o.salt);KEY=await derive(p,SALT);const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:ub64(o.iv)},KEY,ub64(o.ct));d=norm(JSON.parse(dec.decode(pt)))}
  else{if(p.length<8)return lerr("حداقل ۸ نویسه لازم است.");if(p!==$("#lp2").value)return lerr("تکرار رمز یکسان نیست.");
   SALT=crypto.getRandomValues(new Uint8Array(16));KEY=await derive(p,SALT);let old=null;try{old=JSON.parse(localStorage.getItem(OLD))}catch{}
   d=norm(old);await seal();if(old)localStorage.removeItem(OLD)}
 }catch{KEY=null;d=null;return lerr("رمز نادرست است یا داده خراب شده است.")}
 $("#lp").value=$("#lp2").value="";$("#lk").hidden=true;start()};
const lockNow=()=>location.reload();
$("#lockb").onclick=lockNow;
function bump(){lastAct=Date.now();clearTimeout(idleT);if(d)idleT=setTimeout(lockNow,IDLE)}
["click","keydown","touchstart","mousemove"].forEach(ev=>addEventListener(ev,bump,{passive:true}));
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&d&&Date.now()-lastAct>IDLE)lockNow()});

/* ---------- ایجنت‌ها و پرامپت‌ها ---------- */
const agents=[["AG-01","مدیرعامل هوشمند","راهبری کلان، اولویت‌بندی و تصمیم‌های حساس."],["AG-02","مدیر عملیات","تقسیم وظایف، وابستگی‌ها، پیگیری و تجمیع."],["AG-03","مدیر پرونده","حدود قرار، پرسش‌ها و کفایت اطلاعات."],["AG-04","تحلیلگر اسناد","OCR، طبقه‌بندی، ردیابی سند/صفحه و تفکیک ادعا از واقعیت."],["AG-05","تحلیلگر فنی راه و ساختمان","سازه، خاک، پی، آسیب، مصالح، راه و روسازی."],["AG-06","کنترل کیفیت و ممیزی","چرخه چهارستونه، ثبت ایراد و تکرار اصلاح."],["AG-07","ارزیابی خسارت","متره، برآورد، قیمت روز و تفکیک اقلام."],["AG-08","هم‌افزایی و توسعه راهبرد","مباحثه با شما، سناریوها و پیشنهاد؛ فقط با تأیید شما ارجاع می‌دهد."],["AG-09","تحلیلگر حقوقی و رویه قضایی","قوانین، مقررات، آرای وحدت رویه و نظریات مشورتی با راستی‌آزمایی منبع."],["AG-10","آزمون فشار تقابلی","شبیه‌سازی ایرادات وکیل فرضی طرف مقابل، سناریوهای شکست و نقاط آسیب‌پذیر."],["AG-11","ویراستار و تنظیم‌گر حقوقی","ساختار، پاسخ به قرار، نگارش و انسجام؛ بدون تغییر نتیجه فنی."]];
const BASE="تو بخشی از «سازمان هوشمند کارشناسی (AIEO)» هستی که به یک کارشناس رسمی دادگستری رشته راه و ساختمان در ایران کمک می‌کند. به فارسی رسمی، دقیق و فشرده بنویس. قواعد الزامی: ۱) هیچ ماده قانونی، شماره رأی وحدت رویه، بند آیین‌نامه، مبحث مقررات ملی ساختمان یا مقدار عددی فنی را حدس نزن؛ اگر مطمئن نیستی صریحاً بنویس «نیازمند راستی‌آزمایی از منبع معتبر». ۲) ادعا، سند، مشاهده و استنباط را تفکیک کن. ۳) داده‌های مفقود و فرضیه‌های رقیب را صریح بگو. ۴) تو قاضی یا وکیل واقعی نیستی؛ تصمیم و امضای نظریه با کارشناس انسانی است. ۵) از اطلاعاتی که در ورودی نیست نتیجه نگیر و چیزی نساز.";
const sys=id=>{const a=agents.find(x=>x[0]===id);return BASE+"\nنقش تو: "+a[0]+" «"+a[1]+"» — "+a[2]};

/* ---------- فراخوانی مدل (استریم) ---------- */
const red=t=>d.settings.redact?String(t).replace(/[0-9۰-۹٠-٩]{8,}/g,"[شماره]"):String(t);
async function ai({system,messages,max=4096,onDelta}){
 const s=d.settings;ctl=new AbortController();
 const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",signal:ctl.signal,headers:{"content-type":"application/json","x-api-key":s.key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
  body:JSON.stringify({model:s.model,max_tokens:max,stream:true,system:red(system),messages:messages.map(m=>({role:m.role,content:red(m.content)}))})});
 if(!r.ok){let t="";try{t=(await r.json()).error.message}catch{}throw new Error(r.status+(t?" — "+t:""))}
 const rd=r.body.getReader(),de=new TextDecoder();let buf="",out="";
 for(;;){const {done,value}=await rd.read();if(done)break;buf+=de.decode(value,{stream:true});const parts=buf.split("\n\n");buf=parts.pop();
  for(const p of parts){const l=p.split("\n").find(x=>x.startsWith("data: "));if(!l)continue;let j;try{j=JSON.parse(l.slice(6))}catch{continue}
   if(j.type==="content_block_delta"&&j.delta&&j.delta.type==="text_delta"){out+=j.delta.text;onDelta&&onDelta(out)}
   else if(j.type==="error")throw new Error(j.error&&j.error.message||"خطای مدل")}}
 return out}
function busy(b){$$(".aibtn").forEach(x=>x.disabled=b);$("#stopb").hidden=!b}
async function guard(fn){if(!d.settings.key){toast("ابتدا کلید API را در تنظیمات وارد کنید");go("settings");return}busy(true);try{await fn()}catch(e){if(e.name!=="AbortError")toast("خطا: "+e.message)}finally{busy(false);ctl=null}}
$("#stopb").onclick=()=>ctl&&ctl.abort();
const jsonOf=t=>{const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a<0||b<a)throw new Error("پاسخ مدل قالب JSON نداشت");return JSON.parse(t.slice(a,b+1))};
const txt=v=>[].concat(v??"").join("\n");
function ctx(cid){const c=d.cases.find(x=>x.id===cid);if(!c)return"";const ss=d.strategies.filter(s=>s.cid===cid&&s.status==="مصوب کارشناس").map(s=>`- ${s.title}\n  مبانی: ${s.reason}\n  اقدامات: ${s.actions}\n  ریسک: ${s.risks}`).join("\n");
 return `[پرونده]\nعنوان: ${c.title}\nمرجع: ${c.court}\nشماره: ${c.number}\nنوع: ${c.domain}\nموضوع و حدود مأموریت: ${c.subject}\nشرح و مشاهدات: ${c.notes}\nمدارک ثبت‌شده (فقط نام): ${c.files.join("، ")||"—"}${ss?"\n\n[راهبردهای مصوب کارشناس]\n"+ss:""}`}
function pushUser(h,t){if(h.length&&h[h.length-1].role==="user")h[h.length-1].content+="\n\n"+t;else h.push({role:"user",content:t})}
function chatMsgs(cid){const out=[];d.msgs.filter(m=>m.cid===cid).slice(-20).map(m=>({role:m.role||"user",content:m.t})).filter(m=>m.content).forEach(m=>{if(out.length&&out[out.length-1].role===m.role)out[out.length-1].content+="\n\n"+m.content;else out.push({...m})});
 while(out.length&&out[0].role!=="user")out.shift();if(out.length)out[0].content=ctx(cid)+"\n\n[مباحثه]\n"+out[0].content;return out}

/* ---------- ناوبری ---------- */
function go(p){$$(".page").forEach(x=>x.classList.toggle("active",x.id===p));$$("nav button").forEach(x=>x.classList.toggle("active",x.dataset.p===p));$("#side").classList.remove("open")}
$$("nav button").forEach(b=>b.onclick=()=>go(b.dataset.p));$("#hamb").onclick=()=>$("#side").classList.toggle("open");

/* ---------- پرونده ---------- */
$("#cf").onsubmit=e=>{e.preventDefault();if(!d)return;const f=new FormData(e.target),files=[...f.getAll("files")].filter(x=>x.name).map(x=>x.name);
 d.cases.unshift({id:uid("C"),title:f.get("title"),court:f.get("court"),number:f.get("number"),subject:f.get("subject"),domain:f.get("domain"),notes:f.get("notes"),files,at:new Date().toLocaleDateString("fa-IR")});
 log("پرونده ثبت شد.");e.target.reset();save();toast("پرونده ثبت شد")};

/* ---------- اتاق هم‌افزایی: AG-08 ---------- */
$("#mf").onsubmit=e=>{e.preventDefault();if(!d)return;const cid=$("#sc").value;if(!cid)return toast("پرونده مرتبط را انتخاب کنید");const t=$("#mt").value.trim();if(!t)return;
 guard(async()=>{const mode=$("#sm").value;d.msgs.push({cid,role:"user",t:"["+mode+"] "+t,at:fa()});$("#mt").value="";log("دیدگاه در اتاق هم‌افزایی ثبت شد.");
  const m={cid,role:"assistant",t:"",at:fa()};d.msgs.push(m);save();
  try{m.t=await ai({system:sys("AG-08")+"\nنوع مباحثه فعلی: "+mode+". ابتدا مسئله را بازگو کن، سپس فرضیه‌های رقیب، داده‌های مفقود، سناریوها، ریسک‌ها و گزینه‌های اقدام را بده. در پایان فقط یک پرسش روشنگر بپرس.",messages:chatMsgs(cid),onDelta:x=>{m.t=x;renderMsgs()}})}
  catch(err){if(!m.t)d.msgs.splice(d.msgs.indexOf(m),1);save();throw err}
  save()})};
$("#sg").onclick=()=>{const cid=$("#sc").value;if(!cid)return toast("پرونده مرتبط را انتخاب کنید");const h=chatMsgs(cid);if(!h.length)return toast("ابتدا مباحثه‌ای ثبت کنید");
 guard(async()=>{pushUser(h,"بر پایه مباحثه بالا فقط یک شیء JSON با کلیدهای title، reason، actions، risks (همگی رشته فارسی) برای پیشنهاد راهبرد بنویس. هیچ متن دیگری ننویس.");
  const o=jsonOf(await ai({system:sys("AG-08"),messages:h,max:2000}));$("#st").value=txt(o.title);$("#sr").value=txt(o.reason);$("#sa").value=txt(o.actions);$("#sk").value=txt(o.risks);toast("پیش‌نویس راهبرد پر شد؛ بررسی و ثبت کنید")})};
$("#sf").onsubmit=e=>{e.preventDefault();if(!d)return;if(!$("#sc").value)return toast("پرونده مرتبط را انتخاب کنید");
 d.strategies.unshift({id:uid("S"),cid:$("#sc").value,title:$("#st").value,reason:$("#sr").value,actions:$("#sa").value,risks:$("#sk").value,status:"در انتظار تأیید شما"});log("پیشنهاد راهبرد برای تأیید ثبت شد.");e.target.reset();save()};
$("#sl").onclick=e=>{const b=e.target.closest("[data-a]");if(!b)return;const s=d.strategies.find(x=>x.id===b.dataset.id);
 if(b.dataset.a==="ok"){s.status="مصوب کارشناس";[["AG-03","تطبیق با حدود قرار"],["AG-04","استخراج اسناد و شواهد"],["AG-05","تحلیل فنی"],["AG-09","تحلیل حقوقی و راستی‌آزمایی منابع"],["AG-10","آزمون فشار تقابلی"],["AG-07","ارزیابی و برآورد"],["AG-11","تنظیم و ویرایش گزارش"],["AG-06","ممیزی چهارستونه"]].forEach(a=>d.tasks.push({id:uid("T"),cid:s.cid,agent:a[0],title:a[1]+" — "+s.title,status:"ایجادشده",output:""}));log("راهبرد تصویب و وظایف ایجاد شد.")}
 else s.status=b.dataset.a==="no"?"ردشده":"نیازمند اصلاح";save()};

/* ---------- گزارش ---------- */
$("#rf").onsubmit=e=>{e.preventDefault();if(!d)return;d.reports.unshift({id:uid("R"),cid:$("#rc").value,type:$("#rt").value,body:$("#rb").value,questions:$("#rq").value,at:fa()});log("پیش‌نویس گزارش ثبت شد.");e.target.reset();save()};
$("#rg").onclick=()=>{const cid=$("#rc").value;if(!cid)return toast("پرونده را انتخاب کنید");const type=$("#rt").value,agent=type==="ارزیابی خسارت"?"AG-07":type==="گزارش بررسی اسناد"?"AG-04":"AG-11";
 guard(async()=>{const prev=$("#rb").value,q=$("#rq").value;const head=prev+(prev?"\n\n":"")+"----- پیش‌نویس تولیدشده با مدل (نیازمند بازبینی کارشناس) -----\n";
  const u=ctx(cid)+"\n\n[نوع گزارش] "+type+"\n[یادداشت‌ها یا متن فعلی کارشناس]\n"+(prev||"—")+"\n\n[پرسش‌های قرار و پاسخ‌های فعلی]\n"+(q||"—")+"\n\nپیش‌نویس کامل با ساختار رسمی (مقدمه، مستندات و مشاهدات، تحلیل فنی، پاسخ به پرسش‌های قرار، نتیجه‌گیری) بنویس. جاهایی که داده کافی نیست با [نیازمند تکمیل: …] مشخص کن. اگر کارشناس نتیجه‌ای نوشته، آن را تغییر نده، فقط تنظیم و تکمیل کن.";
  await ai({system:sys(agent),messages:[{role:"user",content:u}],max:6000,onDelta:x=>{$("#rb").value=head+x}});toast("پیش‌نویس آماده شد؛ پیش از ذخیره بازبینی کنید")})};
$("#rl").onclick=e=>{const b=e.target.closest("[data-export]");if(!b)return;const r=d.reports.find(x=>x.id===b.dataset.export),t=`${r.type}\nپرونده: ${d.cases.find(c=>c.id===r.cid)?.title}\n\n${r.body}\n\nپرسش‌های قرار:\n${r.questions}\n\nاین متن پیش‌نویس است و باید با اصل مدارک و منابع معتبر تطبیق شود.`;download("AIEO-report.txt","\ufeff"+t,"text/plain;charset=utf-8")};
function download(name,content,type){const a=document.createElement("a"),u=URL.createObjectURL(new Blob([content],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}

/* ---------- ارزیابی چهارستونه ---------- */
$("#ra").onclick=()=>{const r=d.reports.find(x=>x.id===$("#vr").value);if(!r)return toast("پیش‌نویس را انتخاب کنید");
 guard(async()=>{const u=ctx(r.cid)+"\n\n[پیش‌نویس برای ممیزی]\n"+r.body+"\n\n[پرسش‌های قرار]\n"+(r.questions||"—")+"\n\nبا سخت‌گیری ممیزی کن. امتیاز را برای رسیدن به آستانه بالا نبر. فقط یک شیء JSON بده با کلیدهای: v1 (منظر قضایی، ۰ تا ۲٫۵)، v2 (آزمون تقابلی، ۰ تا ۲٫۵)، v3 (صحت فنی و محاسبات، ۰ تا ۳)، v4 (نگارش، ۰ تا ۲)، issues (رشته فارسی: فهرست ایرادات با شدت بحرانی/مهم/جزئی و اقدام اصلاحی)، critical (true اگر استناد غیرقابل راستی‌آزمایی، محاسبه ناسازگار یا تجاوز از حدود قرار دیدی).";
  const o=jsonOf(await ai({system:sys("AG-06"),messages:[{role:"user",content:u}],max:3000})),cl=(v,m)=>Math.max(0,Math.min(m,+v||0));
  $("#v1").value=cl(o.v1,2.5);$("#v2").value=cl(o.v2,2.5);$("#v3").value=cl(o.v3,3);$("#v4").value=cl(o.v4,2);$("#vi").value=txt(o.issues);$("#critical").checked=!!o.critical;toast("فرم پر شد؛ امتیازها را بازبینی و ثبت کنید")})};
$("#vf").onsubmit=e=>{e.preventDefault();if(!d)return;const vals=[1,2,3,4].map(n=>+$("#v"+n).value),max=[2.5,2.5,3,2];if(vals.some((x,i)=>x<0||x>max[i]))return toast("امتیاز خارج از دامنه است");
 const total=+vals.reduce((a,b)=>a+b,0).toFixed(1),critical=$("#critical").checked;
 d.reviews.unshift({rid:$("#vr").value,vals,total,critical,issues:$("#vi").value,round:$("#round").value,accepted:total>=9.5&&!critical,at:fa()});log("ارزیابی چهارستونه ثبت شد.");save();
 toast(critical?"خطای بحرانی؛ تأیید متوقف است":total>=9.5?"آستانه داخلی محقق شد؛ تأیید نهایی با شماست":"نیازمند اصلاح و تکرار")};

/* ---------- دانش ---------- */
$("#kf").onsubmit=e=>{e.preventDefault();if(!d)return;d.knowledge.unshift({title:$("#kt").value,cat:$("#kc").value,body:$("#kb").value,at:new Date().toLocaleDateString("fa-IR")});e.target.reset();log("دانش جدید ثبت شد.");save()};

/* ---------- وظایف ایجنت‌ها ---------- */
$("#tl").onchange=e=>{const t=d.tasks.find(x=>x.id===e.target.dataset.id);if(t){t.status=e.target.value;save()}};
async function runTask(t){
 const prev=d.tasks.filter(x=>x.cid===t.cid&&x.output&&x.output!=="…"&&x.id!==t.id).map(x=>`### خروجی ${x.agent} — ${x.title}\n${x.output.slice(0,8000)}`).join("\n\n");
 const rep=d.reports.find(r=>r.cid===t.cid);
 const extra=t.agent==="AG-06"?"ممیزی کن و ایرادات را با شدت (بحرانی/مهم/جزئی) و اقدام اصلاحی فهرست کن.":t.agent==="AG-10"?"ایرادات محتمل وکیل فرضی طرف مقابل و سناریوهای شکست را فهرست کن.":"خروجی را ساختاریافته بنویس و داده‌های ناقص را صریحاً مشخص کن.";
 const u=ctx(t.cid)+(rep?"\n\n[آخرین پیش‌نویس گزارش]\n"+rep.body:"")+(prev?"\n\n[خروجی ایجنت‌های قبلی]\n"+prev:"")+"\n\n[وظیفه] "+t.title+"\n"+extra;
 t.status="در حال انجام";t.output="…";save();
 try{t.output=await ai({system:sys(t.agent),messages:[{role:"user",content:u}],max:4096,onDelta:x=>{t.output=x;const el=document.querySelector(`[data-out="${t.id}"]`);if(el)el.textContent=x}});t.status="آماده تحویل";log(t.agent+" وظیفه را تکمیل کرد.")}
 catch(err){if(!t.output||t.output==="…"){t.output="";t.status="ایجادشده"}else t.status="نیازمند تصمیم کارشناس انسانی";save();throw err}
 save()}
$("#tl").onclick=e=>{const b=e.target.closest("[data-run]");if(!b)return;const t=d.tasks.find(x=>x.id===b.dataset.run);if(t)guard(()=>runTask(t))};
$("#runall").onclick=()=>guard(async()=>{for(const t of d.tasks.filter(x=>x.status==="ایجادشده"))await runTask(t)});

/* ---------- تنظیمات ---------- */
$("#setf").onsubmit=e=>{e.preventDefault();d.settings.key=$("#ak").value.trim();d.settings.model=$("#am").value;d.settings.redact=$("#ar").checked;save();toast("تنظیمات ذخیره شد")};
$("#tst").onclick=()=>{d.settings.key=$("#ak").value.trim();d.settings.model=$("#am").value;d.settings.redact=$("#ar").checked;save();
 guard(async()=>{const r=await ai({system:"فقط یک کلمه فارسی پاسخ بده.",messages:[{role:"user",content:"سلام"}],max:20});toast("اتصال برقرار است: "+r.slice(0,30))})};
$("#pf").onsubmit=async e=>{e.preventDefault();const p=$("#np").value;if(p.length<8)return toast("حداقل ۸ نویسه لازم است");SALT=crypto.getRandomValues(new Uint8Array(16));KEY=await derive(p,SALT);await seal();$("#np").value="";toast("رمز تغییر کرد")};
$("#bx").onclick=async()=>{await seal();download("aieo-backup-"+Date.now()+".json",localStorage.getItem(K)||"","application/json")};
$("#bi").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const o=JSON.parse(await f.text());if(!(o.salt&&o.iv&&o.ct))throw 0;if(!confirm("داده‌های فعلی این دستگاه با پشتیبان جایگزین شود؟ پس از آن باید با رمز همان پشتیبان وارد شوید."))return;localStorage.setItem(K,JSON.stringify(o));location.reload()}catch{toast("فایل پشتیبان معتبر نیست")}};
$("#wipe").onclick=()=>{if(confirm("همه پرونده‌ها و تنظیمات از این دستگاه برای همیشه حذف شود؟")&&confirm("تأیید نهایی: این کار قابل بازگشت نیست.")){localStorage.removeItem(K);localStorage.removeItem(OLD);location.reload()}};

/* ---------- نمایش ---------- */
function renderMsgs(){const el=$("#msgs");el.innerHTML="AG-08: دیدگاه یا فرضیه خود را بفرستید."+d.msgs.filter(m=>m.cid===$("#sc").value).map(m=>`<div class="msg${m.role==="assistant"?" ai":""}"><b>${m.role==="assistant"?"AG-08":"دیدگاه شما"}</b><p>${esc(m.t)||"…"}</p><small>${m.at}</small></div>`).join("");el.scrollTop=el.scrollHeight}
function render(){if(!d)return;const cn=i=>d.cases.find(x=>x.id===i)?.title||"پرونده نامشخص";
 $("#nc").textContent=d.cases.length;$("#ns").textContent=d.strategies.filter(x=>x.status==="در انتظار تأیید شما"||x.status==="نیازمند اصلاح").length;$("#nr").textContent=d.reports.length;$("#nt").textContent=d.tasks.length;
 $("#events").innerHTML=d.events.slice(0,8).map(x=>`<p>${esc(x.t)} <small>${x.at}</small></p>`).join("")||"هنوز رویدادی ثبت نشده است.";
 $("#cl").innerHTML=d.cases.map(c=>`<article class="item"><h3>${esc(c.title)}</h3>${esc(c.court)} · ${esc(c.number)}<p>${esc(c.subject)}</p><p>${esc(c.notes)}</p><small>مدارک ثبت‌شده: ${c.files.map(esc).join("، ")}</small></article>`).join("")||'<div class="box">پرونده‌ای ثبت نشده است.</div>';
 const opts='<option value="">انتخاب پرونده</option>'+d.cases.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join("");
 ["#sc","#rc"].forEach(s=>{const old=$(s).value;$(s).innerHTML=opts;if(d.cases.some(c=>c.id===old))$(s).value=old});renderMsgs();
 $("#sl").innerHTML=d.strategies.map(s=>`<article class="item"><h3>${esc(s.title)} — ${s.status}</h3><p>مبانی: ${esc(s.reason)}</p><p>اقدامات: ${esc(s.actions)}</p><p>ریسک: ${esc(s.risks)}</p><small>${esc(cn(s.cid))}</small>${s.status==="در انتظار تأیید شما"||s.status==="نیازمند اصلاح"?`<p><button data-a="ok" data-id="${s.id}">تأیید و ارجاع به عملیات</button><button data-a="rev" data-id="${s.id}">اصلاح</button><button data-a="no" data-id="${s.id}">رد</button></p>`:""}</article>`).join("")||"راهبردی ثبت نشده است.";
 $("#rl").innerHTML=d.reports.map(r=>`<article class="item"><h3>${esc(r.type)} — ${esc(cn(r.cid))}</h3><p>${esc(r.body.slice(0,500))}</p><button data-export="${r.id}">دریافت متن</button></article>`).join("")||"پیش‌نویسی ثبت نشده است.";
 const vsel=$("#vr").value;$("#vr").innerHTML='<option value="">انتخاب پیش‌نویس</option>'+d.reports.map(r=>`<option value="${r.id}">${esc(cn(r.cid))} ـ ${esc(r.type)}</option>`).join("");if(d.reports.some(r=>r.id===vsel))$("#vr").value=vsel;
 $("#vh").innerHTML=d.reviews.map(v=>`<article class="item"><h3>امتیاز ${v.total}/۱۰ · دور ${v.round}</h3><p>قضایی ${v.vals[0]}/۲٫۵ | تقابلی ${v.vals[1]}/۲٫۵ | فنی ${v.vals[2]}/۳ | نگارش ${v.vals[3]}/۲</p><p>${esc(v.issues)}</p><b>${v.critical?"خطای بحرانی ـ توقف":v.accepted?"آستانه ۹٫۵ محقق؛ تأیید انسانی لازم":"اصلاح و تکرار لازم"}</b></article>`).join("")||"ارزیابی ثبت نشده است.";
 $("#ag").innerHTML=agents.map(a=>`<article class="agent"><b>${a[0]}</b><h3>${a[1]}</h3><p>${a[2]}</p></article>`).join("");
 const SEL=["ایجادشده","در حال انجام","متوقف به علت نقص اطلاعات","آماده تحویل","برگشت برای اصلاح","در کنترل کیفیت","تأیید داخلی","نیازمند تصمیم کارشناس انسانی","مختومه"];
 $("#tl").innerHTML=d.tasks.map(t=>`<div class="item"><b>${t.agent}</b> · ${esc(t.title)} <select data-id="${t.id}">${SEL.map(s=>`<option ${t.status===s?"selected":""}>${s}</option>`).join("")}</select> <button class="aibtn" data-run="${t.id}">اجرا</button>${t.output?`<details${t.status==="در حال انجام"?" open":""}><summary>خروجی</summary><pre data-out="${t.id}">${esc(t.output)}</pre></details>`:""}</div>`).join("")||"هنوز وظیفه‌ای ایجاد نشده است.";
 $("#kl").innerHTML=d.knowledge.map(k=>`<article class="item"><h3>${esc(k.title)}</h3><small>${esc(k.cat)} · ${k.at}</small><p>${esc(k.body)}</p></article>`).join("")||"دانشی ثبت نشده است."}
$("#sc").onchange=renderMsgs;

function start(){$("#ak").value=d.settings.key;$("#am").value=d.settings.model;$("#ar").checked=d.settings.redact;render();bump()}
showLock();
if("serviceWorker"in navigator&&location.protocol!=="file:")addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
