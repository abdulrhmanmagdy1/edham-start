import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  DriverLocationPayload,
  JwtPayload,
  SOCKET_EVENTS,
  UserRole,
} from '@edham/shared-types';

/**
 * Gateway الوقت الحقيقي (SPEC Feature 3):
 * - مصادقة عبر JWT في handshake.auth.token.
 * - غرف: user:{id} لكل مستخدم، supervisors لغرفة العمليات.
 * - يبث مواقع السائقين للمشرفين، وتغييرات الحالة للعميل المعني.
 */
@WebSocketGateway({ cors: { origin: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
      });
      client.data.user = { sub: payload.sub, role: payload.role };
      client.join(`user:${payload.sub}`);
      if (payload.role === UserRole.SUPERVISOR) client.join('supervisors');
      this.logger.log(`🔌 اتصل ${payload.role} (${payload.sub})`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data.user as { sub: string } | undefined;
    if (user) this.logger.log(`🔌 انفصل ${user.sub}`);
  }

  /** السائق يبث موقعه (DRIVER فقط) → للمشرفين + غرفة الطلب لو مُرفقة. */
  @SubscribeMessage(SOCKET_EVENTS.DRIVER_LOCATION)
  handleDriverLocation(client: Socket, payload: DriverLocationPayload): void {
    const user = client.data.user as { sub: string; role: UserRole } | undefined;
    if (!user || user.role !== UserRole.DRIVER) return;
    this.emitDriverLocation(user.sub, payload.lat, payload.lng);
  }

  // ── دوال البث (تستدعيها الخدمات الأخرى) ──

  emitOrderStatusChanged(customerUserId: string, orderId: string, newStatus: string): void {
    const payload = { orderId, newStatus };
    this.server?.to(`user:${customerUserId}`).emit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, payload);
    this.server?.to('supervisors').emit(SOCKET_EVENTS.ORDER_STATUS_CHANGED, payload);
  }

  emitPriceReceived(customerUserId: string, orderId: string, quotedPrice: number): void {
    this.server
      ?.to(`user:${customerUserId}`)
      .emit(SOCKET_EVENTS.ORDER_PRICE_RECEIVED, { orderId, quotedPrice });
  }

  emitDriverLocation(driverId: string, lat: number, lng: number): void {
    this.server?.to('supervisors').emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATED, { driverId, lat, lng });
  }

  emitColdChainAlert(customerUserId: string | null, orderId: string, temperature: number): void {
    const payload = { orderId, temperature };
    this.server?.to('supervisors').emit(SOCKET_EVENTS.COLD_CHAIN_ALERT, payload);
    if (customerUserId) {
      this.server?.to(`user:${customerUserId}`).emit(SOCKET_EVENTS.COLD_CHAIN_ALERT, payload);
    }
  }
}
