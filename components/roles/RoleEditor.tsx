"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Role, Permission } from '@/types';
import { PermissionMatrix } from '@/components/PermissionMatrix';
import { ALL_PERMISSIONS } from '@/lib/permissions';
import {
  Save,
  AlertCircle,
  PenLine,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  LayoutGrid,
} from 'lucide-react';

interface RoleEditorProps {
  role: Role | null;
  isCreating: boolean;
  onSave: (data: { name: string; description: string; permissions: Permission[] }) => Promise<void>;
  onCancel?: () => void;
  isSaving?: boolean;
}

export function RoleEditor({ role, isCreating, onSave, onCancel, isSaving }: RoleEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<Permission>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Sync state when role changes
  useEffect(() => {
    if (isCreating) {
      setName('');
      setDescription('');
      setSelected(new Set());
      setHasChanges(false);
      setErrors({});
    } else if (role) {
      setName(role.name);
      setDescription(role.description);
      setSelected(new Set(role.permissions));
      setHasChanges(false);
      setErrors({});
    }
  }, [role, isCreating]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  const handleNameChange = (v: string) => {
    setName(v);
    markChanged();
    if (errors.name) setErrors({});
  };

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(permission);
      else next.delete(permission);
      return next;
    });
    markChanged();
  };

  const handleSelectAll = () => {
    setSelected(new Set(ALL_PERMISSIONS));
    markChanged();
  };

  const handleClearAll = () => {
    setSelected(new Set());
    markChanged();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrors({ name: 'Role name is required' });
      return;
    }
    await onSave({
      name: name.trim(),
      description: description.trim(),
      permissions: Array.from(selected),
    });
    setHasChanges(false);
  };

  // Empty state
  if (!role && !isCreating) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4">
          <LayoutGrid className="w-8 h-8 text-neutral-600" />
        </div>
        <h3 className="text-base font-semibold text-neutral-400 mb-1">No Role Selected</h3>
        <p className="text-sm text-neutral-600 max-w-xs leading-relaxed">
          Select a role from the list to edit its permissions, or create a new role.
        </p>
      </div>
    );
  }

  const allSelected = selected.size === ALL_PERMISSIONS.length;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="shrink-0 px-6 py-4 border-b border-neutral-800 bg-neutral-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <PenLine className="w-4 h-4 text-violet-400 shrink-0" />
            <h2 className="text-sm font-semibold text-white truncate">
              {isCreating ? 'Create New Role' : `Edit Role${role ? `: ${role.name}` : ''}`}
            </h2>
            {hasChanges && (
              <span className="shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Unsaved
              </span>
            )}
          </div>
          {onCancel && isCreating && (
            <button
              onClick={onCancel}
              className="shrink-0 ml-4 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable Body ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">

          {/* Role Name */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Role Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Developer, QA Engineer…"
              id="role-name-input"
              className={`
                w-full px-3.5 py-2.5 text-sm bg-neutral-900 border rounded-lg
                text-white placeholder-neutral-600 transition-all duration-150
                focus:outline-none focus:ring-2
                ${
                  errors.name
                    ? 'border-red-500 focus:ring-red-500/30'
                    : 'border-neutral-700 focus:border-violet-500 focus:ring-violet-500/20'
                }
              `}
            />
            {errors.name && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markChanged();
              }}
              placeholder="Briefly describe what this role allows…"
              id="role-description-input"
              rows={2}
              className="w-full px-3.5 py-2.5 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-150 resize-none"
            />
          </div>

          {/* ── Permission Matrix ─────────────────────────────── */}
          <div className="space-y-3">
            {/* Controls row — nowrap keeps buttons on one line */}
            <div className="flex items-center justify-between gap-4 flex-nowrap">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                  Permissions
                </label>
                <p className="text-xs text-neutral-600 mt-0.5 whitespace-nowrap">
                  {selected.size} of 19 granted
                </p>
              </div>
              {/* Buttons always stay on one line */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleClearAll}
                  className="text-xs px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-all whitespace-nowrap"
                >
                  Clear All
                </button>
                <button
                  onClick={handleSelectAll}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    allSelected
                      ? 'text-violet-300 bg-violet-600/20 border border-violet-600/40'
                      : 'text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700'
                  }`}
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  All Permissions
                </button>
              </div>
            </div>

            <PermissionMatrix selected={selected} onChange={handlePermissionChange} />
          </div>

        </div>
      </div>

      {/* ── Sticky Save Footer ─────────────────────────────── */}
      <div className="shrink-0 px-6 py-4 border-t border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-600 truncate">
            {isCreating ? 'New role will be created immediately' : `Editing: ${role?.name}`}
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !hasChanges}
            id="save-role-btn"
            className={`
              ml-auto flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 shrink-0
              ${
                hasChanges && !isSaving
                  ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 active:scale-[0.98]'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-700'
              }
            `}
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isCreating ? 'Create Role' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
