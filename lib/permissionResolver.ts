import { Permission } from '@/types';
import { ALL_PERMISSIONS } from '@/data/permissions';

export function resolveEffectivePermissions(permissionSets: Permission[][]): Permission[] {
  const union = new Set<Permission>();
  for (const set of permissionSets) {
    for (const perm of set) {
      union.add(perm);
    }
  }
  return ALL_PERMISSIONS.filter((p) => union.has(p));
}

export function getPermissionLabel(permission: Permission): string {
  // simple label fallback
  return permission;
}
