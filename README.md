<div dir="rtl">

# إدهام للوجستيات (Edham Logistics)

منصة لوجستية B2B متكاملة لإدارة الشحن المبرّد (Cold Chain) والتتبع الحي (Real-time GPS)
مع دعم الفوترة الإلكترونية (ZATCA Phase 2). النظام يخدم **5 أدوار**:
العميل، السائق، المشرف، المحاسب، والورشة.

---

## نظرة عامة

المشروع عبارة عن **Monorepo** (Turborepo + pnpm) يضم ثلاثة منتجات تشترك في نفس الـ API
ونفس تسجيل الدخول — المستخدم يدخل من أي منصة:

| المنتج | التقنية | الوصف |
|--------|---------|-------|
| **Mobile App** | Flutter (Android + iOS) | تطبيق الجوال بالـ 5 أدوار كاملة |
| **Web Application** | Next.js 14 (App Router) | موقع ويب بالـ 5 أدوار كاملة، RTL + عربي |
| **Backend API** | NestJS + TypeScript | المنطق التجاري، RBAC، Prisma، Socket.io |

**البنية التحتية:** PostgreSQL 16 (Prisma ORM) + Redis 7 (Cache/Queues) + MinIO (تخزين) + Socket.io (تتبع حي).

---

## متطلبات النظام

قبل البدء تأكد من تثبيت الأدوات التالية:

| الأداة | الإصدار | ملاحظة |
|--------|---------|--------|
| **Node.js** | 20+ | مطلوب للـ API والـ Web |
| **pnpm** | 9+ | يُفعّل عبر `corepack enable` |
| **Docker + Docker Compose** | أحدث إصدار | **يجب تثبيته** لتشغيل PostgreSQL/Redis/MinIO محلياً |
| **Flutter SDK** | 3.4+ | **يجب تثبيته** لبناء تطبيق الجوال |

> ملاحظة: **Docker** و**Flutter** غير مثبّتين افتراضياً — ثبّتهما يدوياً قبل تشغيل الأوامر المتعلقة بهما.

---

## خطوات الإعداد (Setup)

```bash
# 1) تفعيل pnpm عبر corepack
corepack enable

# 2) تثبيت الاعتماديات لكل الحزم في الـ monorepo
pnpm install

# 3) إنشاء ملف البيئة من المثال ثم تعبئة القيم الحقيقية
cp .env.example .env

# 4) تشغيل خدمات البنية التحتية (PostgreSQL + Redis + MinIO)
docker-compose up -d

# 5) تطبيق مخطط قاعدة البيانات (Prisma migrations)
pnpm --filter @edham/api prisma migrate dev

# 6) تشغيل كل المشاريع في وضع التطوير (عبر Turborepo)
pnpm dev
```

لبناء تطبيق الجوال (يتطلب Flutter SDK):

```bash
cd apps/mobile
flutter pub get
flutter run
```

---

## هيكل الـ Monorepo

```
edham-start/
├── apps/
│   ├── mobile/   # Flutter App — الـ 5 أدوار (Android + iOS)
│   ├── web/      # Next.js 14 — الـ 5 أدوار
│   └── api/      # NestJS Backend + Prisma
├── packages/
│   ├── shared-types/    # TypeScript types مشتركة (API contracts)
│   ├── eslint-config/   # إعداد ESLint مشترك
│   └── tsconfig/        # tsconfig أساسي
├── docs/                # SPEC / TECH / خطط + Design System
├── design/              # Mockups لكل دور
├── docker-compose.yml   # خدمات التطوير المحلية
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## المنافذ (Ports)

| الخدمة | المنفذ | الرابط |
|--------|--------|--------|
| Backend API (NestJS) | 3000 | http://localhost:3000 |
| Web App (Next.js) | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |
| MinIO (S3 API) | 9000 | http://localhost:9000 |
| MinIO (Console) | 9001 | http://localhost:9001 |

---

## أوامر مفيدة

| الأمر | الوصف |
|-------|-------|
| `pnpm dev` | تشغيل كل المشاريع في وضع التطوير |
| `pnpm build` | بناء كل الحزم |
| `pnpm lint` | فحص الـ lint على كل الحزم |
| `docker-compose up -d` | تشغيل خدمات البنية التحتية |
| `docker-compose down` | إيقاف الخدمات |
| `docker-compose logs -f` | متابعة سجلات الخدمات |
| `pnpm --filter @edham/api prisma migrate dev` | إنشاء/تطبيق migration جديد |
| `pnpm --filter @edham/api prisma studio` | فتح Prisma Studio |
| `pnpm --filter @edham/api prisma db seed` | تعبئة البيانات الأولية |
| `cd apps/mobile && flutter run` | تشغيل تطبيق الجوال |

---

## ملاحظات مهمة

- **فلو التسعير:** السعر يدخله **المشرف يدوياً فقط** — ممنوع عرض أي سعر تلقائي للعميل قبل موافقة المشرف.
- **النطاق:** B2B فقط | Cold Chain | Real-time GPS | ZATCA Phase 2.
- كل المتغيرات الحساسة توضع في `.env` (المُتجاهَل من git) — راجع `.env.example` للقائمة الكاملة.

</div>
