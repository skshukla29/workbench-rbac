import { NextRequest, NextResponse } from 'next/server';
import { getRoles, createRole } from '@/lib/store';
import { CreateRolePayload } from '@/types';

/** GET /api/roles — list all roles */
export async function GET() {
  const roles = getRoles();
  return NextResponse.json(roles);
}

/** POST /api/roles — create a new role */
export async function POST(req: NextRequest) {
  try {
    const body: CreateRolePayload = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = getRoles().find(
      (r) => r.name.toLowerCase() === body.name.trim().toLowerCase()
    );
    if (existing) {
      return NextResponse.json(
        { error: 'CONFLICT', message: `A role named "${body.name}" already exists` },
        { status: 409 }
      );
    }

    const role = createRole(body.name, body.description ?? '', body.permissions ?? []);
    return NextResponse.json(role, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create role' },
      { status: 500 }
    );
  }
}
