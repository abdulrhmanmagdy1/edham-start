import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // يقرأ .env من جذر الـ monorepo أو من apps/api
      envFilePath: ['.env', '../../.env'],
    }),
    // Rate limiting افتراضي عام (TECH.md §5.4) — 100 طلب/دقيقة
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
