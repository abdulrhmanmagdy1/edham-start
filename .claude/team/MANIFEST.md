# MANIFEST.md — هيكل الفريق

## Claude Leader
**الدور:** قائد الفريق + مهندس كبير
**المسؤوليات:** قرأ الوثائق، بناء الخطة، تقسيم المهام، مراجعة كل output، تحديث PROGRESS.md

---

## Backend Agent
**التخصص:** NestJS + Prisma + PostgreSQL + Socket.io
**ملفه:** `.claude/team/backend-agent.md`
**يعمل على:**
- API endpoints (REST + WebSocket)
- Database schema + migrations
- Business logic (Order state machine + Pricing flow)
- Authentication + Authorization (RBAC)
- Redis caching + BullMQ queues
- FCM + Email notifications
- ZATCA integration

---

## Mobile Agent
**التخصص:** Flutter + Dart + Riverpod + Hive
**ملفه:** `.claude/team/mobile-agent.md`
**يعمل على:**
- Flutter App — الـ 5 أدوار كلهم (Android + iOS)
- Customer screens: OTP login، طلب شحن 4 خطوات، tracking، history
- Driver screens: trip list، active trip، GPS، delivery confirm، cold chain
- Supervisor screens: orders، order-details، live map، fleet، drivers
- Accountant screens: dashboard، invoices، payments
- Workshop screens: maintenance، schedule
- Push notifications (FCM flutter_messaging)
- GPS broadcasting (foreground + background)
- Offline sync (Hive + SQLite)

---

## Web Agent
**التخصص:** Next.js 14 + TypeScript + Tailwind CSS
**ملفه:** `.claude/team/web-agent.md`
**يعمل على:**
- Web App — الـ 5 أدوار كلهم
- Customer pages: نفس شاشات الموبايل كـ responsive web pages
- Driver pages: نفس شاشات الموبايل كـ responsive web pages
- Supervisor pages: كل شاشات design/supervisor/ (11 شاشة)
- Accountant pages: كل شاشات design/accountant/ (4 شاشات)
- Workshop pages: كل شاشات design/workshop/ (4 شاشات)
- Real-time updates (Socket.io client)
- Live map (Google Maps JS API)
- RTL + Arabic كامل

---

## QA Agent
**التخصص:** Testing + Verification
**ملفه:** `.claude/team/qa-agent.md`
**يعمل على:**
- Unit tests (Jest + React Testing Library + Flutter test)
- Integration tests (Supertest)
- E2E tests (Playwright)
- API contract verification
- Quality Gate checklists

---

## DevOps Agent
**التخصص:** Docker + GitHub Actions + Railway + Vercel
**ملفه:** `.claude/team/devops-agent.md`
**يعمل على:**
- Docker Compose (dev environment)
- GitHub Actions CI/CD
- Database migrations automation
- Staging + Production deployment
- Google Play + App Store deployment pipeline

---

## قواعد الفريق
1. كل agent يكتب نتيجة عمله في ملفه
2. Claude Leader يراجع قبل القبول
3. لا agent يعمل على ملفات agent آخر بدون تنسيق
