import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyReport, ClassGroup } from '@/types';

export function exportReportsToExcel(reports: DailyReport[], currentClass?: ClassGroup) {
  const wb = XLSX.utils.book_new();

  // Aba 1: Resumo dos Reportes
  const summaryData = reports.map(r => {
    const total = r.attendance.length;
    const present = r.attendance.filter(a => a.status === 'PRESENTE').length;
    const presenceRate = total > 0 ? `${Math.round((present / total) * 100)}%` : '0%';
    const lowPerfCount = r.studentPerformances.filter(p => p.level === 'ABAIXO_DO_ESPERADO').length;

    return {
      'Data': r.date,
      'Turma': r.className,
      'Instrutor': r.instructorName,
      'Presença (%)': presenceRate,
      'Presentes': present,
      'Total Alunos': total,
      'Sistemas Operacionais': r.systemsStatus.operational ? 'SIM (100% OK)' : 'NÃO (Com falhas)',
      'Problemas nos Sistemas': r.systemsStatus.notes || 'Nenhum',
      'Tópicos Ministrados': r.topicsStudied,
      'Exercícios Práticos': r.practicalExercises || 'Nenhum',
      'Alunos Baixo Desempenho': lowPerfCount,
      'Observações Gerais': r.generalObservations || '',
    };
  });
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Geral');

  // Aba 2: Detalhamento de Frequência e Absenteísmo
  const attendanceData: any[] = [];
  reports.forEach(r => {
    r.attendance.forEach(att => {
      attendanceData.push({
        'Data': r.date,
        'Turma': r.className,
        'Aluno': att.studentName,
        'Status de Presença': att.status,
        'Motivo da Falta / Atraso': att.absenceReason || '',
      });
    });
  });
  const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
  XLSX.utils.book_append_sheet(wb, wsAttendance, 'Frequência e Faltas');

  // Aba 3: Desempenho Individual dos Alunos
  const performanceData: any[] = [];
  reports.forEach(r => {
    r.studentPerformances.forEach(perf => {
      performanceData.push({
        'Data': r.date,
        'Turma': r.className,
        'Aluno': perf.studentName,
        'Conceito/Nível': perf.level,
        'Nota (0-10)': perf.score ?? 'N/A',
        'Motivo do Baixo Desempenho': perf.lowPerformanceReason || 'N/A',
        'Observações do Aluno': perf.notes || '',
      });
    });
  });
  const wsPerformance = XLSX.utils.json_to_sheet(performanceData);
  XLSX.utils.book_append_sheet(wb, wsPerformance, 'Desempenho dos Alunos');

  // Aba 4: Ocorrências de Sistemas
  const systemsData = reports.map(r => ({
    'Data': r.date,
    'Turma': r.className,
    'Status dos Sistemas': r.systemsStatus.operational ? '100% Operacional' : 'Instabilidade / Problema',
    'Descrição da Ocorrência': r.systemsStatus.notes || 'Sem intercorrências',
    'Sistemas/Ferramentas Afetadas': (r.systemsStatus.affectedSystems || []).join(', ') || 'Nenhuma',
  }));
  const wsSystems = XLSX.utils.json_to_sheet(systemsData);
  XLSX.utils.book_append_sheet(wb, wsSystems, 'Status de Sistemas');

  const filename = currentClass
    ? `Relatorio_Treinamento_${currentClass.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
    : `Relatorio_Treinamento_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

  XLSX.writeFile(wb, filename);
}

export function exportSingleReportToPdf(report: DailyReport) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho estilizado padrão Bradesco
  doc.setFillColor(181, 7, 41); // Vermelho escuro Bradesco
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DIÁRIO DE TREINAMENTO', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Turma: ${report.className} | Data: ${report.date} | Instrutor: ${report.instructorName}`, 14, 25);

  let currentY = 40;

  // Informações Gerais & Status dos Sistemas
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Infraestrutura e Status dos Sistemas dos Alunos', 14, currentY);
  currentY += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const sysStatus = report.systemsStatus.operational ? 'OPERACIONAL (100% estável)' : 'INSTABILIDADE / COM FALHAS';
  doc.text(`Status Geral: ${sysStatus}`, 14, currentY);
  currentY += 5;
  
  if (report.systemsStatus.notes) {
    const splitNotes = doc.splitTextToSize(`Observação Técnica: ${report.systemsStatus.notes}`, pageWidth - 28);
    doc.text(splitNotes, 14, currentY);
    currentY += splitNotes.length * 5 + 4;
  } else {
    currentY += 4;
  }

  // Conteúdo Estudado
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Conteúdo e Práticas do Dia', 14, currentY);
  currentY += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const splitTopics = doc.splitTextToSize(`Tópicos Estudados: ${report.topicsStudied}`, pageWidth - 28);
  doc.text(splitTopics, 14, currentY);
  currentY += splitTopics.length * 5 + 2;

  if (report.practicalExercises) {
    const splitExercises = doc.splitTextToSize(`Exercícios Práticos: ${report.practicalExercises}`, pageWidth - 28);
    doc.text(splitExercises, 14, currentY);
    currentY += splitExercises.length * 5 + 4;
  } else {
    currentY += 4;
  }

  // Tabela de Frequência e Absenteísmo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Frequência e Absenteísmo', 14, currentY);
  currentY += 4;

  const attendanceRows = report.attendance.map(a => [
    a.studentName,
    a.status,
    a.absenceReason || (a.status === 'PRESENTE' ? 'N/A' : 'Não informado')
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Aluno', 'Status', 'Motivo da Falta / Atraso']],
    body: attendanceRows,
    headStyles: { fillColor: [204, 9, 47], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Tabela de Desempenho dos Alunos
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Desempenho Individual dos Alunos', 14, currentY);
  currentY += 4;

  const performanceRows = report.studentPerformances.map(p => [
    p.studentName,
    p.level.replace(/_/g, ' '),
    p.score !== undefined ? `${p.score}` : '-',
    p.lowPerformanceReason || p.notes || '-'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Aluno', 'Conceito', 'Nota', 'Justificativa / Observação']],
    body: performanceRows,
    headStyles: { fillColor: [181, 7, 41], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 245, 245] },
    margin: { left: 14, right: 14 },
    styles: { cellWidth: 'auto', overflow: 'linebreak' },
    columnStyles: {
      3: { cellWidth: 80 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Resumo do Agente de IA se houver
  if (report.aiGeneratedEmail) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('5. Resumo Executivo e Plano de Ação (Agente de IA)', 14, currentY);
    currentY += 6;

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    const splitAi = doc.splitTextToSize(report.aiGeneratedEmail.executiveSummary, pageWidth - 28);
    doc.text(splitAi, 14, currentY);
    currentY += splitAi.length * 4.5 + 4;

    if (report.aiGeneratedEmail.actionPlan) {
      doc.setFont('helvetica', 'bold');
      doc.text('Plano Pedagógico Sugerido:', 14, currentY);
      currentY += 5;
      doc.setFont('helvetica', 'normal');
      const splitPlan = doc.splitTextToSize(report.aiGeneratedEmail.actionPlan, pageWidth - 28);
      doc.text(splitPlan, 14, currentY);
    }
  }

  // Rodapé com data de emissão
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${totalPages} - Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(`Reporte_${report.className.replace(/[^a-zA-Z0-9]/g, '_')}_${report.date}.pdf`);
}
