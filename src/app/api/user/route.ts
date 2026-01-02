
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (user) {
    return NextResponse.json(user);
  }
  return NextResponse.json(null, { status: 401 });
}
