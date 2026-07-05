import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * معالج الأخطاء الموحد (TECH.md §5.5):
 * { success: false, error: { code, message, details, timestamp, path } }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'حدث خطأ غير متوقع';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      code = HttpStatus[status] ?? 'ERROR';
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        message =
          typeof body.message === 'string'
            ? body.message
            : Array.isArray(body.message)
              ? (body.message as string[]).join('، ')
              : message;
        if (typeof body.code === 'string') code = body.code;
        if (Array.isArray(body.message)) details = { validation: body.message };
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details: details ?? {},
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
