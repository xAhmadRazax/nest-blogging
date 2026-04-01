import { uuid, text, timestamp } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { boolean } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { users } from 'src/db/schema';

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    tokenFamily: text('token_family').notNull(),
    tokenHash: text('token_hash').notNull(),
    isUsed: boolean('is_used').default(false).notNull(),
    isRevoked: boolean('is_revoked').default(false).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    // relations
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    replacedBy: uuid('replaced_by').references((): AnyPgColumn => sessions.id, {
      onDelete: 'cascade',
    }),
    // meta info
    ipAddress: text('ip_address'),
    browser: text('browser'),
    os: text('os'),
    platform: text('platform'),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_family_token_idx').on(table.tokenFamily),
  ],
);
export type Sessions = typeof sessions.$inferSelect;
