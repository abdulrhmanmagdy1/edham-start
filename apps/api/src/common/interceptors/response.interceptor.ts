import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * غلاف الاستجابة الناجحة الموحد (TECH.md §5.5):
 * { success: true, data, meta? }
 * لو الـ handler رجّع كائن فيه `meta`، نفصله عن الـ data.
 */
interface WithMeta {
  data: unknown;
  meta: unknown;
}

function hasMeta(value: unknown): value is WithMeta {
  return (
    typeof value === 'object' &&
    value !== null &&
    'meta' in value &&
    'data' in value
  );
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((payload) => {
        if (hasMeta(payload)) {
          return { success: true, data: payload.data, meta: payload.meta };
        }
        return { success: true, data: payload };
      }),
    );
  }
}
