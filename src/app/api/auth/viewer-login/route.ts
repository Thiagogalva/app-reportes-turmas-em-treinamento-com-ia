import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { ensureBootstrap, verifyPassword, createViewerToken, VIEWER_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ success: false, error: 'Informe a senha.' }, { status: 400 });
    }

    await ensureBootstrap();

    const db = await readDb();
    const hash = db.settings.viewerPasswordHash;

    if (!hash || !(await verifyPassword(password, hash))) {
      return NextResponse.json({ success: false, error: 'Senha inválida.' }, { status: 401 });
    }

    const token = await createViewerToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(VIEWER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
