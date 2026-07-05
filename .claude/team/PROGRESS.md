# لوحة التقدم — Edham Logistics
> آخر تحديث: 2026-07-05

---

## الحالة العامة
- **Phase الحالية:** Phase 1 (Core Backend) — قيد التنفيذ
- **الاكتمال العام:** ~22% (Phase 0 ≈ 80% · Phase 1 ≈ 55%)

---

## Phase 0: Bootstrap & Setup
- [x] Monorepo (Turborepo + pnpm workspaces + tsconfig + eslint) ✅
- [x] packages/shared-types (enums + entities + DTOs + socket-events) ✅
- [x] NestJS project scaffold (main + modules + filters + interceptors) ✅
- [x] Prisma schema كامل (15 model + كل الـ enums) — `prisma validate` ✅
- [x] Next.js 14 Web App scaffold (RTL عربي + 5 أدوار) ✅
- [x] Health check endpoint `GET /api/v1/health` (200) ✅
- [x] `docker-compose.yml` مكتوب ✅ | [x] `.env.example` + `.gitignore` + `README.md` ✅
- [x] Flutter project scaffold مكتوب (pubspec + main.dart + features) ✅
- [⏸️] Database migrations — محجوب (BLK-001: Docker/DB)
- [⏸️] تشغيل docker-compose / flutter build — محجوب (BLK-001/002)
- [ ] GitHub repository + CI skeleton — Phase لاحقة

**Quality Gate:** ✅ كل ما لا يحتاج Docker/Flutter يعمل — راجع quality-gates/phase-0-checklist.md

---

## Phase 1: Core Backend API  ← قيد التنفيذ (~55%)
### Auth  ✅ (كود مبني + boot + tests؛ E2E ينتظر DB)
- [x] SMS OTP (send/verify) — Unifonic stub (مفتاح فارغ → يسجّل باللوج)
- [x] JWT tokens (access+refresh، TTL حسب الدور، rotation، logout)
- [x] RBAC (5 roles) — JwtAuthGuard + RolesGuard + @Roles + @CurrentUser
- [x] POST /users (SUPERVISOR ينشئ موظفاً)

### Orders  ✅ (كود مبني + tests؛ E2E ينتظر DB)
- [x] Create order (+ order_stops، PENDING_PRICING)
- [x] Order status machine (13 unit test ✅)
- [x] PATCH /set-price (Supervisor) — PENDING_PRICING→PRICED + email
- [x] POST /accept-price (Customer) — →CUSTOMER_CONFIRMED
- [x] POST /reject-price (Customer) — →CANCELLED
- [x] GET / (فلاتر+pagination) + GET /my + GET /:id (resource auth) + PATCH /:id/status

### Drivers & Vehicles
- [ ] CRUD endpoints
- [ ] Assignment logic (assign بعد CUSTOMER_CONFIRMED)

### Real-time
- [ ] Socket.io setup / GPS broadcast / status updates

### Notifications
- [x] Email (pricing) — SendGrid stub | [x] In-app notifications (جدول)
- [ ] FCM push | [ ] SMS alerts (فعلي — ينتظر مفاتيح)

**Quality Gate:** unit tests تمر ✅ (13/13). E2E عبر DB ← مؤجَّل (BLK-001)

---

## Phase 2: Flutter App — الـ 5 أدوار
### Customer Screens
- [ ] Login (OTP)
- [ ] Order creation (4 خطوات)
- [ ] Order summary (بدون سعر)
- [ ] Pending pricing screen
- [ ] Price acceptance/rejection
- [ ] Live GPS tracking
- [ ] Order history + Invoice

### Driver Screens
- [ ] Login (Employee ID + Password)
- [ ] Trip list
- [ ] Active trip + GPS broadcasting
- [ ] Stop confirmation + photos
- [ ] Cold chain temperature
- [ ] Report problem
- [ ] Offline sync (Hive)

### Supervisor Screens
- [ ] Dashboard (KPIs)
- [ ] Orders list + pricing
- [ ] Order details + driver assignment
- [ ] Live map

### Accountant Screens
- [ ] Financial dashboard
- [ ] Invoices + payments

### Workshop Screens
- [ ] Maintenance list + details

**Quality Gate:** Happy path يعمل على Android لكل الـ 5 أدوار ← لا

---

## Phase 3: Web Application — الـ 5 أدوار
### Customer Web Pages
- [ ] Login page
- [ ] Order creation wizard
- [ ] Tracking page
- [ ] History + Invoice

### Driver Web Pages
- [ ] Login page
- [ ] Trip list + active trip
- [ ] Delivery confirmation

### Supervisor Web Pages
- [ ] Dashboard + KPIs
- [ ] Orders management
- [ ] Order details + pricing
- [ ] Live map
- [ ] Fleet + Drivers + Vehicles
- [ ] Users management
- [ ] Reports + Cold chain

### Accountant Web Pages
- [ ] Dashboard + Invoices + Payments

### Workshop Web Pages
- [ ] Maintenance + Schedule

**Quality Gate:** كل الـ 5 أدوار تعمل على Chrome ← لا

---

## Phase 4: Integration Testing
- [ ] Full happy path E2E
- [ ] Pricing flow
- [ ] GPS real-time
- [ ] Load test (50 concurrent)

---

## Phase 5: Launch
- [ ] Google Play deployment
- [ ] App Store deployment
- [ ] Web (Vercel)
- [ ] Production (Railway)

---

## سجل التحديثات
| التاريخ | الخطوة | النتيجة |
|---------|--------|---------|
| — | بداية المشروع | الوثائق جاهزة ✅ |
| 2026-07-05 | Phase 0 Bootstrap | Monorepo + Backend + Web + shared-types + DevOps/Flutter scaffold. API build+boot+health ✅، Prisma valid ✅، Web build RTL ✅. المتبقي محجوب بـ Docker/Flutter |
| 2026-07-05 | أمان | معالجة تسريب CREDENTIALS.env: تطهير التاريخ + force push (origin نظيف). تدوير المفاتيح على المستخدم |
| 2026-07-05 | Phase 1 (Auth+Orders+Pricing) | order_stops + Auth كامل + RBAC + Orders + فلو التسعير. build ✅ boot ✅ 13 unit tests ✅. E2E ينتظر DB |
