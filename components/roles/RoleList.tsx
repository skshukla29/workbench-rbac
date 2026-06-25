"use client";

import React, { useState, useMemo } from 'react';
import { Role } from '@/types';
import { Search, Plus, ShieldCheck, Trash2, ChevronRight, Shield } from 'lucide-react';

interface RoleListProps {
  roles: Role[];
  selectedRoleId: string | null;
  onSelectRole: (role: Role) => void;
  onCreateRole: () => void;
  onDeleteRole: (role: Role) => void;
  isLoading?: boolean;
}

const ROLE_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-600',
];

function getRoleColor(roleId: string): string {
  const index = roleId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ROLE_COLORS[index % ROLE_COLORS.length];
}

export function RoleList({
  roles,
  selectedRoleId,
  onSelectRole,
  onCreateRole,
  onDeleteRole,
  isLoading,
}: RoleListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [roles, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Roles</h2>
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-neutral-700 text-neutral-400 font-medium">
              {roles.length}
            </span>
          </div>
          <button
            onClick={onCreateRole}
            id="create-role-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all duration-150 hover:shadow-lg hover:shadow-violet-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New Role
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..."
            id="role-search-input"
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
        </div>
      </div>

      {/* Role List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg p-3 bg-neutral-800/50 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-neutral-700 rounded w-3/4" />
                  <div className="h-2 bg-neutral-700/60 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Shield className="w-8 h-8 text-neutral-600 mb-2" />
            <p className="text-sm text-neutral-500">
              {search ? 'No roles match your search' : 'No roles yet'}
            </p>
            {!search && (
              <button
                onClick={onCreateRole}
                className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2"
              >
                Create your first role
              </button>
            )}
          </div>
        ) : (
          filtered.map((role) => {
            const isSelected = role.id === selectedRoleId;
            const color = getRoleColor(role.id);

            return (
              <div
                key={role.id}
                onClick={() => onSelectRole(role)}
                id={`role-card-${role.id}`}
                className={`
                  group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer
                  transition-all duration-150 border
                  ${
                    isSelected
                      ? 'bg-violet-600/15 border-violet-500/40 shadow-sm'
                      : 'bg-neutral-800/50 border-transparent hover:bg-neutral-800 hover:border-neutral-700'
                  }
                `}
              >
                {/* Color Avatar */}
                <div
                  className={`shrink-0 w-8 h-8 rounded-lg bg-linear-to-br ${color} flex items-center justify-center shadow-sm`}
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {role.name}
                    </span>
                    {role.isSystem && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-400 font-medium shrink-0">
                        System
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-500 truncate">
                      {role.description || 'No description'}
                    </span>
                  </div>
                </div>

                {/* Permission Badge + Arrow */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-violet-500/30 text-violet-300'
                        : 'bg-neutral-700 text-neutral-400'
                    }`}
                  >
                    {role.permissions.length}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-opacity ${
                      isSelected ? 'text-violet-400 opacity-100' : 'text-neutral-600 opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </div>

                {/* Delete button — only visible on hover for non-system roles */}
                {!role.isSystem && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRole(role);
                    }}
                    id={`delete-role-${role.id}`}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all duration-150"
                    aria-label={`Delete role ${role.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
