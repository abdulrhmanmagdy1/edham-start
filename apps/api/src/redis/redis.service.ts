import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * غلاف Redis (ioredis). محميّ: لو REDIS_URL غير مضبوط أو تعذّر الاتصال →
 * `enabled = false` وتُستخدم بدائل in-memory في الخدمات المعتمدة.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('⚠️ REDIS_URL غير مضبوط — Redis معطّل (بدائل in-memory)');
      return;
    }
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 2,
        enableOfflineQueue: false,
        lazyConnect: false,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
      });
      this.client.on('ready', () => this.logger.log('✅ Redis متصل'));
      this.client.on('error', (err) => this.logger.warn(`⚠️ Redis error: ${err.message}`));
    } catch (error) {
      this.logger.warn(`⚠️ تعذّر إنشاء Redis — معطّل: ${String(error)}`);
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => undefined);
  }

  get enabled(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  /** يُتاح للخدمات التي تحتاج عمليات مخصّصة. null لو معطّل. */
  get raw(): Redis | null {
    return this.enabled ? this.client : null;
  }

  async sadd(key: string, member: string, ttlSeconds?: number): Promise<void> {
    if (!this.raw) return;
    await this.raw.sadd(key, member);
    if (ttlSeconds) await this.raw.expire(key, ttlSeconds);
  }

  async srem(key: string, member: string): Promise<void> {
    await this.raw?.srem(key, member);
  }

  async del(key: string): Promise<void> {
    await this.raw?.del(key);
  }

  async smembers(key: string): Promise<string[]> {
    return this.raw ? this.raw.smembers(key) : [];
  }

  async sismember(key: string, member: string): Promise<boolean> {
    if (!this.raw) return false;
    return (await this.raw.sismember(key, member)) === 1;
  }
}
