# لوحة التقدم — Edham Logistics
> آخر تحديث: [يُحدَّث في كل session]

---

## الحالة العامة
- **Phase الحالية:** Phase 0 — لم تبدأ بعد
- **الاكتمال العام:** 0%

---

## Phase 0: Bootstrap & Setup
- [ ] Docker Compose (Postgres + Redis + MinIO)
- [ ] NestJS project scaffold
- [ ] Prisma schema كامل
- [ ] Database migrations
- [ ] Next.js 14 Web App scaffold
- [ ] Flutter project scaffold
- [ ] GitHub repository + CI skeleton
- [ ] Health check endpoint

**Quality Gate:** `docker-compose up` ← لا

---

## Phase 1: Core Backend API
### Auth
- [ ] SMS OTP (Unifonic)
- [ ] JWT tokens
- [ ] RBAC (6 roles)

### Orders
- [ ] Create order
- [ ] Order status machine
- [ ] PATCH /set-price (Supervisor)
- [ ] POST /accept-price (Customer)
- [ ] POST /reject-price (Customer)

### Drivers & Vehicles
- [ ] CRUD endpoints
- [ ] Assignment logic

### Real-time
- [ ] Socket.io setup
- [ ] GPS broadcast
- [ ] Order status updates

### Notifications
- [ ] FCM push
- [ ] Email (pricing)
- [ ] SMS alerts

**Quality Gate:** جميع الـ tests تمر ← لا

---

## Phase 2: Flutter App — الـ 5 أدوار
### Customer Screens
- [ ] Login (OTP)
- [ ] Order creation (4 خطوات)
- [ ] Order summary (بدون سعر)
- [ ] Pending pricing screen
- [ ] Price acceptance/rejection
- [ ] Live GPS tracking
- [ ] Order history + Invoice

### Driver Screens
- [ ] Login (Employee ID + Password)
- [ ] Trip list
- [ ] Active trip + GPS broadcasting
- [ ] Stop confirmation + photos
- [ ] Cold chain temperature
- [ ] Report problem
- [ ] Offline sync (Hive)

### Supervisor Screens
- [ ] Dashboard (KPIs)
- [ ] Orders list + pricing
- [ ] Order details + driver assignment
- [ ] Live map

### Accountant Screens
- [ ] Financial dashboard
- [ ] Invoices + payments

### Workshop Screens
- [ ] Maintenance list + details

**Quality Gate:** Happy path يعمل على Android لكل الـ 5 أدوار ← لا

---

## Phase 3: Web Application — الـ 5 أدوار
### Customer Web Pages
- [ ] Login page
- [ ] Order creation wizard
- [ ] Tracking page
- [ ] History + Invoice

### Driver Web Pages
- [ ] Login page
- [ ] Trip list + active trip
- [ ] Delivery confirmation

### Supervisor Web Pages
- [ ] Dashboard + KPIs
- [ ] Orders management
- [ ] Order details + pricing
- [ ] Live map
- [ ] Fleet + Drivers + Vehicles
- [ ] Users management
- [ ] Reports + Cold chain

### Accountant Web Pages
- [ ] Dashboard + Invoices + Payments

### Workshop Web Pages
- [ ] Maintenance + Schedule

**Quality Gate:** كل الـ 5 أدوار تعمل على Chrome ← لا

---

## Phase 4: Integration Testing
- [ ] Full happy path E2E
- [ ] Pricing flow
- [ ] GPS real-time
- [ ] Load test (50 concurrent)

---

## Phase 5: Launch
- [ ] Google Play deployment
- [ ] App Store deployment
- [ ] Web (Vercel)
- [ ] Production (Railway)

---

## سجل التحديثات
| التاريخ | الخطوة | النتيجة |
|---------|--------|---------|
| — | بداية المشروع | الوثائق جاهزة ✅ |
