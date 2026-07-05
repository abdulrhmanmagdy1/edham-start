'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from './config';
import { tokenStore } from './tokens';

/** أحداث الخادم → العميل. */
export const SOCKET_EVENTS = {
  orderStatusChanged: 'order:status-changed',
  orderPriceReceived: 'order:price-received',
  driverLocationUpdated: 'driver:location-updated',
  coldChainAlert: 'cold-chain:alert',
} as const;

export interface OrderStatusChangedPayload {
  orderId: string;
  newStatus: string;
}

export interface OrderPriceReceivedPayload {
  orderId: string;
  quotedPrice: number;
}

export interface DriverLocationUpdatedPayload {
  driverId: string;
  lat: number;
  lng: number;
}

export interface ColdChainAlertPayload {
  orderId: string;
  temperature: number;
}

type EventHandler = (payload: unknown) => void;

let socket: Socket | null = null;

/**
 * سوكِت مفرد (singleton) متصل بالتوكن الحالي مع إعادة اتصال تلقائية.
 * يعيد null لو لا يوجد توكن (لا يتصل).
 */
export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = tokenStore.access;
  if (!token) return null;

  if (socket) return socket;

  try {
    socket = io(config.socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });
    socket.on('connect_error', (err: Error) => {
      console.warn('[realtime] فشل الاتصال بالسوكِت:', err.message);
    });
  } catch (err: unknown) {
    console.warn('[realtime] تعذّر إنشاء السوكِت:', err);
    socket = null;
    return null;
  }

  return socket;
}

export interface UseRealtimeOptions {
  /** يُستدعى عند تغيّر حالة الاتصال (connect/disconnect). */
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * hook يشترك في أحداث الخادم ويُلغي الاشتراك عند unmount.
 * يُعيد استخدام السوكِت المفرد. آمن لو غاب التوكن أو فشل السوكِت.
 */
export function useRealtime(
  handlers: Partial<Record<string, EventHandler>>,
  options: UseRealtimeOptions = {},
): void {
  // مراجع تحفظ أحدث النسخ لتفادي إعادة الاشتراك عند كل render (stale closure).
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const connectionRef = useRef(options.onConnectionChange);
  connectionRef.current = options.onConnectionChange;

  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    // مستمعون ثابتون يفوّضون للنسخة الأحدث من كل handler.
    const events = Object.keys(handlersRef.current);
    const listeners: Record<string, EventHandler> = {};
    for (const event of events) {
      const listener: EventHandler = (payload) => handlersRef.current[event]?.(payload);
      listeners[event] = listener;
      s.on(event, listener);
    }

    const handleConnect = (): void => connectionRef.current?.(true);
    const handleDisconnect = (): void => connectionRef.current?.(false);
    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);
    if (s.connected) connectionRef.current?.(true);

    return () => {
      for (const event of events) {
        const listener = listeners[event];
        if (listener) s.off(event, listener);
      }
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
