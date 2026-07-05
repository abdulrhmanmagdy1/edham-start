/**
 * Enums — إدهام للوجستيات
 * مطابقة تماماً لـ PostgreSQL Native Enums في TECH.md §4.3
 * لا تُغيَّر بدون تحديث Prisma schema + migration
 */

/** أدوار المستخدمين — SPEC §2 (5 أدوار) */
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  SUPERVISOR = 'SUPERVISOR',
  ACCOUNTANT = 'ACCOUNTANT',
  WORKSHOP = 'WORKSHOP',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/** أنواع المركبات — SPEC §5.1 */
export enum VehicleType {
  HIACE_VAN = 'HIACE_VAN',
  ISUZU_REFRIGERATED = 'ISUZU_REFRIGERATED',
  VOLVO_FH_HEAVY = 'VOLVO_FH_HEAVY',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  ON_TRIP = 'ON_TRIP',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

/** نوعان فقط من التبريد — مبرد أو مجمد (Q9) */
export enum TemperatureType {
  REFRIGERATED = 'REFRIGERATED',
  FROZEN = 'FROZEN',
}

/** قدرة التبريد للمركبة — يجب أن تتوافق مع TemperatureType للطلب */
export enum TemperatureCapability {
  REFRIGERATED = 'REFRIGERATED',
  FROZEN = 'FROZEN',
  BOTH = 'BOTH',
}

export enum CargoType {
  DRY = 'DRY',
  CHILLED = 'CHILLED',
  FROZEN = 'FROZEN',
  HAZARDOUS = 'HAZARDOUS',
}

/**
 * دورة حياة الطلب — SPEC §4 Feature 1
 * PENDING_PRICING: العميل أرسل، ينتظر المشرف يحدد السعر
 * PRICED: المشرف حدد السعر وأرسله بالإيميل، ينتظر موافقة العميل
 * CUSTOMER_CONFIRMED: العميل وافق، جاهز للإسناد
 */
export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING_PRICING = 'PENDING_PRICING',
  PRICED = 'PRICED',
  CUSTOMER_CONFIRMED = 'CUSTOMER_CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  LOADING = 'LOADING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** السائق لا يرفض — لا PENDING_ACCEPTANCE (Q10). AT_STOP للتوقف متعدد النقاط (Q11) */
export enum TripStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  AT_STOP = 'AT_STOP',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TripStopStatus {
  PENDING = 'PENDING',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum MaintenanceType {
  ROUTINE = 'ROUTINE',
  EMERGENCY = 'EMERGENCY',
  INSPECTION = 'INSPECTION',
}

export enum MaintenanceStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DriverStatus {
  AVAILABLE = 'AVAILABLE',
  ON_TRIP = 'ON_TRIP',
  OFF_DUTY = 'OFF_DUTY',
  SUSPENDED = 'SUSPENDED',
}

export enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  TRIP_ASSIGNED = 'TRIP_ASSIGNED',
  COLD_CHAIN_ALERT = 'COLD_CHAIN_ALERT',
  MAINTENANCE_REMINDER = 'MAINTENANCE_REMINDER',
  PAYMENT_DUE = 'PAYMENT_DUE',
  PRICE_SENT = 'PRICE_SENT',
  PRICE_ACCEPTED = 'PRICE_ACCEPTED',
  PRICE_REJECTED = 'PRICE_REJECTED',
  SYSTEM = 'SYSTEM',
}
