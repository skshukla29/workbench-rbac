// ============================================================
// Workbench RBAC — Type Definitions
// ============================================================

/** All 19 permission strings in resource:action format */
export type Permission =
  // Projects
  | 'projects:view'
  | 'projects:create'
  | 'projects:edit'
  | 'projects:delete'
  | 'projects:archive'
  // Tasks
  | 'tasks:view'
  | 'tasks:create'
  | 'tasks:edit'
  | 'tasks:delete'
  | 'tasks:assign'
  // Members
  | 'members:view'
  | 'members:invite'
  | 'members:remove'
  | 'members:update_role'
  // Billing
  | 'billing:view'
  | 'billing:update'
  | 'billing:download_invoices'
  // Settings
  | 'settings:view'
  | 'settings:update';

/** Grouped permission definition for the matrix UI */
export interface PermissionGroup {
  resource: string;
  label: string;
  actions: PermissionAction[];
}

export interface PermissionAction {
  action: string;
  label: string;
  permission: Permission;
}

/** A role in the system */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  isSystem?: boolean; // Seed roles are protected from deletion
}

/** A user in the system */
export interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  roleIds: string[];
  createdAt: string;
  status: 'active' | 'inactive';
}

/** API response shape for effective permissions */
export interface EffectivePermissionsResponse {
  userId: string;
  userName: string;
  roleIds: string[];
  roleNames: string[];
  permissions: Permission[];
}

/** API error response */
export interface ApiError {
  error: string;
  message: string;
}

/** Toast notification */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

/** Create role payload */
export interface CreateRolePayload {
  name: string;
  description: string;
  permissions: Permission[];
}

/** Update role payload */
export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: Permission[];
}

/** Assign role payload */
export interface AssignRolePayload {
  roleId: string;
}

/** Unassign role payload */
export interface UnassignRolePayload {
  roleId: string;
}
