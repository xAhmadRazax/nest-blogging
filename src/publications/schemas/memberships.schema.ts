import {
  pgTable,
  uuid,
  AnyPgColumn,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import { users } from 'src/db/schema';
import { publications } from './publication.schema';
import { roles } from './roles.schema';
import { relations } from 'drizzle-orm';

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references((): AnyPgColumn => users.id)
    .notNull(),
  isOwner: boolean('is_owner').default(false),
  publicationId: uuid('publication_id')
    .references((): AnyPgColumn => publications.id)
    .notNull(),
  roleId: uuid('role_id')
    .references((): AnyPgColumn => roles.id)
    .notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow(),
});

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  publication: one(publications, {
    fields: [memberships.publicationId],
    references: [publications.id],
  }),
  role: one(roles, {
    fields: [memberships.roleId],
    references: [roles.id],
  }),
}));
