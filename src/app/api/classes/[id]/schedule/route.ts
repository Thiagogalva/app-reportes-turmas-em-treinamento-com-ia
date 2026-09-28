import { NextRequest, NextResponse } from 'next/server';
import { toggleScheduleDay } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { dayId, completed } = await request.json();
    if (!dayId || typeof completed !== 'boolean') {
      return NextResponse.json({ success: false, error: 'dayId e completed são obrigatórios.' }, { status: 400 });
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
