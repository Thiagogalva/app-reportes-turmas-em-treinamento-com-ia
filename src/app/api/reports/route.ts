import { NextRequest, NextResponse } from 'next/server';
import { getReports, getReportById, saveReport, deleteReport } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const classId = searchParams.get('classId') || undefined;

    if (id) {
      const report = getReportById(id);
      if (!report) {
        return NextResponse.json({ success: false, error: 'Reporte não encontrado.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: report });
    }

    const reports = getReports(classId);
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

    const saved = saveReport(body);
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
    const deleted = deleteReport(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
