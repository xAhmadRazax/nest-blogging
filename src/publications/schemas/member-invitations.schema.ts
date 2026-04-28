import { pgTable, uuid, text, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { publications } from './publication.schema';
import { roles, users } from 'src/db/schema';
import { relations } from 'drizzle-orm';

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'rejected',
  'expired',
]);

export const memberInvitations = pgTable('member-invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  publicationId: uuid('publication_id')
    .notNull()
    .references(() => publications.id),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id),
  token: text('token').notNull().unique(), // sent in email
  status: invitationStatusEnum('status').default('pending'),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow(),
});

export const memberInvitationRelations = relations(
  memberInvitations,
  ({ one }) => ({
    user: one(users, {
      fields: [memberInvitations.userId],
      references: [users.id],
    }),
    publication: one(publications, {
      fields: [memberInvitations.publicationId],
      references: [publications.id],
    }),
    role: one(roles, {
      fields: [memberInvitations.roleId],
      references: [roles.id],
    }),
  }),
);
