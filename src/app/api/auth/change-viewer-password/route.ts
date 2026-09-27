import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { hashPassword, verifyToken, SESSION_COOKIE, SessionPayload } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifyToken<SessionPayload>(token) : null;
    if (!session || session.scope !== 'admin' || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const { newPassword } = await request.json();
    if (!newPassword || String(newPassword).length < 4) {
      return NextResponse.json({ success: false, error: 'A senha do viewer precisa ter ao menos 4 caracteres.' }, { status: 400 });
    }

    const db = await readDb();
    db.settings.viewerPasswordHash = await hashPassword(newPassword);
    await writeDb(db);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
