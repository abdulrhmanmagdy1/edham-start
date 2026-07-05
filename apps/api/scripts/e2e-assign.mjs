// E2E الإسناد: create → price → accept → assign (مع قاعدة التبريد Q9) على DB حقيقية.
import { PrismaClient } from '@prisma/client';

const BASE = 'http://localhost:3000/api/v1';
const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function check(name, cond, extra = '') {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${extra}`);
  }
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  console.log('\n=== E2E: الإسناد + قاعدة التبريد (Q9) ===\n');

  const login = await api('POST', '/auth/login', {
    body: { identifier: 'supervisor@edham.sa', password: 'Edham@2026' },
  });
  const supToken = login.json?.data?.accessToken;
  check('دخول المشرف', Boolean(supToken));

  // عميل
  const phone = '+966500000001';
  await api('POST', '/auth/send-otp', { body: { phone } });
  const cu = await prisma.user.findFirst({ where: { phone } });
  const verify = await api('POST', '/auth/verify-otp', { body: { phone, otp: cu.otpCode } });
  const custToken = verify.json?.data?.accessToken;
  check('دخول العميل', Boolean(custToken));

  // إنشاء سائق عبر POST /users
  const empId = `EMP-${Date.now()}`;
  const createDriver = await api('POST', '/users', {
    token: supToken,
    body: {
      fullName: 'سائق تجريبي',
      phone: `+96650${String(Date.now()).slice(-7)}`,
      email: `driver${Date.now()}@demo.sa`,
      role: 'DRIVER',
      password: 'Driver@2026',
      employeeId: empId,
      licenseNumber: `LIC-${Date.now()}`,
      licenseExpiry: new Date(Date.now() + 365 * 86400000).toISOString(),
    },
  });
  check('إنشاء سائق → 201', createDriver.status === 201, JSON.stringify(createDriver.json));

  const drivers = await api('GET', '/drivers', { token: supToken });
  const driver = (drivers.json?.data ?? []).find((d) => d.employeeId === empId);
  check('السائق ظهر في القائمة', Boolean(driver));

  // المركبات
  const vehicles = await api('GET', '/vehicles', { token: supToken });
  const all = vehicles.json?.data ?? [];
  const frozenOnly = all.find((v) => v.temperatureCapability === 'FROZEN');
  const compat = all.find((v) => ['REFRIGERATED', 'BOTH'].includes(v.temperatureCapability));
  check('يوجد مركبة FROZEN فقط', Boolean(frozenOnly));
  check('يوجد مركبة متوافقة مع REFRIGERATED', Boolean(compat));

  // available filter
  const avail = await api('GET', '/vehicles/available?temperatureType=REFRIGERATED', { token: supToken });
  const availIds = (avail.json?.data ?? []).map((v) => v.id);
  check('available لا يحتوي المركبة FROZEN فقط', !availIds.includes(frozenOnly.id));
  check('available يحتوي المركبة المتوافقة', availIds.includes(compat.id));

  // طلب مبرّد → price → accept
  const orderBody = {
    pickup: { address: 'مستودع الرياض', lat: 24.71, lng: 46.67 },
    stops: [
      { sequenceNumber: 1, address: 'محطة 1', lat: 24.8, lng: 46.7 },
      { sequenceNumber: 2, address: 'محطة 2', lat: 21.48, lng: 39.19 },
    ],
    vehicleTypeRequired: 'ISUZU_REFRIGERATED',
    cargoType: 'CHILLED',
    cargoWeightKg: 900,
    coldChainRequired: true,
    temperatureType: 'REFRIGERATED',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
  };
  const create = await api('POST', '/orders', { token: custToken, body: orderBody });
  const orderId = create.json?.data?.id;
  await api('PATCH', `/orders/${orderId}/set-price`, { token: supToken, body: { quotedPrice: 2800 } });
  const accept = await api('POST', `/orders/${orderId}/accept-price`, { token: custToken });
  check('الطلب CUSTOMER_CONFIRMED', accept.json?.data?.status === 'CUSTOMER_CONFIRMED');

  // إسناد مركبة FROZEN فقط → 409 TEMPERATURE_MISMATCH
  console.log('قاعدة التبريد: إسناد مركبة FROZEN لطلب REFRIGERATED');
  const badAssign = await api('POST', `/orders/${orderId}/assign`, {
    token: supToken,
    body: { driverId: driver.id, vehicleId: frozenOnly.id },
  });
  check('إسناد غير متوافق → 409', badAssign.status === 409, String(badAssign.status));
  check('كود الخطأ TEMPERATURE_MISMATCH', badAssign.json?.error?.code === 'TEMPERATURE_MISMATCH', JSON.stringify(badAssign.json?.error));

  // إسناد متوافق → 200 ASSIGNED
  console.log('إسناد متوافق');
  const goodAssign = await api('POST', `/orders/${orderId}/assign`, {
    token: supToken,
    body: { driverId: driver.id, vehicleId: compat.id },
  });
  check('إسناد متوافق → 200', goodAssign.status === 200, JSON.stringify(goodAssign.json));
  check('status = ASSIGNED', goodAssign.json?.data?.status === 'ASSIGNED', goodAssign.json?.data?.status);

  // تحقق DB
  const trip = await prisma.trip.findFirst({ where: { orderId }, include: { stops: true } });
  check('Trip أُنشئ', Boolean(trip));
  check('trip_stops نُسخت (2)', trip?.stops.length === 2, String(trip?.stops.length));
  const driverRow = await prisma.driver.findUnique({ where: { id: driver.id } });
  check('السائق ON_TRIP', driverRow?.status === 'ON_TRIP', driverRow?.status);
  const vehicleRow = await prisma.vehicle.findUnique({ where: { id: compat.id } });
  check('المركبة ON_TRIP', vehicleRow?.status === 'ON_TRIP', vehicleRow?.status);
  const notif = await prisma.notification.findFirst({
    where: { userId: driverRow.userId, type: 'TRIP_ASSIGNED', referenceId: orderId },
  });
  check('إشعار TRIP_ASSIGNED للسائق', Boolean(notif));

  // إسناد ثانٍ → 409 (الحالة ASSIGNED)
  const reAssign = await api('POST', `/orders/${orderId}/assign`, {
    token: supToken,
    body: { driverId: driver.id, vehicleId: compat.id },
  });
  check('إسناد مكرر → 409', reAssign.status === 409, String(reAssign.status));

  console.log(`\n=== النتيجة: ${passed} نجح / ${failed} فشل ===\n`);
  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error('خطأ:', e);
  await prisma.$disconnect();
  process.exit(1);
});
