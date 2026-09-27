# سجل المؤجَّلات (Deferred Items Registry)

> **اقرأ هذا الملف في بداية كل session.** كل بند مؤجَّل عبر كل الفيزات، ومتى يُنفَّذ.
> 🔔 **تذكير إلزامي:** عند الوصول لبداية **Phase 4** أو **Phase 5**، اعرض قائمة بنود تلك الفيز على المستخدم قبل أي عمل.

---

## 🗂️ السجل الرئيسي — كل المتبقّي (المصدر الوحيد لـ "فاضل إيه") — آخر تحديث 2026-09-28

### ✅ خلص ومرفوع (LIVE) — استضافة مجانية مؤقتة (2026-09-28) لحد ما ناخد سيرفر
- ⚠️ Railway **وقع** (Application not found — الرصيد/التجربة خلص) + مشروع Vercel القديم `web-nu-lac-65` في حساب Vercel تاني. اتنقلنا:
- الباك اند (NestJS) على **Render Free** (Docker من `render.yaml`، autoDeploy من GitHub main): `https://edham-api.onrender.com` — بينام بعد 15د (أول طلب ~50ث).
- الداتا بيز على **Neon Free** (Postgres، Frankfurt، project `edham`) — migrate + seed اتعملوا من الجهاز المحلي. Redis: مفيش (fallback in-memory).
- الويب على **Vercel** (فريق abdulrhmanmagdy13-gmailcoms-projects، مشروع `edham-web`، root `apps/web` + `apps/web/vercel.json`): `https://edham-web.vercel.app`
- اتأكد: crawl 32 صفحة صفر أخطاء + فلو (إنشاء طلب/تسعير/قبول/إسناد/CSV) ✅.
- الكود كله على GitHub (public) — مفاتيح Maps القديمة اتشالت من التاريخ قبل الرفع.
- 🔔 أمان: باسورد Neon اتكتب في الشات → يتغيّر عند النقل لسيرفر حقيقي. الموبايل APK لسه بيشاور على Railway → لازم rebuild على الرابط الجديد.
- تيست E2E + شجرة اختبار Playwright كاملة (31 صفحة + كل الفلو) = صفر أخطاء.
- وضع تجربة: `DEMO_OTP_ENABLED=true` (باك) + `NEXT_PUBLIC_DEMO_MODE=true` (ويب) — OTP يظهر على الشاشة.
- أخطاء ويب اتصلحت: كراش audit (getPaged)، تعلّق logout (تنقل صريح)، فوترة مكرّرة (استبعاد المُفوترة).

### 🟢 (A) تطبيقات الموبايل — **APK أندرويد اكتمل واتأكد (2026-07-08)**
| البند | الحالة |
|------|--------|
| كود Flutter للأدوار الـ5 | ✅ |
| Android SDK + JDK17 + Flutter 3.24.5 مثبّتين (C:\dev) | ✅ |
| ربط بالباك المرفوع (Railway) + demo OTP + لوجو الشركة | ✅ |
| **APK موقّع release** (`C:\Users\DELL\Downloads\edham-logistics.apk`, arm64, 11MB) | ✅ |
| اختبار الواجهة على جهاز حقيقي (Galaxy A72) — كل الأدوار الـ5 صفر أخطاء | ✅ |
| 🐛 اتصلح: تجديد التوكن (401 بعد انتهاء الصلاحية) — الجلسة كانت تتكسر | ✅ |
| **متبقٍّ:** بناء 3 معماريات (بنينا arm64 فقط بسبب RAM محدود) | ⏳ |
| **متبقٍّ:** صور POD حقيقية (image_picker) + Socket.io client + FCM فعلي | ⏳ |
| **متبقٍّ: iOS build** | ❌ محتاج Mac |
| **متبقٍّ:** نشر Google Play ($25) + App Store ($99/سنة) | ❌ |
> ملاحظة بناء: geolocator_android 4.6.2 عُدِّل في pub cache (compileSdk 34 بدل flutter.compileSdkVersion) — لازم يُعاد على أي جهاز بناء جديد، أو نثبّت نسخة geolocator أحدث.
> keystore التوقيع: `apps/mobile/android/edham-release.jks` (سرّي، غير مرفوع) — **يجب الاحتفاظ به** لتحديثات Play Store المستقبلية.

### 🟡 (B) تفعيلات ما قبل الإطلاق الحقيقي (بعد موافقة العميل)
| البند | الحالة |
|------|--------|
| SMS حقيقي (Unifonic) | mock — الكود جاهز، يحتاج APP_SID + اعتماد Sender سعودي |
| Email حقيقي (Resend) | mock — الكود جاهز، يحتاج API key |
| خرائط Google البصرية | مؤجّلة — تحتاج تعاقد CNTXT (السعودية) — بديل يدوي شغّال |
| ZATCA e-invoicing فعلي | scaffold — يحتاج شهادات + رقم ضريبي + Clearance API |
| تصفير البيانات التجريبية → بيانات العميل | جاهز بأمر seed |
| دومين خاص (بدل vercel.app/railway.app) | يحتاج شراء + ربط DNS |
| إطفاء وضع التجربة + تدوير الأسرار + تقييد CORS | إعدادات بسيطة |
| **تدوير/إلغاء توكنز Railway+Vercel المؤقتة** | ⚠️ المستخدم بعتها في الشات — يُذكَّر بإلغائها |

### 🟢 (C) تحسينات اختيارية
- Cron jobs (BullMQ): تذكير صيانة، فواتير overdue تلقائي، حذف GPS بعد 90 يوم، انتهاء رخص.
- PDF للفواتير (MinIO).
- شاشات LOW: ملفات شخصية لكل دور، جدول فحص الورشة، سجل رحلات منفصل.
- GitHub repo (نسخ احتياطي + CI/CD).

---

## ⏸️ Phase 0 (Bootstrap) — بنود متبقية
| البند | السبب | متى |
|------|-------|-----|
| `docker-compose up` (Postgres+Redis+MinIO محلياً) | Docker غير مثبّت (BLK-001) | عند تثبيت Docker — أو يبقى Postgres محمول على 5433 |
| `flutter build apk` / `flutter analyze` | Flutter غير مثبّت (BLK-002) | Phase 2 verification |
| `.github/workflows` (CI skeleton) | لم يُنشأ | قبل Phase 5 (deploy) |
| `prisma studio` | يحتاج DB (متاح الآن على 5433) | عند الحاجة |
| Redis + MinIO محليان | لا Docker | Phase 4 |

## ⏸️ Phase 1 (Backend) — بنود متبقية (المستخدم طلب تذكيره بها في Phase 4)
> 🔔 **ذكّر المستخدم بهذه تحديداً عند بداية Phase 4:**
| البند | الحالة الحالية | متى يُنفَّذ |
|------|----------------|-----------|
| **FCM Push (فعلي)** | ✅ Firebase Admin مربوط (2026-07-05) — يرسل push حقيقي عبر service account. متبقٍّ: تخزين device tokens في DB/Redis (حالياً in-memory) + اختبار على جهاز | Phase 4 |
| **SMS Unifonic (فعلي)** | ✅ provider pattern (mock/Unifonic scaffold، auto-swap). يحتاج UNIFONIC_APP_SID صالح للتفعيل | Phase 4 |
| **Email Resend (فعلي)** | ✅ provider pattern (mock/Resend scaffold). يحتاج RESEND_API_KEY | Phase 4 |
| **ZATCA e-invoicing (فعلي)** | ✅ ZatcaService scaffold (QR TLV + hash، ZATCA_ENABLED=false). يحتاج شهادات + رقم ضريبي + Clearance API | Phase 5 |
| **PDF الفواتير عبر MinIO** | لم يُبنَ | Phase 4-5 |
| **Redis** | ✅ مربوط (2026-07-05): device-tokens + refresh store + rate-limit (hybrid مع fallback). متبقٍّ: Socket.io adapter + BullMQ | Phase 4 (Socket adapter/queues) |
| تقرير Cold Chain PDF | لم يُبنَ | Phase 4-5 |

### فجوات Phase 1 (Backend) — ✅ سُدَّت واتأكدت E2E (2026-07-07)
| البند | الحالة |
|------|--------|
| **Maintenance module (الورشة)** | ✅ كان مبنياً بالفعل (create/list/byVehicle/findOne/updateStatus) |
| **Customers management** (B1) | ✅ GET/POST/PATCH /customers (SUPERVISOR+ACCOUNTANT) — commit 5ebafb4 |
| **Order Flow 1B** (B2) | ✅ POST /orders/for-customer (SUPERVISOR) — commit 0006852 |
| **Notifications endpoints** (B5) | ✅ GET/unread-count/read/read-all/delete — commit d2c8cc2 |
| **Users CRUD كامل** | ✅ كان مبنياً بالفعل (list/get/update/status) |
| **Pricing tiers + overrides** (B3) | ✅ CRUD كامل /pricing/tiers + /pricing/overrides |
| **Vehicles bulk-status + export** (B6) | ✅ PATCH /vehicles/bulk-status + GET /vehicles/export |
| **Order export CSV** (B7) | ✅ GET /orders/export (CSV UTF-8 BOM) |
| **Audit Log** (B4) | ✅ AuditInterceptor عام يكتب فعلاً + GET /audit-logs (اتأكد: 4 سجلات) |
| **لوحات المشرف/المحاسب** (B8) | ✅ GET /reports/dashboard + /invoices/summary + /invoices/overdue |
| **Trip detail مع stops** | ✅ كان مبنياً بالفعل (tripInclude + GET /trips/:id/stops) |
| **Cron jobs** (تذكير صيانة/رخص/overdue/GPS 90 يوم) | ⏳ لسه — تحتاج BullMQ/Redis — Phase 4 |

## 🟢 Phase 2 (Flutter) — الأدوار الخمسة مكتملة (2026-07-05، dart analyze نظيف 48 ملف)
- ✅ عميل (login/home/create/pricing/tracking+خريطة/history/invoices) + سائق (رحلة/GPS/POD/حرارة/offline Hive) + مشرف (تسعير/إسناد/خريطة) + محاسب + ورشة + FCM scaffolding.
- ⏳ متبقٍّ Phase 2 (تلميع/تفعيل):
  - **build APK فعلي** — يحتاج Android SDK + JDK (BLK-002، مؤجَّل).
  - **منتقي خريطة** للإحداثيات (create-order يستخدم إحداثيات ثابتة الآن).
  - **image_picker** لصور POD الحقيقية (placeholder `captured://pod` حالياً — يحتاج إضافة package بإذن).
  - **Socket.io client** للتحديثات الحية في الموبايل (socket_io_client موجود، غير مربوط بعد).
  - **FCM فعلي:** يحتاج google-services.json + GoogleService-Info.plist + FIREBASE_SERVER_KEY + endpoint لتسجيل التوكن (Phase 4).
  - **تلميع UI** حسب mockups في design/ (الحالي وظيفي بالهوية أسود/أحمر).
  - Google Maps: مفتاح API في AndroidManifest/AppDelegate (Phase 5 / وقت البناء).

## 🔜 Phase 3 (Web — Next.js)
- شاشات الأدوار الخمسة (37 شاشة). حالياً placeholders فقط.
- ربط بالـ API الحقيقي + Socket.io client + Google Maps JS + RTL كامل.

## 🔜 Phase 4 (Integration Testing)
> 🔔 **عند بداية هذه الفيز اعرض على المستخدم كل بنود Phase 1 المؤجَّلة أعلاه.**
- E2E كامل (happy path) + load test (50 concurrent) + تفعيل الخدمات الخارجية الفعلية.

## 🔜 Phase 5 (Launch)
- Google Play ($25) + App Store ($99/سنة) + Vercel (web) + Railway (API/DB/Redis).
- ZATCA onboarding فعلي + شهادات + production secrets + تدوير كل المفاتيح المكشوفة سابقاً.

## ⏸️ Google Maps Billing — مؤجَّل بقرار المستخدم (2026-07-06)
> المشروع الجديد **edham-logistics-501615** — Maps key `AIzaSyACj…` تمّ ضبطه بالكامل:
> APIs مفعّلة (Maps JS + Geocoding + SDK Android/iOS) + المفتاح غير مقيّد على Geocoding (اتصلحت).
> **العائق الوحيد المتبقّي:** Billing غير مفعّل على المشروع → Maps Platform يرفض كل الطلبات (REQUEST_DENIED "You must enable Billing").
- **قرار المستخدم:** تأجيل تفعيل Billing لحين الاقتراب من الإطلاق (يحتاج بطاقة ائتمان — $300 رصيد مجاني + حصة شهرية مجانية).
- **لا يعطّل أي وظيفة:** [map-picker.tsx](apps/web/components/map-picker.tsx) فيه fallback إدخال يدوي تلقائي (gm_authFailure + loadError) — كل فلو الطلبات يكمل بعنوان يدوي.
- **عند التفعيل:** اربط billing account بالمشروع → الكود يشتغل فوراً بلا أي تعديل (المفتاح والإعدادات جاهزة).
- **متى يُنفَّذ:** Phase 5 (Launch) أو وقت ما يطلب المستخدم تفعيل الخريطة البصرية.
