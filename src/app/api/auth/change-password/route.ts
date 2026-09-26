import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { verifyPassword, hashPassword, verifyToken, SESSION_COOKIE, SessionPayload } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifyToken<SessionPayload>(token) : null;
    if (!session || session.scope !== 'admin') {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Informe a senha atual e a nova senha.' }, { status: 400 });
    }
    if (String(newPassword).length < 6) {
      return NextResponse.json({ success: false, error: 'A nova senha precisa ter ao menos 6 caracteres.' }, { status: 400 });
    }

    const db = await readDb();
    const user = (db.users || []).find(u => u.id === session.sub);
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return NextResponse.json({ success: false, error: 'Senha atual incorreta.' }, { status: 401 });
    }

    user.passwordHash = await hashPassword(newPassword);
    await writeDb(db);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
