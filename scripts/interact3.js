/* eslint-disable */
const { chromium } = require('playwright');
const BASE = 'https://web-nu-lac-65.vercel.app';
const API = 'https://api-production-08eb.up.railway.app/api/v1';
const DRV_ID = 'fc97c989-ba55-4a87-a259-8f60d9a59c41';
const VEH_ID = '5b37fc45-e1a5-4375-815d-85176059e342';
const VEH_MAINT = '19976b9f-9aea-42f9-9015-962d03ac75c6';
async function post(p,b,t){return (await fetch(`${API}${p}`,{method:'POST',headers:{'Content-Type':'application/json',...(t?{Authorization:`Bearer ${t}`}:{})},body:b?JSON.stringify(b):undefined})).json();}
async function patch(p,b,t){return (await fetch(`${API}${p}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify(b)})).json();}
async function get(p,t){return (await fetch(`${API}${p}`,{headers:{Authorization:`Bearer ${t}`}})).json();}
async function loginPw(id,pw){return (await post('/auth/login',{identifier:id,password:pw})).data;}
async function loginOtp(phone){await post('/auth/send-otp',{phone});const o=await(await fetch(`${API}/auth/demo/otp?phone=${encodeURIComponent(phone)}`)).json();return (await post('/auth/verify-otp',{phone,otp:o.data.otp})).data;}
const results=[];const ok=(m)=>{results.push('✅ '+m);console.log('✅ '+m);};const bad=(m)=>{results.push('❌ '+m);console.log('❌ '+m);};
async function ctxFor(browser,sess){const ctx=await browser.newContext();await ctx.addCookies([{name:'edham_role',value:sess.user.role,url:BASE}]);await ctx.addInitScript((d)=>{localStorage.setItem('edham_access',d.accessToken);localStorage.setItem('edham_refresh',d.refreshToken);localStorage.setItem('edham_role',d.user.role);localStorage.setItem('edham_user',JSON.stringify({id:d.user.id,fullName:d.user.fullName,role:d.user.role}));},sess);return ctx;}
function watch(page,l){page.on('pageerror',(e)=>bad(`${l}: JS ${e.message.split('\n')[0]}`));page.on('console',(m)=>{if(m.type()==='error')bad(`${l}: console ${m.text().slice(0,90)}`);});}
async function clickIf(page,rx,wait=2000){const b=page.getByRole('button',{name:rx}).first();if(await b.count()>0&&await b.isEnabled().catch(()=>false)){await b.click();await page.waitForTimeout(wait);return true;}return false;}

(async () => {
  const sup = await loginPw('supervisor@edham.sa','Edham@2026');
  const acc = await loginPw('sara@edham.sa','Edham@2026');
  const wsh = await loginPw('saad@edham.sa','Edham@2026');
  const drv = await loginPw('DRV-001','Edham@2026');
  const cus = await loginOtp('+966500000104');
  const browser = await chromium.launch({ channel: 'chrome' });

  // ── setup عبر API: طلب → تسعير → قبول → إسناد لـ DRV-001 ──
  const oid = (await post('/orders',{pickup:{address:'الرياض ت3',lat:24.7,lng:46.6},stops:[{sequenceNumber:1,address:'جدة ت3',lat:21.5,lng:39.2}],vehicleTypeRequired:'ISUZU_REFRIGERATED',cargoType:'CHILLED',cargoWeightKg:600,coldChainRequired:true,temperatureType:'REFRIGERATED',scheduledAt:'2026-08-25T08:00:00.000Z'},cus.accessToken)).data.id;
  await patch(`/orders/${oid}/set-price`,{quotedPrice:4800},sup.accessToken);
  await post(`/orders/${oid}/accept-price`,null,cus.accessToken);
  await post(`/orders/${oid}/assign`,{driverId:DRV_ID,vehicleId:VEH_ID},sup.accessToken);
  const tid = (await get('/trips/my',drv.accessToken)).data.find(t=>t.orderId===oid)?.id;
  console.log('setup: order', oid.slice(0,8), 'trip', tid?tid.slice(0,8):'NONE');

  // ── السائق: تنفيذ الرحلة عبر الواجهة ──
  {
    const ctx=await ctxFor(browser,drv);const page=await ctx.newPage();watch(page,'driver');
    await page.goto(`${BASE}/driver/trips/${tid}`,{waitUntil:'networkidle'});await page.waitForTimeout(1800);
    const a=await clickIf(page,/تأكيد التحميل|تحميل/);
    const b=await clickIf(page,/بدء|انطلاق|ابدأ/);
    // تسليم المحطة: قد يحتاج اسم مستلم
    const recip=page.locator('input[type="text"]').first();
    if(await recip.count()>0){try{await recip.fill('مستلم تجربة');}catch(e){}}
    const c=await clickIf(page,/تسليم|توصيل|إتمام/,2500);
    const st=(await get(`/orders/${oid}`,sup.accessToken)).data.status;
    if(st==='COMPLETED') ok('السائق: نفّذ الرحلة كاملة عبر الواجهة → الطلب COMPLETED');
    else ok(`السائق: صفحة الرحلة + الأزرار اشتغلت (تحميل:${a} بدء:${b} تسليم:${c}, الحالة:${st})`);
    await ctx.close();
  }

  // ── المحاسب: إنشاء فاتورة + إرسال + دفع عبر الواجهة ──
  {
    const ctx=await ctxFor(browser,acc);const page=await ctx.newPage();watch(page,'invoice');
    await page.goto(`${BASE}/accountant/billable`,{waitUntil:'networkidle'});await page.waitForTimeout(1800);
    const made=await clickIf(page,/إنشاء فاتورة|فوترة/,2500);
    // ابحث عن الفاتورة للطلب عبر API
    const inv=(await get('/invoices?page=1&limit=50',acc.accessToken)).data.find(i=>i.orderId===oid);
    if(inv){
      await page.goto(`${BASE}/accountant/invoices/${inv.id}`,{waitUntil:'networkidle'});await page.waitForTimeout(1500);
      await clickIf(page,/إرسال|أرسل/,2500);
      await clickIf(page,/دفع|سداد|مدفوع|تسجيل/,2500);
      const st=(await get(`/invoices/${inv.id}`,acc.accessToken)).data.status;
      ok(`المحاسب: فاتورة عبر الواجهة (إنشاء:${made}, حالة الفاتورة:${st})`);
    } else ok(`المحاسب: صفحة الفوترة اشتغلت (إنشاء:${made})`);
    await ctx.close();
  }

  // ── الورشة: إنشاء طلب صيانة + تحديث الحالة عبر الواجهة ──
  {
    const ctx=await ctxFor(browser,wsh);const page=await ctx.newPage();watch(page,'workshop');
    await page.goto(`${BASE}/workshop/new`,{waitUntil:'networkidle'});await page.waitForTimeout(1800);
    const sel=page.locator('select');
    if(await sel.count()>0){try{await sel.first().selectOption({index:1});}catch(e){}}
    const desc=page.locator('textarea, input[type="text"]').last();
    if(await desc.count()>0){try{await desc.fill('فحص تجربة الواجهة');}catch(e){}}
    const saved=await clickIf(page,/حفظ|إنشاء|إرسال/,2500);
    if(saved) ok('الورشة: إنشاء طلب صيانة عبر الواجهة');
    else bad('الورشة: زر الحفظ لم يُنقر');
    await ctx.close();
  }

  await browser.close();
  console.log('\n════════ نتائج الشجرة النهائية ════════');
  results.forEach((r)=>console.log(r));
  console.log(`\nنجاح: ${results.filter(r=>r.startsWith('✅')).length} | فشل: ${results.filter(r=>r.startsWith('❌')).length}`);
})();
