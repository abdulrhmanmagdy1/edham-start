import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { AuditService } from './audit.service';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MUTATIONS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
// موارد لا تُدقَّق (ضجيج/حساسية): GPS عالي التردد، مصادقة (قبل تسجيل الدخول)، صحة النظام
const SKIP_RESOURCES = new Set(['locations', 'auth', 'health', 'notifications']);
const SENSITIVE_KEYS = new Set(['password', 'newPassword', 'otp', 'token', 'refreshToken', 'passwordHash']);

interface HttpRequestLike {
  method: string;
  originalUrl?: string;
  url: string;
  params?: Record<string, string>;
  body?: Record<string, unknown>;
  user?: AuthenticatedUser;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}

/** يسجّل كل عملية تعديل (POST/PATCH/PUT/DELETE) ناجحة على الموارد الحساسة في audit_logs. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<HttpRequestLike>();
    if (!MUTATIONS.has(req.method)) return next.handle();

    const resource = AuditInterceptor.resourceOf(req);
    if (!resource || SKIP_RESOURCES.has(resource)) return next.handle();

    return next.handle().pipe(
      tap((result) => {
        void this.audit.record({
          userId: req.user?.sub ?? null,
          action: `${req.method} ${resource}`,
          entityType: resource.toUpperCase(),
          entityId: AuditInterceptor.entityIdOf(req, result),
          newValues: AuditInterceptor.sanitize(req.body),
          ipAddress: req.ip ?? null,
          userAgent: AuditInterceptor.headerStr(req.headers['user-agent']),
        });
      }),
    );
  }

  /** المورد = أول مقطع بعد /api/v1. */
  private static resourceOf(req: HttpRequestLike): string | null {
    const path = (req.originalUrl ?? req.url).split('?')[0];
    const segments = path.split('/').filter(Boolean);
    const idx = segments.findIndex((s) => s === 'v1');
    const resource = idx >= 0 ? segments[idx + 1] : segments[0];
    return resource ?? null;
  }

  private static entityIdOf(req: HttpRequestLike, result: unknown): string {
    const paramId = req.params?.id;
    if (paramId && UUID_RE.test(paramId)) return paramId;
    const fromResult = AuditInterceptor.extractId(result);
    return fromResult ?? NIL_UUID;
  }

  private static extractId(result: unknown): string | null {
    if (!result || typeof result !== 'object') return null;
    const obj = result as Record<string, unknown>;
    const direct = obj.id;
    if (typeof direct === 'string' && UUID_RE.test(direct)) return direct;
    const data = obj.data;
    if (data && typeof data === 'object') {
      const nested = (data as Record<string, unknown>).id;
      if (typeof nested === 'string' && UUID_RE.test(nested)) return nested;
    }
    return null;
  }

  private static sanitize(body: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      out[k] = SENSITIVE_KEYS.has(k) ? '***' : v;
    }
    return out;
  }

  private static headerStr(v: string | string[] | undefined): string | null {
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  }
}
