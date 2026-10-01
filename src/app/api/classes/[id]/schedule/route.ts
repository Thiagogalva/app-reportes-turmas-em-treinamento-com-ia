import { NextRequest, NextResponse } from 'next/server';
import { toggleScheduleDay, getClasses } from '@/lib/db';
import { getSession, namesMatch } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { dayId, completed } = await request.json();
    if (!dayId || typeof completed !== 'boolean') {
      return NextResponse.json({ success: false, error: 'dayId e completed são obrigatórios.' }, { status: 400 });
    }

    const session = await getSession(request);
    if (session && session.role !== 'admin') {
      const classes = await getClasses(false);
      const owns = classes.some(c => c.id === id && namesMatch(c.instructor, session.name));
      if (!owns) {
        return NextResponse.json({ success: false, error: 'Você só pode atualizar o cronograma de turmas em que é o instrutor.' }, { status: 403 });
      }
    }

    const updated = await toggleScheduleDay(id, dayId, completed);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Turma não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
