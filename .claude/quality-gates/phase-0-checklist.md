# Quality Gate — Phase 0: Bootstrap

## معيار الاكتمال
**لا تنتقل لـ Phase 1 إلا بعد ✅ على كل هذه النقاط**

---

## Infrastructure
- [ ] `docker-compose up -d` يعمل بدون أخطاء
- [ ] PostgreSQL 16 يقبل connections على port 5432
- [ ] Redis يستجيب على port 6379

## Backend (NestJS)
- [ ] `cd apps/api && pnpm install` ينجح
- [ ] `pnpm build` ينجح بدون TypeScript errors
- [ ] `pnpm start:dev` يشغّل السيرفر على port 3000
- [ ] `GET /api/v1/health` يرجع `{ status: "ok" }` (200)
- [ ] Prisma migrations: `pnpm prisma migrate dev` ينجح
- [ ] `pnpm prisma studio` يفتح ويعرض الجداول

## Mobile (Flutter)
- [ ] `cd apps/mobile && flutter pub get` ينجح
- [ ] `flutter build apk --debug` ينجح (Android)
- [ ] `flutter analyze` بدون errors

## Web Application (Next.js)
- [ ] `cd apps/web && pnpm install` ينجح
- [ ] `pnpm build` ينجح بدون TypeScript errors
- [ ] `pnpm dev` يشتغل على port 3001
- [ ] الصفحة الرئيسية تفتح RTL بالعربية بدون console errors

## Project Structure
- [ ] Monorepo structure صحيح
- [ ] `.env.example` موجود مع كل variables مطلوبة
- [ ] `.gitignore` يستثني `.env` + `node_modules` + `dist` + `build`
- [ ] `README.md` بخطوات الـ setup

---

## نتيجة الـ Gate
**التاريخ:** —
**الحالة:** لم تبدأ
