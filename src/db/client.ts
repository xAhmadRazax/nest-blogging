import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';

const pool = new Pool({ connectionString: process.env.DB_URI });
export const db = drizzle(pool, { schema });

export type DB = typeof db;
export type Transaction = Parameters<Parameters<DB['transaction']>[0]>[0];
export type DbTransactionAdapter = TransactionalAdapterDrizzleOrm<typeof db>;
