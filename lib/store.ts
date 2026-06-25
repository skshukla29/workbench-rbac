// ============================================================
// Workbench RBAC — In-Memory Data Store
// ============================================================
// This module provides a singleton in-memory store initialized
// with seed data. It survives HMR in dev via global.__store.
// In production, data lives for the lifetime of the server process.
// ============================================================

import { Role, User, Permission } from '@/types';
import { ALL_PERMISSIONS } from '@/data/permissions';
import { resolveEffectivePermissions } from '@/lib/permissionResolver';

// ─── Seed Data ──────────────────────────────────────────────

const SEED_ROLES: Role[] = [
  {
    id: 'role_owner',
    name: 'Owner',
    description: 'Full access to the workspace',
    permissions: [...ALL_PERMISSIONS],
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    isSystem: true,
  },
  {
    id: 'role_admin',
    name: 'Admin',
    description: 'Manages projects, tasks and members',
    permissions: ALL_PERMISSIONS.filter((p) => p !== 'billing:download_invoices'),
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    isSystem: true,
  },
  {
    id: 'role_viewer',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: ['projects:view', 'tasks:view', 'members:view'],
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    isSystem: true,
  },
  {
    id: 'role_contractor',
    name: 'Contractor',
    description: 'External collaborator with limited project access',
    permissions: [
      'projects:view',
      'projects:create',
      'projects:edit',
      'tasks:view',
      'tasks:create',
      'tasks:edit',
      'tasks:assign',
    ],
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    isSystem: true,
  },
];

const SEED_USERS: User[] = [
  {
    id: 'user_alex',
    name: 'Alex Kim',
    initials: 'AK',
    email: 'alex.kim@workbench.io',
    roleIds: ['role_owner', 'role_admin'],
    createdAt: new Date('2024-01-15T00:00:00Z').toISOString(),
    status: 'active',
  },
  {
    id: 'user_priya',
    name: 'Priya Sharma',
    initials: 'PS',
    email: 'priya.sharma@workbench.io',
    roleIds: ['role_contractor'],
    createdAt: new Date('2024-02-01T00:00:00Z').toISOString(),
    status: 'active',
  },
  {
    id: 'user_marcus',
    name: 'Marcus Lee',
    initials: 'ML',
    email: 'marcus.lee@workbench.io',
    roleIds: ['role_viewer'],
    createdAt: new Date('2024-02-10T00:00:00Z').toISOString(),
    status: 'active',
  },
  {
    id: 'user_sara',
    name: 'Sara Torres',
    initials: 'ST',
    email: 'sara.torres@workbench.io',
    roleIds: ['role_admin'],
    createdAt: new Date('2024-03-01T00:00:00Z').toISOString(),
    status: 'active',
  },
];

// ─── Store Singleton ─────────────────────────────────────────

interface Store {
  roles: Map<string, Role>;
  users: Map<string, User>;
}

declare global {
  // eslint-disable-next-line no-var
  var __workbenchStore: Store | undefined;
}

function createStore(): Store {
  const roles = new Map<string, Role>();
  const users = new Map<string, User>();

  for (const role of SEED_ROLES) roles.set(role.id, { ...role });
  for (const user of SEED_USERS) users.set(user.id, { ...user });

  return { roles, users };
}

function getStore(): Store {
  if (!global.__workbenchStore) {
    global.__workbenchStore = createStore();
  }
  return global.__workbenchStore;
}

// ─── ID Generation ───────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Role CRUD ───────────────────────────────────────────────

export function getRoles(): Role[] {
  return Array.from(getStore().roles.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function getRole(id: string): Role | undefined {
  return getStore().roles.get(id);
}

export function createRole(name: string, description: string, permissions: Permission[]): Role {
  const store = getStore();
  const role: Role = {
    id: generateId('role'),
    name: name.trim(),
    description: description.trim(),
    permissions,
    createdAt: new Date().toISOString(),
    isSystem: false,
  };
  store.roles.set(role.id, role);
  return role;
}

export function updateRole(
  id: string,
  updates: { name?: string; description?: string; permissions?: Permission[] }
): Role | null {
  const store = getStore();
  const existing = store.roles.get(id);
  if (!existing) return null;

  const updated: Role = {
    ...existing,
    ...(updates.name !== undefined && { name: updates.name.trim() }),
    ...(updates.description !== undefined && { description: updates.description.trim() }),
    ...(updates.permissions !== undefined && { permissions: updates.permissions }),
  };
  store.roles.set(id, updated);
  return updated;
}

export function deleteRole(id: string): boolean {
  const store = getStore();
  const role = store.roles.get(id);
  if (!role) return false;

  store.roles.delete(id);

  // Remove deleted role from all users
  for (const [userId, user] of store.users.entries()) {
    if (user.roleIds.includes(id)) {
      store.users.set(userId, {
        ...user,
        roleIds: user.roleIds.filter((rid) => rid !== id),
      });
    }
  }
  return true;
}

// ─── User Operations ─────────────────────────────────────────

export function getUsers(): User[] {
  return Array.from(getStore().users.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function getUser(id: string): User | undefined {
  return getStore().users.get(id);
}

export function assignRoleToUser(userId: string, roleId: string): User | null {
  const store = getStore();
  const user = store.users.get(userId);
  if (!user) return null;
  if (!store.roles.has(roleId)) return null;

  if (!user.roleIds.includes(roleId)) {
    const updated = { ...user, roleIds: [...user.roleIds, roleId] };
    store.users.set(userId, updated);
    return updated;
  }
  return user; // already assigned
}

export function unassignRoleFromUser(userId: string, roleId: string): User | null {
  const store = getStore();
  const user = store.users.get(userId);
  if (!user) return null;

  const updated = { ...user, roleIds: user.roleIds.filter((rid) => rid !== roleId) };
  store.users.set(userId, updated);
  return updated;
}

export function getEffectivePermissions(userId: string): Permission[] | null {
  const store = getStore();
  const user = store.users.get(userId);
  if (!user) return null;

  // Collect permission sets for each assigned role
  const permissionSets: Permission[][] = user.roleIds
    .map((rid) => store.roles.get(rid)?.permissions ?? [])
    .filter((p) => p.length > 0);

  // Union across all roles (Set-based deduplication)
  return resolveEffectivePermissions(permissionSets);
}

export function createUser(name: string, email: string, roleIds: string[]): User {
  const store = getStore();
  const id = generateId('user');
  
  const initials = name
    .trim()
    .split(/\s+/)
    .map((word) => word[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const user: User = {
    id,
    name: name.trim(),
    initials: initials || '??',
    email: email.trim().toLowerCase(),
    roleIds,
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  
  store.users.set(id, user);
  return user;
}

export function updateUser(
  id: string,
  updates: { name?: string; email?: string; roleIds?: string[]; status?: 'active' | 'inactive' }
): User | null {
  const store = getStore();
  const existing = store.users.get(id);
  if (!existing) return null;

  let initials = existing.initials;
  if (updates.name !== undefined) {
    initials = updates.name
      .trim()
      .split(/\s+/)
      .map((word) => word[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  const updated: User = {
    ...existing,
    ...(updates.name !== undefined && { name: updates.name.trim(), initials: initials || '??' }),
    ...(updates.email !== undefined && { email: updates.email.trim().toLowerCase() }),
    ...(updates.roleIds !== undefined && { roleIds: updates.roleIds }),
    ...(updates.status !== undefined && { status: updates.status }),
  };
  
  store.users.set(id, updated);
  return updated;
}

export function deleteUser(id: string): boolean {
  const store = getStore();
  return store.users.delete(id);
}
