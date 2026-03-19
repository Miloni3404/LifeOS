import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('database.url'),

  // In production use migrations; in dev synchronize is fine
  synchronize: configService.get('app.nodeEnv') !== 'production',
  logging: configService.get('app.nodeEnv') === 'development',

  // SSL required for Supabase
  ssl: {
    rejectUnauthorized: false,
  },

  connectTimeoutMS: 30000,

  extra: {
    max: 5, // fewer connections to avoid Supabase limits
    connectionTimeoutMillis: 30000, // 30s connection timeout
    idleTimeoutMillis: 60000, // 60s idle timeout
    query_timeout: 30000,
    statement_timeout: 30000,
  },

  // Auto-load all entity files
  autoLoadEntities: true,

  // Connection pool settings — important for Supabase
  //   extra: {
  //     max: 10,
  //     connectionTimeoutMillis: 10000,
  //     idleTimeoutMillis: 30000,
  //   },
});
