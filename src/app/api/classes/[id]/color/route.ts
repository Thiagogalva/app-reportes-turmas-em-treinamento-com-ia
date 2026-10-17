import { NextRequest, NextResponse } from 'next/server';
import { setClassColor, getClasses } from '@/lib/db';
import { getSession, namesMatch } from '@/lib/auth';
import { isValidClassColor } from '@/lib/class-colors';

// Cor de destaque do card da turma: preferência de visualização, por isso não
// exige perfil admin — o instrutor pode personalizar as próprias turmas.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { color } = await request.json();
    if (color !== null && !isValidClassColor(color)) {
      return NextResponse.json({ success: false, error: 'Cor inválida. Use o formato #RRGGBB ou null para remover.' }, { status: 400 });
    }

    const session = await getSession(request);
    if (session && session.role !== 'admin') {
      const classes = await getClasses(false);
      const owns = classes.some(c => c.id === id && namesMatch(c.instructor, session.name));
      if (!owns) {
        return NextResponse.json({ success: false, error: 'Você só pode personalizar turmas em que é o instrutor.' }, { status: 403 });
      }
    }

    const updated = await setClassColor(id, color);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Turma não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
