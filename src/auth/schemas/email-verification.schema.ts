import {
  uuid,
  text,
  timestamp,
  pgTable,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

import { users } from 'src/db/schema';
export const emailVerifications = pgTable('email_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references((): AnyPgColumn => users.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  token: text('token').notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  verified_at: timestamp('verified_at', { withTimezone: true, mode: 'date' }),

  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
});

export type EmailVerificationsType = typeof emailVerifications.$inferSelect;
