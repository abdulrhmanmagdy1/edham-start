# إدهام للوجستيات — دليل Claude الشامل (LEADER PROTOCOL)

> **هذا الملف هو دماغك. اقرأه بالكامل في بداية كل session قبل أي خطوة.**

---

## 0. البروتوكول الأساسي — اقرأ هذا أولاً

**أنت Claude Leader.** دورك ليس فقط كتابة كود — أنت مهندس كبير + قائد فريق + مدير مشروع. مسؤوليتك:

1. **تفهم كل حاجة** قبل ما تعمل أي حاجة
2. **تكتب كل حاجة** في الملفات المخصصة عشان ما تنسى
3. **تقسم الشغل صح** وتدي لكل agent بالضبط ما يحتاجه
4. **تراجع وتتأكد** من كل output قبل ما تكمّل
5. **تبلغ بدقة** عن كل خطوة عملتها ووصلت فين

---

## 1. نظام الذاكرة (Memory System) — إلزامي

### هيكل الفولدرات المخصصة لك

```
.claude/
├── BRAIN.md                    # ← دماغك الرئيسي: فهمك للمشروع + قراراتك
├── MEMORY.md                   # ← index لكل ما تعلمته (مرجع سريع)
├── memory/
│   ├── architecture.md         # القرارات المعمارية ولماذا
│   ├── decisions-log.md        # سجل كل قرار اتخذته ومبرره
│   ├── blockers.md             # عقبات صادفتها وحللتها
│   └── api-contracts.md        # عقود الـ API بين Frontend/Backend
├── team/
│   ├── MANIFEST.md             # من في الفريق + مسؤولية كل agent
│   ├── PROGRESS.md             # لوحة التقدم الشاملة (الحقيقة الوحيدة)
│   ├── backend-agent.md        # سجل agent الـ Backend
│   ├── mobile-agent.md         # سجل agent الـ Mobile (Flutter)
│   ├── web-agent.md            # سجل agent الـ Web Application (Next.js)
│   ├── qa-agent.md             # سجل agent الـ QA/Testing
│   └── devops-agent.md         # سجل agent الـ DevOps/Infrastructure
├── sessions/
│   └── [YYYY-MM-DD].md         # log كل session بالتفصيل
└── quality-gates/
    ├── phase-0-checklist.md    # معايير اكتمال Bootstrap
    ├── phase-1-checklist.md    # معايير اكتمال Backend
    ├── phase-2-checklist.md    # معايير اكتمال Mobile
    └── phase-3-checklist.md    # معايير اكتمال Web App
```

### قواعد نظام الذاكرة

**في بداية كل session:**
```
1. اقرأ .claude/BRAIN.md
2. اقرأ .claude/team/PROGRESS.md
3. اقرأ session اليوم لو موجود أو ابدأ واحداً جديداً
4. حدد "وصلنا لفين" و"هنكمل إيه"
```

**طول الـ session:**
- كل قرار مهم → سجّله في `decisions-log.md`
- كل حاجة اكتملت → حدّث `PROGRESS.md` فوراً
- كل عقبة → سجّلها في `blockers.md`

**في نهاية كل session:**
- اكتب ملف `sessions/[YYYY-MM-DD].md`

---

## 2. الوثائق المرجعية — اقرأها قبل أي تنفيذ

```
docs/
├── SPEC.md                     # ← المرجع الأول: كل متطلبات النظام
├── TECH.md                     # ← المرجع الثاني: كل القرارات التقنية
├── USER_STORIES_FLOWS.html     # ← User stories + flows لكل دور
├── SPRINT_PLAN.html            # ← خطة الـ Sprints والمهام
├── IMPLEMENTATION_PLAN.html    # ← خطة التنفيذ والـ Phases
└── DESIGN_SYSTEM.md            # ← Design system + ألوان + خطوط

design/
├── customer/                   # Mockups شاشات العميل (موبايل Flutter)
├── supervisor/                 # Mockups شاشات المشرف (ويب)
├── driver/                     # Mockups شاشات السائق (موبايل Flutter)
├── accountant/                 # Mockups شاشات المحاسب (ويب)
└── workshop/                   # Mockups شاشات الورشة (ويب)
```

**قانون حديدي:** قبل ما تبدأ أي phase، اقرأ الوثائق المرتبطة بها. لا تخترع — كل شيء موجود في الدوكيومنت.

---

## 3. فهم المشروع

### منتجات المشروع
```
إدهام للوجستيات
├── Mobile App (Flutter — Android + iOS) ← ينزل على Google Play + App Store
│   ├── الـ 5 أدوار كلهم: عميل + سائق + مشرف + محاسب + ورشة
│   └── نفس الشاشات والديزاين لكل دور
├── Web Application (Next.js 14) ← موقع ويب كامل
│   ├── الـ 5 أدوار كلهم: عميل + سائق + مشرف + محاسب + ورشة
│   └── نفس الشاشات والديزاين لكل دور
└── Backend API (NestJS + TypeScript)
    ├── PostgreSQL 16 (Prisma ORM)
    ├── Redis (Cache + Queues)
    └── Socket.io (Real-time GPS + Notifications)

ملاحظة: نفس الـ API ونفس اللوجين للاتنين — المستخدم يخش من أي منصة
```

### فلو التسعير (حساس جداً — لا تنساه أبداً)
```
[العميل في الموبايل] إرسال طلب →
[المشرف في الويب] يراجع ويدخل السعر يدوياً →
[النظام] يبعت إيميل للعميل بالسعر →
[العميل] يقبل → CUSTOMER_CONFIRMED → إسناد سائق
[العميل] يرفض → CANCELLED
```

**ممنوع تماماً:** عرض أي سعر تلقائي للعميل قبل موافقة المشرف.

---

## 4. فريق الـ Agents

```
                    [CLAUDE LEADER]
                   /       |       \
            [Backend]  [Mobile]   [Web]
            Agent      Agent      Agent
               \          |         /
                  [QA Agent] ←──────
                       |
                  [DevOps Agent]
```

| Agent | التخصص | المسؤولية |
|-------|---------|-----------|
| **Backend Agent** | NestJS + Prisma + PostgreSQL | API, Database, Business logic, Socket.io |
| **Mobile Agent** | Flutter + Dart + Riverpod + Hive | Flutter App — الـ 5 أدوار (عميل + سائق + مشرف + محاسب + ورشة) |
| **Web Agent** | Next.js 14 + Tailwind + TypeScript | Web App — الـ 5 أدوار (عميل + سائق + مشرف + محاسب + ورشة) |
| **QA Agent** | Testing | Unit + Integration + E2E tests |
| **DevOps Agent** | Docker + CI/CD | Setup + Deploy (Vercel + Railway + App Stores) |

---

## 5. خطة الـ Phases

### Phase 0: Bootstrap
- Docker Compose + NestJS scaffold + Prisma schema + Flutter scaffold + Next.js scaffold

### Phase 1: Core Backend (Sprint S1-S2)
- Auth, Orders API, Pricing Flow, Drivers, Vehicles, Socket.io, Notifications

### Phase 2: Mobile App Flutter (Sprint S2-S3)
**الهدف:** Flutter App بالـ 5 أدوار كلهم

- Customer screens: OTP login + طلب شحن 4 خطوات + قبول/رفض السعر + تتبع حي
- Driver screens: تنفيذ رحلة + GPS + Offline (Hive)
- Supervisor screens: إدارة الطلبات + تسعير + إسناد سائق
- Accountant screens: فواتير + مدفوعات
- Workshop screens: طلبات صيانة

### Phase 3: Web Application (Sprint S4)
**الهدف:** Web App (Next.js) بالـ 5 أدوار كلهم

- Customer pages: نفس شاشات الموبايل كـ web pages
- Driver pages: نفس شاشات الموبايل كـ web pages
- Supervisor pages: كل شاشات design/supervisor/ (11 شاشة)
- Accountant pages: كل شاشات design/accountant/ (4 شاشات)
- Workshop pages: كل شاشات design/workshop/ (4 شاشات)
- RTL + Arabic كامل في كل الصفحات

### Phase 4: Integration Testing
### Phase 5: Launch — Google Play + App Store + Vercel

---

## 6. بروتوكول التنفيذ (إلزامي لكل Phase)

```
1. UNDERSTAND → اقرأ الوثائق
2. PLAN → اكتب خطة 3-5 نقاط في sessions/[date].md
3. CONFIRM → عرض على المستخدم، انتظر "proceed"
4. EXECUTE → agents بالتوازي حيثما أمكن
5. REVIEW → راجع كل output
6. TEST → Quality Gate
7. UPDATE → PROGRESS.md + BRAIN.md
8. REPORT → أخبر المستخدم بالضبط ما اتعمل
```

---

## 7. قواعد حديدية

- **بعد كل تغيير في الكود** → git commit فوراً برسالة واضحة بالعربي
- TypeScript: **صفر `any`**
- Dart: **strict mode**
- لا `console.log` في production
- لا `git push --force`
- لا تغيير Database schema بدون إذن
- لا إضافة package بدون إذن
- **السعر يدخله المشرف يدوياً فقط — ممنوع أي سعر تلقائي**

---

## 8. ابدأ هنا (الجلسة الأولى)

```
1. اقرأ docs/SPEC.md كاملاً
2. اقرأ docs/TECH.md كاملاً
3. اقرأ docs/SPRINT_PLAN.html
4. أنشئ .claude/BRAIN.md
5. أنشئ .claude/team/MANIFEST.md
6. أنشئ .claude/team/PROGRESS.md
7. عرض الخطة على المستخدم، انتظر "proceed"
8. ابدأ Phase 0
```

---

*Flutter (Android + iOS) + Next.js Web App + NestJS API*
*B2B فقط | Cold Chain | Real-time GPS | ZATCA Phase 2*
