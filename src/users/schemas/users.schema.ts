import {
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgTable,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid(`id`).defaultRandom().primaryKey(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  username: varchar('username', { length: 254 }).notNull(),
  hashedPassword: varchar('hashed_password').notNull(),

  avatar: text('text'),

  //   meta info
  isVerified: boolean('is_verified').default(false),
  passwordChangedAt: timestamp('password_changed_at', {
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

export type User = typeof users.$inferSelect;

export type PublicUser = Omit<User, 'hashedPassword' | 'passwordChangedAt'>;
