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

export interface EmailConfig {
  apiKey: string;
  fromAddress: string;
  fromName: string;
}

export const emailConfig = registerAs(
  'email',
  (): EmailConfig => ({
    apiKey: process.env.EMAIL_API_KEY!,
    fromAddress: process.env.EMAIL_FROM_ADDRESS!,
    fromName: process.env.EMAIL_FROM_NAME!,
  }),
);
