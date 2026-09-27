# BRAIN.md — دماغ Claude Leader

> اقرأ هذا في بداية كل session.

## ملخص المشروع
نظام لوجستي متكامل لشركة "إدهام" في السوق السعودي.
- B2B فقط (شركات، لا أفراد)
- Cold Chain (شحن مبرد / مجمد)
- Real-time GPS من موبايل السائق
- ZATCA Phase 2 للفوترة الإلكترونية

## المنتجات
```
1. Flutter App (Android + iOS) — Google Play + App Store
   - الـ 5 أدوار: عميل + سائق + مشرف + محاسب + ورشة
   - نفس الديزاين لكل دور

2. Web Application (Next.js 14)
   - الـ 5 أدوار: عميل + سائق + مشرف + محاسب + ورشة
   - نفس الديزاين لكل دور

3. Backend API (NestJS + Prisma + PostgreSQL)
   - REST API + Socket.io
   - يخدم الاتنين بنفس الـ endpoints
```

## فلو التسعير (الأهم — لا تنساه)
```
العميل يرسل طلب من الموبايل
    ↓
Status: PENDING_PRICING (لا يظهر سعر للعميل)
    ↓
المشرف يراجع في الويب ويدخل السعر يدوياً
    ↓
النظام يرسل إيميل للعميل
    ↓
العميل يقبل → CUSTOMER_CONFIRMED → إسناد سائق
العميل يرفض → CANCELLED
```

## قاعدة Git
بعد كل تغيير في الكود → git commit فوراً برسالة عربية واضحة

## القرارات التقنية المقفلة
- Mobile: Flutter + Dart + Riverpod + Hive (Android + iOS)
- Web: Next.js 14 + TypeScript + Tailwind CSS
- Backend: NestJS + Prisma + PostgreSQL 16 + Redis
- Maps: Google Maps API
- Notifications: FCM (push) + Unifonic (SMS OTP) + SMTP (Email)
- Font: IBM Plex Sans Arabic
- Colors: #0D0D0D (أسود) + #DC2626 (أحمر)

## الـ Order Status Machine
```
DRAFT → PENDING_PRICING → PRICED → CUSTOMER_CONFIRMED → ASSIGNED → LOADING → IN_TRANSIT → DELIVERED → COMPLETED
                                            ↓ (رفض)
                                         CANCELLED
```

## حالة المشروع
- Phase 0 (Bootstrap): ✅ مكتمل جزئياً (2026-07-05) — Monorepo + Backend + Web + shared-types + scaffolds. المتبقي (migrate + flutter build + docker up) محجوب بـ Docker/Flutter غير المثبّتين.
- Phase 1 (Backend): 🟢 ~92% (2026-07-05) — Auth+RBAC + Orders + التسعير + Vehicles/Drivers + الإسناد + Trips + Socket.io + Cold Chain + GPS + Invoices. **مُتحقَّق E2E على PostgreSQL حقيقي**: تسعير 21/21، إسناد 19/19، رحلة+socket 21/21، فوترة 17/17 + 24 unit. المتبقي: FCM/SMS/ZATCA فعلي + Redis (Phase 4-5).
- Phase 2 (Mobile Flutter): 🟢 ~80% (2026-07-05) — **الأدوار الخمسة كاملة**: عميل (login/home/create/pricing/tracking+خريطة/history/invoices) + سائق (رحلة/GPS/POD/حرارة/offline Hive) + مشرف (تسعير/إسناد/خريطة حية) + محاسب (فواتير/مدفوعات) + ورشة (صيانة) + FCM scaffolding. **`dart analyze` نظيف (48 ملف)**. المتبقي: build APK (Android SDK — BLK-002) + منتقي خريطة + image_picker + Socket.io client حي.
- Phase 3 (Web Application): 🟢 ~80% (2026-07-05) — Next.js 14: أساس (API client + auth/session + DashboardShell + LiveMap) + **الأدوار الخمسة كاملة** (عميل/سائق/مشرف/محاسب/ورشة). **`next build` 18 route ✅** + tsc صارم نظيف + `/login` مُتحقَّق RTL. المتبقي: Socket.io client حي + منتقي خريطة + شاشات ثانوية (Users/Reports/Cold-chain).
- Phase 4 (Integration): لم يبدأ
- Phase 5 (Launch): لم يبدأ

## 🔔 تذكير المؤجَّلات (إلزامي)
راجع [deferred-items.md](memory/deferred-items.md) كل جلسة. **عند بداية Phase 4** اعرض على المستخدم بنود Phase 1 المؤجَّلة: FCM/SMS/Email الفعلي + ZATCA + Redis + PDF عبر MinIO. **عند Phase 5** ذكّر بتدوير المفاتيح المكشوفة (BLK-005).

## ملاحظات تشغيلية مهمة
- **pnpm:** لا صلاحية admin لـ `corepack enable`. استخدم `corepack pnpm@9.12.0 <cmd>` دائماً.
- **DB:** PostgreSQL 16.4 محمول يعمل على **port 5433** (scratchpad/pgsql + pgdata، trust auth). `.env` يشير إليه. إعادة التشغيل بعد إقفال الجهاز عبر pg_ctl (راجع blockers.md BLK-001). Docker غير مثبّت.
- **⚠️ تعارض ألوان (لحسمه في Phase 3):** BRAIN/CLAUDE يقولان أسود #0D0D0D + أحمر #DC2626، لكن `docs/DESIGN_SYSTEM.md §2` يعرّف primary أزرق #2563EB. الـ Web scaffold استخدم الأسود/الأحمر حالياً. يجب حسم المرجع قبل بناء شاشات Phase 3.
- **بنية dist:** أُضيف `apps/api/tsconfig.build.json` يستثني `prisma/` كي يكون الإخراج `dist/main.js` مباشرة (seed يُشغَّل بـ ts-node).
- **الاستضافة الحالية (2026-09-28، مؤقتة مجانية):** API على Render `edham-api.onrender.com` + DB على Neon + ويب Vercel `edham-web.vercel.app`. Railway القديم وقع. التفاصيل في [deferred-items.md](memory/deferred-items.md).
