import { NextRequest, NextResponse } from 'next/server';
import { getChamados, saveChamado, deleteChamado, getClasses } from '@/lib/db';
import { getAdminSession, getSession, namesMatch } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    let chamados = await getChamados();

    const session = await getSession(request);
    if (session && session.role !== 'admin') {
      const classes = await getClasses(false);
      const allowedClassIds = new Set(classes.filter(c => namesMatch(c.instructor, session.name)).map(c => c.id));
      chamados = chamados.filter(c => allowedClassIds.has(c.classId));
    }

    return NextResponse.json({ success: true, data: chamados });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem cadastrar ou editar chamados.' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.numeroChamado || !body.classId || !body.type || body.slaDays == null || !body.openedDate) {
      return NextResponse.json({ success: false, error: 'Número do chamado, turma, tipo, prazo (dias) e data de abertura são obrigatórios.' }, { status: 400 });
    }

    const saved = await saveChamado({ ...body, createdBy: body.id ? body.createdBy : session.name });
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem excluir chamados.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório.' }, { status: 400 });
    }
    const deleted = await deleteChamado(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
