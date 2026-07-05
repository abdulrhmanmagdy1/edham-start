/**
 * Seed واقعي — إدهام للوجستيات (Stage 1 / F1).
 * بيانات عربية واقعية: مشرف + عملاء (شركات) + سائقون + محاسبون + ورش + مركبات + طلبات + فواتير + صيانة.
 * idempotent: يمسح البيانات المعامَلاتية (transactional) ثم يعيد الإنشاء، ويُupsert الكيانات الأساسية.
 * كلمات المرور موحّدة للتجربة (راجع docs/testing/credentials.md).
 */
import {
  PrismaClient,
  Prisma,
  TemperatureCapability,
  VehicleType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEV_PASSWORD = process.env.SEED_DEV_PASSWORD ?? 'Edham@2026';
const SUPERVISOR_PASSWORD = process.env.SEED_SUPERVISOR_PASSWORD ?? 'Edham@2026';

const CITIES = {
  riyadh: { name: 'الرياض', lat: 24.7136, lng: 46.6753 },
  jeddah: { name: 'جدة', lat: 21.4858, lng: 39.1925 },
  dammam: { name: 'الدمام', lat: 26.4207, lng: 50.0888 },
  makkah: { name: 'مكة المكرمة', lat: 21.3891, lng: 39.8579 },
};

async function clearTransactional(): Promise<void> {
  // ترتيب آمن للـ FK (الـ PrismaClient هنا بلا soft-delete middleware → حذف فعلي)
  await prisma.temperatureLog.deleteMany();
  await prisma.locationPoint.deleteMany();
  await prisma.tripStop.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.orderStop.deleteMany();
  await prisma.order.deleteMany();
}

async function main(): Promise<void> {
  await clearTransactional();

  const hash = await bcrypt.hash(DEV_PASSWORD, 10);
  const supHash = await bcrypt.hash(SUPERVISOR_PASSWORD, 10);

  // ── 1) مشرف ──
  const supervisor = await prisma.user.upsert({
    where: { phone: '+966500000000' },
    update: { passwordHash: supHash },
    create: {
      fullName: 'مشرف العمليات',
      phone: '+966500000000',
      email: 'supervisor@edham.sa',
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      passwordHash: supHash,
    },
  });

  // ── 2) عملاء (شركات B2B) ──
  const companies = [
    { name: 'مؤسسة الفهد للنقل', contact: 'عبدالعزيز الفهد', crn: '1010111111', vat: '300011111100003', phone: '+966500000101', email: 'faisal@alfahd.sa', terms: 30 },
    { name: 'شركة الأمل التجارية', contact: 'منى الأمل', crn: '1010222222', vat: '300022222200003', phone: '+966500000102', email: 'info@alamal.sa', terms: 60 },
    { name: 'مصنع الروابي للألبان', contact: 'سلطان الروابي', crn: '1010333333', vat: '300033333300003', phone: '+966500000103', email: 'orders@alrabie.sa', terms: 30 },
    { name: 'شركة تبريد الخليج', contact: 'حسن الخليجي', crn: '1010444444', vat: '300044444400003', phone: '+966500000104', email: 'ops@gulfcool.sa', terms: 45 },
    { name: 'مؤسسة النخبة للتوزيع', contact: 'ريم النخبة', crn: '1010555555', vat: '300055555500003', phone: '+966500000105', email: 'sales@alnokhba.sa', terms: 30 },
  ];
  const customerIds: string[] = [];
  for (const c of companies) {
    const user = await prisma.user.upsert({
      where: { phone: c.phone },
      update: {},
      create: { fullName: c.contact, phone: c.phone, email: c.email, role: 'CUSTOMER', status: 'ACTIVE' },
    });
    const customer = await prisma.customer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyName: c.name,
        commercialRegistrationNumber: c.crn,
        vatNumber: c.vat,
        contactPersonName: c.contact,
        billingEmail: c.email,
        paymentTermsDays: c.terms,
      },
    });
    customerIds.push(customer.id);
  }

  // ── 3) سائقون ──
  const driverNames = [
    { name: 'محمد العتيبي', emp: 'DRV-001', lic: 'LIC-1001' },
    { name: 'عبدالله القحطاني', emp: 'DRV-002', lic: 'LIC-1002' },
    { name: 'فيصل الدوسري', emp: 'DRV-003', lic: 'LIC-1003' },
    { name: 'خالد الشمري', emp: 'DRV-004', lic: 'LIC-1004' },
    { name: 'ناصر الغامدي', emp: 'DRV-005', lic: 'LIC-1005' },
  ];
  const driverIds: string[] = [];
  for (let i = 0; i < driverNames.length; i++) {
    const d = driverNames[i]!;
    const user = await prisma.user.upsert({
      where: { phone: `+96650000020${i + 1}` },
      update: { passwordHash: hash },
      create: {
        fullName: d.name,
        phone: `+96650000020${i + 1}`,
        email: `${d.emp.toLowerCase()}@edham.sa`,
        role: 'DRIVER',
        status: 'ACTIVE',
        passwordHash: hash,
      },
    });
    const driver = await prisma.driver.upsert({
      where: { employeeId: d.emp },
      update: {},
      create: {
        userId: user.id,
        employeeId: d.emp,
        licenseNumber: d.lic,
        licenseExpiry: new Date('2027-12-31'),
      },
    });
    driverIds.push(driver.id);
  }

  // ── 4) محاسبون + ورش ──
  const staff = [
    { name: 'سارة المطيري', role: 'ACCOUNTANT' as const, phone: '+966500000301', email: 'sara@edham.sa' },
    { name: 'نورة العنزي', role: 'ACCOUNTANT' as const, phone: '+966500000302', email: 'noura@edham.sa' },
    { name: 'سعد الحربي', role: 'WORKSHOP' as const, phone: '+966500000401', email: 'saad@edham.sa' },
    { name: 'ماجد الزهراني', role: 'WORKSHOP' as const, phone: '+966500000402', email: 'majed@edham.sa' },
  ];
  for (const s of staff) {
    await prisma.user.upsert({
      where: { phone: s.phone },
      update: { passwordHash: hash },
      create: { fullName: s.name, phone: s.phone, email: s.email, role: s.role, status: 'ACTIVE', passwordHash: hash },
    });
  }

  // ── 5) مركبات (10 — mix) ──
  const plates = ['أ ب ج 1234', 'د ه و 5678', 'ز ح ط 9012', 'ي ك ل 3456', 'م ن س 7890', 'ع ف ص 2345', 'ق ر ش 6789', 'ت ث خ 1122', 'ذ ض ظ 3344', 'غ ب ن 5566'];
  const vehSpecs: Array<{ type: VehicleType; make: string; model: string; cap: number; temp: TemperatureCapability }> = [
    { type: 'HIACE_VAN', make: 'Toyota', model: 'HiAce', cap: 1500, temp: 'REFRIGERATED' },
    { type: 'HIACE_VAN', make: 'Toyota', model: 'HiAce', cap: 1500, temp: 'REFRIGERATED' },
    { type: 'ISUZU_REFRIGERATED', make: 'Isuzu', model: 'NPR', cap: 5000, temp: 'BOTH' },
    { type: 'ISUZU_REFRIGERATED', make: 'Isuzu', model: 'NPR', cap: 5000, temp: 'FROZEN' },
    { type: 'ISUZU_REFRIGERATED', make: 'Isuzu', model: 'FRR', cap: 7000, temp: 'BOTH' },
    { type: 'VOLVO_FH_HEAVY', make: 'Volvo', model: 'FH', cap: 25000, temp: 'FROZEN' },
    { type: 'VOLVO_FH_HEAVY', make: 'Volvo', model: 'FH16', cap: 25000, temp: 'BOTH' },
    { type: 'HIACE_VAN', make: 'Toyota', model: 'HiAce', cap: 1500, temp: 'REFRIGERATED' },
    { type: 'ISUZU_REFRIGERATED', make: 'Isuzu', model: 'NPR', cap: 5000, temp: 'REFRIGERATED' },
    { type: 'VOLVO_FH_HEAVY', make: 'Volvo', model: 'FH', cap: 25000, temp: 'FROZEN' },
  ];
  const vehicleIds: string[] = [];
  for (let i = 0; i < plates.length; i++) {
    const spec = vehSpecs[i]!;
    const v = await prisma.vehicle.upsert({
      where: { plateNumber: plates[i]! },
      update: {},
      create: {
        plateNumber: plates[i]!,
        type: spec.type,
        make: spec.make,
        model: spec.model,
        year: 2022 + (i % 3),
        capacityKg: spec.cap,
        temperatureCapability: spec.temp,
        status: 'AVAILABLE',
      },
    });
    vehicleIds.push(v.id);
  }

  // ── 6) Pricing tiers ──
  for (const t of [
    { name: 'Standard', basePricePerKm: 3.5, minCharge: 150 },
    { name: 'Express', basePricePerKm: 5.0, minCharge: 250 },
    { name: 'Cold Chain', basePricePerKm: 4.5, temperatureSurcharge: 100, minCharge: 300 },
  ]) {
    await prisma.pricingTier.upsert({ where: { name: t.name }, update: {}, create: t });
  }

  // ── 7) طلبات (20 — حالات مختلطة) ──
  const cityList = [CITIES.riyadh, CITIES.jeddah, CITIES.dammam, CITIES.makkah];
  // 14 مكتملة (لأجل ~14 فاتورة، الفاتورة 1:1 مع الطلب) + 6 بحالات متنوّعة = 20
  const statuses = [
    'PENDING_PRICING', 'PENDING_PRICING',
    'PRICED', 'CUSTOMER_CONFIRMED', 'IN_TRANSIT', 'CANCELLED',
    'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
    'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
  ] as const;

  const completedOrders: string[] = [];
  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i]!;
    const pickup = cityList[i % cityList.length]!;
    const drop = cityList[(i + 1) % cityList.length]!;
    const cold = i % 3 === 0;
    const frozen = cold && i % 2 === 0;
    const priced = ['PRICED', 'CUSTOMER_CONFIRMED', 'ASSIGNED', 'LOADING', 'IN_TRANSIT', 'COMPLETED'].includes(status);
    const quoted = priced ? 800 + i * 120 : null;

    const order = await prisma.order.create({
      data: {
        customerId: customerIds[i % customerIds.length]!,
        pickupAddress: `مستودع ${pickup.name} — حي الصناعية`,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        deliveryAddress: `فرع ${drop.name} — الطريق الدائري`,
        deliveryLat: drop.lat,
        deliveryLng: drop.lng,
        cargoType: frozen ? 'FROZEN' : cold ? 'CHILLED' : 'DRY',
        cargoWeightKg: 500 + i * 150,
        cargoDescription: cold ? (frozen ? 'لحوم مجمّدة' : 'ألبان وأجبان') : 'بضائع عامة',
        vehicleTypeRequired: i % 3 === 0 ? 'ISUZU_REFRIGERATED' : i % 3 === 1 ? 'HIACE_VAN' : 'VOLVO_FH_HEAVY',
        coldChainRequired: cold,
        temperatureType: cold ? (frozen ? 'FROZEN' : 'REFRIGERATED') : null,
        tempMinCelsius: cold ? (frozen ? -25 : 2) : null,
        tempMaxCelsius: cold ? (frozen ? -18 : 8) : null,
        quotedPrice: quoted,
        pricingNotes: priced ? 'شامل رسوم التبريد' : null,
        pricingSentAt: priced ? new Date() : null,
        status,
        cancellationReason: status === 'CANCELLED' ? 'أُلغي بطلب العميل' : null,
        scheduledAt: new Date(Date.now() + (i - 10) * 86400000),
        stops: {
          create: [
            {
              sequenceNumber: 1,
              address: `فرع ${drop.name} — الطريق الدائري`,
              city: drop.name,
              latitude: drop.lat,
              longitude: drop.lng,
              contactName: 'مستلم الفرع',
              contactPhone: '+966500000900',
            },
          ],
        },
      },
    });
    if (status === 'COMPLETED') completedOrders.push(order.id);

    // رحلة + محطات للطلبات المُسندة فأعلى
    if (['ASSIGNED', 'LOADING', 'IN_TRANSIT', 'COMPLETED'].includes(status)) {
      const tripStatus = status === 'COMPLETED' ? 'COMPLETED' : status === 'IN_TRANSIT' ? 'IN_PROGRESS' : 'ASSIGNED';
      await prisma.trip.create({
        data: {
          orderId: order.id,
          driverId: driverIds[i % driverIds.length]!,
          vehicleId: vehicleIds[i % vehicleIds.length]!,
          status: tripStatus,
          totalStops: 1,
          actualStartAt: tripStatus !== 'ASSIGNED' ? new Date() : null,
          actualEndAt: tripStatus === 'COMPLETED' ? new Date() : null,
          stops: {
            create: [
              {
                sequenceNumber: 1,
                address: `فرع ${drop.name}`,
                city: drop.name,
                latitude: drop.lat,
                longitude: drop.lng,
                status: tripStatus === 'COMPLETED' ? 'DELIVERED' : 'PENDING',
              },
            ],
          },
        },
      });
    }
  }

  // ── 8) فواتير (15 — بعضها مدفوع) ──
  const VAT = 0.15;
  let invNo = 1;
  for (let i = 0; i < 15; i++) {
    const orderId = completedOrders[i % completedOrders.length];
    if (!orderId) break;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.quotedPrice === null) continue;
    // تجنّب تكرار الفاتورة لنفس الطلب (order_id فريد)
    const exists = await prisma.invoice.findUnique({ where: { orderId } });
    if (exists) continue;

    const subtotal = Number(order.quotedPrice);
    const vatAmount = Math.round(subtotal * VAT * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;
    const paid = i % 3 !== 0;
    const issuedAt = new Date(Date.now() - (15 - i) * 86400000);

    await prisma.invoice.create({
      data: {
        orderId,
        customerId: order.customerId,
        invoiceNumber: `INV-2026-${String(invNo++).padStart(6, '0')}`,
        subtotal,
        vatRate: VAT,
        vatAmount,
        totalAmount: total,
        status: paid ? 'PAID' : 'SENT',
        issuedAt,
        dueAt: new Date(issuedAt.getTime() + 30 * 86400000),
        paidAt: paid ? new Date(issuedAt.getTime() + 5 * 86400000) : null,
        paymentReference: paid ? `PAY-${1000 + i}` : null,
      },
    });
  }

  // ── 9) طلبات صيانة (5) ──
  const maint: Array<{ type: Prisma.MaintenanceRequestCreateInput['type']; desc: string }> = [
    { type: 'ROUTINE', desc: 'تغيير زيت وفلاتر' },
    { type: 'EMERGENCY', desc: 'عطل في نظام التبريد' },
    { type: 'INSPECTION', desc: 'فحص دوري شامل' },
    { type: 'ROUTINE', desc: 'تغيير إطارات' },
    { type: 'EMERGENCY', desc: 'مشكلة في الفرامل' },
  ];
  const maintStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'OPEN', 'COMPLETED'] as const;
  for (let i = 0; i < maint.length; i++) {
    await prisma.maintenanceRequest.create({
      data: {
        vehicleId: vehicleIds[i]!,
        type: maint[i]!.type,
        description: maint[i]!.desc,
        reportedBy: supervisor.id,
        status: maintStatuses[i]!,
        cost: maintStatuses[i] === 'COMPLETED' ? 300 + i * 150 : null,
        completedAt: maintStatuses[i] === 'COMPLETED' ? new Date() : null,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.warn(
    `✅ Seed: 1 مشرف + ${companies.length} عملاء + ${driverNames.length} سائقين + ${staff.length} موظفين + ${plates.length} مركبات + ${statuses.length} طلبات + فواتير + ${maint.length} صيانة`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error('❌ فشل الـ seed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
