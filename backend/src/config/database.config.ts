import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  // Railway proporciona DATABASE_URL automáticamente para PostgreSQL
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (databaseUrl) {
    // Configuración para Railway (producción) usando DATABASE_URL
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: configService.get<boolean>('DB_SYNCHRONIZE') || false,
      logging: configService.get<boolean>('DB_LOGGING') || false,
      ssl: {
        rejectUnauthorized: false, // Railway requiere SSL
      },
    };
  }

  // Configuración para desarrollo local usando variables individuales
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST') || 'localhost',
    port: configService.get<number>('DB_PORT') || 5432,
    username: configService.get<string>('DB_USERNAME') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || '',
    database: configService.get<string>('DB_DATABASE') || 'inventory_transfer',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE') || false,
    logging: configService.get<boolean>('DB_LOGGING') || false,
  };
};
