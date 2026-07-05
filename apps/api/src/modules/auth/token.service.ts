import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import { AuthTokens, JwtPayload, UserRole } from '@edham/shared-types';
import { RedisService } from '../../redis/redis.service';

/**
 * TTLs حسب الدور (TECH.md §5.1):
 * - Access: 1h للسائق، 15m للبقية.
 * - Refresh: 30d للسائق والعميل، 8h للمشرف/المحاسب/الورشة.
 */
const ACCESS_TTL: Record<UserRole, string> = {
  [UserRole.DRIVER]: '1h',
  [UserRole.CUSTOMER]: '15m',
  [UserRole.SUPERVISOR]: '15m',
  [UserRole.ACCOUNTANT]: '15m',
  [UserRole.WORKSHOP]: '15m',
};

const REFRESH_TTL: Record<UserRole, string> = {
  [UserRole.DRIVER]: '30d',
  [UserRole.CUSTOMER]: '30d',
  [UserRole.SUPERVISOR]: '8h',
  [UserRole.ACCOUNTANT]: '8h',
  [UserRole.WORKSHOP]: '8h',
};

const REFRESH_TTL_SECONDS: Record<UserRole, number> = {
  [UserRole.DRIVER]: 60 * 60 * 24 * 30,
  [UserRole.CUSTOMER]: 60 * 60 * 24 * 30,
  [UserRole.SUPERVISOR]: 60 * 60 * 8,
  [UserRole.ACCOUNTANT]: 60 * 60 * 8,
  [UserRole.WORKSHOP]: 60 * 60 * 8,
};

type IssuedUser = Pick<AuthTokens['user'], 'id' | 'role'>;

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  /** بديل in-memory لمخزن refresh tokens عند تعطّل Redis. */
  private readonly mem = new Map<string, Set<string>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.accessSecret = config.get<string>('JWT_ACCESS_SECRET', 'dev_access_secret_change_me');
    this.refreshSecret = config.get<string>('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me');
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private key(userId: string): string {
    return `refresh:${userId}`;
  }

  async issueTokens(user: IssuedUser): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { sub: user.id, role: user.role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: ACCESS_TTL[user.role],
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: REFRESH_TTL[user.role],
    });

    await this.remember(user.id, user.role, refreshToken);
    return { accessToken, refreshToken };
  }

  private async remember(userId: string, role: UserRole, refreshToken: string): Promise<void> {
    const h = this.hash(refreshToken);
    if (this.redis.enabled) {
      await this.redis.sadd(this.key(userId), h, REFRESH_TTL_SECONDS[role]);
      return;
    }
    const set = this.mem.get(userId) ?? new Set<string>();
    set.add(h);
    this.mem.set(userId, set);
  }

  private async isKnown(userId: string, h: string): Promise<boolean> {
    if (this.redis.enabled) return this.redis.sismember(this.key(userId), h);
    return this.mem.get(userId)?.has(h) ?? false;
  }

  private async forget(userId: string, h: string): Promise<void> {
    if (this.redis.enabled) {
      await this.redis.srem(this.key(userId), h);
      return;
    }
    this.mem.get(userId)?.delete(h);
  }

  /** يتحقق من refresh token ويُصدر access جديد (rotation للـ refresh). */
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH', message: 'رمز التجديد غير صالح' });
    }

    const h = this.hash(refreshToken);
    if (!(await this.isKnown(payload.sub, h))) {
      throw new UnauthorizedException({ code: 'REVOKED_REFRESH', message: 'رمز التجديد مُبطَل' });
    }

    await this.forget(payload.sub, h); // rotation: أبطل القديم
    return this.issueTokens({ id: payload.sub, role: payload.role });
  }

  async revoke(userId: string, refreshToken: string): Promise<void> {
    await this.forget(userId, this.hash(refreshToken));
  }
}
