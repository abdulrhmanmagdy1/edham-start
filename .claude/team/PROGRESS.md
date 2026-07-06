# لوحة التقدم — Edham Logistics
> آخر تحديث: 2026-07-05

---

## الحالة العامة
- **الحالية:** Stage 1 (Backend Production + Web Completion + Testing) — 🟢 مكتمل، full stack يعمل locally
- **الاكتمال العام:** ~78% (Backend ~96% · Web ~92% · Mobile ~80%)
- **Stage 1 (2026-07-05):** Docker (pg+redis) · Redis (device-tokens/refresh/rate-limit) · SMS/Email providers (mock+scaffold) · ZATCA scaffold · Socket.io web حي · MapPicker · شاشات المشرف (users/vehicles/reports/cold-chain) · seed واقعي (20 طلب/14 فاتورة) · testing guide. المنافذ: API:3001 / Web:3000.
- **Public-facing (2026-07-06):** Landing احترافية + Auth كامل (login/signup/forgot/reset، split-screen) + backend (signup-customer/forgot/reset، bcrypt 12، revokeAll) + middleware (كوكي edham_role) + SEO (robots/sitemap/OG). العميل يدخل بـ OTP أو password. مُتحقَّق E2E + next build (30+ route، middleware active).
- **التالي (Stage 2 — لم يبدأ):** GitHub + Mobile build (Android SDK) + Deployment.

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

### Drivers & Vehicles  ✅ (E2E على DB حقيقية)
- [x] Vehicles CRUD (create/list/available/get/status) + قاعدة توافق التبريد
- [x] Drivers (list/get/status) + إنشاء عبر POST /users
- [x] Assignment logic — POST /orders/:id/assign (Trip + نسخ stops + Q9 + إشعار السائق)

### Trips (تنفيذ الرحلة) ✅ (E2E)
- [x] GET /trips /my /:id + confirm-loading/start/deliver-stop/report-issue
- [x] Trip state machine + مزامنة حالة الطلب + تسليم متعدد المحطات + POD

### Real-time ✅ (E2E — socket فعلي)
- [x] Socket.io Gateway (JWT auth + غرف) — order:status-changed / price-received / driver:location / cold-chain:alert
- [x] GPS: POST /locations (batch) + /trip/:id + /fleet
- [ ] (فعلي prod: Redis adapter لـ multi-instance — Phase 4)

### Cold Chain ✅ (E2E)
- [x] POST /temperature-logs + كشف الانتهاك + تنبيه + /trip/:id

### Invoices ✅ (E2E)
- [x] create (VAT 15%) / list / my / get / send (dueAt=+terms) / mark-paid
- [x] رقم فاتورة تسلسلي INV-YYYY-NNNNNN | حقول ZATCA جاهزة (تكامل فعلي Phase 5)

### Notifications
- [x] Email (pricing/invoice) — SendGrid stub | [x] In-app notifications (جدول)
- [ ] FCM push | [ ] SMS alerts (فعلي — ينتظر مفاتيح)

**Quality Gate:** ✅ 24 unit tests + **E2E حقيقي على PostgreSQL 16.4**:
تسعير 21/21 · إسناد 19/19 · رحلة+socket 21/21 · فوترة 17/17. DB على port 5433.

---

## Phase 2: Flutter App — الـ 5 أدوار  ← 🔵 بدأت (2026-07-05)
### الأساس (Foundation) ✅ — `dart analyze` نظيف
- [x] Theme (أسود/أحمر RTL) + go_router (redirect حسب الدور) + Dio ApiClient (refresh على 401)
- [x] Hive TokenStorage + Riverpod (auth + orders) + models (enums/user/order)

### Customer Screens ✅ (dart analyze نظيف)
- [x] Login (OTP للعميل + password للموظفين + اختيار الدور)
- [x] Home (قائمة طلباتي + حالات ملوّنة + pull-to-refresh + وصول للسجل/الفواتير)
- [x] Order creation (نموذج كامل — بلا سعر PRE-001)
- [x] Order detail + Price acceptance/rejection
- [x] Live GPS tracking (Google Maps + محطات + حالة) — عبر GET /orders/:id/track
- [x] Order history + Invoices (قائمة + متأخرة)
- [ ] منتقي خريطة للإحداثيات (حالياً ثابتة — TODO)

### Driver Screens ✅ (agent + dart analyze نظيف)
- [x] Login (Employee ID + Password — عبر شاشة الدخول الموحّدة)
- [x] Trip list (رحلة نشطة بارزة + قادمة)
- [x] Active trip + GPS (geolocator → POST /locations)
- [x] Stop confirmation + POD (placeholder صورة/توقيع — image_picker مؤجَّل)
- [x] Cold chain temperature (+ تحذير الانتهاك)
- [x] Report problem
- [x] Offline sync (Hive queue + syncPending)

### Supervisor Screens ✅ (agent)
- [x] Orders list + فلترة بالحالة | [x] Order details + pricing + driver/vehicle assignment
- [x] Live map (Google Maps + fleet markers)

### Accountant Screens ✅ (agent)
- [x] Invoices list (متأخرة ملوّنة) + طلبات جاهزة للفوترة
- [x] Invoice detail + send + mark-paid

### Workshop Screens ✅ (agent)
- [x] Maintenance list + new request + detail + تغيير الحالة (+ تكلفة)

**Quality Gate:** `dart analyze` نظيف على 48 ملف (الأدوار الخمسة). build APK يحتاج Android SDK (BLK-002).

---

## Phase 3: Web Application — الـ 5 أدوار  ← 🟢 الأدوار الخمسة مكتملة (next build ✅)
### الأساس (Foundation) ✅
- [x] API client (fetch + تجديد توكن 401) + auth/session (localStorage) + login (OTP+password+اختيار الدور)
- [x] DashboardShell (sidebar RTL + حارس دور) + UI kit + useQuery hook + LiveMap (Google Maps) + layouts الأدوار

### Customer ✅
- [x] طلباتي + إنشاء طلب (بلا سعر) + تفاصيل/قبول-رفض السعر + تتبع (خريطة) + فواتير

### Driver ✅
- [x] رحلاتي + تفاصيل الرحلة (confirm-loading/start/deliver stops + حرارة + بلاغ)

### Supervisor ✅
- [x] لوحة KPIs + إدارة الطلبات + تفاصيل (تسعير + إسناد) + خريطة حية + الأسطول + السائقون

### Accountant ✅
- [x] الفواتير + جاهزة للفوترة (إنشاء) + تفاصيل (إرسال + تسجيل دفع)

### Workshop ✅
- [x] طلبات الصيانة + إنشاء + تفاصيل (تغيير الحالة + تكلفة)

**Quality Gate:** ✅ `next build` (18 route) + `tsc` صارم نظيف + `/login` يُخدَّم RTL عربي فعلياً.
المتبقي: Socket.io client الحي + منتقي خريطة + تلميع UI حسب mockups + Users management + Reports/Cold-chain screens.

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
| 2026-07-05 | DB حقيقية (Postgres محمول 5433) | migrate 17 جدول + seed. **E2E التسعير 21/21 ✅** على DB فعلية |
| 2026-07-05 | Phase 1 (Vehicles+Drivers+Assign) | Vehicles/Drivers + الإسناد + قاعدة التبريد Q9. 16 unit ✅ + **E2E الإسناد 19/19 ✅** |
| 2026-07-05 | Phase 1 (Trips+Socket.io+ColdChain+GPS) | تنفيذ الرحلة + Socket.io حي + حرارة + GPS. **E2E 21/21 ✅** (socket فعلي) |
| 2026-07-05 | Phase 1 (Invoices) | فوترة VAT 15% + send + mark-paid. **E2E 17/17 ✅**. Phase 1 ≈ 92% |
| 2026-07-05 | Phase 2 Flutter (الأدوار 5) | عميل (تتبع/خريطة/سجل/فاتورة) + سائق (GPS/رحلة/POD/حرارة/offline) + مشرف (تسعير/إسناد/خريطة) + محاسب + ورشة + FCM scaffolding. **dart analyze نظيف (48 ملف)**. + Backend: Maintenance module (E2E 10/10) + track + trip stops |
| 2026-07-05 | Firebase + Maps integration | flutter create (android/ios) + Firebase configs + Admin SDK حقيقي (FCM push) + device-token + Maps keys. أسرار مؤمّنة (gitignore). commit a0bbe65 |
| 2026-07-05 | Phase 3 Web (الأدوار 5) | Next.js 14: أساس (api/auth/shell/map) + الأدوار الخمسة. **next build 18 route ✅** + tsc صارم نظيف + /login RTL مُتحقَّق |
