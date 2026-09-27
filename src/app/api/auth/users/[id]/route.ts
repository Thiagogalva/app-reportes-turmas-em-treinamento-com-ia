import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { hashPassword, verifyToken, SESSION_COOKIE, SessionPayload } from '@/lib/auth';

async function requireAdmin(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken<SessionPayload>(token) : null;
  if (!session || session.scope !== 'admin' || session.role !== 'admin') return null;
  return session;
}

function countAdmins(users: { role: string }[]): number {
  return users.filter(u => u.role === 'admin').length;
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Acesso restrito a administradores.' }, { status: 403 });
    }
    const { id } = await params;

    if (id === session.sub) {
      return NextResponse.json({ success: false, error: 'Você não pode excluir seu próprio usuário.' }, { status: 400 });
    }

    const db = await readDb();
    const target = (db.users || []).find(u => u.id === id);
    if (!target) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado.' }, { status: 404 });
    }
    if (target.role === 'admin' && countAdmins(db.users) <= 1) {
      return NextResponse.json({ success: false, error: 'Não é possível excluir o último administrador.' }, { status: 400 });
    }

    db.users = db.users.filter(u => u.id !== id);
    await writeDb(db);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Acesso restrito a administradores.' }, { status: 403 });
    }
    const { id } = await params;
    const { newPassword, role } = await request.json();

    const db = await readDb();
    const target = (db.users || []).find(u => u.id === id);
    if (!target) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado.' }, { status: 404 });
    }

    if (role && role !== 'admin' && role !== 'instrutor') {
      return NextResponse.json({ success: false, error: 'Perfil inválido.' }, { status: 400 });
    }
    if (role && target.role === 'admin' && role !== 'admin' && countAdmins(db.users) <= 1) {
      return NextResponse.json({ success: false, error: 'Não é possível rebaixar o último administrador.' }, { status: 400 });
    }

    if (newPassword) {
      if (String(newPassword).length < 6) {
        return NextResponse.json({ success: false, error: 'A nova senha precisa ter ao menos 6 caracteres.' }, { status: 400 });
      }
      target.passwordHash = await hashPassword(newPassword);
    }
    if (role) {
      target.role = role;
    }

    await writeDb(db);
    const { passwordHash, ...safeUser } = target;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
