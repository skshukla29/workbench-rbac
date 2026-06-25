# Architecture — Workbench Role & Permission Builder

## Overview

Workbench RBAC is a single-page admin dashboard built for managing roles, permissions, and team member access. It runs entirely as a Next.js 15 application with an in-memory data store — no external services required.

---

## Technology Decisions

### Why Next.js 15 (App Router)?

Next.js gives us full-stack capability in a single repository:

- **Route Handlers** (`app/api/**`) eliminate the need for a separate Express/Fastify server. The API lives alongside the UI — same repo, same deploy, same TypeScript types.
- **App Router** enables per-component streaming, nested layouts, and `async` Server Components for future extensibility.
- **`'use client'`** boundaries are explicit — every component that touches browser state (React hooks, event handlers) declares this, while the rest can be static or server-rendered.
- **Turbopack** (dev only) gives sub-100ms HMR for tight feedback loops.

### Why Tailwind CSS?

- **Colocation** — styles live with the component, not in a separate `.css` file. This makes components portable and self-documenting.
- **Constraint system** — Tailwind's spacing, color, and typography scales enforce visual consistency without a custom design system.
- **Dark mode** — `bg-neutral-*` / `text-neutral-*` scales make building a sophisticated dark theme trivial.
- **No runtime** — Tailwind is statically extracted at build time with zero JS overhead.

### Why In-Memory Store?

The assignment spec explicitly prohibits a database. The in-memory store:

- Uses a **Node.js global singleton** (`global.__workbenchStore`) so it survives hot-module reloads in development without losing data.
- Is **pre-seeded** on first access with the 4 required roles and 4 required users.
- Is **server-side only** — all mutations go through Route Handlers, giving us a real HTTP API boundary even without a database.
- In production, state persists for the lifetime of the server process (acceptable for an assignment/demo environment).

### Why No Redux / Zustand?

The data dependency graph is shallow:

- `roles` array → rendered in `RoleList`, `RoleEditor`, `UsersPanel`
- `users` array → rendered in `UsersPanel`

React `useState` at the page level + `useCallback` handlers passed as props is sufficient. Adding a global state manager would introduce indirection without benefit at this scale.

---

## Permission Resolution Strategy

### Union (Additive) Model

Effective permissions for a user are the **mathematical union** of all permissions granted by their assigned roles.

```
User: Alex Kim
  Role A (Owner): { projects:view, projects:create, ..., billing:download_invoices, ... }  [all 19]
  Role B (Admin):  { projects:view, ..., billing:update }                                   [18]

Effective = UNION(Owner, Admin)
          = Set { all 19 permissions }
          = 19 unique permissions
```

**Another example (from spec):**

```
Role A permissions: { projects:view, projects:create }
Role B permissions: { projects:edit }

Union = { projects:view, projects:create, projects:edit }
```

### Implementation

```typescript
// lib/permissions.ts
export function resolveEffectivePermissions(
  permissionSets: Permission[][]
): Permission[] {
  const union = new Set<Permission>();

  for (const set of permissionSets) {
    for (const perm of set) {
      union.add(perm);        // Set automatically deduplicates
    }
  }

  // Return in canonical matrix order for consistent display
  return ALL_PERMISSIONS.filter((p) => union.has(p));
}
```

1. For each of the user's assigned roles, collect the `permissions[]` array.
2. Insert every permission into a `Set<Permission>` — duplicates are silently ignored.
3. Filter `ALL_PERMISSIONS` (the canonical ordered list) against the Set — this returns permissions in a stable, human-readable order.

This is an **additive / least-privilege-union** model. There is no "deny" concept. A permission can only be granted, never explicitly revoked by another role.

---

## Folder Structure

```
workbench-rbac/
├── app/
│   ├── api/
│   │   ├── permissions/route.ts          # GET /api/permissions
│   │   ├── roles/
│   │   │   ├── route.ts                  # GET, POST /api/roles
│   │   │   └── [id]/route.ts             # PUT, DELETE /api/roles/:id
│   │   └── users/
│   │       ├── route.ts                  # GET /api/users
│   │       └── [id]/
│   │           ├── roles/route.ts        # POST, DELETE /api/users/:id/roles
│   │           └── effective-permissions/route.ts  # GET
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                          # Single dashboard page
│
├── components/
│   ├── RoleList.tsx                      # Left panel: role cards + search
│   ├── RoleEditor.tsx                    # Middle panel: name/desc + matrix
│   ├── PermissionMatrix.tsx              # Checkbox grid (resource × action)
│   ├── UsersPanel.tsx                    # Right panel: users + assignment
│   ├── EffectivePermissions.tsx          # Permission chips
│   ├── Toast.tsx                         # Notification system
│   └── ConfirmModal.tsx                  # Delete confirmation
│
├── lib/
│   ├── store.ts                          # In-memory singleton store + CRUD
│   └── permissions.ts                   # Matrix definition + union resolver
│
├── types/
│   └── index.ts                          # All TypeScript types
│
├── Architecture.md
└── README.md
```

---

## API Surface

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/permissions` | All 19 permissions grouped by resource |
| `GET` | `/api/roles` | List all roles |
| `POST` | `/api/roles` | Create a new role |
| `PUT` | `/api/roles/:id` | Update role name, description, or permissions |
| `DELETE` | `/api/roles/:id` | Delete a role (removes from all users) |
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users/:id/roles` | Assign a role to a user |
| `DELETE` | `/api/users/:id/roles` | Remove a role from a user |
| `GET` | `/api/users/:id/effective-permissions` | Resolve effective permissions (UNION) |

---

## Data Model

```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];   // Array of permission strings
  createdAt: string;           // ISO 8601
  isSystem?: boolean;          // Seed roles
}

interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  roleIds: string[];           // References to Role.id
  createdAt: string;
}
```

Users hold a **list of role IDs**, not embedded permissions. This means updating a role's permissions immediately affects all users with that role — no stale data, no sync needed.

---

## UX Architecture

The dashboard follows a **master-detail-context** pattern:

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Workbench Role Builder                             │
├──────────────┬──────────────────────────┬───────────────────┤
│ Roles List   │     Role Editor          │  Users Panel      │
│              │                          │                   │
│ [Search]     │  Name: ___________       │  ● Alex Kim       │
│              │  Desc: ___________       │    [Owner][Admin] │
│ ● Owner      │                          │                   │
│ ● Admin      │  Permission Matrix:      │  ○ Priya Sharma   │
│ ● Viewer     │  Resource │ V │ C │ E …  │    [Contractor]   │
│ ● Contractor │  Projects │ ✓ │ ✓ │ ✓ …  │                   │
│              │  Tasks    │ ✓ │ ✓ │ ✓ …  │  ─────────────── │
│ [+ New Role] │  ...                     │  Effective Perms: │
│              │                          │  [view][create]…  │
│              │  [Save Changes]          │                   │
└──────────────┴──────────────────────────┴───────────────────┘
```

- **Left panel** — master list with search and create
- **Middle panel** — detail editor (empty state if nothing selected)
- **Right panel** — contextual: shows users and their roles; clicking a user reveals effective permissions at the bottom

All three panels are visible simultaneously on a single screen, as required.
