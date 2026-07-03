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
- Phase 0 (Bootstrap): لم يبدأ
- Phase 1 (Backend): لم يبدأ
- Phase 2 (Mobile Flutter): لم يبدأ
- Phase 3 (Web Application): لم يبدأ
- Phase 4 (Integration): لم يبدأ
- Phase 5 (Launch): لم يبدأ
