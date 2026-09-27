import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { hashPassword, verifyToken, SESSION_COOKIE, SessionPayload } from '@/lib/auth';
import { randomUUID } from 'node:crypto';

async function requireAdmin(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken<SessionPayload>(token) : null;
  if (!session || session.scope !== 'admin' || session.role !== 'admin') return null;
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  const db = await readDb();
  const safeUsers = (db.users || []).map(({ passwordHash, ...rest }) => rest);
  return NextResponse.json({ success: true, data: safeUsers });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const { username, name, password, role } = await request.json();
    if (!username || !name || !password) {
      return NextResponse.json({ success: false, error: 'Usuário, nome e senha são obrigatórios.' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ success: false, error: 'A senha precisa ter ao menos 6 caracteres.' }, { status: 400 });
    }
    if (role !== 'admin' && role !== 'instrutor') {
      return NextResponse.json({ success: false, error: 'Perfil inválido.' }, { status: 400 });
    }

    const normalizedUsername = String(username).trim().toLowerCase();
    const db = await readDb();
    if ((db.users || []).some(u => u.username.toLowerCase() === normalizedUsername)) {
      return NextResponse.json({ success: false, error: 'Já existe um usuário com esse nome.' }, { status: 409 });
    }

    const newUser = {
      id: randomUUID(),
      username: normalizedUsername,
      name: String(name).trim(),
      passwordHash: await hashPassword(password),
      role: role as 'admin' | 'instrutor',
      createdAt: new Date().toISOString(),
    };

    db.users = [...(db.users || []), newUser];
    await writeDb(db);

    const { passwordHash, ...safeUser } = newUser;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
