import { NextRequest, NextResponse } from 'next/server';
import { getClasses, saveClass, deleteClass } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('onlyActive') === 'true';
    const classes = await getClasses(onlyActive);
    return NextResponse.json({ success: true, data: classes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.code) {
      return NextResponse.json({ success: false, error: 'Nome e código da turma são obrigatórios.' }, { status: 400 });
    }

    // Editar uma turma já existente (id presente) é restrito a administradores —
    // é aqui que dados sensíveis como login de rede/cliente dos alunos são alterados.
    if (body.id) {
      const session = await getAdminSession(request);
      if (!session || session.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Apenas administradores podem editar uma turma existente.' }, { status: 403 });
      }
    }

    const saved = await saveClass(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem excluir turmas.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID da turma é obrigatório.' }, { status: 400 });
    }
    const deleted = await deleteClass(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
