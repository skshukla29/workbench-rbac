import { NextRequest, NextResponse } from 'next/server';
import { getUser, getEffectivePermissions, getRole } from '@/lib/store';

type Params = { params: Promise<{ id: string }> };

/** GET /api/users/:id/effective-permissions — resolve effective permissions via UNION */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = getUser(id);

  if (!user) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'User not found' },
      { status: 404 }
    );
  }

  const permissions = getEffectivePermissions(id);

  const roleNames = user.roleIds
    .map((rid) => getRole(rid)?.name)
    .filter(Boolean) as string[];

  return NextResponse.json({
    userId: user.id,
    userName: user.name,
    roleIds: user.roleIds,
    roleNames,
    permissions: permissions ?? [],
  });
}
