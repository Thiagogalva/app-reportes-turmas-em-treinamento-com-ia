import { NextRequest, NextResponse } from 'next/server';
import { getReports, getReportById, saveReport, deleteReport, getClasses } from '@/lib/db';
import { getSession, namesMatch } from '@/lib/auth';

/**
 * Para sessão de instrutor (não-admin), retorna o conjunto de IDs de turma em
 * que ele aparece como instrutor — usado para restringir quais reportes ele
 * pode ver. Admin e sessão de /viewer retornam null (sem restrição).
 */
async function getInstructorClassIdFilter(request: NextRequest): Promise<Set<string> | null> {
  const session = await getSession(request);
  if (!session || session.role === 'admin') return null;
  const classes = await getClasses(false);
  return new Set(classes.filter(c => namesMatch(c.instructor, session.name)).map(c => c.id));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const classId = searchParams.get('classId') || undefined;
    const allowedClassIds = await getInstructorClassIdFilter(request);

    if (id) {
      const report = await getReportById(id);
      if (!report) {
        return NextResponse.json({ success: false, error: 'Reporte não encontrado.' }, { status: 404 });
      }
      if (allowedClassIds && !allowedClassIds.has(report.classId)) {
        return NextResponse.json({ success: false, error: 'Você não tem acesso a este reporte.' }, { status: 403 });
      }
      return NextResponse.json({ success: true, data: report });
    }

    let reports = await getReports(classId);
    if (allowedClassIds) {
      reports = reports.filter(r => allowedClassIds.has(r.classId));
    }
    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.classId || !body.date) {
      return NextResponse.json({ success: false, error: 'Turma e data são obrigatórios.' }, { status: 400 });
    }

    const allowedClassIds = await getInstructorClassIdFilter(request);
    if (allowedClassIds && !allowedClassIds.has(body.classId)) {
      return NextResponse.json({ success: false, error: 'Você só pode lançar reportes para turmas em que é o instrutor.' }, { status: 403 });
    }

    // Validação estrita: se algum aluno tiver desempenho "ABAIXO_DO_ESPERADO", o campo lowPerformanceReason DEVE estar preenchido
    if (Array.isArray(body.studentPerformances)) {
      for (const perf of body.studentPerformances) {
        if (perf.level === 'ABAIXO_DO_ESPERADO') {
          if (!perf.lowPerformanceReason || perf.lowPerformanceReason.trim().length < 5) {
            return NextResponse.json({
              success: false,
              error: `O aluno ${perf.studentName || 'indicado'} possui desempenho Abaixo do Esperado. É obrigatório detalhar o motivo do baixo desempenho.`,
            }, { status: 400 });
          }
        }
      }
    }

    const saved = await saveReport(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do reporte é obrigatório.' }, { status: 400 });
    }

    const allowedClassIds = await getInstructorClassIdFilter(request);
    if (allowedClassIds) {
      const report = await getReportById(id);
      if (!report || !allowedClassIds.has(report.classId)) {
        return NextResponse.json({ success: false, error: 'Você não tem permissão para excluir este reporte.' }, { status: 403 });
      }
    }

    const deleted = await deleteReport(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
