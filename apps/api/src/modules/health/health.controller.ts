import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface HealthResponse {
  status: 'ok';
  service: string;
  db: 'up' | 'down';
  timestamp: string;
}

/**
 * GET /api/v1/health — Phase 0 Quality Gate.
 * يرجع 200 دائماً طالما الـ API حيّ؛ حقل db يعكس حالة الاتصال بقاعدة البيانات.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthResponse> {
    let db: 'up' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'up';
    } catch {
      db = 'down';
    }
    return {
      status: 'ok',
      service: 'edham-api',
      db,
      timestamp: new Date().toISOString(),
    };
  }
}
