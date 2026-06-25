'use client';

import React from 'react';
import { Permission } from '@/types';
import { PERMISSION_MATRIX, getResourceLabel } from '@/data/permissions';
import { ShieldCheck, Zap } from 'lucide-react';

interface EffectivePermissionsProps {
  permissions: Permission[];
  userName: string;
  roleNames: string[];
  isLoading?: boolean;
}

const RESOURCE_COLORS: Record<string, string> = {
  projects: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  tasks:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  members:  'bg-violet-500/15 text-violet-300 border-violet-500/25',
  billing:  'bg-amber-500/15 text-amber-300 border-amber-500/25',
  settings: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
};

const RESOURCE_LABELS: Record<string, string> = {
  projects: 'Projects',
  tasks:    'Tasks',
  members:  'Members',
  billing:  'Billing',
  settings: 'Settings',
};

export function EffectivePermissions({
  permissions,
  userName,
  roleNames,
  isLoading,
}: EffectivePermissionsProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-3 bg-neutral-700 rounded w-1/2" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 bg-neutral-700 rounded-full w-24" />
          ))}
        </div>
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="p-4 text-center">
        <ShieldCheck className="w-6 h-6 text-neutral-600 mx-auto mb-1.5" />
        <p className="text-xs text-neutral-500">No effective permissions</p>
        <p className="text-xs text-neutral-600 mt-0.5">Assign roles to grant access</p>
      </div>
    );
  }

  // Group permissions by resource
  const grouped = PERMISSION_MATRIX.reduce<Record<string, Permission[]>>((acc, group) => {
    const groupPerms = group.actions
      .map((a) => a.permission)
      .filter((p) => permissions.includes(p));
    if (groupPerms.length > 0) {
      acc[group.resource] = groupPerms;
    }
    return acc;
  }, {});

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-neutral-300">Effective Permissions</span>
        </div>
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-neutral-700 text-neutral-400 font-medium">
          {permissions.length} / 19
        </span>
      </div>

      {/* Union source note */}
      {roleNames.length > 1 && (
        <p className="text-xs text-neutral-600 leading-relaxed">
          Union of{' '}
          {roleNames.map((name, i) => (
            <span key={name}>
              <span className="text-neutral-400 font-medium">{name}</span>
              {i < roleNames.length - 1 ? ' + ' : ''}
            </span>
          ))}
        </p>
      )}

      {/* Permission chips grouped by resource */}
      <div className="space-y-2.5">
        {Object.entries(grouped).map(([resource, perms]) => (
          <div key={resource}>
            <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
              {RESOURCE_LABELS[resource] ?? resource}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {perms.map((perm) => {
                const action = perm.split(':')[1];
                const colorClass = RESOURCE_COLORS[resource] ?? 'bg-neutral-700 text-neutral-400 border-neutral-600';
                return (
                  <span
                    key={perm}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium ${colorClass}`}
                    title={perm}
                  >
                    {action.replace(/_/g, ' ')}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
