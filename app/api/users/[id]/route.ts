import { NextRequest, NextResponse } from 'next/server';
import { getUser, updateUser, deleteUser } from '@/lib/store';

type Params = { params: Promise<{ id: string }> };

/** GET /api/users/:id — get user details */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = getUser(id);

  if (!user) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}

/** PUT /api/users/:id — update user details */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = getUser(id);

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }

    const { name, email, roleIds, status } = await req.json();

    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Full name cannot be empty' },
        { status: 400 }
      );
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Email cannot be empty' },
          { status: 400 }
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Please provide a valid email address' },
          { status: 400 }
        );
      }
    }

    const updated = updateUser(id, { name, email, roleIds, status });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/** DELETE /api/users/:id — delete a user */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = getUser(id);

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }

    const deleted = deleteUser(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
