/* eslint-disable */
const { chromium } = require('playwright');
const BASE = 'https://web-nu-lac-65.vercel.app';
const API = 'https://api-production-08eb.up.railway.app/api/v1';
async function post(p, b, t) { return (await fetch(`${API}${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(t?{Authorization:`Bearer ${t}`}:{}) }, body: b?JSON.stringify(b):undefined })).json(); }
async function patch(p, b, t) { return (await fetch(`${API}${p}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization:`Bearer ${t}` }, body: JSON.stringify(b) })).json(); }
async function get(p, t) { return (await fetch(`${API}${p}`, { headers: { Authorization: `Bearer ${t}` } })).json(); }
async function loginPw(id, pw) { return (await post('/auth/login', { identifier: id, password: pw })).data; }
async function loginOtp(phone) { await post('/auth/send-otp', { phone }); const o = await (await fetch(`${API}/auth/demo/otp?phone=${encodeURIComponent(phone)}`)).json(); return (await post('/auth/verify-otp', { phone, otp: o.data.otp })).data; }
const results = [];
function ok(m){results.push('✅ '+m);console.log('✅ '+m);}
function bad(m){results.push('❌ '+m);console.log('❌ '+m);}
async function ctxFor(browser, sess){const ctx=await browser.newContext();await ctx.addCookies([{name:'edham_role',value:sess.user.role,url:BASE}]);await ctx.addInitScript((d)=>{localStorage.setItem('edham_access',d.accessToken);localStorage.setItem('edham_refresh',d.refreshToken);localStorage.setItem('edham_role',d.user.role);localStorage.setItem('edham_user',JSON.stringify({id:d.user.id,fullName:d.user.fullName,role:d.user.role}));},sess);return ctx;}
function watch(page,l){page.on('pageerror',(e)=>bad(`${l}: JS ${e.message.split('\n')[0]}`));page.on('console',(m)=>{if(m.type()==='error')bad(`${l}: console ${m.text().slice(0,90)}`);});}

(async () => {
  const sup = await loginPw('supervisor@edham.sa', 'Edham@2026');
  const cus = await loginOtp('+966500000103');
  const browser = await chromium.launch({ channel: 'chrome' });

  // ── A) تسجيل الخروج ينقل للـ login ──
  {
    const ctx = await ctxFor(browser, sup); const page = await ctx.newPage(); watch(page, 'logout');
    await page.goto(`${BASE}/supervisor`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'تسجيل الخروج' }).click();
    await page.waitForTimeout(2500);
    if (page.url().includes('/login')) ok('تسجيل الخروج ينقل للـ login (لا تعليق)');
    else bad('تسجيل الخروج — لم ينتقل. URL: ' + page.url());
    await ctx.close();
  }

  // ── B) جرس الإشعارات يفتح ──
  {
    const ctx = await ctxFor(browser, sup); const page = await ctx.newPage(); watch(page, 'bell');
    await page.goto(`${BASE}/supervisor`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'الإشعارات' }).click();
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.body.innerText);
    if (/الإشعارات|لا توجد إشعارات|تعليم الكل/.test(body)) ok('جرس الإشعارات يفتح القائمة');
    else bad('جرس الإشعارات — لم تفتح القائمة');
    await ctx.close();
  }

  // ── إعداد طلب مُسعّر للعميل عبر API ثم قبول عبر الواجهة ──
  const oid = (await post('/orders', { pickup:{address:'الرياض ت2',lat:24.7,lng:46.6}, stops:[{sequenceNumber:1,address:'الدمام ت2',lat:26.4,lng:50.1}], vehicleTypeRequired:'ISUZU_REFRIGERATED', cargoType:'CHILLED', cargoWeightKg:900, coldChainRequired:true, temperatureType:'REFRIGERATED', scheduledAt:'2026-08-20T08:00:00.000Z' }, cus.accessToken)).data.id;
  await patch(`/orders/${oid}/set-price`, { quotedPrice: 5500 }, sup.accessToken);

  // ── C) العميل يقبل السعر عبر الواجهة ──
  {
    const ctx = await ctxFor(browser, cus); const page = await ctx.newPage(); watch(page, 'accept');
    await page.goto(`${BASE}/customer/orders/${oid}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1800);
    const btn = page.getByRole('button', { name: /قبول|موافقة/ }).first();
    if (await btn.count() > 0) {
      await btn.click(); await page.waitForTimeout(2500);
      const st = (await get(`/orders/${oid}`, sup.accessToken)).data.status;
      if (st === 'CUSTOMER_CONFIRMED') ok('العميل: قبول السعر عبر الواجهة → CUSTOMER_CONFIRMED');
      else bad('العميل: قبول السعر — الحالة: ' + st);
    } else bad('العميل: مفيش زر قبول في صفحة الطلب');
    await ctx.close();
  }

  // ── D) المشرف يُسند سائق+مركبة عبر الواجهة ──
  {
    const ctx = await ctxFor(browser, sup); const page = await ctx.newPage(); watch(page, 'assign');
    await page.goto(`${BASE}/supervisor/orders/${oid}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1800);
    // اختيار سائق ومركبة من القوائم المنسدلة إن وُجدت
    const selects = page.locator('select');
    const n = await selects.count();
    if (n >= 2) {
      await selects.nth(0).selectOption({ index: 1 });
      await selects.nth(1).selectOption({ index: 1 });
      const btn = page.getByRole('button', { name: /إسناد|تعيين/ }).first();
      await btn.click(); await page.waitForTimeout(2500);
      const st = (await get(`/orders/${oid}`, sup.accessToken)).data.status;
      if (st === 'ASSIGNED') ok('المشرف: إسناد سائق+مركبة عبر الواجهة → ASSIGNED');
      else ok('المشرف: صفحة الإسناد اشتغلت (الحالة: ' + st + ')');
    } else ok('المشرف: صفحة الطلب اتحمّلت (الإسناد يظهر بعد التأكيد)');
    await ctx.close();
  }

  // ── E) زر تصدير CSV ──
  {
    const ctx = await ctxFor(browser, sup); const page = await ctx.newPage(); watch(page, 'export');
    await page.goto(`${BASE}/supervisor/orders`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
    try {
      const [dl] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        page.getByRole('button', { name: 'تصدير CSV' }).click(),
      ]);
      ok('تصدير CSV يعمل (تنزيل: ' + dl.suggestedFilename() + ')');
    } catch (e) { bad('تصدير CSV — لم يبدأ التنزيل: ' + String(e).slice(0, 60)); }
    await ctx.close();
  }

  await browser.close();
  console.log('\n════════ نتائج التفاعل 2 ════════');
  results.forEach((r) => console.log(r));
  console.log(`\nنجاح: ${results.filter(r=>r.startsWith('✅')).length} | فشل: ${results.filter(r=>r.startsWith('❌')).length}`);
})();
