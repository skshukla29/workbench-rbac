"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Role, EffectivePermissionsResponse } from '@/types';
import { EffectivePermissions } from '@/components/EffectivePermissions';
import { useToast } from '@/components/Toast';
import {
  Users, ChevronDown, X, Plus, UserCheck, Loader2, Search,
  MoreVertical, Edit3, Trash2, Shield, Mail, AlertTriangle,
  UserPlus, Zap, ChevronRight,
} from 'lucide-react';

interface UsersPanelProps {
  users: User[];
  roles: Role[];
  selectedUserId: string | null;
  onSelectUser: (user: User | null) => void;
  onAssignRole: (userId: string, roleId: string) => Promise<void>;
  onUnassignRole: (userId: string, roleId: string) => Promise<void>;
  onCreateUser: (name: string, email: string, roleIds: string[]) => Promise<boolean>;
  onUpdateUser: (userId: string, name: string, email: string, roleIds: string[]) => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
  isLoading?: boolean;
}

// ─── Colour helpers ───────────────────────────────────────────

const AVATAR_COLORS = [
  'from-violet-600 to-purple-800',
  'from-blue-600 to-cyan-800',
  'from-emerald-600 to-teal-800',
  'from-amber-600 to-orange-800',
  'from-pink-600 to-rose-800',
  'from-indigo-600 to-sky-800',
];

function getAvatarColor(userId: string): string {
  const index = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

const ROLE_BADGE_COLORS = [
  'bg-violet-500/10 text-violet-300 border-violet-500/25',
  'bg-blue-500/10 text-blue-300 border-blue-500/25',
  'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  'bg-amber-500/10 text-amber-300 border-amber-500/25',
  'bg-pink-500/10 text-pink-300 border-pink-500/25',
];

function getRoleBadgeColor(roleId: string): string {
  const index = roleId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ROLE_BADGE_COLORS[index % ROLE_BADGE_COLORS.length];
}

// ─── Effective permissions fetcher ────────────────────────────

function SelectedUserPermissions({ user, roles }: { user: User; roles: Role[] }) {
  const [data, setData] = useState<EffectivePermissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/effective-permissions`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchPerms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPerms, user.roleIds.join(',')]);

  return (
    <EffectivePermissions
      permissions={data?.permissions ?? []}
      userName={user.name}
      roleNames={data?.roleNames ?? []}
      isLoading={loading}
    />
  );
}

// ─── Main component ─────────────────────────────────────────

export function UsersPanel({
  users,
  roles,
  selectedUserId,
  onSelectUser,
  onAssignRole,
  onUnassignRole,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  isLoading,
}: UsersPanelProps) {
  useToast(); // keep hook order stable

  // ── UI state ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]           = useState('');
  const [showThreeDotUserId, setShowThreeDotUserId] = useState<string | null>(null);
  const [assignRoleOpen, setAssignRoleOpen]     = useState(false);

  // ── Modals ──────────────────────────────────────────────────
  const [showAddModal, setShowAddModal]         = useState(false);
  const [editUser, setEditUser]                 = useState<User | null>(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<User | null>(null);
  const [roleToRemove, setRoleToRemove]         = useState<{ user: User; role: Role } | null>(null);

  // ── Add-modal form ──────────────────────────────────────────
  const [newName, setNewName]   = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRoleId, setNewRoleId] = useState('');

  // ── Edit-modal form ─────────────────────────────────────────
  const [editName, setEditName]     = useState('');
  const [editEmail, setEditEmail]   = useState('');
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);

  const [isSaving, setIsSaving]     = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({});

  const dropdownRef  = useRef<HTMLDivElement>(null);
  const drawerRef    = useRef<HTMLDivElement>(null);

  // Default first role when roles load
  useEffect(() => {
    if (roles.length > 0 && !newRoleId) setNewRoleId(roles[0].id);
  }, [roles, newRoleId]);

  // Close assign-role dropdown & three-dot menus on outside click.
  // We do NOT close the drawer here — that is handled separately.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAssignRoleOpen(false);
      }
      if (!(e.target as HTMLElement).closest('.three-dot-trigger')) {
        setShowThreeDotUserId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Handle drawer close (deselect)
  const closeDrawer = useCallback(() => {
    onSelectUser(null);
  }, [onSelectUser]);

  // Close drawer when clicking the backdrop (outside the drawer panel)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        closeDrawer();
      }
    },
    [closeDrawer],
  );

  // ── Validation ──────────────────────────────────────────────
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ── Create handler ──────────────────────────────────────────
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; email?: string } = {};
    if (!newName.trim()) errors.name = 'Full name is required';
    if (!newEmail.trim()) errors.email = 'Email is required';
    else if (!validateEmail(newEmail)) errors.email = 'Please enter a valid email address';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setIsSaving(true);
    const ok = await onCreateUser(newName, newEmail, newRoleId ? [newRoleId] : []);
    setIsSaving(false);
    if (ok) {
      setShowAddModal(false);
      setNewName(''); setNewEmail('');
      if (roles.length > 0) setNewRoleId(roles[0].id);
      setFormErrors({});
    }
  };

  // ── Edit handlers ───────────────────────────────────────────
  const startEditing = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRoleIds(user.roleIds);
    setFormErrors({});
    setShowThreeDotUserId(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    const errors: { name?: string; email?: string } = {};
    if (!editName.trim()) errors.name = 'Full name cannot be empty';
    if (!editEmail.trim()) errors.email = 'Email cannot be empty';
    else if (!validateEmail(editEmail)) errors.email = 'Please enter a valid email address';
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setIsSaving(true);
    const ok = await onUpdateUser(editUser.id, editName, editEmail, editRoleIds);
    setIsSaving(false);
    if (ok) { setEditUser(null); setFormErrors({}); }
  };

  // ── Filtered list ────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;
  const availableRoles = roles.filter(
    (r) => selectedUser && !selectedUser.roleIds.includes(r.id),
  );
  const drawerOpen = !!selectedUser;

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        closeDrawer();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [drawerOpen, closeDrawer]);

  // ─────────────────────────────────────────────────────────────
  return (
    // Outer container — relative so the drawer can float over it
    <div className="relative flex flex-col h-full overflow-hidden bg-neutral-900/10">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="shrink-0 px-5 py-4 border-b border-neutral-800 bg-neutral-900/30 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="text-sm font-semibold text-white truncate">Team Members</span>
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 font-semibold">
              {users.length}
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            id="add-member-btn"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm hover:shadow-violet-500/20 transition-all active:scale-[0.97]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Member
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 focus:border-violet-500 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── User Card List ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 bg-neutral-800/20 border border-neutral-800/40 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-700/60 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-neutral-700/60 rounded w-2/5" />
                  <div className="h-2.5 bg-neutral-700/40 rounded w-3/5" />
                </div>
              </div>
            </div>
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-neutral-800/40 border border-neutral-700/40 flex items-center justify-center mb-4">
              {users.length === 0
                ? <UserPlus className="w-6 h-6 text-neutral-600" />
                : <Search className="w-6 h-6 text-neutral-600" />
              }
            </div>
            <h3 className="text-sm font-semibold text-neutral-300 mb-1">
              {users.length === 0 ? 'No team members yet' : 'No matches found'}
            </h3>
            <p className="text-xs text-neutral-500 max-w-55 leading-relaxed">
              {users.length === 0
                ? 'Add your first team member to start managing permissions.'
                : 'Try adjusting your search query.'}
            </p>
            {users.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-5 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Team Member
              </button>
            )}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isSelected = user.id === selectedUserId;
            const userRoles  = roles.filter((r) => user.roleIds.includes(r.id));
            const uniquePerms = new Set<string>();
            userRoles.forEach((r) => r.permissions.forEach((p) => uniquePerms.add(p)));

            return (
              <div
                key={user.id}
                onClick={() => {
                  if (selectedUserId === user.id) {
                    // Toggle off - close drawer by deselecting
                    closeDrawer();
                  } else {
                    // Toggle on - open drawer or switch to new user
                    onSelectUser(user);
                  }
                }}
                id={`user-card-${user.id}`}
                className={`
                  relative group flex items-center gap-4 px-4 py-3.5 rounded-xl border cursor-pointer
                  transition-all duration-200
                  ${isSelected
                    ? 'border-violet-500/50 bg-violet-950/20 shadow-sm shadow-violet-500/10 ring-1 ring-violet-500/20'
                    : 'border-neutral-800/70 bg-neutral-900/30 hover:border-neutral-700 hover:bg-neutral-800/30'
                  }
                `}
              >
                {/* Avatar */}
                <div
                  className={`shrink-0 w-10 h-10 rounded-full bg-linear-to-br ${getAvatarColor(user.id)} flex items-center justify-center font-bold text-sm text-white shadow-sm ring-1 ring-white/10`}
                >
                  {user.initials}
                </div>

                {/* Name + email + roles */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-semibold truncate transition-colors ${isSelected ? 'text-violet-300' : 'text-white group-hover:text-violet-200'}`}>
                      {user.name}
                    </span>
                    {isSelected && <UserCheck className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                  </div>
                  <span className="text-xs text-neutral-500 truncate block">{user.email}</span>
                  {/* Role badges */}
                  {userRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {userRoles.map((role) => (
                        <span
                          key={role.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getRoleBadgeColor(role.id)}`}
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side: status + perm count + three-dot */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {/* Active badge */}
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold uppercase tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Permission count chip */}
                    <span className="flex items-center gap-1 text-[10px] text-neutral-500">
                      <Shield className="w-3 h-3" />
                      {uniquePerms.size}
                    </span>

                    {/* Three-dot menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowThreeDotUserId(showThreeDotUserId === user.id ? null : user.id);
                        }}
                        className="three-dot-trigger p-1 rounded text-neutral-600 hover:text-neutral-300 hover:bg-neutral-700/60 transition-colors"
                        aria-label="Member options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {showThreeDotUserId === user.id && (
                        <div className="absolute right-0 top-7 z-40 w-36 bg-neutral-900 border border-neutral-700/80 rounded-lg shadow-xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={(e) => startEditing(user, e)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white text-left transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                            Edit Member
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteUserConfirm(user);
                              setShowThreeDotUserId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/30 hover:text-red-300 text-left transition-colors border-t border-neutral-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Member
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Open drawer hint */}
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-all duration-200 ${isSelected ? 'text-violet-400 rotate-90' : 'text-neutral-700 group-hover:text-neutral-500'}`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Details Drawer ────────────────────────────────────── */}
      
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className={`absolute inset-0 z-20 bg-black/40 backdrop-blur-sm transition-opacity duration-250 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className={`absolute top-0 right-0 bottom-0 z-30 w-100 max-w-full bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col overflow-hidden transition-transform duration-250 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Member details drawer"
      >
        {selectedUser && (
          <>
            {/* Drawer Header */}
            <div className="shrink-0 px-6 py-5 border-b border-neutral-800 bg-neutral-900/80">
              <div className="flex items-start justify-between gap-4">
                {/* Avatar + Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`shrink-0 w-14 h-14 rounded-full bg-linear-to-br ${getAvatarColor(selectedUser.id)} flex items-center justify-center text-xl font-bold text-white shadow-lg ring-2 ring-white/10`}
                    >
                      {selectedUser.initials}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-base font-bold text-white truncate">{selectedUser.name}</h2>
                        <span className="shrink-0 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold tracking-wider uppercase">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={closeDrawer}
                  className="shrink-0 p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-6">
                
                {/* Assigned Roles Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-violet-400" />
                      <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Assigned Roles</h3>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-medium">
                      {selectedUser.roleIds.length}
                    </span>
                  </div>

                  {selectedUser.roleIds.length === 0 ? (
                    <p className="text-xs text-neutral-600 py-2">No roles assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.roleIds.map((roleId) => {
                        const role = roles.find((r) => r.id === roleId);
                        return role ? (
                          <div
                            key={roleId}
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{role.name}</p>
                              <p className="text-[10px] text-neutral-500 truncate">{role.permissions.length} permissions</p>
                            </div>
                            <button
                              onClick={async () => {
                                setRoleToRemove({ user: selectedUser, role });
                              }}
                              className="shrink-0 ml-2 p-1 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              aria-label={`Remove ${role.name} role`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {/* Assign Role Dropdown */}
                <div>
                  <div ref={dropdownRef} className="relative">
                    <button
                      onClick={() => setAssignRoleOpen(!assignRoleOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Assign Role
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${assignRoleOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {assignRoleOpen && availableRoles.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-40 mt-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
                        {availableRoles.map((role) => (
                          <button
                            key={role.id}
                            onClick={async () => {
                              setAssignRoleOpen(false);
                              await onAssignRole(selectedUser.id, role.id);
                            }}
                            className="w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white text-left transition-colors border-b border-neutral-800 last:border-b-0"
                          >
                            <div className="font-semibold">{role.name}</div>
                            <div className="text-neutral-500">{role.permissions.length} permissions</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {assignRoleOpen && availableRoles.length === 0 && (
                      <div className="absolute top-full left-0 right-0 z-40 mt-2 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl text-xs text-neutral-500">
                        All roles assigned
                      </div>
                    )}
                  </div>
                </div>

                {/* Effective Permissions */}
                <div>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Effective Permissions</h3>
                  <div className="rounded-lg bg-neutral-800/30 border border-neutral-700/50 overflow-hidden">
                    <SelectedUserPermissions user={selectedUser} roles={roles} />
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
