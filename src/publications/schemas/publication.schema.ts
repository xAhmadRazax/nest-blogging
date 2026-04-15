import { relations } from 'drizzle-orm';
import {
  uuid,
  text,
  varchar,
  timestamp,
  AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { memberships, roles, users } from 'src/db/schema';
import { posts } from 'src/posts/schemas/post.schema';

export const publications = pgTable('publications', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logo: text(),

  owner: uuid('owner')
    .references((): AnyPgColumn => users.id)
    .notNull(),

  version: integer('version').default(1),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
  //    soft deletion
  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export const publicationsRelations = relations(publications, ({ many }) => ({
  posts: many(posts),
  members: many(memberships),
  roles: many(roles),
}));
