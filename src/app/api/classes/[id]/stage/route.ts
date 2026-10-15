import { NextRequest, NextResponse } from 'next/server';
import { setClassReleasedStage } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

// Liberação de etapas de sistemas da turma — ação de quem controla os acessos (admin).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem liberar etapas de sistemas.' }, { status: 403 });
    }

    const { id } = await params;
    const { releasedStage } = await request.json();
    if (typeof releasedStage !== 'number' || !Number.isFinite(releasedStage) || releasedStage < 1) {
      return NextResponse.json({ success: false, error: 'releasedStage deve ser um número maior ou igual a 1.' }, { status: 400 });
    }

    const updated = await setClassReleasedStage(id, releasedStage);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Turma não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
