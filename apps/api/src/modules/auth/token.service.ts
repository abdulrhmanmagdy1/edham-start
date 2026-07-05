import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import { AuthTokens, JwtPayload, UserRole } from '@edham/shared-types';

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

type IssuedUser = Pick<AuthTokens['user'], 'id' | 'role'>;

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  /**
   * مخزن refresh tokens الصالحة (userId → مجموعة hashes).
   * بديل تطويري لـ Redis (TECH.md §5.1). يُستبدَل بـ Redis في Phase 4 لدعم multi-instance.
   */
  private readonly store = new Map<string, Set<string>>();

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.get<string>('JWT_ACCESS_SECRET', 'dev_access_secret_change_me');
    this.refreshSecret = config.get<string>('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me');
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
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

    this.remember(user.id, refreshToken);
    return { accessToken, refreshToken };
  }

  private remember(userId: string, refreshToken: string): void {
    const set = this.store.get(userId) ?? new Set<string>();
    set.add(this.hash(refreshToken));
    this.store.set(userId, set);
  }

  /** يتحقق من refresh token ويُصدر access جديد (rotation للـ refresh). */
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH', message: 'رمز التجديد غير صالح' });
    }

    const set = this.store.get(payload.sub);
    if (!set?.has(this.hash(refreshToken))) {
      throw new UnauthorizedException({ code: 'REVOKED_REFRESH', message: 'رمز التجديد مُبطَل' });
    }

    set.delete(this.hash(refreshToken)); // rotation: أبطل القديم
    return this.issueTokens({ id: payload.sub, role: payload.role });
  }

  revoke(userId: string, refreshToken: string): void {
    this.store.get(userId)?.delete(this.hash(refreshToken));
  }
}
