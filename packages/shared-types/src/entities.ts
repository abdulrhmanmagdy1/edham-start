/**
 * Entities — إدهام للوجستيات
 * تمثيلات TypeScript للكيانات (SPEC §6 + TECH.md §4).
 * التواريخ كـ string (ISO 8601) في نقل الـ API.
 */
import {
  CargoType,
  DriverStatus,
  InvoiceStatus,
  MaintenanceStatus,
  MaintenanceType,
  NotificationType,
  OrderStatus,
  TemperatureCapability,
  TemperatureType,
  TripStatus,
  TripStopStatus,
  UserRole,
  UserStatus,
  VehicleStatus,
  VehicleType,
} from './enums';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  companyName: string;
  commercialRegistrationNumber: string | null;
  vatNumber: string | null;
  contactPersonName: string | null;
  billingAddress: string | null;
  billingEmail: string | null;
  paymentTermsDays: number;
  creditLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  employeeId: string;
  licenseNumber: string;
  licenseExpiry: string;
  assignedVehicleId: string | null;
  status: DriverStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  capacityKg: number;
  temperatureCapability: TemperatureCapability;
  status: VehicleStatus;
  currentDriverId: string | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  registrationExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  cargoType: CargoType;
  cargoWeightKg: number;
  cargoDescription: string | null;
  vehicleTypeRequired: VehicleType;
  coldChainRequired: boolean;
  temperatureType: TemperatureType | null;
  tempMinCelsius: number | null;
  tempMaxCelsius: number | null;
  /** السعر الذي حدده المشرف يدوياً (قبل الضريبة) — يُرسَل للعميل للموافقة */
  quotedPrice: number | null;
  pricingNotes: string | null;
  pricingSentAt: string | null;
  currency: string;
  status: OrderStatus;
  cancellationReason: string | null;
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  orderId: string;
  driverId: string;
  vehicleId: string;
  status: TripStatus;
  estimatedDistanceKm: number | null;
  actualDistanceKm: number | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  totalStops: number;
  recipientName: string | null;
  recipientSignatureUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripStop {
  id: string;
  tripId: string;
  sequenceNumber: number;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  contactName: string | null;
  contactPhone: string | null;
  scheduledArrival: string | null;
  actualArrival: string | null;
  status: TripStopStatus;
  podPhotoUrl: string | null;
  podSignatureUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export interface LocationPoint {
  id: string;
  vehicleId: string;
  tripId: string | null;
  lat: number;
  lng: number;
  accuracyMeters: number | null;
  speedKmh: number | null;
  bearingDegrees: number | null;
  isOfflineSynced: boolean;
  recordedAt: string;
  syncedAt: string | null;
}

export interface TemperatureLog {
  id: string;
  tripId: string;
  driverId: string;
  temperatureCelsius: number;
  isViolation: boolean;
  notes: string | null;
  isOfflineSynced: boolean;
  recordedAt: string;
  syncedAt: string | null;
}

export interface Invoice {
  id: string;
  orderId: string;
  customerId: string;
  invoiceNumber: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  zatcaUuid: string | null;
  zatcaHash: string | null;
  zatcaQr: string | null;
  pdfUrl: string | null;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PricingTier {
  id: string;
  name: string;
  basePricePerKm: number | null;
  basePricePerKg: number | null;
  temperatureSurcharge: number | null;
  minCharge: number | null;
  createdAt: string;
}

export interface ClientPricingOverride {
  id: string;
  clientId: string;
  pricingTierId: string | null;
  customPricePerKm: number | null;
  customPricePerKg: number | null;
  discountPercentage: number | null;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
}

export interface MaintenanceRequest {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  reportedBy: string;
  assignedTo: string | null;
  cost: number | null;
  partsUsed: string | null;
  status: MaintenanceStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}
