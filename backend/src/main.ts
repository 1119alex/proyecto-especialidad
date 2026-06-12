import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Cabeceras de seguridad HTTP
  app.use(helmet());

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // CORS: con CORS_ORIGIN definido se restringe a esa lista de dominios.
  // Sin definir (o '*') se refleja el origen de la petición — válido para
  // desarrollo; en producción debe configurarse CORS_ORIGIN.
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  if (corsOrigin && corsOrigin !== '*') {
    app.enableCors({
      origin: corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    });
  } else {
    app.enableCors({ origin: true });
    logger.warn(
      'CORS_ORIGIN no configurado: se acepta cualquier origen (solo recomendado en desarrollo)',
    );
  }

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

  logger.log(`Aplicación iniciada en el puerto ${port} (prefijo /${apiPrefix})`);
}
bootstrap();
