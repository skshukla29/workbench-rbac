# Workbench — Role & Permission Builder

A production-quality RBAC (Role-Based Access Control) admin dashboard built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- **Role Management** — Create, edit, and delete custom roles with granular permissions
- **Permission Matrix** — Interactive checkbox grid organized by resource and action
- **User Management** — Assign and unassign multiple roles per user
- **Effective Permissions** — Real-time union resolution across all assigned roles
- **Toast Notifications** — Feedback for every action
- **Delete Confirmation** — Safeguarded destructive operations
- **Search & Filter** — Quickly find roles by name or description

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Permission Matrix

19 permissions across 5 resources:

| Resource | Permissions |
|----------|-------------|
| Projects | view, create, edit, delete, archive |
| Tasks    | view, create, edit, delete, assign  |
| Members  | view, invite, remove, update_role   |
| Billing  | view, update, download_invoices     |
| Settings | view, update                        |

## Seed Data

### Roles

| Role | Permissions | Description |
|------|-------------|-------------|
| Owner | All 19 | Full workspace access |
| Admin | 18 (no billing:download_invoices) | Manages projects, tasks, members |
| Viewer | 3 (view only) | Read-only access |
| Contractor | 7 (project + task, no delete/billing/settings) | External collaborator |

### Users

| User | Roles | Effective Permissions |
|------|-------|-----------------------|
| Alex Kim | Owner + Admin | 19 (union = all) |
| Priya Sharma | Contractor | 7 |
| Marcus Lee | Viewer | 3 |
| Sara Torres | Admin | 18 |

## API Reference

```
GET    /api/permissions
GET    /api/roles
POST   /api/roles
PUT    /api/roles/:id
DELETE /api/roles/:id
GET    /api/users
POST   /api/users/:id/roles
DELETE /api/users/:id/roles
GET    /api/users/:id/effective-permissions
```

## Project Structure

```
workbench-rbac/
├── app/
│   ├── api/              # Next.js Route Handlers
│   ├── globals.css       # Design tokens + animations
│   ├── layout.tsx        # Root layout with ToastProvider
│   └── page.tsx          # Single dashboard page
├── components/
│   ├── RoleList.tsx      # Left panel
│   ├── RoleEditor.tsx    # Middle panel
│   ├── PermissionMatrix.tsx
│   ├── UsersPanel.tsx    # Right panel
│   ├── EffectivePermissions.tsx
│   ├── Toast.tsx
│   └── ConfirmModal.tsx
├── lib/
│   ├── store.ts          # In-memory store (global singleton)
│   └── permissions.ts   # Matrix + union resolver
├── types/
│   └── index.ts
├── Architecture.md
└── README.md
```

## Tech Stack

- **Next.js 15** — App Router, Route Handlers, Turbopack
- **TypeScript** — Strict typing throughout
- **Tailwind CSS** — Utility-first dark theme
- **Lucide React** — Icon library
- **In-memory store** — Global singleton, no database

## Notes

- Data resets on server restart (in-memory only)
- No authentication required
- All state managed via React `useState` — no Redux/Zustand
- Seed data cannot be permanently deleted (flagged as `isSystem: true`)
