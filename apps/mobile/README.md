<div dir="rtl">

# إدهام للوجستيات — تطبيق الجوال (Flutter)

تطبيق Android + iOS بالـ 5 أدوار (عميل + سائق + مشرف + محاسب + ورشة).

## متطلب أساسي

> **يتطلب البناء تثبيت Flutter SDK (3.4+).** التطبيق لن يُبنى بدونه.

## التشغيل

```bash
flutter pub get
flutter run
```

## الهيكل

```
lib/
├── main.dart
└── features/
    ├── auth/         # تسجيل الدخول + توجيه الأدوار
    ├── customer/     # شاشات العميل
    ├── driver/       # شاشات السائق
    ├── supervisor/   # شاشات المشرف
    ├── accountant/   # شاشات المحاسب
    └── workshop/     # شاشات الورشة
```

</div>
