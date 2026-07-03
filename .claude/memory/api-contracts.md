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
*[يُكمَّل هذا الملف بواسطة Backend Agent في Phase 1]*
