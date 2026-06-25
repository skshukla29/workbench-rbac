'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Role, User, Permission } from '@/types';
import { RoleList } from '@/components/roles/RoleList';
import { RoleEditor } from '@/components/roles/RoleEditor';
import { UsersPanel } from '@/components/users/UsersPanel';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import { Layers, RefreshCw } from 'lucide-react';

export default function WorkbenchDashboard() {
  // ─── State ─────────────────────────────────────────────────
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const toast = useToast();

  // ─── Data Fetching ──────────────────────────────────────────

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data: Role[] = await res.json();
      setRoles(data);
      // Keep selected role in sync
      setSelectedRole((prev) => {
        if (!prev) return null;
        return data.find((r) => r.id === prev.id) ?? null;
      });
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setRolesLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data: User[] = await res.json();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [fetchRoles, fetchUsers]);

  // ─── Role Actions ───────────────────────────────────────────

  const handleSelectRole = useCallback((role: Role) => {
    setSelectedRole(role);
    setIsCreating(false);
  }, []);

  const handleCreateRole = useCallback(() => {
    setSelectedRole(null);
    setIsCreating(true);
  }, []);

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
    setSelectedRole(null);
  }, []);

  const handleSaveRole = useCallback(
    async (data: { name: string; description: string; permissions: Permission[] }) => {
      setIsSaving(true);
      try {
        const url = isCreating ? '/api/roles' : `/api/roles/${selectedRole?.id}`;
        const method = isCreating ? 'POST' : 'PUT';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!res.ok) {
          toast.error(
            isCreating ? 'Failed to create role' : 'Failed to save role',
            json.message
          );
          return;
        }

        await fetchRoles();

        if (isCreating) {
          toast.success(`Role "${json.name}" created`, `${json.permissions.length} permissions granted`);
          setIsCreating(false);
          setSelectedRole(json);
        } else {
          toast.success(`Role "${json.name}" updated`);
          setSelectedRole(json);
        }
      } catch {
        toast.error('An unexpected error occurred');
      } finally {
        setIsSaving(false);
      }
    },
    [isCreating, selectedRole, fetchRoles, toast]
  );

  const handleDeleteRole = useCallback((role: Role) => {
    setDeleteTarget(role);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/roles/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();

      if (!res.ok) {
        toast.error('Failed to delete role', json.message);
        return;
      }

      toast.success(`Role "${deleteTarget.name}" deleted`);
      await fetchRoles();
      await fetchUsers(); // users may have lost this role

      if (selectedRole?.id === deleteTarget.id) {
        setSelectedRole(null);
        setIsCreating(false);
      }
    } catch {
      toast.error('Failed to delete role');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, fetchRoles, fetchUsers, selectedRole, toast]);

  // ─── User Actions ───────────────────────────────────────────

  const handleSelectUser = useCallback((user: User | null) => {
    if (user === null) {
      setSelectedUserId(null);
    } else {
      setSelectedUserId((prev) => (prev === user.id ? null : user.id));
    }
  }, []);

  const handleAssignRole = useCallback(
    async (userId: string, roleId: string) => {
      const res = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error('Failed to assign role', json.message);
        return;
      }

      const role = roles.find((r) => r.id === roleId);
      const user = users.find((u) => u.id === userId);
      toast.success(`"${role?.name}" assigned`, `to ${user?.name}`);

      // Update local user state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? json : u))
      );
    },
    [roles, users, toast]
  );

  const handleUnassignRole = useCallback(
    async (userId: string, roleId: string) => {
      const res = await fetch(`/api/users/${userId}/roles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error('Failed to remove role', json.message);
        return;
      }

      const role = roles.find((r) => r.id === roleId);
      const user = users.find((u) => u.id === userId);
      toast.info(`"${role?.name}" removed`, `from ${user?.name}`);

      // Update local user state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? json : u))
      );
    },
    [roles, users, toast]
  );

  const handleCreateUser = useCallback(
    async (name: string, email: string, roleIds: string[]) => {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, roleIds }),
        });

        const json = await res.json();
        if (!res.ok) {
          toast.error('Failed to create user', json.message);
          return false;
        }

        toast.success(`User "${json.name}" created`);
        setUsers((prev) => [...prev, json]);
        return true;
      } catch {
        toast.error('An unexpected error occurred');
        return false;
      }
    },
    [toast]
  );

  const handleUpdateUser = useCallback(
    async (userId: string, name: string, email: string, roleIds: string[]) => {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, roleIds }),
        });

        const json = await res.json();
        if (!res.ok) {
          toast.error('Failed to update user', json.message);
          return false;
        }

        toast.success(`User "${json.name}" updated`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? json : u))
        );
        return true;
      } catch {
        toast.error('An unexpected error occurred');
        return false;
      }
    },
    [toast]
  );

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });

        const json = await res.json();
        if (!res.ok) {
          toast.error('Failed to delete user', json.message);
          return false;
        }

        const user = users.find((u) => u.id === userId);
        toast.success(`User "${user?.name}" deleted`);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        if (selectedUserId === userId) {
          setSelectedUserId(null);
        }
        return true;
      } catch {
        toast.error('An unexpected error occurred');
        return false;
      }
    },
    [users, selectedUserId, toast]
  );

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-neutral-950 overflow-hidden">
      {/* ── Top Nav ─────────────────────────────────────────── */}
      <header className="shrink-0 h-14 flex items-center justify-between px-6 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm z-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight">Workbench</span>
            <span className="ml-2 text-xs text-neutral-500 font-medium">Role Builder</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-neutral-400 font-medium">In-memory store</span>
          </div>
          <button
            onClick={() => { fetchRoles(); fetchUsers(); }}
            className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
            title="Refresh data"
            id="refresh-btn"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Sub Header ──────────────────────────────────────── */}
      <div className="shrink-0 px-6 py-3 border-b border-neutral-800/50 bg-neutral-900/40 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white">Role & Permission Manager</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {roles.length} roles · {users.length} members · 19 total permissions
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs text-neutral-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-violet-600 inline-block" />
            Select role to edit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-blue-600 inline-block" />
            Click user for permissions
          </span>
        </div>
      </div>

      {/* ── Three-Panel Grid Layout ───────────────────────────── */}
      {/*
        Grid columns:
          col 1 – Roles sidebar:  280px fixed
          col 2 – Role Editor:    flex-1 (all remaining space)
          col 3 – Users panel:    460px fixed
        Each column is a self-contained scroll container.
      */}
      <main
        className="flex-1 grid overflow-hidden"
        style={{ gridTemplateColumns: '280px 1fr 460px' }}
      >
        {/* Panel 1: Roles List */}
        <aside
          className="border-r border-neutral-800 bg-neutral-900/60 overflow-hidden flex flex-col min-w-0"
          id="roles-panel"
          aria-label="Roles list"
        >
          <RoleList
            roles={roles}
            selectedRoleId={selectedRole?.id ?? null}
            onSelectRole={handleSelectRole}
            onCreateRole={handleCreateRole}
            onDeleteRole={handleDeleteRole}
            isLoading={rolesLoading}
          />
        </aside>

        {/* Panel 2: Role Editor — gets all flex-1 space */}
        <section
          className="border-r border-neutral-800 bg-neutral-950 overflow-hidden flex flex-col min-w-0"
          id="role-editor-panel"
          aria-label="Role editor"
        >
          <RoleEditor
            role={selectedRole}
            isCreating={isCreating}
            onSave={handleSaveRole}
            onCancel={handleCancelCreate}
            isSaving={isSaving}
          />
        </section>

        {/* Panel 3: Users Panel */}
        <aside
          className="bg-neutral-900/60 overflow-hidden flex flex-col border-l border-neutral-800 min-w-0"
          id="users-panel"
          aria-label="Team members"
        >
          <UsersPanel
            users={users}
            roles={roles}
            selectedUserId={selectedUserId}
            onSelectUser={handleSelectUser}
            onAssignRole={handleAssignRole}
            onUnassignRole={handleUnassignRole}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            isLoading={usersLoading}
          />
        </aside>
      </main>

      {/* ── Delete Confirmation Modal ────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        message={
          deleteTarget?.isSystem
            ? 'This is a system role. Are you sure you want to delete it? All users assigned this role will lose its permissions.'
            : `This will permanently delete the role and remove it from all assigned users. This action cannot be undone.`
        }
        confirmLabel="Delete Role"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
