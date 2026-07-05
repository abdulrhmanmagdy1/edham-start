# Tech Debt — إدهام للوجستيات

> بنود تقنية مؤجَّلة يجب معالجتها قبل الإطلاق (Phase 5). مرتبط بـ `.claude/memory/deferred-items.md`.

---

## 🔴 حرج — تدوير المفاتيح قبل الإطلاق (Pre-launch Key Rotation)

### 1. مفاتيح انكشفت سابقاً في git history (BLK-005)
`CREDENTIALS.env` رُفع مرة في commit `init` ونُظّف بـ filter-branch + force-push، لكن المفاتيح تُعتبر **مكشوفة**. **يجب تدويرها كلها قبل الإطلاق:**
- `GITHUB_ACCESS_TOKEN` (ghp_…) — الأخطر
- `GOOGLE_MAPS_API_KEY` · `FIREBASE_SERVER_KEY` · `MAIN_PASSWORD`

### 2. مفتاح Google Maps مُضمَّن في ملفات مُلتزَمة
`GOOGLE_MAPS_API_KEY` (client key) مكتوب صراحةً في:
- `apps/mobile/android/app/src/main/AndroidManifest.xml`
- `apps/mobile/ios/Runner/AppDelegate.swift`
(هذا معياري للموبايل — المفتاح مُضمَّن في الـ APK/IPA على أي حال). لكنّه في الريبو.
**مطلوب قبل الإطلاق:**
- **تقييد المفتاح** في Google Cloud Console: Android (package `com.edham.logistics` + SHA-1)، iOS (bundle `com.edham.logistics`)، Web (HTTP referrers).
- **تدوير** المفتاح واستخدام مفتاح مقيّد للإنتاج.
- مفتاح الويب في `apps/web/.env.local` (متجاهَل) بادئته `NEXT_PUBLIC_` (عام بطبيعته).

### 3. الملفات الحساسة المتجاهَلة (آمنة الآن)
مُتجاهَلة من git ولا تُلتزَم: `google-services.json`، `GoogleService-Info.plist`، `apps/api/firebase-service-account.json` (Admin SDK — وصول كامل)، كل `.env`. **يجب توزيعها عبر قناة آمنة** (secrets manager) في CI/Prod، لا يدوياً.

---

## 🟡 بنية للإنتاج (Phase 4)

- **Device token store (FCM):** حالياً في الذاكرة (`DeviceTokenStore`) — يُفقد عند إعادة التشغيل ولا يدعم multi-instance. → جدول `device_tokens` أو Redis.
- **Refresh token store + Socket.io adapter:** في الذاكرة → Redis.
- **FCM فعلي:** Admin SDK مُهيّأ ويرسل، لكن يحتاج أجهزة مسجّلة فعلاً + اختبار end-to-end على جهاز.
- راجع `.claude/memory/deferred-items.md` لبقية بنود Phase 1/4/5.

---

## 🟢 إعدادات المنصّات (مثبّتة 2026-07-05)
- `applicationId` (Android) و bundle id (iOS) = **`com.edham.logistics`** (يطابق Firebase).
- Firebase مربوط: google-services plugin (Android declarative) + `FirebaseApp.configure()` (iOS) + `Firebase.initializeApp()` (Flutter عبر FcmService).
- `flutter build apk` يحتاج Android SDK + JDK (غير مثبّتين — BLK-002).
