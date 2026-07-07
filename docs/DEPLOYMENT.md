# دليل الرفع — إدهام للوجستيات

> الاستضافة: **Railway** (API + PostgreSQL + Redis) · **Vercel** (الويب).
> التنفيذ عبر CLI tokens (المستخدم يوفّرها).

---

## المتطلبات من المستخدم (قبل الرفع)
1. **Railway API token**: railway.app → Account Settings → Tokens → Create.
2. **Vercel token**: vercel.com → Settings → Tokens → Create.
3. (لاحقاً للموبايل) حساب GitHub لربط الريبو — اختياري للرفع الحالي.

---

## 1) الباك اند على Railway

### الخدمات (3)
- **PostgreSQL** (plugin) → يوفّر `DATABASE_URL`
- **Redis** (plugin) → يوفّر `REDIS_URL`
- **API** (من `apps/api/Dockerfile` عبر `railway.json`)

### متغيّرات بيئة الـ API (تُضبط في Railway)
```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
SEED_SUPERVISOR_PASSWORD=<كلمة قوية>
FIREBASE_PROJECT_ID=edham-logistics-501615
FIREBASE_SERVICE_ACCOUNT_PATH=./apps/api/firebase-service-account.json
SMS_PROVIDER=mock
EMAIL_PROVIDER=mock
ZATCA_ENABLED=false
DEMO_OTP_ENABLED=true        # ← وضع التجربة: يُظهر OTP للعميل. اجعله false في الإنتاج الحقيقي
```
> ملف `firebase-service-account.json` سرّي — يُرفع كـ secret file في Railway (لا يُوضع في git).
> الـ Dockerfile يشغّل `prisma migrate deploy` تلقائياً عند الإقلاع.

### بعد أول رفع: تعبئة البيانات التجريبية
```
railway run pnpm --filter @edham/api exec ts-node prisma/seed.ts
```

### خطوات CLI
```
railway login --token $RAILWAY_TOKEN
railway link            # أو railway init لمشروع جديد
railway up              # يبني ويرفع API
# أضِف Postgres + Redis plugins من الـ dashboard ثم اضبط المتغيّرات أعلاه
```

---

## 2) الويب على Vercel

### الإعداد
- Root Directory: `apps/web`
- Framework: Next.js (يُكتشف تلقائياً)
- Install (من جذر المونوريبو): `pnpm install`
- Build: `pnpm --filter @edham/shared-types build && pnpm --filter web build`

### متغيّرات بيئة الويب
```
NEXT_PUBLIC_API_URL=https://<railway-api-domain>/api/v1
NEXT_PUBLIC_SOCKET_URL=https://<railway-api-domain>
NEXT_PUBLIC_DEMO_MODE=true            # ← يُظهر رمز OTP على شاشة الدخول (تجربة فقط)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=      # اختياري (يوجد بديل يدوي)
```

### خطوات CLI
```
vercel login --token $VERCEL_TOKEN
cd apps/web && vercel link
vercel --prod --token $VERCEL_TOKEN
```

---

## 3) بعد الرفع — CORS
الـ API يفعّل CORS `origin: true` (يعكس أي origin) — يعمل فوراً مع دومين Vercel.
للإنتاج الصارم: حصر الـ origin على دومين الويب.

## 4) اختبار دخان بعد الرفع
- `GET https://<api>/api/v1/health` → `{status:ok, db:up}`
- افتح دومين Vercel → سجّل دخول كمشرف → تأكّد من اللوحة + الطلبات.
- سلّم للعميل: رابط الويب + كشف الحسابات (`docs/testing/credentials.md`).

## 5) قائمة ما قبل الإنتاج الحقيقي (بعد قبول العميل)
- [ ] `DEMO_OTP_ENABLED=false` + `NEXT_PUBLIC_DEMO_MODE=false`
- [ ] تفعيل SMS (Unifonic) و/أو Email (Resend) الحقيقيَّين
- [ ] تدوير كل الأسرار + حصر CORS
- [ ] ربط Billing لخرائط Google (إن لزم)
- [ ] ZATCA onboarding
