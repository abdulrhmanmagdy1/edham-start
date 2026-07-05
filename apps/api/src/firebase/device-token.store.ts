import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

const TTL_SECONDS = 60 * 60 * 24 * 60; // 60 يوم

/**
 * مخزن رموز أجهزة FCM (userId → tokens).
 * Redis إن كان مُفعّلاً، وإلا بديل in-memory.
 */
@Injectable()
export class DeviceTokenStore {
  private readonly mem = new Map<string, Set<string>>();

  constructor(private readonly redis: RedisService) {}

  private key(userId: string): string {
    return `device:${userId}`;
  }

  async register(userId: string, token: string): Promise<void> {
    if (this.redis.enabled) {
      await this.redis.sadd(this.key(userId), token, TTL_SECONDS);
      return;
    }
    const set = this.mem.get(userId) ?? new Set<string>();
    set.add(token);
    this.mem.set(userId, set);
  }

  async tokensFor(userId: string): Promise<string[]> {
    if (this.redis.enabled) return this.redis.smembers(this.key(userId));
    return Array.from(this.mem.get(userId) ?? []);
  }

  async remove(userId: string, token: string): Promise<void> {
    if (this.redis.enabled) {
      await this.redis.srem(this.key(userId), token);
      return;
    }
    this.mem.get(userId)?.delete(token);
  }
}
