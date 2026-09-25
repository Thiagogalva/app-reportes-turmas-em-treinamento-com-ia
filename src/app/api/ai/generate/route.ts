import { NextRequest, NextResponse } from 'next/server';
import { generateAiTrainingReport } from '@/lib/gemini';
import { DailyReport } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const reportData: DailyReport = await request.json();
    if (!reportData || !reportData.attendance || !reportData.studentPerformances) {
      return NextResponse.json({ success: false, error: 'Dados do reporte incompletos para a IA processar.' }, { status: 400 });
    }

    const aiResult = await generateAiTrainingReport(reportData);
    return NextResponse.json({ success: true, data: aiResult });
  } catch (error: any) {
    console.error("Erro na rota de IA:", error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao gerar análise com IA.' }, { status: 500 });
  }
}
