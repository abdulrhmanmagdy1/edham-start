/* eslint-disable */
// زاحف اختبار DFS للموقع المرفوع — يحقن جلسة كل دور ويزور كل صفحة ويلتقط الأخطاء.
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'https://web-nu-lac-65.vercel.app';
const API = process.env.API || 'https://api-production-08eb.up.railway.app/api/v1';

async function post(path, body) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return r.json();
}
async function get(path, token) {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return r.json();
}
async function loginPw(identifier, password) {
  const j = await post('/auth/login', { identifier, password });
  return j.data;
}
async function loginOtp(phone) {
  await post('/auth/send-otp', { phone });
  const o = await (await fetch(`${API}/auth/demo/otp?phone=${encodeURIComponent(phone)}`)).json();
  const j = await post('/auth/verify-otp', { phone, otp: o.data.otp });
  return j.data;
}

(async () => {
  // ── جلسات الأدوار ──
  const sup = await loginPw('supervisor@edham.sa', 'Edham@2026');
  const acc = await loginPw('sara@edham.sa', 'Edham@2026');
  const wsh = await loginPw('saad@edham.sa', 'Edham@2026');
  const drv = await loginPw('DRV-001', 'Edham@2026');
  const cus = await loginOtp('+966500000101');

  // ── معرّفات كيانات ──
  const orderId = (await get('/orders?page=1&limit=1', sup.accessToken)).data[0]?.id;
  const invId = (await get('/invoices?page=1&limit=1', acc.accessToken)).data[0]?.id;
  const maintId = (await get('/maintenance', wsh.accessToken)).data[0]?.id;
  const tripId = (await get('/trips/my', drv.accessToken)).data[0]?.id;
  const myOrder = (await get('/orders/my', cus.accessToken)).data[0]?.id;

  const ROLES = [
    { name: 'SUPERVISOR', s: sup, pages: [
      '/supervisor', '/supervisor/orders', '/supervisor/customers', '/supervisor/customers/new-order',
      '/supervisor/map', '/supervisor/vehicles', '/supervisor/fleet', '/supervisor/drivers',
      '/supervisor/users', '/supervisor/pricing', '/supervisor/reports', '/supervisor/cold-chain',
      '/supervisor/audit', orderId && `/supervisor/orders/${orderId}`,
    ]},
    { name: 'ACCOUNTANT', s: acc, pages: [
      '/accountant', '/accountant/billable', invId && `/accountant/invoices/${invId}`,
    ]},
    { name: 'WORKSHOP', s: wsh, pages: [
      '/workshop', '/workshop/new', maintId && `/workshop/maintenance/${maintId}`,
    ]},
    { name: 'DRIVER', s: drv, pages: [
      '/driver', tripId && `/driver/trips/${tripId}`,
    ]},
    { name: 'CUSTOMER', s: cus, pages: [
      '/customer', '/customer/new-order', '/customer/invoices',
      myOrder && `/customer/orders/${myOrder}`, myOrder && `/customer/orders/${myOrder}/track`,
    ]},
  ];

  const PUBLIC = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

  const browser = await chromium.launch();
  const findings = [];

  async function visit(ctx, url, label) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('JS: ' + e.message.split('\n')[0]));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 120)); });
    let status = 0;
    try {
      const resp = await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 });
      status = resp ? resp.status() : 0;
      await page.waitForTimeout(1800);
      const body = await page.evaluate(() => document.body.innerText);
      const html = await page.content();
      const crash = /Application error|client-side exception/i.test(body);
      // كشف التعليق: فيه spinner ومفيش عنوان/محتوى
      const onlySpinner = /animate-spin/.test(html) && !/<h1/i.test(html) && body.trim().length < 40;
      if (crash) findings.push(`❌ [${label}] ${url} → CRASH (Application error)`);
      else if (onlySpinner) findings.push(`⚠️ [${label}] ${url} → عالق على spinner (بلا محتوى)`);
      if (errors.length) findings.push(`⚠️ [${label}] ${url} → ${errors.slice(0, 3).join(' | ')}`);
      if (!crash && !onlySpinner && !errors.length) console.log(`✅ [${label}] ${url} (${status})`);
      else console.log(`⚠️ [${label}] ${url} (${status}) — سُجّل`);
    } catch (e) {
      findings.push(`❌ [${label}] ${url} → ${String(e).split('\n')[0]}`);
      console.log(`❌ [${label}] ${url} — ${String(e).slice(0, 60)}`);
    }
    await page.close();
  }

  // Public (بلا جلسة)
  const pub = await browser.newContext();
  for (const u of PUBLIC) await visit(pub, u, 'PUBLIC');
  await pub.close();

  // كل دور بجلسته المحقونة
  for (const role of ROLES) {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: 'edham_role', value: role.s.user.role, url: BASE }]);
    await ctx.addInitScript((data) => {
      localStorage.setItem('edham_access', data.accessToken);
      localStorage.setItem('edham_refresh', data.refreshToken);
      localStorage.setItem('edham_role', data.user.role);
      localStorage.setItem('edham_user', JSON.stringify({ id: data.user.id, fullName: data.user.fullName, role: data.user.role }));
    }, role.s);
    for (const u of role.pages.filter(Boolean)) await visit(ctx, u, role.name);
    await ctx.close();
  }

  await browser.close();

  console.log('\n════════ النتائج ════════');
  if (findings.length === 0) console.log('🎉 صفر أخطاء — كل الصفحات سليمة');
  else findings.forEach((f) => console.log(f));
  console.log(`\nإجمالي المشاكل: ${findings.length}`);
})();
