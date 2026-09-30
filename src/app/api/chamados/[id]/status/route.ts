import { NextRequest, NextResponse } from 'next/server';
import { setChamadoStatus } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem alterar o status de um chamado.' }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();
    if (status !== 'PENDENTE' && status !== 'APROVADO') {
      return NextResponse.json({ success: false, error: 'Status inválido.' }, { status: 400 });
    }

    const updated = await setChamadoStatus(id, status);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Chamado não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
