// ============================================================
// Workbench RBAC — Permission Matrix Definition
// ============================================================

import { Permission, PermissionGroup } from '@/types';

/** Complete permission matrix grouped by resource */
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

/** Flat array of all 19 permissions */
export const ALL_PERMISSIONS: Permission[] = PERMISSION_MATRIX.flatMap(
  (group) => group.actions.map((a) => a.permission)
);

/** Resolve effective permissions for a set of permissions arrays using SET UNION */
export function resolveEffectivePermissions(permissionSets: Permission[][]): Permission[] {
  const union = new Set<Permission>();
  for (const set of permissionSets) {
    for (const perm of set) {
      union.add(perm);
    }
  }
  // Return in matrix order for consistent display
  return ALL_PERMISSIONS.filter((p) => union.has(p));
}

/** Get the label for a permission string */
export function getPermissionLabel(permission: Permission): string {
  for (const group of PERMISSION_MATRIX) {
    const action = group.actions.find((a) => a.permission === permission);
    if (action) return `${group.label}: ${action.label}`;
  }
  return permission;
}

/** Get the resource label for a permission */
export function getResourceLabel(permission: Permission): string {
  const resource = permission.split(':')[0];
  return PERMISSION_MATRIX.find((g) => g.resource === resource)?.label ?? resource;
}
