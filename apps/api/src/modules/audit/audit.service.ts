import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AuditEntry {
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  newValues?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditQuery {
  page: number;
  limit: number;
  entityType?: string;
  userId?: string;
  action?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** كتابة سجل تدقيق (فشل الكتابة لا يعطّل الطلب). */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          newValues:
            entry.newValues === undefined
              ? undefined
              : (entry.newValues as Prisma.InputJsonValue),
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`تعذّر كتابة سجل التدقيق: ${String(err)}`);
    }
  }

  /** قراءة سجلات التدقيق (المشرف) مع فلترة + ترقيم. */
  async findAll(query: AuditQuery): Promise<{
    data: Record<string, unknown>[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { user: { select: { fullName: true, role: true } } },
      }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        actor: r.user ? { fullName: r.user.fullName, role: r.user.role } : null,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        newValues: r.newValues,
        ipAddress: r.ipAddress,
        timestamp: r.timestamp.toISOString(),
      })),
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }
}
