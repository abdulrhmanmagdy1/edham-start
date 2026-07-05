// E2E: دورة الرحلة الكاملة + Cold Chain + GPS + Socket.io — على DB حقيقية.
import { PrismaClient } from '@prisma/client';
import { io } from 'socket.io-client';

const BASE = 'http://localhost:3000/api/v1';
const ORIGIN = 'http://localhost:3000';
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

const orderBody = (temp = 'REFRIGERATED') => ({
  pickup: { address: 'مستودع الرياض', lat: 24.71, lng: 46.67 },
  stops: [
    { sequenceNumber: 1, address: 'محطة 1', lat: 24.8, lng: 46.7 },
    { sequenceNumber: 2, address: 'محطة 2', lat: 21.48, lng: 39.19 },
  ],
  vehicleTypeRequired: 'ISUZU_REFRIGERATED',
  cargoType: 'CHILLED',
  cargoWeightKg: 900,
  coldChainRequired: true,
  temperatureType: temp,
  scheduledAt: new Date(Date.now() + 86400000).toISOString(),
});

async function main() {
  console.log('\n=== E2E: الرحلة + Cold Chain + GPS + Socket.io ===\n');

  // إعداد
  const sup = (await api('POST', '/auth/login', { body: { identifier: 'supervisor@edham.sa', password: 'Edham@2026' } })).json.data.accessToken;
  const phone = '+966500000001';
  await api('POST', '/auth/send-otp', { body: { phone } });
  const cu = await prisma.user.findFirst({ where: { phone } });
  const cust = (await api('POST', '/auth/verify-otp', { body: { phone, otp: cu.otpCode } })).json.data.accessToken;

  // سائق
  const empId = `EMP-T-${Date.now()}`;
  await api('POST', '/users', { token: sup, body: {
    fullName: 'سائق رحلة', phone: `+96651${String(Date.now()).slice(-7)}`,
    email: `drv${Date.now()}@demo.sa`, role: 'DRIVER', password: 'Driver@2026',
    employeeId: empId, licenseNumber: `LIC-T-${Date.now()}`,
    licenseExpiry: new Date(Date.now() + 365 * 86400000).toISOString(),
  }});
  const drvLogin = await api('POST', '/auth/login', { body: { identifier: empId, password: 'Driver@2026' } });
  const drv = drvLogin.json.data.accessToken;
  check('دخول السائق بـ employeeId', Boolean(drv));

  // === اختبار Socket.io: العميل يستمع لحدث السعر ===
  console.log('Socket.io: العميل يستقبل order:price-received');
  const socket = io(ORIGIN, { auth: { token: cust }, transports: ['websocket'], reconnection: false });
  const connected = await new Promise((r) => { socket.on('connect', () => r(true)); socket.on('connect_error', () => r(false)); setTimeout(() => r(false), 5000); });
  check('اتصال socket للعميل', connected);

  const socketOrder = (await api('POST', '/orders', { token: cust, body: orderBody() })).json.data.id;
  const priceEvent = new Promise((r) => { socket.on('order:price-received', (p) => r(p)); setTimeout(() => r(null), 5000); });
  await api('PATCH', `/orders/${socketOrder}/set-price`, { token: sup, body: { quotedPrice: 1500 } });
  const received = await priceEvent;
  check('وصل حدث order:price-received عبر socket', received?.orderId === socketOrder && received?.quotedPrice === 1500, JSON.stringify(received));
  socket.disconnect();

  // === دورة الرحلة الكاملة ===
  console.log('دورة الرحلة');
  const orderId = (await api('POST', '/orders', { token: cust, body: orderBody() })).json.data.id;
  await api('PATCH', `/orders/${orderId}/set-price`, { token: sup, body: { quotedPrice: 3000 } });
  await api('POST', `/orders/${orderId}/accept-price`, { token: cust });

  const vehicles = (await api('GET', '/vehicles', { token: sup })).json.data;
  const compat = vehicles.find((v) => ['REFRIGERATED', 'BOTH'].includes(v.temperatureCapability) && v.status === 'AVAILABLE');
  const drivers = (await api('GET', '/drivers', { token: sup })).json.data;
  const driver = drivers.find((d) => d.employeeId === empId);
  const assign = await api('POST', `/orders/${orderId}/assign`, { token: sup, body: { driverId: driver.id, vehicleId: compat.id } });
  check('الإسناد → ASSIGNED', assign.json.data?.status === 'ASSIGNED');

  const trip = await prisma.trip.findFirst({ where: { orderId }, include: { stops: { orderBy: { sequenceNumber: 'asc' } } } });
  const tripId = trip.id;

  // confirm-loading → LOADING
  const load = await api('POST', `/trips/${tripId}/confirm-loading`, { token: drv });
  check('confirm-loading → 200', load.status === 200, JSON.stringify(load.json));
  check('order = LOADING', (await api('GET', `/orders/${orderId}`, { token: sup })).json.data.status === 'LOADING');

  // start → IN_PROGRESS / IN_TRANSIT
  const start = await api('POST', `/trips/${tripId}/start`, { token: drv });
  check('start → trip IN_PROGRESS', start.json.data?.status === 'IN_PROGRESS', start.json.data?.status);
  check('order = IN_TRANSIT', (await api('GET', `/orders/${orderId}`, { token: sup })).json.data.status === 'IN_TRANSIT');

  // GPS
  const gps = await api('POST', '/locations', { token: drv, body: {
    tripId, points: [
      { lat: 24.72, lng: 46.68, recordedAt: new Date().toISOString() },
      { lat: 24.9, lng: 46.9, recordedAt: new Date().toISOString() },
    ],
  }});
  check('GPS ingest → count 2', gps.json.data?.count === 2, JSON.stringify(gps.json));
  const fleet = await api('GET', '/locations/fleet', { token: sup });
  check('fleet يعرض آخر موقع', (fleet.json.data ?? []).some((l) => l.vehicleId === compat.id));

  // Cold chain: قراءة سليمة ثم انتهاك
  const okTemp = await api('POST', '/temperature-logs', { token: drv, body: { tripId, temperatureCelsius: 5 } });
  check('قراءة 5°C ليست انتهاكاً', okTemp.json.data?.isViolation === false, JSON.stringify(okTemp.json));
  const badTemp = await api('POST', '/temperature-logs', { token: drv, body: { tripId, temperatureCelsius: 15 } });
  check('قراءة 15°C انتهاك', badTemp.json.data?.isViolation === true, JSON.stringify(badTemp.json));
  const alert = await prisma.notification.findFirst({ where: { type: 'COLD_CHAIN_ALERT', referenceId: orderId } });
  check('إشعار COLD_CHAIN_ALERT مُخزَّن', Boolean(alert));
  const logs = await api('GET', `/temperature-logs/trip/${tripId}`, { token: sup });
  check('سجل الحرارة = 2 قراءة', (logs.json.data ?? []).length === 2, String((logs.json.data ?? []).length));

  // تسليم المحطات
  const stop1 = trip.stops[0].id;
  const stop2 = trip.stops[1].id;
  const d1 = await api('POST', `/trips/${tripId}/stops/${stop1}/deliver`, { token: drv, body: { recipientName: 'مستلم 1' } });
  check('تسليم محطة 1 → trip AT_STOP', d1.json.data?.status === 'AT_STOP', d1.json.data?.status);
  check('order ما زال IN_TRANSIT', (await api('GET', `/orders/${orderId}`, { token: sup })).json.data.status === 'IN_TRANSIT');

  const d2 = await api('POST', `/trips/${tripId}/stops/${stop2}/deliver`, { token: drv, body: { recipientName: 'مستلم 2', podSignatureUrl: 'sig://x' } });
  check('تسليم محطة 2 → trip COMPLETED', d2.json.data?.status === 'COMPLETED', d2.json.data?.status);
  check('order = COMPLETED', (await api('GET', `/orders/${orderId}`, { token: sup })).json.data.status === 'COMPLETED');

  // السائق والمركبة رجعا AVAILABLE
  const drvRow = await prisma.driver.findUnique({ where: { id: driver.id } });
  const vehRow = await prisma.vehicle.findUnique({ where: { id: compat.id } });
  check('السائق AVAILABLE بعد الإكمال', drvRow.status === 'AVAILABLE', drvRow.status);
  check('المركبة AVAILABLE بعد الإكمال', vehRow.status === 'AVAILABLE', vehRow.status);

  // تسليم محطة مُسلَّمة → 409
  const dup = await api('POST', `/trips/${tripId}/stops/${stop2}/deliver`, { token: drv, body: {} });
  check('تسليم محطة مكررة → 409', dup.status === 409, String(dup.status));

  console.log(`\n=== النتيجة: ${passed} نجح / ${failed} فشل ===\n`);
  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (e) => { console.error('خطأ:', e); await prisma.$disconnect(); process.exit(1); });
