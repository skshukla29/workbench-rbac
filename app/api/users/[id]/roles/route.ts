import { NextRequest, NextResponse } from 'next/server';
import { assignRoleToUser, unassignRoleFromUser, getUser, getRole } from '@/lib/store';

type Params = { params: Promise<{ id: string }> };

/** POST /api/users/:id/roles — assign a role to user */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = getUser(id);

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }

    const { roleId } = await req.json();

    if (!roleId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'roleId is required' },
        { status: 400 }
      );
    }

    const role = getRole(roleId);
    if (!role) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Role not found' },
        { status: 404 }
      );
    }

    const updated = assignRoleToUser(id, roleId);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to assign role' },
      { status: 500 }
    );
  }
}

/** DELETE /api/users/:id/roles — unassign a role from user */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = getUser(id);

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }

    const { roleId } = await req.json();

    if (!roleId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'roleId is required' },
        { status: 400 }
      );
    }

    const updated = unassignRoleFromUser(id, roleId);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to unassign role' },
      { status: 500 }
    );
  }
}
