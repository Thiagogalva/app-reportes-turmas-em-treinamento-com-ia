import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { ensureBootstrap, verifyPassword, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    await ensureBootstrap();

    const db = await readDb();
    const user = (db.users || []).find(
      u => u.username.toLowerCase() === String(username).trim().toLowerCase()
    );

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ success: false, error: 'Usuário ou senha inválidos.' }, { status: 401 });
    }

    const token = await createSessionToken({
      scope: 'admin',
      sub: user.id,
      username: user.username,
      name: user.name,
    });

    const response = NextResponse.json({ success: true, data: { username: user.username, name: user.name } });
    response.cookies.set(SESSION_COOKIE, token, {
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
