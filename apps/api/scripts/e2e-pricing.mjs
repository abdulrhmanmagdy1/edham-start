// E2E فلو التسعير على قاعدة بيانات حقيقية.
// يشغّل الـ API على 3000 + Postgres حيّ. يقرأ OTP من DB مباشرة.
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
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  console.log('\n=== E2E: فلو التسعير (PRE-001) على DB حقيقية ===\n');

  // 1) دخول المشرف
  console.log('1) دخول المشرف');
  const login = await api('POST', '/auth/login', {
    body: { identifier: 'supervisor@edham.sa', password: 'Edham@2026' },
  });
  check('login → 200', login.status === 200, JSON.stringify(login.json));
  const supToken = login.json?.data?.accessToken;
  check('حصلنا على accessToken للمشرف', Boolean(supToken));

  // 2) OTP للعميل
  console.log('2) OTP للعميل التجريبي');
  const phone = '+966500000001';
  const otpReq = await api('POST', '/auth/send-otp', { body: { phone } });
  check('send-otp → 200', otpReq.status === 200, JSON.stringify(otpReq.json));
  const user = await prisma.user.findFirst({ where: { phone } });
  const otp = user?.otpCode;
  check('OTP مُخزَّن في DB', Boolean(otp));

  const verify = await api('POST', '/auth/verify-otp', { body: { phone, otp } });
  check('verify-otp → 200', verify.status === 200, JSON.stringify(verify.json));
  const custToken = verify.json?.data?.accessToken;
  check('حصلنا على accessToken للعميل', Boolean(custToken));

  // 3) إنشاء طلب (عميل) → PENDING_PRICING
  console.log('3) إنشاء طلب (عميل)');
  const orderBody = {
    pickup: { address: 'مستودع الرياض', lat: 24.7136, lng: 46.6753 },
    stops: [
      {
        sequenceNumber: 1,
        address: 'فرع جدة',
        city: 'جدة',
        lat: 21.4858,
        lng: 39.1925,
        contactName: 'مستلم جدة',
        contactPhone: '+966500000009',
      },
    ],
    vehicleTypeRequired: 'ISUZU_REFRIGERATED',
    cargoType: 'CHILLED',
    cargoWeightKg: 1200,
    coldChainRequired: true,
    temperatureType: 'REFRIGERATED',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
  };
  const create = await api('POST', '/orders', { token: custToken, body: orderBody });
  check('create order → 201', create.status === 201, JSON.stringify(create.json));
  const orderId = create.json?.data?.id;
  check('status = PENDING_PRICING', create.json?.data?.status === 'PENDING_PRICING', create.json?.data?.status);

  // 4) المشرف يرى الطلب في القائمة
  console.log('4) المشرف يرى الطلب');
  const list = await api('GET', '/orders?status=PENDING_PRICING', { token: supToken });
  check('list → 200', list.status === 200);
  check('الطلب موجود في قائمة المشرف', (list.json?.data ?? []).some((o) => o.id === orderId));

  // 5) المشرف يحدد السعر يدوياً → PRICED
  console.log('5) المشرف يحدد السعر (يدوي — PRE-001)');
  const setPrice = await api('PATCH', `/orders/${orderId}/set-price`, {
    token: supToken,
    body: { quotedPrice: 3500, pricingNotes: 'شامل التبريد' },
  });
  check('set-price → 200', setPrice.status === 200, JSON.stringify(setPrice.json));
  check('status = PRICED', setPrice.json?.data?.status === 'PRICED', setPrice.json?.data?.status);
  check('quotedPrice = 3500', setPrice.json?.data?.quotedPrice === 3500);
  check('pricingSentAt مضبوط', Boolean(setPrice.json?.data?.pricingSentAt));

  // 6) منع: العميل لا يستطيع تحديد السعر (RBAC)
  console.log('6) RBAC: العميل ممنوع من set-price');
  const custSetPrice = await api('PATCH', `/orders/${orderId}/set-price`, {
    token: custToken,
    body: { quotedPrice: 1 },
  });
  check('العميل → 403 على set-price', custSetPrice.status === 403, String(custSetPrice.status));

  // 7) إشعار PRICE_SENT وصل للعميل
  const priceNotif = await prisma.notification.findFirst({
    where: { userId: user.id, type: 'PRICE_SENT', referenceId: orderId },
  });
  check('إشعار PRICE_SENT مُخزَّن للعميل', Boolean(priceNotif));

  // 8) العميل يقبل → CUSTOMER_CONFIRMED
  console.log('7) العميل يقبل السعر');
  const accept = await api('POST', `/orders/${orderId}/accept-price`, { token: custToken });
  check('accept-price → 200', accept.status === 200, JSON.stringify(accept.json));
  check('status = CUSTOMER_CONFIRMED', accept.json?.data?.status === 'CUSTOMER_CONFIRMED', accept.json?.data?.status);

  // 9) لا يمكن قبول مرتين (آلة الحالة)
  const acceptAgain = await api('POST', `/orders/${orderId}/accept-price`, { token: custToken });
  check('accept مرة ثانية → 409', acceptAgain.status === 409, String(acceptAgain.status));

  // 10) طلب ثانٍ → رفض → CANCELLED
  console.log('8) طلب ثانٍ ثم رفض العميل');
  const create2 = await api('POST', '/orders', { token: custToken, body: orderBody });
  const orderId2 = create2.json?.data?.id;
  await api('PATCH', `/orders/${orderId2}/set-price`, {
    token: supToken,
    body: { quotedPrice: 4000 },
  });
  const reject = await api('POST', `/orders/${orderId2}/reject-price`, { token: custToken });
  check('reject-price → 200', reject.status === 200, JSON.stringify(reject.json));
  check('status = CANCELLED', reject.json?.data?.status === 'CANCELLED', reject.json?.data?.status);

  console.log(`\n=== النتيجة: ${passed} نجح / ${failed} فشل ===\n`);
  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error('خطأ في E2E:', e);
  await prisma.$disconnect();
  process.exit(1);
});
