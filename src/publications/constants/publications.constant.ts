import { PermissionType } from '../schemas/permissions.schema';

export const DEFAULT_PERMISSION_ACTIONS = [
  'create',
  'update',
  'delete',
  'publish',
  'invite',
  'remove',
  'rollback',
] as const;
export const DEFAULT_PERMISSION_RESOURCE = [
  'publication',
  'post',
  'comment',
  'member',
] as const;

export const DEFAULT_PERMISSIONS: PermissionType[] = [
  // publications
  { resource: 'publication', action: 'update' },
  { resource: 'publication', action: 'delete' },
  { resource: 'publication', action: 'rollback' },

  // posts
  { resource: 'post', action: 'create' },
  { resource: 'post', action: 'update' },
  { resource: 'post', action: 'delete' },
  { resource: 'post', action: 'publish' },

  // comments
  { resource: 'comment', action: 'create' },
  { resource: 'comment', action: 'update' },
  { resource: 'comment', action: 'delete' },

  // members
  { resource: 'member', action: 'invite' },
  { resource: 'member', action: 'remove' },
  { resource: 'member', action: 'update' },
] as const;

export const DEFAULT_ROLES = [
  {
    name: 'Owner',
    permissions: 'all',
  },
  {
    name: 'Editor',
    permissions: [
      'post:create',
      'post:update',
      'post:delete',
      'post:publish',
      'comment:delete',
    ],
  },
  {
    name: 'Writer',
    permissions: [
      'post:create',
      'post:update',
      'comment:create',
      'comment:update',
    ],
  },
  {
    name: 'Viewer',
    permissions: ['comment:create', 'comment:update'],
  },
] as const;
