// E2E الصيانة (الورشة) على DB حقيقية.
import { PrismaClient } from '@prisma/client';

const BASE = 'http://localhost:3000/api/v1';
const prisma = new PrismaClient();
let passed = 0;
let failed = 0;
const check = (n, c, e = '') => {
  if (c) { passed++; console.log(`  ✅ ${n}`); }
  else { failed++; console.log(`  ❌ ${n} ${e}`); }
};

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function main() {
  console.log('\n=== E2E: الصيانة (الورشة) ===\n');
  const sup = (await api('POST', '/auth/login', { body: { identifier: 'supervisor@edham.sa', password: 'Edham@2026' } })).json.data.accessToken;

  const t = Date.now();
  const wsEmail = `ws${t}@demo.sa`;
  const createWs = await api('POST', '/users', { token: sup, body: {
    fullName: 'موظف ورشة', phone: `+96653${String(t).slice(-7)}`,
    email: wsEmail, role: 'WORKSHOP', password: 'Ws@20260',
  }});
  check('إنشاء موظف ورشة → 201', createWs.status === 201, JSON.stringify(createWs.json));
  const ws = (await api('POST', '/auth/login', { body: { identifier: wsEmail, password: 'Ws@20260' } })).json.data.accessToken;
  check('دخول الورشة', Boolean(ws));

  const vehicles = (await api('GET', '/vehicles', { token: sup })).json.data;
  const vehicleId = vehicles[0].id;

  const create = await api('POST', '/maintenance', { token: ws, body: {
    vehicleId, type: 'ROUTINE', description: 'تغيير زيت وفلتر',
  }});
  check('إنشاء طلب صيانة → 201', create.status === 201, JSON.stringify(create.json));
  const mid = create.json.data?.id;
  check('الحالة OPEN', create.json.data?.status === 'OPEN');

  const list = await api('GET', '/maintenance', { token: ws });
  check('قائمة الصيانة تحتوي الطلب', (list.json.data ?? []).some((m) => m.id === mid));
  check('يظهر رقم لوحة المركبة', (list.json.data ?? []).find((m) => m.id === mid)?.vehicle?.plateNumber != null);

  // IN_PROGRESS → المركبة IN_MAINTENANCE
  await api('PATCH', `/maintenance/${mid}/status`, { token: ws, body: { status: 'IN_PROGRESS' } });
  const veh1 = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  check('المركبة IN_MAINTENANCE', veh1.status === 'IN_MAINTENANCE', veh1.status);

  // COMPLETED → المركبة AVAILABLE + cost
  const done = await api('PATCH', `/maintenance/${mid}/status`, { token: ws, body: { status: 'COMPLETED', cost: 250 } });
  check('COMPLETED + cost=250', done.json.data?.status === 'COMPLETED' && done.json.data?.cost === 250, JSON.stringify(done.json.data));
  const veh2 = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  check('المركبة رجعت AVAILABLE', veh2.status === 'AVAILABLE', veh2.status);

  // RBAC: العميل ممنوع
  const phone = '+966500000001';
  await api('POST', '/auth/send-otp', { body: { phone } });
  const cu = await prisma.user.findFirst({ where: { phone } });
  const cust = (await api('POST', '/auth/verify-otp', { body: { phone, otp: cu.otpCode } })).json.data.accessToken;
  const forbidden = await api('GET', '/maintenance', { token: cust });
  check('العميل ممنوع من الصيانة → 403', forbidden.status === 403, String(forbidden.status));

  console.log(`\n=== النتيجة: ${passed} نجح / ${failed} فشل ===\n`);
  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (e) => { console.error('خطأ:', e); await prisma.$disconnect(); process.exit(1); });
