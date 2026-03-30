import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DB_URI,
    ssl: {
      rejectUnauthorized: Boolean(process.env.DB_REJECT_UNAUTH),
    },
    synchronize: Boolean(process.env.DB_SYNC ?? false),
  }),
);
