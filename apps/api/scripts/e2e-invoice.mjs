// E2E الفوترة: create → send → mark-paid + VAT + RBAC — على DB حقيقية.
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
  console.log('\n=== E2E: الفوترة (VAT 15% + ZATCA-ready) ===\n');

  const sup = (await api('POST', '/auth/login', { body: { identifier: 'supervisor@edham.sa', password: 'Edham@2026' } })).json.data.accessToken;

  // عميل
  const phone = '+966500000001';
  await api('POST', '/auth/send-otp', { body: { phone } });
  const cu = await prisma.user.findFirst({ where: { phone } });
  const cust = (await api('POST', '/auth/verify-otp', { body: { phone, otp: cu.otpCode } })).json.data.accessToken;
  const customer = await prisma.customer.findFirst({ where: { userId: cu.id } });

  // محاسب (ينشئه المشرف)
  const accEmail = `acc${Date.now()}@demo.sa`;
  const createAcc = await api('POST', '/users', { token: sup, body: {
    fullName: 'محاسب تجريبي', phone: `+96652${String(Date.now()).slice(-7)}`,
    email: accEmail, role: 'ACCOUNTANT', password: 'Acc@2026',
  }});
  check('إنشاء محاسب → 201', createAcc.status === 201, JSON.stringify(createAcc.json));
  const acc = (await api('POST', '/auth/login', { body: { identifier: accEmail, password: 'Acc@2026' } })).json.data.accessToken;
  check('دخول المحاسب', Boolean(acc));

  // طلب مكتمل بلا فاتورة (من تشغيلات E2E السابقة) لنفس العميل
  const order = await prisma.order.findFirst({
    where: { status: 'COMPLETED', customerId: customer.id, invoice: null, quotedPrice: { not: null } },
  });
  if (!order) {
    console.log('  ⚠️ لا يوجد طلب مكتمل بلا فاتورة — شغّل e2e-trip.mjs أولاً');
    await prisma.$disconnect();
    process.exit(1);
  }
  const subtotal = Number(order.quotedPrice);
  console.log(`طلب مكتمل ${order.id} — سعر ${subtotal}`);

  // إنشاء فاتورة
  const create = await api('POST', '/invoices', { token: acc, body: { orderId: order.id } });
  check('create invoice → 201', create.status === 201, JSON.stringify(create.json));
  const inv = create.json.data;
  check('status = DRAFT', inv?.status === 'DRAFT');
  check('subtotal = سعر الطلب', inv?.subtotal === subtotal, String(inv?.subtotal));
  check('vatAmount = 15%', inv?.vatAmount === Math.round(subtotal * 0.15 * 100) / 100, String(inv?.vatAmount));
  check('total = subtotal + vat', inv?.totalAmount === Math.round((subtotal * 1.15) * 100) / 100, String(inv?.totalAmount));
  check('رقم الفاتورة بصيغة INV-YYYY-NNNNNN', /^INV-\d{4}-\d{6}$/.test(inv?.invoiceNumber ?? ''), inv?.invoiceNumber);

  // فاتورة مكررة لنفس الطلب → 409
  const dup = await api('POST', '/invoices', { token: acc, body: { orderId: order.id } });
  check('فاتورة مكررة → 409', dup.status === 409, String(dup.status));

  // RBAC: العميل لا ينشئ فاتورة
  const custCreate = await api('POST', '/invoices', { token: cust, body: { orderId: order.id } });
  check('العميل ممنوع من إنشاء فاتورة → 403', custCreate.status === 403, String(custCreate.status));

  // العميل يرى فاتورته
  const my = await api('GET', '/invoices/my', { token: cust });
  check('العميل يرى الفاتورة في /invoices/my', (my.json.data ?? []).some((i) => i.id === inv.id));

  // إرسال → SENT + dueAt = +30 يوم
  const send = await api('POST', `/invoices/${inv.id}/send`, { token: acc });
  check('send → 200 SENT', send.json.data?.status === 'SENT', JSON.stringify(send.json));
  check('issuedAt مضبوط', Boolean(send.json.data?.issuedAt));
  const days = Math.round((new Date(send.json.data.dueAt) - new Date(send.json.data.issuedAt)) / 86400000);
  check('dueAt = issuedAt + 30 يوم (payment terms)', days === 30, String(days));

  // إرسال مرة ثانية → 409
  const send2 = await api('POST', `/invoices/${inv.id}/send`, { token: acc });
  check('إرسال مكرر → 409', send2.status === 409, String(send2.status));

  // تسجيل الدفع → PAID
  const paid = await api('POST', `/invoices/${inv.id}/mark-paid`, { token: acc, body: { paymentReference: 'REF-123' } });
  check('mark-paid → PAID', paid.json.data?.status === 'PAID', JSON.stringify(paid.json));
  check('paidAt مضبوط', Boolean(paid.json.data?.paidAt));

  console.log(`\n=== النتيجة: ${passed} نجح / ${failed} فشل ===\n`);
  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (e) => { console.error('خطأ:', e); await prisma.$disconnect(); process.exit(1); });
