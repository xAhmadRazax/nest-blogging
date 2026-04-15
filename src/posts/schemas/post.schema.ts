import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { publications, users } from 'src/db/schema';

export const postStatusEnum = pgEnum('post_status', [
  'draft',
  'published',
  'archived',
]);

// export const postTypeEnum = pgEnum('post_type', [
//   'article',
//   'short',
//   'newsletter',
// ]);

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  publicationId: uuid('publication_id')
    .notNull()
    .references(() => publications.id),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 280 }).notNull(),
  coverImage: text('cover_image'),
  content: jsonb('content'), // ← JSON from Tiptap/Lexical
  excerpt: varchar('excerpt', { length: 500 }),
  status: postStatusEnum('status').default('draft').notNull(),
  //   type: postTypeEnum('type').default('article').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
});

export const postsRelations = relations(posts, ({ one }) => ({
  publication: one(publications, {
    fields: [posts.publicationId],
    references: [publications.id],
  }),
}));
