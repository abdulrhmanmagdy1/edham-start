# Design System — إدهام للوجستيات

**الإصدار:** 1.0  
**التاريخ:** 2026-06-27  
**يعتمد على:** SPEC.md v1.0 | TECH.md v1.0 | IMAGE_INVENTORY.md  
**المصمم:** Senior Product Designer

---

## 1. هوية البراند (Brand Identity)

### 1.1 قيم البراند

| القيمة | التجسيد البصري | المصدر |
|--------|--------------|--------|
| **الاحترافية** | ألوان هادئة وعميقة، خطوط واضحة، كثافة معلومات عالية دون ازدحام | صور Volvo FH16 باللون الأسود الفاخر — تُشعل توقعات راقية |
| **الموثوقية** | UI متسق ولا مفاجآت، حالات الأخطاء واضحة، بيانات دقيقة بالثانية | غرفة العمليات المنظمة بشاشات Dell — جودة مؤسسية |
| **الدقة** | أرقام واضحة، أيقونات مقروءة، مكوّن درجة الحرارة لا يتهاون | Cold Chain monitoring يمثل حياة أو موت البضاعة |
| **القوة والحجم** | أيقونات شاحنات ثقيلة، أرقام الأسطول بارزة، بيانات الوزن ظاهرة | 20+ شاحنة في صف واحد — ليست app delivery عادية |

### 1.2 نبرة الواجهة

**Professional + Direct + Arabic-native**

- الواجهة تتكلم بالعربية كلغة أولى — لا ترجمة من إنجليزي
- الجمل قصيرة ومباشرة: "تم التسليم" وليس "لقد تمت عملية تسليم الشحنة بنجاح"
- التحذيرات جدية وغير مزخرفة: "انتهاك سلسلة التبريد — يتطلب إجراء فورياً"
- أسماء الأزرار أفعال مباشرة: "إسناد سائق"، "تأكيد التحميل"، "إصدار الفاتورة"
- لا مصطلحات تقنية مكشوفة للمستخدم النهائي — "موقع غير متاح" بدلاً من "GPS timeout"

### 1.3 Mood Board البصري

**اللحظات البصرية المستوحاة من الصور:**

- **شاحنات Volvo FH16 الداكنة على الجسر:** تُعطي إحساس بالثقل والجدية والقوة — هذا يترجم إلى Primary Blue عميق وليس زرق فاتح
- **غرفة العمليات الخليجية الفاخرة بشاشات Dell:** كثافة معلومات عالية، مساحة بيضاء كافية، ألوان تُساعد على التركيز لساعات طويلة — تُلغي الخيارات الجرافيتية المُبهجة
- **أسترات الأمان الصفراء والبرتقالية:** نظام ألوان الأدوار موجود قبل التصميم — السائق أصفر، المشرف برتقالي، تلقائياً
- **شاحنات Isuzu البيضاء في بيئة صحراوية:** خلفية ترابية ذهبية، أبيض نظيف، سماء زرقاء — هذه palette البيئة الطبيعية للشركة
- **لوحات الترقيم العربية:** RTL ليس خياراً — هو طبيعة الأرقام والحروف والسياق كله

**الكلمات التي تصف الـ Aesthetic المطلوب:**
صناعي فاخر، دقيق وحازم، خليجي المولد عالمي المعيار، مؤسسي وليس استهلاكي.

---

## 2. ألوان (Color Palette)

### 2.1 الألوان الأساسية — Primary Blue (أزرق مؤسسي عميق)

اختيار اللون مبني على: B2B Logistics تحتاج ثقة واحترافية — الأزرق العميق هو اللغة العالمية للمؤسسات الجادة (FedEx, DHL, Maersk). درجته تميل للأزرق الصلبي (Steel Blue) لا السماوي.

| Token | Hex | RGB | الاستخدام |
|-------|-----|-----|---------|
| primary-50 | `#EFF6FF` | 239, 246, 255 | خلفيات الـ info cards، hover خفيف |
| primary-100 | `#DBEAFE` | 219, 234, 254 | خلفية badges "في الطريق"، selected row |
| primary-200 | `#BFDBFE` | 191, 219, 254 | borders خفيفة، dividers |
| primary-300 | `#93C5FD` | 147, 197, 253 | progress bars، accents ثانوية |
| primary-400 | `#60A5FA` | 96, 165, 250 | links، secondary actions |
| primary-500 | `#3B82F6` | 59, 130, 246 | **اللون الرئيسي** — أزرق حية للـ Info state |
| primary-600 | `#2563EB` | 37, 99, 235 | **Primary Button** — الأكثر استخداماً |
| primary-700 | `#1D4ED8` | 29, 78, 216 | Hover على Primary Button |
| primary-800 | `#1E40AF` | 30, 64, 175 | Active/Pressed، Sidebar selected item |
| primary-900 | `#1E3A8A` | 30, 58, 138 | Sidebar خلفية، Header داكن، Dark Mode base |

**قاعدة الاستخدام:** primary-600 للأزرار والأفعال الرئيسية. primary-900 للخلفيات الداكنة. primary-100/200 للحالات والـ highlights.

---

### 2.2 الألوان الثانوية — Logistics Amber (كهرماني لوجستي)

مستوحى مباشرة من سترات الأمان الصفراء والبرتقالية في صور الفريق الميداني. يُستخدم للإجراءات الثانوية وتمييز دور المشرف.

| Token | Hex | RGB | الاستخدام |
|-------|-----|-----|---------|
| amber-50 | `#FFFBEB` | 255, 251, 235 | خلفية تحذيرات خفيفة |
| amber-100 | `#FEF3C7` | 254, 243, 199 | background badges "في الانتظار" |
| amber-200 | `#FDE68A` | 253, 230, 138 | borders تحذيرية |
| amber-300 | `#FCD34D` | 252, 211, 77 | أيقونات تحذير، warning borders |
| amber-400 | `#FBBF24` | 251, 191, 36 | secondary interactive elements |
| amber-500 | `#F59E0B` | 245, 158, 11 | **Warning State**، درجة حرارة تقترب من الحد |
| amber-600 | `#D97706` | 217, 119, 6 | **Secondary Button** للمشرف |
| amber-700 | `#B45309` | 180, 83, 9 | Hover على Secondary Button |
| amber-800 | `#92400E` | 146, 64, 14 | نص على خلفية فاتحة |
| amber-900 | `#78350F` | 120, 53, 15 | تحذير نصي داكن |

---

### 2.3 الألوان المحايدة — Neutral (رمادي مؤسسي)

رمادي بارد (Cool Gray) لا دافئ — لأن الـ UI مؤسسي وليس ودياً.

| Token | Hex | RGB | الاستخدام |
|-------|-----|-----|---------|
| neutral-0 | `#FFFFFF` | 255, 255, 255 | خلفية الـ cards، الصفحات |
| neutral-50 | `#F9FAFB` | 249, 250, 251 | خلفية الصفحة الرئيسية |
| neutral-100 | `#F3F4F6` | 243, 244, 246 | خلفية الـ inputs، rows في الجداول |
| neutral-200 | `#E5E7EB` | 229, 231, 235 | Dividers، borders العامة |
| neutral-300 | `#D1D5DB` | 209, 213, 219 | Borders للـ inputs، disabled |
| neutral-400 | `#9CA3AF` | 156, 163, 175 | Placeholder text، icons ثانوية |
| neutral-500 | `#6B7280` | 107, 114, 128 | نص ثانوي، labels |
| neutral-600 | `#4B5563` | 75, 85, 99 | نص Body العادي |
| neutral-700 | `#374151` | 55, 65, 81 | نص Body الثقيل |
| neutral-800 | `#1F2937` | 31, 41, 55 | عناوين الصفحات، نص رئيسي داكن |
| neutral-900 | `#111827` | 17, 24, 39 | أداكن نص — عناوين كبيرة |

---

### 2.4 الألوان الدلالية (Semantic Colors)

| Token | Hex | الاستخدام في إدهام |
|-------|-----|------------------|
| `success-500` | `#10B981` | تم التسليم، سائق متاح، درجة حرارة طبيعية، فاتورة مدفوعة |
| `success-100` | `#D1FAE5` | خلفية badge "مكتمل" |
| `success-700` | `#047857` | نص على خلفية success-100 |
| `warning-500` | `#F59E0B` | انتظار الإسناد، درجة حرارة تقترب من الحد، فاتورة متأخرة |
| `warning-100` | `#FEF3C7` | خلفية badge "في الانتظار" |
| `warning-700` | `#B45309` | نص على خلفية warning-100 |
| `danger-500` | `#EF4444` | انتهاك Cold Chain، مركبة خارج الخدمة، طلب ملغى، فاتورة ملغاة |
| `danger-100` | `#FEE2E2` | خلفية badge "ملغى"، تحذير انتهاك الحرارة |
| `danger-700` | `#B91C1C` | نص على خلفية danger-100 |
| `info-500` | `#3B82F6` | في الطريق، معلومات عامة، إشعار نظام |
| `info-100` | `#DBEAFE` | خلفية badge "تم الإسناد" |
| `info-700` | `#1D4ED8` | نص على خلفية info-100 |

---

### 2.5 ألوان حالات المركبات (Fleet Status Colors)

تُستخدم على الخريطة الحية كـ marker colors وفي قوائم الأسطول.

| الحالة | الـ Token | Hex | الرمز | اللون في الخريطة |
|--------|----------|-----|-------|----------------|
| متاحة (AVAILABLE) | `success-500` | `#10B981` | دائرة خضراء صلبة | Marker أخضر |
| في رحلة (ON_TRIP) | `info-500` | `#3B82F6` | دائرة زرقاء صلبة | Marker أزرق |
| في الصيانة (IN_MAINTENANCE) | `warning-500` | `#F59E0B` | دائرة برتقالية | Marker أصفر |
| خارج الخدمة (OUT_OF_SERVICE) | `danger-500` | `#EF4444` | دائرة حمراء مع X | Marker رمادي (محذوف من الخريطة) |

**قاعدة الـ Marker:** الشكل الأساسي للـ marker هو شاحنة صغيرة `ti-truck`. اللون يتغير حسب الحالة. حجم الـ marker: 32×32px على الخريطة.

---

### 2.6 ألوان Cold Chain (سلسلة التبريد)

| الحالة | الـ Token | Hex | النطاق — مبرد (Chilled) | النطاق — مجمد (Frozen) |
|--------|----------|-----|------------------------|----------------------|
| طبيعي | `success-500` | `#10B981` | 2°C – 8°C | أقل من -18°C |
| تحذير (اقتراب من الحد) | `warning-500` | `#F59E0B` | 1°C أو 9°C – 10°C | -17°C إلى -15°C |
| انتهاك (خارج النطاق) | `danger-500` | `#EF4444` | أقل من 1°C أو أكثر من 10°C | أكثر من -15°C |

**سلوك بصري خاص بالانتهاك:**
- الـ Badge والـ Gauge يرتجفان بـ CSS animation (`shake 0.5s ease-in-out infinite alternate`)
- يظهر أيقونة `ti-alert-triangle` مع كل انتهاك
- في Dashboard المشرف: صف الرحلة المنتهِكة يُصبح خلفيته `danger-50` (#FFF5F5)

---

## 3. الخطوط (Typography)

### 3.1 عائلة الخطوط

**الخط الرئيسي: IBM Plex Sans Arabic**
```
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
```
**السبب:**
- مصمم أصلاً للعربية — لا مجرد ترجمة لخط لاتيني
- ممتاز للـ RTL interfaces: كثافة المعلومات المطلوبة في Dashboard
- واضح على شاشات Dell 1920×1080 في غرفة العمليات
- مجاني ومفتوح المصدر (Google Fonts)
- يدعم الأوزان المطلوبة: 400, 500, 600, 700

**خط الأرقام والـ IDs: JetBrains Mono**
```
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
```
**السبب:** الأرقام المهمة في النظام (لوحات المركبات، أرقام الرحلات، الـ timestamps، درجات الحرارة) تحتاج خطاً أحادي العرض لسهولة المقارنة والقراءة السريعة. JetBrains Mono هو الأوضح في قراءة الأرقام.

**مثال على التطبيق:**
- رقم لوحة المركبة: `أ ب ج ١٢٣٤` → خط Mono
- عدد الطلبات في Badge: `١٢٤` → خط Mono
- درجة الحرارة: `-٢.٥°C` → خط Mono
- اسم السائق: `محمد عبدالله السعيدي` → خط Arabic

---

### 3.2 Type Scale

| Token | الحجم | Line Height | الوزن (Weight) | الخط | الاستخدام |
|-------|-------|-------------|--------------|------|---------|
| `text-display` | 48px | 56px (116%) | 700 Bold | Arabic | شاشة Splash، عنوان Landing Page |
| `text-h1` | 36px | 44px (122%) | 700 Bold | Arabic | عناوين الصفحات الرئيسية |
| `text-h2` | 30px | 38px (126%) | 700 Bold | Arabic | عناوين الأقسام الكبيرة في Dashboard |
| `text-h3` | 24px | 32px (133%) | 600 SemiBold | Arabic | عناوين الـ Cards والـ Modals |
| `text-h4` | 20px | 28px (140%) | 600 SemiBold | Arabic | عناوين الـ Sub-sections، أسماء الـ Tabs |
| `text-h5` | 18px | 26px (144%) | 600 SemiBold | Arabic | عناوين الأقسام الصغيرة |
| `text-body-lg` | 18px | 28px (155%) | 400 Regular | Arabic | نص رئيسي كبير — تفاصيل الطلب، وصف الشحنة |
| `text-body` | 16px | 24px (150%) | 400 Regular | Arabic | النص العادي في كل مكان |
| `text-body-md` | 15px | 22px (146%) | 400 Regular | Arabic | النص في الجداول (Desktop) |
| `text-body-sm` | 14px | 20px (142%) | 400 Regular | Arabic | نص ثانوي، labels للـ inputs، timestamps |
| `text-caption` | 12px | 16px (133%) | 400 Regular | Arabic | labels صغيرة، تاريخ صغير، metadata |
| `text-mono-md` | 14px | 20px (142%) | 500 Medium | Mono | أرقام الرحلات، لوحات المركبات، IDs |
| `text-mono-sm` | 12px | 16px (133%) | 400 Regular | Mono | timestamps في السجلات، قراءات الحرارة |
| `text-mono-lg` | 18px | 24px (133%) | 600 SemiBold | Mono | درجة الحرارة الكبيرة في الـ Gauge |

**ملاحظة وزن الخط:** الخط العربي يبدو أرفع من اللاتيني بنفس الوزن. استخدم 600 حيث تستخدم 500 في خط لاتيني، و700 حيث تستخدم 600.

---

## 4. المسافات والشبكة (Spacing & Grid)

### 4.1 Spacing Scale

**القاعدة:** 4px base unit — كل القيم مضاعفات لـ 4.

| Token | القيمة | الاستخدام الشائع |
|-------|-------|----------------|
| `space-0` | 0px | إزالة المسافة |
| `space-1` | 4px | padding داخل الـ badges، مسافة بين أيقونة ونص |
| `space-2` | 8px | padding صغير، gap بين العناصر المتجاورة |
| `space-3` | 12px | padding الـ inputs (vertical)، gap في النوافذ |
| `space-4` | 16px | padding الـ cards (mobile)، المسافة القياسية |
| `space-5` | 20px | padding الأزرار (horizontal)، gap قياسي |
| `space-6` | 24px | padding الـ cards (desktop)، مسافة بين الأقسام |
| `space-8` | 32px | مسافة بين الـ sections |
| `space-10` | 40px | padding الـ modals، مسافة كبيرة |
| `space-12` | 48px | مسافة بين الـ sections الكبيرة |
| `space-16` | 64px | padding الصفحات (desktop) |
| `space-20` | 80px | مسافة hero sections |
| `space-24` | 96px | bottom navigation safe area (mobile) |

---

### 4.2 Grid System

**Mobile (320px – 767px) — المرجع: iPhone 14 Pro 390px:**
```
Columns:    4
Gutter:     16px
Margin:     16px (جانبي)
Content:    calc(100% - 32px)
```

**Tablet (768px – 1023px):**
```
Columns:    8
Gutter:     24px
Margin:     24px
Content:    calc(100% - 48px)
```

**Desktop (1024px – 1439px):**
```
Columns:    12
Gutter:     24px
Margin:     32px
Content:    calc(100% - 64px)
```

**Wide (1440px+) — المرجع: شاشات Dell 1920×1080 في غرفة العمليات:**
```
Columns:    12
Gutter:     24px
Max-width:  1440px
Margin:     auto (يتمركز)
```

**ملاحظة Sidebar:** في الـ Dashboard (Desktop)، الـ Sidebar يأخذ 240px ثابتة. الـ Content Area تبدأ من 240px وتمتد للنهاية. في الـ Collapsed mode: الـ Sidebar 64px فقط.

**اتجاه الـ Sidebar في RTL:** الـ Sidebar يكون على اليمين (inline-end). الـ Content على اليسار. الـ Breadcrumbs والـ Navigation تسير من اليمين لليسار.

---

## 5. Border Radius

| Token | القيمة | الاستخدام |
|-------|-------|---------|
| `radius-none` | 0px | حدود حادة — لا يُستخدم في هذا النظام |
| `radius-sm` | 4px | inputs، checkboxes، small badges، table cells |
| `radius-md` | 8px | buttons، small cards، dropdown items، tooltips |
| `radius-lg` | 12px | cards رئيسية، panels، form containers |
| `radius-xl` | 16px | modals، bottom sheets (Mobile)، popovers |
| `radius-2xl` | 20px | large modals، onboarding cards |
| `radius-full` | 9999px | avatar images، status pills، toggle switches، loading spinners |

**القاعدة:** الـ border-radius يصغر مع صغر العنصر. Badge صغير = radius-sm. Card كبيرة = radius-lg. Modal = radius-xl.

---

## 6. الظلال (Shadows)

| Token | CSS Value | الاستخدام |
|-------|-----------|---------|
| `shadow-none` | `none` | flat elements |
| `shadow-xs` | `0 1px 2px rgba(0, 0, 0, 0.04)` | بديل subtle لـ border على الـ inputs |
| `shadow-sm` | `0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)` | inputs، بطاقات خفيفة، table header |
| `shadow-md` | `0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04)` | cards رئيسية، Navbar، Sidebar |
| `shadow-lg` | `0 10px 15px rgba(0, 0, 0, 0.07), 0 4px 6px rgba(0, 0, 0, 0.04)` | dropdowns، date-pickers، tooltips كبيرة |
| `shadow-xl` | `0 20px 25px rgba(0, 0, 0, 0.08), 0 8px 10px rgba(0, 0, 0, 0.04)` | modals، side panels، Cold Chain alert popup |
| `shadow-2xl` | `0 25px 50px rgba(0, 0, 0, 0.12)` | full-screen overlays، onboarding sheets |

**ملاحظة Dark Mode:** إذا أُضيف Dark Mode في المستقبل، الظلال تُستبدل بـ borders خفيفة (neutral-700/30%) لأن الظلال لا تبرز على خلفيات داكنة.

---

## 7. المكوّنات (Components)

### 7.1 Button (زر)

**الوريانتات:**

| Variant | الخلفية | نص | Border | الاستخدام |
|---------|---------|-----|--------|---------|
| `primary` | primary-600 | white | none | الإجراء الرئيسي في كل شاشة: "إسناد سائق"، "تأكيد الطلب" |
| `secondary` | white | primary-600 | primary-600 (1px) | إجراء ثانوي: "تعديل"، "عرض التفاصيل" |
| `ghost` | transparent | neutral-700 | none | إجراءات خفيفة: "إلغاء"، "رجوع" |
| `danger` | danger-500 | white | none | إجراءات حذف أو إلغاء لا رجعة فيها: "إلغاء الطلب"، "حذف" |
| `success` | success-500 | white | none | إتمام إيجابي: "تأكيد التسليم"، "إتمام الرحلة" |
| `warning` | amber-500 | white | none | تحذيرات تحتاج إجراء: "تعليق الرحلة"، "الإبلاغ عن مشكلة" |

**الأحجام:**

| Size | الارتفاع | Padding X | Font | الاستخدام |
|------|---------|---------|------|---------|
| `sm` | 32px | 12px | text-body-sm + 600 | actions في الجداول، badges قابلة للنقر |
| `md` | 40px | 16px | text-body + 600 | الزر القياسي في الـ Dashboard |
| `lg` | 48px | 20px | text-body-lg + 600 | الأزرار الرئيسية في Mobile (مناسب لإصبع السائق) |
| `xl` | 56px | 24px | text-h5 + 600 | CTA الوحيد في الشاشة كشاشة "تأكيد التسليم" |

**الحالات (States):**
- `default`: الشكل العادي
- `hover`: يُضيء 5% — مثال primary-600 → primary-500
- `active/pressed`: يُعتّم 5% — مثال primary-600 → primary-700
- `disabled`: opacity 0.4، cursor: not-allowed، pointer-events: none
- `loading`: spinner 16px على يسار النص (يمين في RTL) + نص "جاري..." مع ellipsis animation

**قواعد RTL للأزرار:**
- الأيقونة في الزر: `icon-start` = يمين النص. `icon-end` = يسار النص
- السهم ">" في زر "التالي" يُقلب ليصبح "<" عبر `transform: scaleX(-1)` أو باستخدام أيقونة `ti-chevron-left`

```css
/* CSS مثال */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: all 100ms ease-in;
}
.btn-primary { background: var(--color-primary-600); color: white; }
.btn-primary:hover { background: var(--color-primary-500); }
.btn-primary:active { background: var(--color-primary-700); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
```

---

### 7.2 Input Field (حقل إدخال)

**الأنواع:**

| النوع | الوصف | مثال الاستخدام |
|-------|-------|--------------|
| `text` | نص عادي | اسم العميل، وصف الشحنة |
| `phone` | رقم جوال سعودي | +966 مع mask تلقائي |
| `number` | رقم فقط | وزن الشحنة، كمية البضاعة |
| `textarea` | نص متعدد الأسطر | ملاحظات الرحلة، سبب الرفض |
| `date-picker` | تاريخ | موعد الاستلام المجدول |
| `time-picker` | وقت | وقت الاستلام |
| `select` | قائمة منسدلة | نوع المركبة، نوع البضاعة، حالة الطلب |
| `combobox` | بحث + اختيار | اختيار سائق من قائمة كبيرة |
| `temperature` | رقم عشري + °C | إدخال درجة حرارة يدوياً |

**الأبعاد:**
- الارتفاع: **48px** — مناسب للسائق على الموبايل وسهل النقر
- الـ Label: **فوق الحقل دائماً** (لا floating label — floating labels أصعب مع RTL وتُخفي معلومات مهمة)
- الـ Label font: text-body-sm + 600 + neutral-700
- الـ Placeholder: text-body + neutral-400 — بالعربي الفصيح الواضح

**الحالات:**

| الحالة | Border | Shadow | Background |
|--------|--------|--------|-----------|
| `default` | neutral-300 (1.5px) | shadow-xs | white |
| `focused` | primary-600 (2px) | shadow-sm | white |
| `filled` | neutral-300 (1.5px) | none | white |
| `error` | danger-500 (2px) | none | danger-50 |
| `disabled` | neutral-200 (1.5px) | none | neutral-100 |

**رسالة الخطأ:** text-caption + danger-600 + أيقونة `ti-alert-circle` (16px) — تظهر أسفل الحقل مباشرة.

**حقل الجوال السعودي (Phone Input) — قواعد خاصة:**
- يبدأ تلقائياً بـ `+966` كـ prefix ثابت غير قابل للحذف
- اتجاه الحقل: LTR (الأرقام تُكتب من اليسار لليمين حتى في RTL)
- مثال: `+966 5X XXX XXXX`
- الـ mask: `+966 5\d \d\d\d \d\d\d\d`

---

### 7.3 Card (بطاقة)

**الوريانتات:**

| Variant | Shadow | Border | Background | الاستخدام |
|---------|--------|--------|-----------|---------|
| `flat` | shadow-none | neutral-200 (1px) | white | cards داخل sections |
| `elevated` | shadow-md | none | white | cards رئيسية في Dashboard |
| `outlined` | shadow-none | primary-200 (1.5px) | primary-50 | cards مُختارة أو مُبرزة |
| `interactive` | shadow-sm → shadow-lg (hover) | neutral-200 | white | cards قابلة للنقر (order cards) |

**Padding:**
- Mobile: `space-4` (16px) على الجوانب
- Desktop: `space-6` (24px) على الجوانب

---

#### Card خاصة بالطلبات (Order Card)

```
┌─────────────────────────────────────────────────────────┐
│  [أيقونة نوع البضاعة]   رقم الطلب #ORD-2026-004521     │ ← text-mono-md
│                          العميل: شركة التميمي التجارية   │ ← text-body-sm + neutral-600
├─────────────────────────────────────────────────────────┤
│  📍 الاستلام: مستودع الرياض الصناعي                     │ ← text-body
│  📍 التسليم: مخازن جدة الغربية                         │
│  الوزن: 4,200 كغ        نوع المركبة: Isuzu مبردة       │ ← text-body-sm
├─────────────────────────────────────────────────────────┤
│  [❄️ مبرد: 2°C–8°C]   🕐 الغد، 8:00 ص    [في الطريق] │
│                                        [تعيين سائق ↙]  │ ← CTA
└─────────────────────────────────────────────────────────┘
```

- حالة Cold Chain تكون **دائماً مرئية** لو `cold_chain_required = true` — لا تُخفى في تبويب
- لون شريط الحالة الجانبي (4px على الجانب الأيمن في RTL): يتطابق مع لون الـ Status Badge

---

#### Card خاصة بالمركبات (Vehicle Card)

```
┌─────────────────────────────────────────────────────────┐
│  🚛  أ ب ج ١٢٣٤           ● متاحة                    │ ← رقم اللوحة بـ Mono + badge
│     Volvo FH — شاحنة ثقيلة                             │ ← text-body-sm
│     السائق: عبدالرحمن الحربي                            │
├─────────────────────────────────────────────────────────┤
│  آخر موقع: طريق الرياض–الدمام، 12:45                   │
│  الصيانة القادمة: 15 يوليو 2026 (19 يوماً)             │ ← warning لو < 7 أيام
├─────────────────────────────────────────────────────────┤
│  [سجل الرحلات]        [طلب صيانة]        [تفاصيل ↙]   │
└─────────────────────────────────────────────────────────┘
```

- لو الصيانة القادمة خلال أقل من 7 أيام → لون النص warning-600 + أيقونة `ti-alert-triangle`
- لو رخصة السائق منتهية → danger-600 + أيقونة `ti-id-off`

---

### 7.4 Status Badge (شارة الحالة)

| الحالة | Token الخلفية | Token النص | الأيقونة | النص العربي |
|--------|-------------|----------|---------|-----------|
| `DRAFT` مسودة | neutral-100 | neutral-600 | `ti-edit` | مسودة |
| `CONFIRMED` مؤكد | primary-100 | primary-700 | `ti-check` | مؤكد |
| `ASSIGNED` مُسند | info-100 | info-700 | `ti-user-check` | تم الإسناد |
| `LOADING` تحميل | amber-100 | amber-700 | `ti-package` | جاري التحميل |
| `IN_TRANSIT` في الطريق | primary-100 | primary-700 | `ti-truck` | في الطريق |
| `DELIVERED` تم التسليم | success-100 | success-700 | `ti-circle-check` | تم التسليم |
| `COMPLETED` مكتمل | success-100 | success-700 | `ti-check-all` | مكتمل |
| `CANCELLED` ملغى | danger-100 | danger-700 | `ti-x` | ملغى |
| `OVERDUE` متأخر | danger-100 | danger-700 | `ti-clock-exclamation` | متأخر |

**أبعاد الـ Badge:**
- Height: 24px
- Padding: 4px 8px
- Border-radius: radius-full (pill shape)
- Font: text-caption + 500 Medium

**قاعدة إمكانية الوصول (Accessibility):** الحالة تظهر دائماً كـ **نص + لون**. اعتماد اللون وحده غير مقبول لأن بعض المستخدمين يعانون من عمى الألوان.

---

### 7.5 Navigation

#### Mobile Bottom Navigation (للسائق والعميل)

عدد التبويبات: 4 – 5 كحد أقصى. أيقونة + نص عربي دائماً (أيقونة بدون نص في الموبايل تُربك المستخدم).

**للسائق:**
```
┌────────────────────────────────────────────────────────┐
│  [🗺 رحلاتي] [📦 الشحنات] [🌡 الحرارة] [👤 حسابي] │
└────────────────────────────────────────────────────────┘
```

**للعميل:**
```
┌───────────────────────────────────────────────────────────────┐
│  [📋 طلباتي]  [➕ طلب جديد]  [📍 تتبع]  [📄 الفواتير]  [👤] │
└───────────────────────────────────────────────────────────────┘
```

**المواصفات التقنية:**
- الارتفاع: 64px + safe area (للـ iPhone)
- الخلفية: white + shadow-lg من فوق
- التبويب النشط: أيقونة primary-600 + نص primary-600 + خط أسفل 2px primary-600
- التبويب غير النشط: أيقونة neutral-400 + نص neutral-500
- font size: text-caption (12px) تحت الأيقونة

---

#### Desktop Sidebar (للمشرف والمحاسب والورشة)

**المواصفات:**
- العرض الموسّع: **240px** — ثابت في الـ Default
- العرض المضغوط: **64px** — يظهر الأيقونة فقط مع Tooltip
- الاتجاه: على **اليمين** في RTL (inline-end)
- الخلفية: primary-900 (`#1E3A8A`)
- نص القوائم: white + opacity 0.85 (غير نشط)، white + opacity 1.0 (نشط)
- الـ Active Item: خلفية primary-800 + حد أيسر (inline-start) 3px primary-300

**هيكل الـ Sidebar للمشرف:**
```
┌──────────────────────────┐
│  ▪▪▪ إدهام للوجستيات    │ ← شعار + اسم
├──────────────────────────┤
│  📊 لوحة التحكم          │ ← نشط حالياً (highlighted)
│  📦 إدارة الطلبات         │
│  🗺  خريطة الأسطول        │
│  🚛 إدارة المركبات         │
│  👥 السائقون             │
│  🏢 العملاء              │
│  ❄️ مراقبة التبريد        │
│  📈 التقارير             │
├──────────────────────────┤
│  🔔 الإشعارات (۱۲)      │ ← badge بعدد غير المقروء
├──────────────────────────┤
│  ⚙️ الإعدادات            │
│  👤 الملف الشخصي         │
└──────────────────────────┘
```

---

### 7.6 Map Markers (علامات الخريطة)

**أشكال الـ Markers حسب نوع المركبة:**

| نوع المركبة | الشكل | اللون | أيقونة |
|------------|-------|-------|-------|
| Toyota HiAce (VAN) | دائرة صغيرة 28×28px | حسب الحالة | `ti-van` |
| Isuzu مبردة | مستطيل مستدير 36×28px + ❄ | حسب الحالة | `ti-truck` + `ti-snowflake` صغيرة |
| Volvo FH ثقيلة | مستطيل 44×32px | حسب الحالة | `ti-truck-delivery` |

**علامات نقاط الرحلة:**
- نقطة الاستلام: Pin أخضر + `ti-package` داخله
- نقطة التسليم: Pin أزرق + `ti-map-pin-filled` داخله
- موقع السائق الحالي: دائرة متحركة (pulsing) + `ti-navigation` داخله

**قاعدة المعلومات عند الضغط على Marker:**
- Popup صغير 200px عرض يظهر: رقم اللوحة + اسم السائق + الحالة + آخر تحديث
- زر "عرض التفاصيل" يفتح Panel جانبي كامل

---

### 7.7 Data Table (جدول البيانات)

مُصمم لشاشات 1920×1080 في غرفة العمليات.

**مواصفات:**
- Row height: 52px (يتسع لمعلومات كافية مع راحة للعين)
- Header: خلفية neutral-50 + neutral-700 + font text-body-sm + 600
- Zebra stripes: صفوف زوجية خلفيتها neutral-50 (اختياري — يُفعّل في الجداول الكبيرة)
- Hover: neutral-100
- Selected: primary-50 + border primary-200

**الميزات الإلزامية:**
- **فلترة:** شريط فلترة أعلى الجدول — فلتر بالحالة، التاريخ، السائق، نوع المركبة
- **بحث:** حقل بحث نصي مع debounce 300ms
- **Sorting:** كل column قابل للترتيب (تصاعدي/تنازلي) مع سهم واضح
- **Pagination:** `< السابق` و`التالي >` مع عرض `الصفحة 1 من 15` + اختيار `20 / 50 / 100` لكل صفحة
- **Bulk Select:** checkbox في كل صف + checkbox "اختر الكل" في الـ Header + action bar يظهر عند الاختيار

**ترتيب Columns (جدول الطلبات مثالاً):**
```
☐  رقم الطلب ↕  العميل ↕  نوع المركبة ↕  السائق ↕  الحالة ↕  التاريخ ↕  إجراءات
```

---

### 7.8 Modal / Dialog

**الأحجام:**

| Size | العرض | الاستخدام |
|------|------|---------|
| `sm` | 400px | تأكيد حذف، رسائل تحذير بسيطة |
| `md` | 560px | إسناد سائق، تغيير الحالة مع ملاحظة |
| `lg` | 720px | تفاصيل طلب كاملة، إنشاء طلب جديد |
| `xl` | 960px | نموذج معقد، عرض تقرير Cold Chain |
| `full` | 100vw × 100vh | خريطة مفردة، عرض صورة إثبات التسليم |

**الهيكل الداخلي:**
```
┌─────────────────────────────────────────────┐
│  [أيقونة] عنوان الـ Modal          [✕]     │ ← Header: padding 24px، border-bottom
├─────────────────────────────────────────────┤
│                                             │
│   Body — scrollable إذا تجاوز الـ content   │ ← padding 24px
│                                             │
├─────────────────────────────────────────────┤
│  [زر ثانوي — إلغاء]    [زر رئيسي — تأكيد] │ ← Footer: padding 16px 24px
└─────────────────────────────────────────────┘
```

**قواعد RTL للـ Modal:**
- زر الإغلاق × في الـ Header: **يسار** (في RTL هو inline-start)
- أزرار الـ Footer: الزر الأساسي (التأكيد) **يسار** — الزر الثانوي (إلغاء) يمينه

---

### 7.9 Toast Notifications

**الأنواع:**

| النوع | الأيقونة | اللون | مثال |
|-------|---------|------|-----|
| `success` | `ti-circle-check` | success-500 | "تم إسناد الرحلة بنجاح" |
| `error` | `ti-alert-circle` | danger-500 | "فشل إرسال الفاتورة" |
| `warning` | `ti-alert-triangle` | warning-500 | "انتهاك درجة الحرارة — شاحنة أ ب ج 1234" |
| `info` | `ti-info-circle` | info-500 | "طلب جديد من شركة التميمي" |

**الموضع في RTL:**
- الـ Web Dashboard: **أسفل يسار الشاشة** (في LTR سيكون bottom-right، لكن RTL يعكسه لـ bottom-left)
- الـ Mobile App: **أعلى الشاشة** تحت الـ Status Bar (أفضل للـ UX على الموبايل)

**المواصفات:**
- عرض: 360px (desktop) | 90% عرض الشاشة (mobile)
- animation: تنزلق من الأسفل `slide-up 250ms ease-out`
- auto dismiss: 4 ثواني (success/info) | 7 ثواني (warning/error — تحتاج وقتاً أطول للقراءة)
- يمكن إغلاقها يدوياً بـ ✕

---

### 7.10 Skeleton Loader

نمط loading states لجميع الـ Cards والجداول — يمنع layout shift ويُشعر المستخدم بالتقدم.

**animation:**
```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
.skeleton {
  background: neutral-200;
  border-radius: var(--radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
```

**Skeleton لـ Order Card:**
```
┌─────────────────────────────────────────────┐
│  [██████]  [████████████████]               │ ← عنوان + رقم الطلب
│            [████████████]                   │ ← اسم العميل
│  [████████████████████████████████████]     │ ← عنوان الاستلام
│  [████████████████████████████]             │ ← عنوان التسليم
│  [██████]  [████████]  [██████████]         │ ← metadata row
└─────────────────────────────────────────────┘
```

**القاعدة:** الـ Skeleton يكون دقيقاً — لا يحتاج أن يكون تعقيداً مثل المكوّن الحقيقي، بل يُعطي انطباعاً بالشكل العام.

---

### 7.11 Empty State (حالة فارغة)

تُستخدم عند غياب البيانات — "لا توجد طلبات"، "لا توجد مركبات متاحة".

**الهيكل:**
```
         [أيقونة كبيرة 64px — neutral-300]
         
              عنوان بسيط وصريح
          "لا توجد طلبات حالياً"
          
     وصف ثانوي يشرح السبب أو ماذا تفعل
  "سيظهر هنا طلب الشحن عند إنشائه من العميل"
  
          [زر رئيسي — اختياري]
         "إنشاء طلب جديد +"
```

**الأيقونات المقترحة لحالات الفراغ:**
- لا طلبات: `ti-package-off` (64px، neutral-300)
- لا مركبات متاحة: `ti-truck-off` (64px، neutral-300)
- لا إشعارات: `ti-bell-off` (64px، neutral-300)
- لا نتائج بحث: `ti-search-off` (64px، neutral-300)
- لا سجل صيانة: `ti-tool-off` (64px، neutral-300)

---

### 7.12 Temperature Gauge (مقياس الحرارة — مكوّن Cold Chain)

مكوّن مخصص لعرض درجة الحرارة الحالية مقارنة بالنطاق المسموح.

**الشكل:** شريط أفقي (horizontal range bar) مع مؤشر يتحرك عليه.

```
مجمد           ◄─────────────────────────────────►   ساخن
-30°C          [-18]          [2   8]          [30°C]
                 ←مجمد→        ←مبرد→
                                  ▲
                              [4.2°C]   ← الحرارة الحالية
                             ● طبيعي
```

**الحالات الثلاث:**

**1. طبيعي (Normal):**
- المؤشر داخل النطاق الأخضر
- الرقم باللون success-600
- Badge: `● طبيعي` بخلفية success-100
- لا animation

**2. تحذير (Warning):**
- المؤشر قريب من حدود النطاق (margin 1°C)
- الرقم باللون warning-600
- Badge: `⚠ قريب من الحد` بخلفية warning-100
- خفقان خفيف: `opacity: 0.7 ↔ 1.0` كل ثانيتين

**3. انتهاك (Violation):**
- المؤشر خارج النطاق
- الرقم باللون danger-600 + **خط عريض**
- Badge: `✕ انتهاك — إجراء فوري` بخلفية danger-100
- animation رجفة: `@keyframes shake { 0%, 100% {translateX(0)} 25% {translateX(-4px)} 75% {translateX(4px)} }`
- تُطلق toast notification تلقائياً للمشرف والسائق

**المعلومات المعروضة في المكوّن:**
```
┌─────────────────────────────────────────────────────────┐
│  ❄ مراقبة سلسلة التبريد                                │
│  النطاق المسموح: 2°C – 8°C                             │
│                                                         │
│  [──────────[████████]──────────]                      │ ← الشريط
│               ▲                                         │
│           4.2°C                                         │
│           ● طبيعي                                      │
│                                                         │
│  آخر قراءة: محمد السعيدي — 11:32 ص                    │
│  القراءة التالية المتوقعة: 1:32 م                     │
└─────────────────────────────────────────────────────────┘
```

---

## 8. الأيقونات (Icons)

**المكتبة:** Tabler Icons (Outline variant)  
**السبب:** مفتوحة المصدر، 5700+ أيقونة، نمط outline موحد مناسب للـ Dashboard المهني، Stroke Width 1.5px مقروء بوضوح، تدعم RTL عبر `transform: scaleX(-1)`.

**CDN:**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
```

**الأحجام:**
| الحجم | الاستخدام |
|-------|---------|
| 16px | أيقونات داخل الـ badges، أيقونات inline مع النص |
| 20px | الأيقونة القياسية في الـ buttons والـ inputs |
| 24px | أيقونات الـ Navigation، أيقونات الـ sidebar |
| 32px | أيقونات الـ card headers، marker المركبة على الخريطة |
| 48px | أيقونات التأكيد في الـ modals (نجاح/خطأ) |
| 64px | أيقونات Empty States |

**Stroke Width:** دائماً 1.5px (القيمة الافتراضية في Tabler).

---

### 8.1 أيقونات رئيسية في النظام

| الاستخدام | اسم Tabler |
|---------|-----------|
| طلب شحن جديد | `ti-package` |
| تتبع الشحنة / الموقع | `ti-map-pin` |
| سائق | `ti-steering-wheel` |
| مركبة / شاحنة | `ti-truck` |
| شاحنة توصيل (HiAce) | `ti-van` |
| شاحنة ثقيلة (Volvo) | `ti-truck-delivery` |
| مبرد / Cold Chain | `ti-snowflake` |
| صيانة / ورشة | `ti-tool` |
| فاتورة | `ti-file-invoice` |
| تسليم مكتمل | `ti-circle-check` |
| تحذير | `ti-alert-triangle` |
| خريطة الأسطول | `ti-map` |
| إشعار | `ti-bell` |
| إشعار غير مقروء | `ti-bell-ringing` |
| بحث | `ti-search` |
| فلترة | `ti-filter` |
| تصدير Excel | `ti-table-export` |
| تصدير PDF | `ti-file-type-pdf` |
| الإعدادات | `ti-settings` |
| المستخدم / الملف الشخصي | `ti-user` |
| إضافة | `ti-plus` |
| تعديل | `ti-edit` |
| حذف / إلغاء | `ti-trash` |
| إغلاق | `ti-x` |
| رجوع | `ti-chevron-right` ← يُقلب في RTL |
| توجيه / مسار | `ti-route` |
| قراءة الحرارة | `ti-thermometer` |
| انتهاك الحرارة | `ti-thermometer-plus` |
| لوحة تحكم / KPIs | `ti-layout-dashboard` |
| ترتيب تصاعدي | `ti-sort-ascending` |
| ترتيب تنازلي | `ti-sort-descending` |
| تحديث | `ti-refresh` |
| متصل بالإنترنت | `ti-wifi` |
| غير متصل | `ti-wifi-off` |
| GPS | `ti-gps` |
| توقيع | `ti-signature` |
| كاميرا | `ti-camera` |
| رفع صورة | `ti-photo-up` |
| تقرير | `ti-report` |
| رقم الموظف / ID | `ti-id-badge-2` |
| رقم لوحة المركبة | `ti-license` |
| ضريبة القيمة المضافة | `ti-receipt-tax` |
| حساب مالي | `ti-calculator` |
| وضع Offline | `ti-cloud-off` |

---

### 8.2 قواعد RTL للأيقونات

**الأيقونات التي تنعكس أفقياً في RTL** (`transform: scaleX(-1)`):

| الأيقونة | السبب |
|---------|-------|
| `ti-chevron-right` → تصبح تشير يساراً | زر "رجوع" في RTL يشير يميناً |
| `ti-arrow-right` | اتجاه التنقل معكوس |
| `ti-arrow-left` | اتجاه التنقل معكوس |
| `ti-chevron-left` | |
| `ti-corner-down-right` | |
| `ti-align-left` → يصبح `ti-align-right` | اتجاه النص |
| `ti-indent-increase` | |
| `ti-layout-sidebar-left` → يصبح الـ Sidebar على اليمين | |

**الأيقونات التي لا تنعكس (Universal):**

| الأيقونة | السبب |
|---------|-------|
| `ti-home` | رمز عالمي |
| `ti-settings` | رمز عالمي |
| `ti-user` | رمز عالمي |
| `ti-phone` | رمز عالمي |
| `ti-snowflake` | رمز Cold Chain |
| `ti-truck` | الشاحنة تسير يميناً في العالم كله |
| `ti-package` | بوكس متماثل |
| `ti-map-pin` | رمز موقع جغرافي |
| `ti-bell` | رمز إشعار |
| `ti-search` | رمز بحث عالمي |
| `ti-thermometer` | رمز عالمي |
| `ti-refresh` | دائري |

---

## 9. Motion & Animation

**المبدأ:** الحركة تخدم الوظيفة — لا زخرفة. في بيئة عمليات سريعة، الحركة البطيئة تُزعج.

| الحدث | المدة | Easing | التفاصيل |
|-------|-------|--------|---------|
| Page transition | 200ms | `ease-in-out` | fade-in فقط — لا slide في الـ Dashboard |
| Modal open | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` | scale من 0.95 → 1.0 + fade in |
| Modal close | 150ms | `cubic-bezier(0.4, 0, 1, 1)` | scale من 1.0 → 0.95 + fade out |
| Bottom Sheet (Mobile) open | 300ms | `cubic-bezier(0.0, 0.0, 0.2, 1)` | slide-up من الأسفل |
| Bottom Sheet close | 250ms | `cubic-bezier(0.4, 0.0, 1, 1)` | slide-down للأسفل |
| Toast slide-up | 250ms | `ease-out` | من الأسفل +20px → 0 |
| Toast dismiss | 200ms | `ease-in` | fade-out → translate-down |
| Button press | 100ms | `ease-in` | scale 1.0 → 0.97 |
| Dropdown open | 150ms | `ease-out` | opacity 0 → 1 + translate-y -4 → 0 |
| Skeleton pulse | 1500ms | `ease-in-out` | infinite alternating opacity |
| Map Marker move | 500ms | `ease-in-out` | `LatLng interpolation` سلس |
| Cold Chain shake | 500ms | `ease-in-out` | infinite alternating `translateX(±4px)` |
| Sidebar collapse | 250ms | `ease-in-out` | width 240px → 64px |
| Notification badge | 300ms | `spring` | scale 0 → 1.2 → 1.0 (pop effect) |

**قاعدة Reduce Motion:** يجب احترام `prefers-reduced-motion: reduce` — إلغاء جميع الحركات غير الضرورية للمستخدمين الذين يفضلون ذلك.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. RTL Considerations (اعتبارات الاتجاه)

### 10.1 قواعد Layout

```css
/* استخدام CSS Logical Properties بدلاً من left/right */

/* بدلاً من: */
margin-left: 16px;
padding-right: 24px;
border-left: 3px solid;

/* استخدم: */
margin-inline-start: 16px;
padding-inline-end: 24px;
border-inline-start: 3px solid;
```

**في HTML:**
```html
<html lang="ar" dir="rtl">
```

**في Flutter:**
```dart
MaterialApp(
  locale: const Locale('ar'),
  builder: (context, child) => Directionality(
    textDirection: TextDirection.rtl,
    child: child!,
  ),
)
```

---

### 10.2 الأرقام في RTL

- **الأرقام الغربية (123):** تُكتب LTR داخل النص RTL. هذا هو المعيار المقبول في MENA UX (مرسول، Hungerstation، نون).
- لا نستخدم الأرقام الهندية/العربية (١٢٣) في الواجهة التقنية.
- أرقام الرحلات والـ IDs: LTR دائماً في خط Mono.
- مثال: "الطلب رقم ORD-2026-004521 تم تسليمه في 12:30 م"

---

### 10.3 التواريخ

**الصيغة المعتمدة:** بالتقويم الميلادي بترتيب عربي
- اليوم: `الجمعة، 27 يونيو 2026`
- وقت + تاريخ: `الجمعة 27 يونيو، 11:32 ص`
- مختصر: `27 يون 2026`
- timestamp في الجداول: `27/06/2026 — 11:32`

**ملاحظة SPEC:** لا يوجد دعم للتقويم الهجري في MVP — يُضاف في v2 إذا طُلب.

---

### 10.4 الأسعار والعملة

- الصيغة الرئيسية: `١٢٠ ريال` (أو `١٢٠.٠٠ ريال`)
- الصيغة البديلة المقبولة: `SAR 120.00`
- في الفواتير المطابقة لـ ZATCA: `SAR` حصراً كمعيار دولي
- الضريبة: `٪١٥ ضريبة القيمة المضافة`

---

### 10.5 حقول رقم الجوال

```
الشكل: [+966] [5X XXX XXXX]
        ↑ثابت      ↑ LTR direction
```

رغم أن الصفحة RTL، حقل الجوال يكون `direction: ltr` داخلياً لأن الأرقام تُقرأ من اليسار لليمين.

---

### 10.6 الخريطة في RTL

- الخريطة (Google Maps) نفسها لا تنعكس — إنها بيانات جغرافية
- عناصر الـ UI فوق الخريطة (الأزرار، الفلاتر) تتبع RTL
- الـ Zoom controls: تنتقل من اليمين السفلي (Google default) إلى اليسار السفلي
- نص الـ Popup وبيانات الـ marker: عربي RTL

---

## 11. Breakpoints

| الاسم | min-width | المرجع الحقيقي | الاستخدام |
|-------|----------|--------------|---------|
| `xs` | 320px | أصغر Android | أصغر هواتف مدعومة |
| `sm` (Mobile) | 390px | iPhone 14 Pro | المرجع الأساسي لتطبيق السائق والعميل |
| `md` (Tablet) | 768px | iPad 10th Gen | لا يوجد استخدام رئيسي في MVP |
| `lg` (Desktop) | 1024px | Laptops | Dashboard مضغوط |
| `xl` (Wide) | 1280px | MacBook Pro 14 | Dashboard كامل |
| `2xl` (Full) | 1440px | شاشات Dell 1920×1080 في غرفة العمليات | **المرجع الرئيسي للـ Dashboard** |

**قاعدة Mobile-First:**
```css
/* mobile first */
.component { font-size: 16px; }

/* tablet */
@media (min-width: 768px) { .component { font-size: 15px; } }

/* desktop */
@media (min-width: 1024px) { .component { font-size: 14px; } }
```

**توزيع الشاشات حسب الدور:**
- السائق: sm فقط (390px Mobile)
- العميل: sm + md (Mobile + Tablet)
- المشرف: lg + xl + 2xl (Desktop حصراً)
- المحاسب: lg + xl + 2xl (Desktop حصراً)
- الورشة: lg + xl + 2xl (Desktop حصراً)

---

## 12. Design Tokens (CSS Variables)

```css
:root {
  /* ========================================
     Colors — Primary Blue
     ======================================== */
  --color-primary-50:  #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-300: #93C5FD;
  --color-primary-400: #60A5FA;
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;
  --color-primary-700: #1D4ED8;
  --color-primary-800: #1E40AF;
  --color-primary-900: #1E3A8A;

  /* ========================================
     Colors — Amber (Secondary / Warning)
     ======================================== */
  --color-amber-50:  #FFFBEB;
  --color-amber-100: #FEF3C7;
  --color-amber-200: #FDE68A;
  --color-amber-300: #FCD34D;
  --color-amber-400: #FBBF24;
  --color-amber-500: #F59E0B;
  --color-amber-600: #D97706;
  --color-amber-700: #B45309;
  --color-amber-800: #92400E;
  --color-amber-900: #78350F;

  /* ========================================
     Colors — Neutral
     ======================================== */
  --color-neutral-0:   #FFFFFF;
  --color-neutral-50:  #F9FAFB;
  --color-neutral-100: #F3F4F6;
  --color-neutral-200: #E5E7EB;
  --color-neutral-300: #D1D5DB;
  --color-neutral-400: #9CA3AF;
  --color-neutral-500: #6B7280;
  --color-neutral-600: #4B5563;
  --color-neutral-700: #374151;
  --color-neutral-800: #1F2937;
  --color-neutral-900: #111827;

  /* ========================================
     Colors — Semantic
     ======================================== */
  --color-success-50:  #ECFDF5;
  --color-success-100: #D1FAE5;
  --color-success-500: #10B981;
  --color-success-600: #059669;
  --color-success-700: #047857;

  --color-warning-50:  #FFFBEB;
  --color-warning-100: #FEF3C7;
  --color-warning-500: #F59E0B;
  --color-warning-600: #D97706;
  --color-warning-700: #B45309;

  --color-danger-50:  #FFF5F5;
  --color-danger-100: #FEE2E2;
  --color-danger-500: #EF4444;
  --color-danger-600: #DC2626;
  --color-danger-700: #B91C1C;

  --color-info-50:  #EFF6FF;
  --color-info-100: #DBEAFE;
  --color-info-500: #3B82F6;
  --color-info-600: #2563EB;
  --color-info-700: #1D4ED8;

  /* ========================================
     Semantic Aliases (استخدمها في الـ Code)
     ======================================== */
  --color-bg-page:        var(--color-neutral-50);
  --color-bg-card:        var(--color-neutral-0);
  --color-bg-sidebar:     var(--color-primary-900);
  --color-text-primary:   var(--color-neutral-800);
  --color-text-secondary: var(--color-neutral-500);
  --color-text-disabled:  var(--color-neutral-400);
  --color-border-default: var(--color-neutral-200);
  --color-border-strong:  var(--color-neutral-300);
  --color-action-primary: var(--color-primary-600);
  --color-action-hover:   var(--color-primary-500);
  --color-action-active:  var(--color-primary-700);

  /* ========================================
     Typography
     ======================================== */
  --font-arabic: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif;
  --font-mono:   'JetBrains Mono', 'Courier New', Courier, monospace;

  /* Font Sizes */
  --text-display:  48px;
  --text-h1:       36px;
  --text-h2:       30px;
  --text-h3:       24px;
  --text-h4:       20px;
  --text-h5:       18px;
  --text-body-lg:  18px;
  --text-body:     16px;
  --text-body-md:  15px;
  --text-body-sm:  14px;
  --text-caption:  12px;

  /* Line Heights */
  --leading-display:  56px;
  --leading-h1:       44px;
  --leading-h2:       38px;
  --leading-h3:       32px;
  --leading-h4:       28px;
  --leading-h5:       26px;
  --leading-body-lg:  28px;
  --leading-body:     24px;
  --leading-body-sm:  20px;
  --leading-caption:  16px;

  /* Font Weights */
  --weight-regular:   400;
  --weight-medium:    500;
  --weight-semibold:  600;
  --weight-bold:      700;

  /* ========================================
     Spacing
     ======================================== */
  --space-0:   0px;
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;

  /* ========================================
     Border Radius
     ======================================== */
  --radius-none: 0px;
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  20px;
  --radius-full: 9999px;

  /* ========================================
     Shadows
     ======================================== */
  --shadow-none: none;
  --shadow-xs:   0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm:   0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md:   0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.07), 0 4px 6px rgba(0, 0, 0, 0.04);
  --shadow-xl:   0 20px 25px rgba(0, 0, 0, 0.08), 0 8px 10px rgba(0, 0, 0, 0.04);
  --shadow-2xl:  0 25px 50px rgba(0, 0, 0, 0.12);

  /* ========================================
     Breakpoints (as reference — use in JS too)
     ======================================== */
  --bp-xs:   320px;
  --bp-sm:   390px;
  --bp-md:   768px;
  --bp-lg:   1024px;
  --bp-xl:   1280px;
  --bp-2xl:  1440px;

  /* ========================================
     Sidebar
     ======================================== */
  --sidebar-width:          240px;
  --sidebar-width-collapsed: 64px;
  --sidebar-bg:             var(--color-primary-900);
  --sidebar-text:           #FFFFFF;

  /* ========================================
     Component-specific Tokens
     ======================================== */
  --input-height:      48px;
  --input-height-sm:   36px;
  --btn-height-sm:     32px;
  --btn-height-md:     40px;
  --btn-height-lg:     48px;
  --btn-height-xl:     56px;
  --card-padding-mob:  var(--space-4);
  --card-padding-desk: var(--space-6);
  --nav-bottom-height: 64px;
  --toast-width:       360px;
  --modal-width-sm:    400px;
  --modal-width-md:    560px;
  --modal-width-lg:    720px;
  --modal-width-xl:    960px;

  /* ========================================
     Animation Durations
     ======================================== */
  --duration-instant:  100ms;
  --duration-fast:     150ms;
  --duration-normal:   200ms;
  --duration-moderate: 250ms;
  --duration-slow:     300ms;
  --duration-xslow:    500ms;

  /* Easing */
  --ease-standard:    cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate:  cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-accelerate:  cubic-bezier(0.4, 0.0, 1, 1);

  /* ========================================
     Z-Index Scale
     ======================================== */
  --z-base:       0;
  --z-raised:     10;
  --z-dropdown:   100;
  --z-sticky:     200;
  --z-overlay:    300;
  --z-modal:      400;
  --z-toast:      500;
  --z-tooltip:    600;
}
```

---

## 13. Tailwind Config (للـ Next.js Dashboard)

```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['IBM Plex Sans Arabic', 'sans-serif'],
        mono:   ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        amber: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
      },
      spacing: {
        '18': '72px',
        '22': '88px',
      },
      borderRadius: {
        'xl':  '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
        'modal': '0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04)',
      },
    },
  },
}
```

---

## 14. Flutter Theme (للـ Mobile App)

```dart
// core/theme/app_theme.dart
import 'package:flutter/material.dart';

class EdhamTheme {
  // Primary Colors
  static const Color primary50  = Color(0xFFEFF6FF);
  static const Color primary100 = Color(0xFFDBEAFE);
  static const Color primary600 = Color(0xFF2563EB);
  static const Color primary700 = Color(0xFF1D4ED8);
  static const Color primary900 = Color(0xFF1E3A8A);

  // Semantic Colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger  = Color(0xFFEF4444);
  static const Color info    = Color(0xFF3B82F6);

  // Neutral Colors
  static const Color neutral50  = Color(0xFFF9FAFB);
  static const Color neutral200 = Color(0xFFE5E7EB);
  static const Color neutral400 = Color(0xFF9CA3AF);
  static const Color neutral500 = Color(0xFF6B7280);
  static const Color neutral700 = Color(0xFF374151);
  static const Color neutral800 = Color(0xFF1F2937);

  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    fontFamily: 'IBMPlexSansArabic',
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary600,
      primary: primary600,
      error: danger,
    ),
    textTheme: const TextTheme(
      displayLarge:  TextStyle(fontSize: 48, fontWeight: FontWeight.w700),
      headlineLarge: TextStyle(fontSize: 36, fontWeight: FontWeight.w700),
      headlineMedium:TextStyle(fontSize: 30, fontWeight: FontWeight.w700),
      headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
      titleLarge:    TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
      titleMedium:   TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
      bodyLarge:     TextStyle(fontSize: 18, fontWeight: FontWeight.w400),
      bodyMedium:    TextStyle(fontSize: 16, fontWeight: FontWeight.w400),
      bodySmall:     TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
      labelSmall:    TextStyle(fontSize: 12, fontWeight: FontWeight.w400),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFD1D5DB), width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: primary600, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: danger, width: 2),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary600,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    cardTheme: CardTheme(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
    ),
    scaffoldBackgroundColor: neutral50,
  );
}
```

---

## 15. لا تفعل / افعل (Do's & Don'ts)

| افعل | لا تفعل |
|------|--------|
| اكتب الأزرار والعناوين بـ `font-weight: 600` على الأقل — الخط العربي يبدو أرفع من اللاتيني بنفس الوزن | استخدام font-weight: 400 في الأزرار — سيبدو ضعيفاً جداً |
| اعرض حالة Cold Chain دائماً مرئية للشحنات المبردة — حتى في قائمة الطلبات | إخفاء معلومات درجة الحرارة في تبويب ثانوي — يُخفق في السلامة الغذائية |
| استخدم ألوان الحالة مع نص وصفي دائماً (نص + لون) | الاعتماد على اللون وحده للحالة — عمى الألوان وإمكانية الوصول |
| اكتب الـ placeholder بالعربية الفصيحة الواضحة: "اكتب عنوان الاستلام" | كتابة placeholder بالإنجليزي في نظام عربي بالكامل |
| ضع أيقونة + نص في Bottom Navigation على الموبايل | أيقونة بدون نص في الموبايل — المستخدم الجديد يضيع |
| استخدم حقل ارتفاع 48px للـ Mobile inputs — مناسب للإصبع في القيادة والعمل الميداني | inputs بارتفاع 36px على الموبايل — صعبة الضغط بالإصبع |
| استخدم CSS Logical Properties: `margin-inline-start` بدلاً من `margin-left` | hardcode `left`/`right` في الـ CSS — يكسر RTL |
| اعرض رقم الجوال بـ direction: ltr داخل الحقل حتى في RTL | جعل رقم الجوال RTL — سيظهر معكوساً وغير مقروء |
| اعرض Skeleton Loader فور بدء الطلب — لا loading spinner فارغ | blank white screen أثناء التحميل — يُشعر المستخدم بالتعطل |
| الـ Empty State دائماً: أيقونة + عنوان + تعليمات + زر CTA لو ممكن | صفحة فارغة بدون أي توجيه |
| استخدم `ti-chevron-right` كزر "رجوع" في RTL (يشير يميناً — للخلف في RTL) | استخدام `ti-arrow-left` كزر رجوع في RTL — اتجاه مخالف |
| خصص Marker مختلف الحجم لكل نوع مركبة على الخريطة (HiAce صغير، Volvo كبير) | نفس الـ marker لكل المركبات — يُفقد التمييز البصري |
| أعرض تحذير صيانة مركبة بلون warning-600 إذا كانت خلال 7 أيام | إخفاء تحذير الصيانة حتى اليوم نفسه |
| استخدم JetBrains Mono لأرقام الرحلات ولوحات المركبات ودرجات الحرارة | خط arabic عادي للأرقام المهمة — يصعب مقارنتها بصرياً |
| اعرض badge Cold Chain على كل بطاقة طلب مبرد في قائمة الطلبات | إخفاء معلومة Cold Chain إلا في تفاصيل الطلب |

---

## 16. Accessibility (إمكانية الوصول)

### 16.1 نسب التباين (Contrast Ratios)

يجب أن يستوفي كل نص على خلفية نسبة WCAG AA (4.5:1) على الأقل:

| نص | خلفية | النسبة | المستوى |
|----|--------|--------|--------|
| neutral-800 `#1F2937` على neutral-0 `#FFFFFF` | الأبيض | 14.1:1 | AAA |
| neutral-700 `#374151` على neutral-50 `#F9FAFB` | فاتح | 10.0:1 | AAA |
| white على primary-600 `#2563EB` | أزرار | 4.7:1 | AA |
| white على danger-500 `#EF4444` | أزرار خطر | 4.6:1 | AA |
| danger-700 `#B91C1C` على danger-100 `#FEE2E2` | badges | 5.2:1 | AA |
| success-700 `#047857` على success-100 `#D1FAE5` | badges | 5.7:1 | AA |

### 16.2 Focus States

كل عنصر تفاعلي يجب أن يظهر `focus-visible` واضح:
```css
:focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### 16.3 قواعد إضافية

- جميع الصور الوظيفية لها `alt` بالعربية
- جميع الأيقونات التفاعلية بدون نص لها `aria-label` بالعربية
- نسبة المس الأدنى (Touch Target): 44×44px على الموبايل
- لا تُستخدم الألوان وحدها لنقل المعلومات — دائماً مع نص أو أيقونة

---

## 17. Vehicle Type Icons (أيقونات المركبات)

جدول المطابقة الكاملة بين أنواع المركبات في SPEC.md وتمثيلها البصري:

| vehicle_type في SPEC | الاسم العربي | الأيقونة | الحجم على الخريطة | Badge اللون |
|---------------------|-------------|---------|-----------------|-----------|
| `HIACE_VAN` | فان صغير | `ti-van` | 28×28px | neutral-600 |
| `ISUZU_REFRIGERATED` | شاحنة مبردة | `ti-truck` + `ti-snowflake` | 36×28px | info-600 |
| `VOLVO_FH_HEAVY` | شاحنة ثقيلة | `ti-truck-delivery` | 44×32px | neutral-800 |

---

*آخر تحديث: 2026-06-27 | Senior Product Designer — إدهام للوجستيات*  
*يعتمد على: SPEC.md v1.0 | TECH.md v1.0 | IMAGE_INVENTORY.md (15 صورة)*
