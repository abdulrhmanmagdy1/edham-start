# سجل شجرة الاختبار (DFS) — الموقع المرفوع

> الهدف: زيارة كل مسار + كل زر لكل دور، التقاط أي خطأ (client-side exception / console error / 500)، وإصلاحه على السيرفر. صفر أخطاء.
> الموقع: https://web-nu-lac-65.vercel.app · الأداة: Playwright (Chromium headless).

## الأخطاء المكتشفة والإصلاحات
| # | المكان | الخطأ | الإصلاح | الحالة |
|---|--------|-------|---------|--------|
| 1 | /supervisor/audit | client-side exception: `data.data` undefined (endpoint مُصفَّح، api.get يرجّع مصفوفة) | استخدام `api.getPaged` | ✅ أُصلح ورُفع |
| 2 | كل الأدوار / تسجيل الخروج | الشاشة تعلّق على spinner بعد الخروج (user=null بلا تنقل) | تنقل صريح `router.replace('/login')` في handleLogout | ✅ أُصلح (قيد الرفع) |

## تقدّم الـ DFS (لكل دور)
- [ ] SUPERVISOR — كل الشاشات + الأزرار
- [ ] ACCOUNTANT
- [ ] WORKSHOP
- [ ] DRIVER
- [ ] CUSTOMER
- [ ] Public (landing/login/signup/forgot/reset)
