# العقبات (Blockers)

> عقبات صادفتها وحالتها. حدّث فور الحل.

---

## [BLK-001] Docker غير مثبّت على جهاز التطوير
**الحالة:** ✅ تم تجاوزه (2026-07-05) — DB حقيقية تعمل بدون Docker
**التاريخ:** 2026-07-05
**الوصف:** Docker Desktop غير مثبّت (يحتاج admin+WSL2+reboot — غير عملي headless). pgAdmin موجود لكن بلا محرّك server.
**الحل المُطبَّق:** نزّلنا **PostgreSQL 16.4 المحمول** (binaries zip من EnterpriseDB، بلا admin) في:
`scratchpad/pgsql`، cluster في `scratchpad/pgdata`، يعمل على **port 5433** (trust auth).
- `.env` → `DATABASE_URL=...localhost:5433/edham_dev`.
- تم: `prisma migrate dev` (17 جدول) + seed + **E2E الفلو الكامل على DB حقيقية**.
**لإعادة التشغيل بعد إغلاق الجهاز:**
`scratchpad/pgsql/bin/pg_ctl.exe -D scratchpad/pgdata -o "-p 5433" -l scratchpad/pg.log start`
**ملاحظة:** docker-compose.yml (port 5432) يبقى للمرجع/الإنتاج؛ التطوير الحالي على 5433.

## [BLK-002] Flutter SDK غير مثبّت
**الحالة:** 🟡 مفتوح (غير مانع لـ Phase 0)
**التاريخ:** 2026-07-05
**الوصف:** Flutter غير مثبّت، فلا يمكن `flutter pub get` / `flutter build apk` / `flutter analyze`.
**الأثر:** التحقق من `apps/mobile` مؤجَّل. الملفات مكتوبة (pubspec.yaml + main.dart + هيكل features) لكن غير مُبنيّة.
**الحل المقترح:** تثبيت Flutter SDK (channel stable) قبل Phase 2.

## [BLK-003] DATABASE_URL / REDIS_URL فارغان في CREDENTIALS.env
**الحالة:** 🟡 مفتوح
**التاريخ:** 2026-07-05
**الوصف:** كان القرار استخدام Railway السحابية، لكن `DATABASE_URL` و`REDIS_URL` فارغان فعلاً (Railway مؤجَّل لـ Phase 4-5 في الملف).
**الأثر:** لا قاعدة بيانات حيّة للتطوير الآن — مرتبط بـ BLK-001.
**الحل المقترح:** إمّا تثبيت Docker محلياً (BLK-001) أو توفير Railway Postgres الآن.

## [BLK-005] 🔴 تسريب أمني — CREDENTIALS.env كان في تاريخ Git وعلى GitHub
**الحالة:** ✅ التاريخ طُهِّر — لكن **تدوير المفاتيح إلزامي وما زال مسؤولية المستخدم**
**التاريخ:** 2026-07-05
**الوصف:** ملف `CREDENTIALS.env` (بمفاتيح حقيقية) كان مرفوعاً في commit `init` (005c324) ومدفوعاً إلى `origin/main`.
**ما تم:** إزالة من التتبع + `git filter-branch` لتطهيره من كل التاريخ + `git push --force` (تاريخ جديد: 460ac9e). origin/main نظيف الآن. الملف باقٍ محلياً (untracked + ignored).
**⚠️ متبقٍّ على المستخدم (حرج):** المفاتيح انكشفت علناً — يجب **تدويرها/إبطالها كلها**: GITHUB_ACCESS_TOKEN (ghp_)، GOOGLE_MAPS_API_KEY، FIREBASE_SERVER_KEY، MAIN_PASSWORD. GitHub قد يحتفظ بالـ commit القديم عبر الـ SHA حتى يُنظّف، والنسخ/الـ forks قد تحتفظ به — التدوير هو الحماية الوحيدة المؤكدة.

## [BLK-004] corepack enable يحتاج صلاحية Admin
**الحالة:** ✅ محلول (Workaround)
**التاريخ:** 2026-07-05
**الوصف:** `corepack enable` يفشل بـ EPERM (يكتب في `C:\Program Files\nodejs`).
**الحل:** استخدام `corepack pnpm@9.12.0 <cmd>` مباشرة بدون shim — يعمل تماماً.
