import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';

const sql = neon(process.env.DB_URI!);

export const db = drizzle(sql, { schema });

export type DB = typeof db;
export type DbTransactionAdapter = TransactionalAdapterDrizzleOrm<typeof db>;
