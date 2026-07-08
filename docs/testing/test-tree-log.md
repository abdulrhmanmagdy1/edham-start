# سجل شجرة الاختبار (DFS) — الموقع المرفوع

> الهدف: زيارة كل مسار + كل زر لكل دور، التقاط أي خطأ (client-side exception / console error / 500)، وإصلاحه على السيرفر. صفر أخطاء.
> الموقع: https://web-nu-lac-65.vercel.app · الأداة: Playwright (Chromium headless).

## الأخطاء المكتشفة والإصلاحات
| # | المكان | الخطأ | الإصلاح | الحالة |
|---|--------|-------|---------|--------|
| 1 | /supervisor/audit | client-side exception: `data.data` undefined (endpoint مُصفَّح، api.get يرجّع مصفوفة) | استخدام `api.getPaged` | ✅ أُصلح ورُفع |
| 2 | كل الأدوار / تسجيل الخروج | الشاشة تعلّق على spinner بعد الخروج (user=null بلا تنقل) | تنقل صريح `router.replace('/login')` في handleLogout | ✅ أُصلح (قيد الرفع) |

## تقدّم الـ DFS (لكل دور)

### الطبقة 1 — تحميل كل الصفحات (Playwright + Chrome) → ✅ صفر أخطاء (31 صفحة)
- [x] Public (5 صفحات) · SUPERVISOR (14) · ACCOUNTANT (3) · WORKSHOP (3) · DRIVER (2) · CUSTOMER (5)
- مفيش client-side exception / console error / تعليق على أي صفحة.

### الطبقة 2 — التفاعل (أزرار + فورمات + الفلو الكامل)
- [ ] فورمات الإنشاء (عميل/شريحة/مركبة/مستخدم/طلب)
- [ ] الفلو التجاري عبر الواجهة (طلب→تسعير→قبول→إسناد→تسليم→فاتورة→دفع)
- [ ] الأزرار والفلاتر والتنقّل
