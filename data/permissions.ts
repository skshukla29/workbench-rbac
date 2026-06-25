// Permission matrix moved to data for clearer separation of static data
import { Permission, PermissionGroup } from '@/types';

export const PERMISSION_MATRIX: PermissionGroup[] = [
  {
    resource: 'projects',
    label: 'Projects',
    actions: [
      { action: 'view',    label: 'View',    permission: 'projects:view' },
      { action: 'create',  label: 'Create',  permission: 'projects:create' },
      { action: 'edit',    label: 'Edit',    permission: 'projects:edit' },
      { action: 'delete',  label: 'Delete',  permission: 'projects:delete' },
      { action: 'archive', label: 'Archive', permission: 'projects:archive' },
    ],
  },
  {
    resource: 'tasks',
    label: 'Tasks',
    actions: [
      { action: 'view',   label: 'View',   permission: 'tasks:view' },
      { action: 'create', label: 'Create', permission: 'tasks:create' },
      { action: 'edit',   label: 'Edit',   permission: 'tasks:edit' },
      { action: 'delete', label: 'Delete', permission: 'tasks:delete' },
      { action: 'assign', label: 'Assign', permission: 'tasks:assign' },
    ],
  },
  {
    resource: 'members',
    label: 'Members',
    actions: [
      { action: 'view',        label: 'View',        permission: 'members:view' },
      { action: 'invite',      label: 'Invite',      permission: 'members:invite' },
      { action: 'remove',      label: 'Remove',      permission: 'members:remove' },
      { action: 'update_role', label: 'Update Role', permission: 'members:update_role' },
    ],
  },
  {
    resource: 'billing',
    label: 'Billing',
    actions: [
      { action: 'view',              label: 'View',               permission: 'billing:view' },
      { action: 'update',            label: 'Update',             permission: 'billing:update' },
      { action: 'download_invoices', label: 'Download Invoices',  permission: 'billing:download_invoices' },
    ],
  },
  {
    resource: 'settings',
    label: 'Settings',
    actions: [
      { action: 'view',   label: 'View',   permission: 'settings:view' },
      { action: 'update', label: 'Update', permission: 'settings:update' },
    ],
  },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_MATRIX.flatMap(
  (group) => group.actions.map((a) => a.permission)
);

export function getResourceLabel(permission: Permission): string {
  const resource = permission.split(':')[0];
  const group = PERMISSION_MATRIX.find((item) => item.resource === resource);
  return group?.label ?? resource;
}
