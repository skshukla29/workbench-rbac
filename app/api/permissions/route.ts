import { NextResponse } from 'next/server';
import { PERMISSION_MATRIX, ALL_PERMISSIONS } from '@/data/permissions';

export async function GET() {
  return NextResponse.json({
    groups: PERMISSION_MATRIX,
    total: ALL_PERMISSIONS.length,
    permissions: ALL_PERMISSIONS,
  });
}
