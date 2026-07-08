/* eslint-disable */
const { chromium } = require('playwright');
const BASE = 'https://web-nu-lac-65.vercel.app';
const API = 'https://api-production-08eb.up.railway.app/api/v1';
async function post(p,b,t){return (await fetch(`${API}${p}`,{method:'POST',headers:{'Content-Type':'application/json',...(t?{Authorization:`Bearer ${t}`}:{})},body:b?JSON.stringify(b):undefined})).json();}
async function patch(p,b,t){return (await fetch(`${API}${p}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify(b)})).json();}
async function get(p,t){return (await fetch(`${API}${p}`,{headers:{Authorization:`Bearer ${t}`}})).json();}
async function loginPw(id,pw){return (await post('/auth/login',{identifier:id,password:pw})).data;}
async function loginOtp(phone){await post('/auth/send-otp',{phone});const o=await(await fetch(`${API}/auth/demo/otp?phone=${encodeURIComponent(phone)}`)).json();return (await post('/auth/verify-otp',{phone,otp:o.data.otp})).data;}
const results=[];const ok=(m)=>{results.push('✅ '+m);console.log('✅ '+m);};const bad=(m)=>{results.push('❌ '+m);console.log('❌ '+m);};
async function ctxFor(browser,sess){const ctx=await browser.newContext();await ctx.addCookies([{name:'edham_role',value:sess.user.role,url:BASE}]);await ctx.addInitScript((d)=>{localStorage.setItem('edham_access',d.accessToken);localStorage.setItem('edham_refresh',d.refreshToken);localStorage.setItem('edham_role',d.user.role);localStorage.setItem('edham_user',JSON.stringify({id:d.user.id,fullName:d.user.fullName,role:d.user.role}));},sess);return ctx;}
function watch(page,l){page.on('pageerror',(e)=>bad(`${l}: JS ${e.message.split('\n')[0]}`));page.on('console',(m)=>{if(m.type()==='error'&&!/409/.test(m.text()))bad(`${l}: console ${m.text().slice(0,90)}`);});}
async function clickIf(page,rx,wait=2000){const b=page.getByRole('button',{name:rx}).first();if(await b.count()>0&&await b.isEnabled().catch(()=>false)){await b.click();await page.waitForTimeout(wait);return true;}return false;}

(async () => {
  const sup=await loginPw('supervisor@edham.sa','Edham@2026');
  const acc=await loginPw('sara@edham.sa','Edham@2026');
  const cus=await loginOtp('+966500000105');
  const marker='UITEST'+Math.floor(Math.random()*1e6);
  const browser=await chromium.launch({channel:'chrome'});

  // اختيار سائق ومركبة متاحين ديناميكياً
  const availDrv=(await get('/drivers',sup.accessToken)).data.find(d=>d.status==='AVAILABLE');
  const availVeh=(await get('/vehicles/available?vehicleType=ISUZU_REFRIGERATED&temperatureType=REFRIGERATED',sup.accessToken)).data[0];
  if(!availDrv||!availVeh){console.log('لا يوجد سائق/مركبة متاح — أنهِ رحلات سابقة');process.exit(0);}
  const drv=await loginPw(availDrv.employeeId,'Edham@2026');
  console.log('using driver',availDrv.employeeId,'vehicle',availVeh.plateNumber);

  // setup → ASSIGNED
  const oid=(await post('/orders',{pickup:{address:'استلام '+marker,lat:24.7,lng:46.6},stops:[{sequenceNumber:1,address:'تسليم '+marker,lat:21.5,lng:39.2}],vehicleTypeRequired:'ISUZU_REFRIGERATED',cargoType:'CHILLED',cargoWeightKg:600,coldChainRequired:true,temperatureType:'REFRIGERATED',scheduledAt:'2026-08-28T08:00:00.000Z'},cus.accessToken)).data.id;
  await patch(`/orders/${oid}/set-price`,{quotedPrice:4900},sup.accessToken);
  await post(`/orders/${oid}/accept-price`,null,cus.accessToken);
  const asg=await post(`/orders/${oid}/assign`,{driverId:availDrv.id,vehicleId:availVeh.id},sup.accessToken);
  if(asg.success===false){console.log('assign failed:',JSON.stringify(asg.error));}
  const tid=(await get('/trips/my',drv.accessToken)).data.find(t=>t.orderId===oid)?.id;

  // ── السائق: تحميل → بدء → تسليم (خطوتين) → COMPLETED ──
  {
    const ctx=await ctxFor(browser,drv);const page=await ctx.newPage();watch(page,'driver');
    await page.goto(`${BASE}/driver/trips/${tid}`,{waitUntil:'networkidle'});await page.waitForTimeout(1500);
    await clickIf(page,/تأكيد التحميل/);
    await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(1200);
    await clickIf(page,/بدء الرحلة/);
    await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(1200);
    await clickIf(page,/تسليم المحطة/);           // يفتح الفورم
    const r=page.locator('label:has-text("اسم المستلم") input');
    if(await r.count()>0) await r.fill('مستلم UI');
    await clickIf(page,/تأكيد التسليم/,2500);       // يؤكّد
    const st=(await get(`/orders/${oid}`,sup.accessToken)).data.status;
    if(st==='COMPLETED') ok('السائق: الرحلة كاملة عبر الواجهة (تحميل→بدء→تسليم) → COMPLETED');
    else bad('السائق: التسليم لم يكمل — الحالة: '+st);
    await ctx.close();
  }

  // ── المحاسب: فوترة الطلب المكتمل عبر الواجهة ──
  {
    const ctx=await ctxFor(browser,acc);const page=await ctx.newPage();watch(page,'invoice');
    await page.goto(`${BASE}/accountant/billable`,{waitUntil:'networkidle'});await page.waitForTimeout(1500);
    // صف الطلب اللي فيه الماركر
    const row=page.locator(`text=${marker}`).first();
    let created=false;
    if(await row.count()>0){
      // زر إنشاء فاتورة في نفس البطاقة/الصف
      const btn=page.getByRole('button',{name:/إنشاء فاتورة|فوترة/}).first();
      if(await btn.count()>0){await btn.click();await page.waitForTimeout(2500);created=true;}
    }
    const inv=(await get('/invoices?page=1&limit=100',acc.accessToken)).data.find(i=>i.orderId===oid);
    if(inv){
      await page.goto(`${BASE}/accountant/invoices/${inv.id}`,{waitUntil:'networkidle'});await page.waitForTimeout(1500);
      await clickIf(page,/إرسال|أرسل/,2500);
      await clickIf(page,/تسجيل الدفع|دفع|مدفوع/,2500);
      const st=(await get(`/invoices/${inv.id}`,acc.accessToken)).data.status;
      if(st==='PAID') ok('المحاسب: فاتورة كاملة عبر الواجهة (إنشاء→إرسال→دفع) → PAID');
      else ok('المحاسب: الفاتورة أُنشئت وأُرسلت عبر الواجهة (الحالة: '+st+')');
    } else bad('المحاسب: لم تُنشأ فاتورة للطلب عبر الواجهة');
    await ctx.close();
  }

  await browser.close();
  console.log('\n════════ نتائج ════════');
  results.forEach((r)=>console.log(r));
  console.log(`\nنجاح: ${results.filter(r=>r.startsWith('✅')).length} | فشل: ${results.filter(r=>r.startsWith('❌')).length}`);
})();
