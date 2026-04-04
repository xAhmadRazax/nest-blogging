import {
  uuid,
  text,
  timestamp,
  pgTable,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { users } from 'src/db/schema';

export const passwordResets = pgTable('password_resets', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').notNull(),

  userId: uuid('user_id')
    .references((): AnyPgColumn => users.id, {
      onDelete: 'cascade',
    })
    .notNull(),

  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  usedAT: timestamp('used_at', {
    withTimezone: true,
    mode: 'date',
  }),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
});

export type PasswordResetsType = typeof passwordResets.$inferSelect;
