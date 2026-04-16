import { uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { publications } from './publication.schema';
import { varchar } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { users } from 'src/db/schema';
import { relations } from 'drizzle-orm';

export const publicationVersions = pgTable('publication_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Reference to the actual publication
  publicationId: uuid('publication_id')
    .references(() => publications.id, { onDelete: 'cascade' })
    .notNull(),

  // Mirrored fields from the original table
  name: varchar('name', { length: 100 }).notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  logo: text(),

  // Metadata for the version
  version: integer('version').notNull(), // Incremental counter
  changedBy: uuid('changed_by').references(() => users.id),
  changeReason: text('change_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const publicationsHistoryRelations = relations(
  publicationVersions,
  ({ one }) => ({
    publicationVersions: one(publications, {
      fields: [publicationVersions.publicationId],
      references: [publications.id],
    }),
  }),
);
