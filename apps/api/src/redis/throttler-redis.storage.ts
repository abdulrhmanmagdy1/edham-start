import { Injectable } from '@nestjs/common';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { RedisService } from './redis.service';

interface StorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * تخزين rate-limit هجين: Redis عند التوفّر (multi-instance)،
 * وإلا بديل in-memory (ThrottlerStorageService) — TECH.md §5.4.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly memory = new ThrottlerStorageService();

  constructor(private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<StorageRecord> {
    const raw = this.redis.raw;
    if (!raw) {
      return this.memory.increment(key, ttl, limit, blockDuration, throttlerName);
    }

    const rk = `throttle:${throttlerName}:${key}`;
    const totalHits = await raw.incr(rk);
    if (totalHits === 1) await raw.pexpire(rk, ttl);

    let pttl = await raw.pttl(rk);
    if (pttl < 0) {
      await raw.pexpire(rk, ttl);
      pttl = ttl;
    }

    const timeToExpire = Math.ceil(pttl / 1000);
    const isBlocked = totalHits > limit;
    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire: isBlocked ? timeToExpire : 0,
    };
  }
}
