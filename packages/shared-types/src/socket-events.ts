/**
 * Real-time Events (Socket.io) — api-contracts.md
 * أسماء الأحداث ثابتة بين Backend والـ Frontends.
 */

export const SOCKET_EVENTS = {
  // Client → Server
  DRIVER_LOCATION: 'driver:location',
  // Server → Client
  ORDER_STATUS_CHANGED: 'order:status-changed',
  ORDER_PRICE_RECEIVED: 'order:price-received',
  DRIVER_LOCATION_UPDATED: 'driver:location-updated',
  COLD_CHAIN_ALERT: 'cold-chain:alert',
} as const;

export interface DriverLocationPayload {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

export interface OrderStatusChangedPayload {
  orderId: string;
  newStatus: string;
}

export interface OrderPriceReceivedPayload {
  orderId: string;
  quotedPrice: number;
  expiresAt?: string;
}

export interface DriverLocationUpdatedPayload {
  driverId: string;
  lat: number;
  lng: number;
}
