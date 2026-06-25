import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser } from '@/lib/store';

/** GET /api/users — list all users */
export async function GET() {
  const users = getUsers();
  return NextResponse.json(users);
}

/** POST /api/users — create a new user */
export async function POST(req: NextRequest) {
  try {
    const { name, email, roleIds } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Full name is required' },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email format verification
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    const newUser = createUser(name, email, roleIds || []);
    return NextResponse.json(newUser, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create user' },
      { status: 500 }
    );
  }
}
