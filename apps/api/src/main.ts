import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  // كل الـ endpoints تحت /api/v1 (TECH.md §5)
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // غلاف الاستجابة الموحد + معالج الأخطاء (TECH.md §5.5)
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Railway/المضيفات تحقن PORT؛ محلياً نستخدم API_PORT
  const port = config.get<number>('PORT') ?? config.get<number>('API_PORT', 3001);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.warn(`🚚 إدهام API يعمل على http://localhost:${port}/api/v1`);
}

void bootstrap();
