/**
 * Seed أولي — إدهام للوجستيات (TECH.md §4.5)
 * 1) مستخدم مشرف واحد (SUPERVISOR)
 * 2) أنواع مركبات مع تعريف التبريد
 * 3) Pricing tiers أساسية
 * Fresh Start (Q4): لا هجرة بيانات — نبدأ من صفر.
 */
import { PrismaClient, TemperatureCapability, VehicleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // 1) مشرف افتراضي — كلمة المرور من env أو قيمة تطوير
  const supervisorPassword = process.env.SEED_SUPERVISOR_PASSWORD ?? 'Edham@2026';
  const passwordHash = await bcrypt.hash(supervisorPassword, 10);

  const supervisor = await prisma.user.upsert({
    where: { phone: '+966500000000' },
    update: {},
    create: {
      fullName: 'مشرف النظام',
      phone: '+966500000000',
      email: 'supervisor@edham.sa',
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      passwordHash,
    },
  });
  // eslint-disable-next-line no-console
  console.warn(`✅ مشرف: ${supervisor.email}`);

  // 1.b) عميل تجريبي (شركة) — لتجارب الفلو E2E
  const customerUser = await prisma.user.upsert({
    where: { phone: '+966500000001' },
    update: {},
    create: {
      fullName: 'شركة النقل التجريبية',
      phone: '+966500000001',
      email: 'customer@demo.sa',
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });
  await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      companyName: 'شركة النقل التجريبية المحدودة',
      commercialRegistrationNumber: '1010101010',
      vatNumber: '300000000000003',
      contactPersonName: 'أحمد التجريبي',
      billingEmail: 'billing@demo.sa',
      paymentTermsDays: 30,
    },
  });
  // eslint-disable-next-line no-console
  console.warn(`✅ عميل تجريبي: ${customerUser.phone}`);

  // 2) مركبات أولية (3 أنواع)
  const vehicles: Array<{
    plateNumber: string;
    type: VehicleType;
    make: string;
    model: string;
    year: number;
    capacityKg: number;
    temperatureCapability: TemperatureCapability;
  }> = [
    {
      plateNumber: 'أ ب ج 1234',
      type: 'HIACE_VAN',
      make: 'Toyota',
      model: 'HiAce',
      year: 2023,
      capacityKg: 1500,
      temperatureCapability: 'REFRIGERATED',
    },
    {
      plateNumber: 'د ه و 5678',
      type: 'ISUZU_REFRIGERATED',
      make: 'Isuzu',
      model: 'NPR',
      year: 2022,
      capacityKg: 5000,
      temperatureCapability: 'BOTH',
    },
    {
      plateNumber: 'ز ح ط 9012',
      type: 'VOLVO_FH_HEAVY',
      make: 'Volvo',
      model: 'FH',
      year: 2021,
      capacityKg: 25000,
      temperatureCapability: 'FROZEN',
    },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: {},
      create: v,
    });
  }
  // eslint-disable-next-line no-console
  console.warn(`✅ ${vehicles.length} مركبات`);

  // 3) Pricing tiers أساسية (مرجع داخلي للمشرف فقط — لا تُعرض للعميل)
  const tiers = [
    { name: 'Standard', basePricePerKm: 3.5, minCharge: 150 },
    { name: 'Express', basePricePerKm: 5.0, minCharge: 250 },
    { name: 'Cold Chain', basePricePerKm: 4.5, temperatureSurcharge: 100, minCharge: 300 },
  ];

  for (const t of tiers) {
    await prisma.pricingTier.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    });
  }
  // eslint-disable-next-line no-console
  console.warn(`✅ ${tiers.length} pricing tiers`);
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
