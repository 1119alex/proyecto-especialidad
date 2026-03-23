import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // CORS
  const corsOrigin = configService.get('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin === '*' ? '*' : (corsOrigin?.split(',').map(o => o.trim()) || '*'),
    credentials: configService.get<boolean>('CORS_CREDENTIALS') || true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`
  🚀 Aplicación iniciada en: http://localhost:${port}
  📝 API Prefix: /${apiPrefix}
  🌍 Endpoint completo: http://localhost:${port}/${apiPrefix}
  `);
}
bootstrap();
