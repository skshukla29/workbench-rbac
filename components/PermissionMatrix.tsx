'use client';

import React from 'react';
import { PERMISSION_MATRIX } from '@/data/permissions';
import { Permission } from '@/types';

interface PermissionMatrixProps {
  selected: Set<Permission>;
  onChange: (permission: Permission, checked: boolean) => void;
  readOnly?: boolean;
}

export function PermissionMatrix({ selected, onChange, readOnly }: PermissionMatrixProps) {
  // Collect all unique action labels across all groups
  const allActionLabels = ['View', 'Create / Invite', 'Edit / Update', 'Delete / Remove', 'Special'];

  return (
    <div className="rounded-xl border border-neutral-700/60 overflow-hidden bg-neutral-900/40">
      <table className="w-full table-fixed border-collapse">
        {/* Column widths: Resource label fixed, each action equal share of remaining */}
        <colgroup>
          <col style={{ width: '140px' }} />
          {PERMISSION_MATRIX[0].actions.map((_, i) => (
            <col key={i} />
          ))}
          {!readOnly && <col style={{ width: '72px' }} />}
        </colgroup>

        {/* ── Table Head ──────────────────────────────────────── */}
        <thead>
          <tr className="bg-neutral-800/70 border-b border-neutral-700/60">
            <th className="px-4 py-3 text-left">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Resource
              </span>
            </th>
            {allActionLabels.map((label) => (
              <th key={label} className="px-2 py-3 text-center">
                <span className="text-xs font-semibold text-neutral-500">{label}</span>
              </th>
            ))}
            {!readOnly && (
              <th className="px-2 py-3 text-center">
                <span className="text-xs font-semibold text-neutral-600">Group</span>
              </th>
            )}
          </tr>
        </thead>

        {/* ── Table Body ──────────────────────────────────────── */}
        <tbody>
          {PERMISSION_MATRIX.map((group, groupIdx) => {
            const groupSelected = group.actions.filter((a) => selected.has(a.permission)).length;
            const allGroupSelected = groupSelected === group.actions.length;
            const someGroupSelected = groupSelected > 0 && !allGroupSelected;
            const isLast = groupIdx === PERMISSION_MATRIX.length - 1;

            // Build a map of action → permission for this group
            const actionMap = new Map(group.actions.map((a) => [a.action, a]));

            // We render a cell per header column; if this group doesn't have that
            // action type, render an empty disabled cell
            const actionKeys = ['view', 'create', 'edit', 'delete', 'special'];

            return (
              <tr
                key={group.resource}
                className={`transition-colors hover:bg-neutral-800/30 ${
                  !isLast ? 'border-b border-neutral-700/40' : ''
                }`}
              >
                {/* Resource label */}
                <td className="px-4 py-3.5">
                  <div>
                    <span className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      {group.label}
                    </span>
                    <span className="block text-[11px] text-neutral-600 font-mono mt-0.5">
                      {group.resource}:*
                    </span>
                  </div>
                </td>

                {/* Action cells — one per action column header */}
                {group.actions.map((action) => {
                  const isChecked = selected.has(action.permission);
                  return (
                    <td key={action.action} className="px-2 py-3.5 text-center">
                      <label
                        className="inline-flex items-center justify-center cursor-pointer group"
                        title={action.permission}
                        id={`perm-${action.permission.replace(':', '-')}`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          disabled={readOnly}
                          onChange={(e) => onChange(action.permission, e.target.checked)}
                          aria-label={`${group.label} ${action.label}`}
                        />
                        <span
                          className={`
                            w-6 h-6 rounded flex items-center justify-center border transition-all duration-150
                            ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                            ${
                              isChecked
                                ? 'bg-violet-600 border-violet-500 shadow-sm shadow-violet-500/30'
                                : readOnly
                                ? 'border-neutral-700 bg-neutral-800'
                                : 'border-neutral-600 bg-neutral-800/60 group-hover:border-violet-500/60 group-hover:bg-violet-500/5'
                            }
                          `}
                        >
                          {isChecked && (
                            <svg
                              viewBox="0 0 10 8"
                              fill="none"
                              className="w-3 h-3"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 4l2.5 2.5L9 1" />
                            </svg>
                          )}
                        </span>
                      </label>
                    </td>
                  );
                })}

                {/* Group toggle button */}
                {!readOnly && (
                  <td className="px-2 py-3.5 text-center">
                    <button
                      onClick={() => {
                        if (allGroupSelected) {
                          group.actions.forEach((a) => onChange(a.permission, false));
                        } else {
                          group.actions.forEach((a) => onChange(a.permission, true));
                        }
                      }}
                      className={`text-[11px] px-2 py-1 rounded font-semibold transition-colors ${
                        allGroupSelected
                          ? 'text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20'
                          : someGroupSelected
                          ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
                          : 'text-neutral-500 hover:text-neutral-300 bg-neutral-700/50 hover:bg-neutral-700'
                      }`}
                      title={allGroupSelected ? 'Deselect all in group' : 'Select all in group'}
                    >
                      {allGroupSelected
                        ? 'All'
                        : someGroupSelected
                        ? `${groupSelected}/${group.actions.length}`
                        : 'None'}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Summary Footer ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-800/40 border-t border-neutral-700/40">
        <span className="text-xs text-neutral-600">
          {selected.size} of 19 permissions selected
        </span>
        <div className="flex gap-4">
          <span className="text-xs text-neutral-600 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-violet-600 inline-block" />
            Granted
          </span>
          <span className="text-xs text-neutral-600 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-neutral-600 inline-block" />
            Not granted
          </span>
        </div>
      </div>
    </div>
  );
}
