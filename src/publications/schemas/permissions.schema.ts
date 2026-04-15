import { pgTable, uuid, pgEnum } from 'drizzle-orm/pg-core';
import {
  DEFAULT_PERMISSION_ACTIONS,
  DEFAULT_PERMISSION_RESOURCE,
} from '../constants/publications.constant';
import { relations } from 'drizzle-orm';
import { rolesPermissions } from './roles-permissions.schema';

export const actionEnum = pgEnum('action', DEFAULT_PERMISSION_ACTIONS);
export const resourceEnum = pgEnum('resource', DEFAULT_PERMISSION_RESOURCE);

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  action: actionEnum('action').notNull(),
  resource: resourceEnum('resource').notNull(),
});

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolesPermissions: many(rolesPermissions),
}));
