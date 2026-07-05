import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — يدير الاتصال بقاعدة البيانات + Soft Delete (TECH.md §4.4).
 * الجداول التي تطبق soft delete عبر deleted_at: users, orders, vehicles.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private static readonly SOFT_DELETE_MODELS = ['User', 'Order', 'Vehicle'];

  constructor() {
    super({ log: ['warn', 'error'] });
    this.registerSoftDeleteMiddleware();
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Prisma متصل بقاعدة البيانات');
    } catch (error) {
      // لا نُسقط الـ boot لو DB غير متاحة — الـ health يعكس الحالة
      this.logger.warn(`⚠️ تعذّر الاتصال بقاعدة البيانات عند الإقلاع: ${String(error)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private registerSoftDeleteMiddleware(): void {
    this.$use(async (params, next) => {
      const model = params.model ?? '';
      if (!PrismaService.SOFT_DELETE_MODELS.includes(model)) {
        return next(params);
      }

      // delete → update deleted_at
      if (params.action === 'delete') {
        params.action = 'update';
        params.args = params.args ?? {};
        params.args.data = { deletedAt: new Date() };
      }
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        params.args = params.args ?? {};
        params.args.data = { ...(params.args.data ?? {}), deletedAt: new Date() };
      }

      // إخفاء المحذوف من القراءات الافتراضية
      if (params.action === 'findMany' || params.action === 'findFirst') {
        params.args = params.args ?? {};
        if (!params.args.where) params.args.where = {};
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null;
        }
      }

      return next(params);
    });
  }
}
