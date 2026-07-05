/**
 * DTOs + API envelope — إدهام للوجستيات
 * عقود الطلب/الاستجابة بين Backend وكل Frontend (api-contracts.md).
 */
import { CargoType, OrderStatus, TemperatureType, UserRole, VehicleType } from './enums';
import { Order, User } from './entities';

/** غلاف الاستجابة الموحد — TECH.md §5.5 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    path: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Auth ──
export interface SendOtpRequest {
  phone: string;
}

export interface SendOtpResponse {
  success: boolean;
  expiresIn: number;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface LoginRequest {
  identifier: string; // employeeId أو email
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshRequest {
  refreshToken: string;
}

// ── Orders ──
export interface AddressDto {
  address: string;
  lat: number;
  lng: number;
}

export interface StopDto {
  sequenceNumber: number;
  address: string;
  city?: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactPhone?: string;
  scheduledArrival?: string;
}

export interface CreateOrderRequest {
  pickup: AddressDto;
  stops: StopDto[];
  vehicleTypeRequired: VehicleType;
  cargoType: CargoType;
  cargoWeightKg: number;
  cargoDescription?: string;
  coldChainRequired: boolean;
  temperatureType?: TemperatureType;
  scheduledAt: string; // ISO 8601
}

/** المشرف يحدد السعر يدوياً — لا حساب تلقائي (PRE-001) */
export interface SetPriceRequest {
  quotedPrice: number;
  pricingNotes?: string;
}

export interface OrderResponse {
  order: Order;
}

// ── Query params ──
export interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  customerId?: string;
  vehicleType?: VehicleType;
  temperatureType?: TemperatureType;
  from?: string;
  to?: string;
}

export interface JwtPayload {
  sub: string; // userId
  role: UserRole;
  iat?: number;
  exp?: number;
}
