import { NextResponse } from 'next/server';
import { VIEWER_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(VIEWER_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
