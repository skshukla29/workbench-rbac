import { NextRequest, NextResponse } from 'next/server';
import { getRole, updateRole, deleteRole, getRoles } from '@/lib/store';
import { UpdateRolePayload } from '@/types';

type Params = { params: Promise<{ id: string }> };

/** PUT /api/roles/:id — update a role */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const role = getRole(id);

    if (!role) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Role not found' },
        { status: 404 }
      );
    }

    const body: UpdateRolePayload = await req.json();

    // Check name uniqueness if name is being changed
    if (body.name && body.name.trim().toLowerCase() !== role.name.toLowerCase()) {
      const duplicate = getRoles().find(
        (r) => r.id !== id && r.name.toLowerCase() === body.name!.trim().toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json(
          { error: 'CONFLICT', message: `A role named "${body.name}" already exists` },
          { status: 409 }
        );
      }
    }

    const updated = updateRole(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update role' },
      { status: 500 }
    );
  }
}

/** DELETE /api/roles/:id — delete a role */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const role = getRole(id);

    if (!role) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Role not found' },
        { status: 404 }
      );
    }

    deleteRole(id);
    return NextResponse.json({ success: true, message: `Role "${role.name}" deleted` });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
