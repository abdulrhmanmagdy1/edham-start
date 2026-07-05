# سجل المؤجَّلات (Deferred Items Registry)

> **اقرأ هذا الملف في بداية كل session.** كل بند مؤجَّل عبر كل الفيزات، ومتى يُنفَّذ.
> 🔔 **تذكير إلزامي:** عند الوصول لبداية **Phase 4** أو **Phase 5**، اعرض قائمة بنود تلك الفيز على المستخدم قبل أي عمل.

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
| **FCM Push (فعلي)** | stub يسجّل باللوج | Phase 4 (يحتاج FIREBASE_SERVER_KEY صالح) |
| **SMS Unifonic (فعلي)** | stub يسجّل باللوج | Phase 4 (يحتاج UNIFONIC_API_KEY — فارغ) |
| **Email SendGrid (فعلي)** | stub يسجّل باللوج | Phase 4 (يحتاج SENDGRID_API_KEY — فارغ) |
| **ZATCA e-invoicing (فعلي)** | حقول zatca_* جاهزة، لا تكامل | Phase 5 (يحتاج ZATCA onboarding) |
| **PDF الفواتير عبر MinIO** | لم يُبنَ | Phase 4-5 |
| **Redis** (refresh store + Socket.io adapter + BullMQ + rate-limit store) | in-memory حالياً | Phase 4 (multi-instance) |
| تقرير Cold Chain PDF | لم يُبنَ | Phase 4-5 |

### فجوات وظيفية في Phase 1 (Backend) لم تُبنَ بعد — تُستكمل قبل/أثناء Phase 3-4
| البند | ملاحظة |
|------|--------|
| **Maintenance module (الورشة)** | جدول maintenance_requests موجود، لا endpoints. دور WORKSHOP بلا API بعد |
| **Customers management** (SUPERVISOR: إنشاء/تعديل شركات) | لا endpoint — العميل يُنشأ عبر seed فقط حالياً |
| **Order Flow 1B** (المشرف ينشئ طلباً نيابة عن العميل) | لم يُبنَ |
| **Notifications endpoints** (GET/read/read-all/delete) | NotificationsService.notify فقط — لا REST |
| **Users CRUD كامل** (list/get/update/status) | فقط POST /users مبني |
| **Pricing tiers + client overrides** (إدارة المشرف — مرجع داخلي) | جداول موجودة، لا endpoints |
| **Vehicles**: bulk-status + history + update كامل | فقط create/list/available/get/status |
| **Order bulk-export (Excel)** | TECH §5.3 — لم يُبنَ |
| **Audit Log** (كتابة فعلية) | جدول audit_logs موجود، لا middleware يكتب |
| **Cron jobs**: تذكير صيانة (7 أيام)، انتهاء رخصة، فواتير overdue، حذف GPS بعد 90 يوم | لم تُبنَ (تحتاج BullMQ/Redis) |
| **Trip detail مع stops** | GET /trips/:id لا يُرجع المحطات (السائق يحتاجها) — تحسين مطلوب |

## 🔵 Phase 2 (Flutter) — بدأت (2026-07-05)
- ✅ مُنجز: الأساس + دور العميل (login/home/create-order/pricing). `dart analyze` نظيف.
- ⏳ متبقٍّ من العميل: tracking (خريطة Google Maps) + history + invoice + منتقي خريطة للإحداثيات.
- ⏳ الأدوار الأربعة الأخرى: السائق (GPS/رحلة/POD/حرارة/offline Hive) + المشرف + المحاسب + الورشة.
- ⏳ FCM في الموبايل (firebase_messaging) + Socket.io client للتتبع الحي.
- verification: `dart analyze` يعمل (SDK محمول في scratchpad). `flutter build apk` يحتاج Android SDK (مؤجَّل).

## 🔜 Phase 3 (Web — Next.js)
- شاشات الأدوار الخمسة (37 شاشة). حالياً placeholders فقط.
- ربط بالـ API الحقيقي + Socket.io client + Google Maps JS + RTL كامل.

## 🔜 Phase 4 (Integration Testing)
> 🔔 **عند بداية هذه الفيز اعرض على المستخدم كل بنود Phase 1 المؤجَّلة أعلاه.**
- E2E كامل (happy path) + load test (50 concurrent) + تفعيل الخدمات الخارجية الفعلية.

## 🔜 Phase 5 (Launch)
- Google Play ($25) + App Store ($99/سنة) + Vercel (web) + Railway (API/DB/Redis).
- ZATCA onboarding فعلي + شهادات + production secrets + تدوير كل المفاتيح المكشوفة سابقاً.
