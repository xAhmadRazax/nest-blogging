import { uuid, AnyPgColumn, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { roles } from './roles.schema';
import { permissions } from './permissions.schema';
import { relations } from 'drizzle-orm';

export const rolesPermissions = pgTable(
  'roles-permission',
  {
    roleId: uuid()
      .references((): AnyPgColumn => roles.id)
      .notNull(),
    permissionId: uuid()
      .references((): AnyPgColumn => permissions.id)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.roleId, table.permissionId],
    }),
  }),
);

export const rolesPermissionsRelations = relations(
  rolesPermissions,
  ({ one }) => ({
    rolePermissions: one(roles, {
      fields: [rolesPermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolesPermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);
