# عقود الـ API — API Contracts

> هذا الملف هو العقد الرسمي بين Backend وكل Frontend.
> Backend Agent يكتب هنا. Mobile Agent + Web Agent يلتزمان به.
> أي تعديل → يُوثَّق هنا أولاً.

---

## الـ Base URL
```
Development: http://localhost:3000/api/v1
Staging: https://api-staging.edham.sa/api/v1
Production: https://api.edham.sa/api/v1
```

## الـ Auth
```
Header: Authorization: Bearer <JWT_ACCESS_TOKEN>
Refresh: POST /auth/refresh { refreshToken }
```

---

## Auth Endpoints

### POST /auth/send-otp
**Request:** `{ phone: string }`
**Response:** `{ success: boolean, expiresIn: number }`

### POST /auth/verify-otp
**Request:** `{ phone: string, otp: string }`
**Response:** `{ accessToken: string, refreshToken: string, user: UserDto }`

---

## Orders Endpoints

### POST /orders
**Role:** CUSTOMER
**Request:**
```typescript
{
  pickupAddress: AddressDto,
  stops: StopDto[],
  vehicleType: VehicleType,
  cargoType: string,
  weight: number,
  temperature?: { min: number, max: number },
  scheduledAt: string // ISO 8601
}
```
**Response:** `{ order: OrderDto }` — status: PENDING_PRICING

### PATCH /orders/:id/set-price
**Role:** SUPERVISOR
**Request:**
```typescript
{
  quotedPrice: number,
  pricingNotes?: string
}
```
**Response:** `{ order: OrderDto }` — status: PRICED
**Side Effect:** Email يُرسل لـ billing_email للعميل

### POST /orders/:id/accept-price
**Role:** CUSTOMER
**Response:** `{ order: OrderDto }` — status: CUSTOMER_CONFIRMED

### POST /orders/:id/reject-price
**Role:** CUSTOMER
**Response:** `{ order: OrderDto }` — status: CANCELLED

---

## DTOs الأساسية

### OrderDto
```typescript
{
  id: string,
  status: OrderStatus,
  quotedPrice: number | null,
  pricingSentAt: string | null,
  createdAt: string,
  // ... (يكتمل بواسطة Backend Agent)
}
```

---

## Real-time Events (Socket.io)

### Client → Server
- `driver:location` `{ lat, lng, heading, speed }`

### Server → Client
- `order:status-changed` `{ orderId, newStatus }`
- `order:price-received` `{ orderId, quotedPrice, expiresAt }`
- `driver:location-updated` `{ driverId, lat, lng }`

---

## Notification Types
```
PRICE_SENT       — عميل يستقبل عرض السعر
PRICE_ACCEPTED   — مشرف يُبلَّغ بالقبول
PRICE_REJECTED   — مشرف يُبلَّغ بالرفض
TRIP_ASSIGNED    — سائق يستقبل رحلة جديدة
TRIP_STARTED     — عميل يُبلَّغ ببدء الشحن
DELIVERED        — عميل يُبلَّغ بالتسليم
```

---

## ✅ حالة التنفيذ — Phase 1 (2026-07-05)

### مُنفَّذ فعلياً (build + boot + unit tests ✅)
**Auth** (`/api/v1/auth`):
- `POST /send-otp` — CUSTOMER. ينشئ حساب shell للرقم الجديد، OTP 6 أرقام صلاحية 10د، rate-limit 5/ساعة.
- `POST /verify-otp` — تحقق + إصدار توكنات (rate-limit 10/ساعة).
- `POST /login` — موظفون (email أو employeeId + password، bcrypt، rate-limit 20/15د).
- `POST /refresh` — تجديد access (مع rotation للـ refresh).
- `POST /logout` — إبطال refresh (JwtAuthGuard).
- `GET /me` — بيانات المستخدم (JwtAuthGuard).

**JWT TTL (TECH §5.1):** Access 1h سائق / 15m البقية. Refresh 30d سائق+عميل / 8h البقية.
**RBAC:** `JwtAuthGuard` + `RolesGuard` + `@Roles(...)` + `@CurrentUser()`.

**Users** (`/api/v1/users`):
- `POST /` — SUPERVISOR ينشئ موظفاً (DRIVER ينشئ Driver profile تلقائياً).

**Orders** (`/api/v1/orders`):
- `POST /` — CUSTOMER. ينشئ طلباً + order_stops، status = PENDING_PRICING. delivery_* = آخر محطة.
- `GET /` — SUPERVISOR,ACCOUNTANT (pagination + فلاتر: status/customerId/vehicleType/temperatureType/from/to).
- `GET /my` — CUSTOMER.
- `GET /:id` — SUPERVISOR,ACCOUNTANT,CUSTOMER(مالك),DRIVER(مُسنَد) — resource auth.
- `PATCH /:id/status` — SUPERVISOR (يُتحقَّق بآلة الحالة).

**فلو التسعير (PRE-001):**
- `PATCH /:id/set-price` — SUPERVISOR. PENDING_PRICING→PRICED فقط + email + إشعار PRICE_SENT.
- `POST /:id/accept-price` — CUSTOMER(مالك). PRICED→CUSTOMER_CONFIRMED + إشعار المشرفين.
- `POST /:id/reject-price` — CUSTOMER(مالك). PRICED→CANCELLED + إشعار المشرفين.

**آلة حالة الطلب:** DRAFT→PENDING_PRICING→PRICED→CUSTOMER_CONFIRMED→ASSIGNED→LOADING→IN_TRANSIT→DELIVERED→COMPLETED؛ إلغاء حتى LOADING؛ لا إلغاء بعد IN_TRANSIT.

### مؤجَّل (يحتاج DB حيّة — BLK-001)
- تشغيل الفلو end-to-end فعلياً (create/accept/reject) — الكود جاهز، ينتظر Postgres.
- Unifonic SMS + SendGrid Email + FCM — stubs تسجّل في اللوج (المفاتيح فارغة).
- Refresh store حالياً in-memory (يُستبدَل بـ Redis في Phase 4).

### لم يُبنَ بعد (Phase 1 متبقٍّ / Phase لاحقة)
- Drivers/Vehicles CRUD + الإسناد (assign) + Socket.io GPS + Invoices.
