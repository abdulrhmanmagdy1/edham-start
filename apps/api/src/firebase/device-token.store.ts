import { Injectable } from '@nestjs/common';

/**
 * مخزن رموز أجهزة FCM (userId → tokens).
 * بديل تطويري في الذاكرة — يُستبدَل بجدول/Redis في Phase 4 (deferred-items).
 */
@Injectable()
export class DeviceTokenStore {
  private readonly tokens = new Map<string, Set<string>>();

  register(userId: string, token: string): void {
    const set = this.tokens.get(userId) ?? new Set<string>();
    set.add(token);
    this.tokens.set(userId, set);
  }

  tokensFor(userId: string): string[] {
    return Array.from(this.tokens.get(userId) ?? []);
  }

  remove(userId: string, token: string): void {
    this.tokens.get(userId)?.delete(token);
  }
}
