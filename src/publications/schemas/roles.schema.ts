import { uuid, text, timestamp, AnyPgColumn } from 'drizzle-orm/pg-core';
// import { boolean } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { publications } from './publication.schema';
import { relations } from 'drizzle-orm';
import { rolesPermissions } from './roles-permissions.schema';

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  //   isOwner: boolean('is_owner').default(false),
  name: text('name').notNull(),
  publicationId: uuid('publication_id')
    .references((): AnyPgColumn => publications.id)
    .notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
});

export const rolesRelations = relations(roles, ({ many, one }) => ({
  rolePermissions: many(rolesPermissions),
  publication: one(publications, {
    fields: [roles.publicationId],
    references: [publications.id],
  }),
}));
