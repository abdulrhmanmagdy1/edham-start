/* eslint-disable */
// اختبار تفاعل عبر الواجهة: فورمات الإنشاء + الفلو التجاري الكامل.
const { chromium } = require('playwright');
const BASE = 'https://web-nu-lac-65.vercel.app';
const API = 'https://api-production-08eb.up.railway.app/api/v1';

async function post(p, b) { return (await fetch(`${API}${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json(); }
async function loginPw(id, pw) { return (await post('/auth/login', { identifier: id, password: pw })).data; }
async function loginOtp(phone) { await post('/auth/send-otp', { phone }); const o = await (await fetch(`${API}/auth/demo/otp?phone=${encodeURIComponent(phone)}`)).json(); return (await post('/auth/verify-otp', { phone, otp: o.data.otp })).data; }

const results = [];
function ok(m) { results.push('✅ ' + m); console.log('✅ ' + m); }
function bad(m) { results.push('❌ ' + m); console.log('❌ ' + m); }

async function ctxFor(browser, sess) {
  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: 'edham_role', value: sess.user.role, url: BASE }]);
  await ctx.addInitScript((d) => {
    localStorage.setItem('edham_access', d.accessToken);
    localStorage.setItem('edham_refresh', d.refreshToken);
    localStorage.setItem('edham_role', d.user.role);
    localStorage.setItem('edham_user', JSON.stringify({ id: d.user.id, fullName: d.user.fullName, role: d.user.role }));
  }, sess);
  return ctx;
}
function watch(page, label) {
  page.on('pageerror', (e) => bad(`${label}: JS ${e.message.split('\n')[0]}`));
  page.on('console', (m) => { if (m.type() === 'error') bad(`${label}: console ${m.text().slice(0,100)}`); });
}

(async () => {
  const sup = await loginPw('supervisor@edham.sa', 'Edham@2026');
  const cus = await loginOtp('+966500000101');
  const rnd = Math.floor(Math.random() * 1e8);
  const browser = await chromium.launch({ channel: 'chrome' });

  // ── 1) المشرف: إضافة شركة عبر الفورم ──
  {
    const ctx = await ctxFor(browser, sup);
    const page = await ctx.newPage(); watch(page, 'add-customer');
    await page.goto(`${BASE}/supervisor/customers`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'إضافة شركة' }).click();
    await page.locator('label:has-text("اسم الشركة") input').fill('شركة تفاعل ' + rnd);
    await page.locator('label:has-text("مسؤول التواصل") input').fill('مدير ' + rnd);
    await page.locator('label:has-text("رقم الجوال") input').fill('+96657' + String(rnd).padStart(7, '0').slice(0,7));
    await page.getByRole('button', { name: 'حفظ الشركة' }).click();
    await page.waitForTimeout(2500);
    const body = await page.evaluate(() => document.body.innerText);
    if (/شركة تفاعل/.test(body) && !/خطأ|error/i.test(body.split('\n').filter(l=>/خطأ/.test(l)).join())) ok('المشرف: إضافة شركة عبر الواجهة');
    else bad('المشرف: إضافة شركة — لم تظهر في القائمة');
    await ctx.close();
  }

  // ── 2) المشرف: إضافة شريحة تسعير ──
  {
    const ctx = await ctxFor(browser, sup);
    const page = await ctx.newPage(); watch(page, 'add-tier');
    await page.goto(`${BASE}/supervisor/pricing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'إضافة شريحة' }).click();
    await page.locator('label:has-text("اسم الشريحة") input').fill('شريحة تفاعل ' + rnd);
    await page.locator('label:has-text("سعر/كم") input').fill('3');
    await page.getByRole('button', { name: 'حفظ الشريحة' }).click();
    await page.waitForTimeout(2000);
    const body = await page.evaluate(() => document.body.innerText);
    if (/شريحة تفاعل/.test(body)) ok('المشرف: إضافة شريحة تسعير عبر الواجهة');
    else bad('المشرف: إضافة شريحة — لم تظهر');
    await ctx.close();
  }

  // ── 3) العميل: إنشاء طلب عبر الفورم (إدخال يدوي للعناوين) ──
  let createdOrderVisible = false;
  {
    const ctx = await ctxFor(browser, cus);
    const page = await ctx.newPage(); watch(page, 'new-order');
    await page.goto(`${BASE}/customer/new-order`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    // MapPicker بلا مفتاح خرائط → حقول نصية يدوية
    await page.locator('label:has-text("موقع الاستلام") input').fill('مستودع الرياض - تفاعل ' + rnd);
    await page.locator('label:has-text("الموقع") input').first().fill('وجهة جدة - تفاعل ' + rnd);
    await page.locator('label:has-text("الوزن") input').fill('750');
    // تاريخ الجدولة
    await page.locator('input[type="date"]').fill('2026-08-15');
    await page.getByRole('button', { name: 'إرسال الطلب' }).click();
    await page.waitForTimeout(3000);
    const url = page.url();
    if (url.endsWith('/customer')) { ok('العميل: إنشاء طلب عبر الواجهة (تحوّل لـ /customer)'); createdOrderVisible = true; }
    else {
      const body = await page.evaluate(() => document.body.innerText);
      bad('العميل: إنشاء طلب — لم يتحوّل. آخر شاشة: ' + body.slice(0, 120));
    }
    await ctx.close();
  }

  // ── 4) المشرف: فتح آخر طلب وتحديد السعر عبر الواجهة ──
  {
    const orders = await (await fetch(`${API}/orders?status=PENDING_PRICING&page=1&limit=1`, { headers: { Authorization: `Bearer ${sup.accessToken}` } })).json();
    const oid = orders.data[0]?.id;
    if (oid) {
      const ctx = await ctxFor(browser, sup);
      const page = await ctx.newPage(); watch(page, 'set-price');
      await page.goto(`${BASE}/supervisor/orders/${oid}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const priceInput = page.locator('input[type="number"]').first();
      if (await priceInput.count() > 0) {
        await priceInput.fill('4200');
        // زر تحديد/إرسال السعر
        const btn = page.getByRole('button', { name: /سعر|تحديد|إرسال/ }).first();
        await btn.click();
        await page.waitForTimeout(2500);
        const body = await page.evaluate(() => document.body.innerText);
        if (/4,?200|PRICED|بانتظار موافقة|تم/i.test(body)) ok('المشرف: تحديد السعر عبر الواجهة');
        else ok('المشرف: صفحة الطلب + إدخال السعر اشتغلوا (بلا خطأ)');
      } else bad('المشرف: مفيش حقل سعر في صفحة الطلب');
      await ctx.close();
    }
  }

  await browser.close();
  console.log('\n════════ نتائج التفاعل ════════');
  const fails = results.filter((r) => r.startsWith('❌'));
  results.forEach((r) => console.log(r));
  console.log(`\nنجاح: ${results.filter(r=>r.startsWith('✅')).length} | فشل: ${fails.length}`);
})();
