import { GoogleGenAI } from "@google/genai";
import { DailyReport, AiGeneratedReport } from '@/types';
import { getSettings } from './db';

export async function generateAiTrainingReport(report: DailyReport): Promise<AiGeneratedReport> {
  const settings = getSettings();
  const apiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;

  // Calculos auxiliares para contextualizar o modelo
  const totalStudents = report.attendance.length;
  const presentCount = report.attendance.filter(a => a.status === 'PRESENTE').length;
  const absentCount = report.attendance.filter(a => a.status === 'AUSENTE' || a.status === 'JUSTIFICADO').length;
  const absentees = report.attendance.filter(a => a.status !== 'PRESENTE');

  const lowPerformers = report.studentPerformances.filter(p => p.level === 'ABAIXO_DO_ESPERADO');
  const highPerformers = report.studentPerformances.filter(p => p.level === 'EXCELENTE');
  const systemsStatusText = report.systemsStatus.operational
    ? "Sistemas 100% operacionais e estáveis."
    : `Instabilidade detectada nos sistemas: ${report.systemsStatus.notes}. Sistemas afetados: ${(report.systemsStatus.affectedSystems || []).join(', ') || 'Não especificado'}`;

  // Se tiver chave de API do Gemini, invocamos o modelo gemini-3.8-flash via SDK oficial @google/genai
  if (apiKey && apiKey.trim().length > 5) {
    try {
      const client = new GoogleGenAI({ apiKey });

      const prompt = `
Você é um Coordenador Pedagógico e Especialista em Treinamentos Corporativos de alto nível.
Sua função é transformar os dados brutos de um reporte diário de treinamento em um E-mail Executivo Profissional, conciso, elegante e orientado à liderança e stakeholders.

DADOS DO REPORTE:
- Turma: ${report.className}
- Data: ${report.date}
- Instrutor: ${report.instructorName}
- Status dos Sistemas dos Alunos: ${systemsStatusText}
- Detalhes dos Sistemas: ${report.systemsStatus.notes || 'Sem observações'}
- Tópicos Estudados Hoje: ${report.topicsStudied}
- Exercícios Práticos Realizados: ${report.practicalExercises || 'N/A'}
- Frequência: ${presentCount} presentes de ${totalStudents} alunos (${Math.round((presentCount / (totalStudents || 1)) * 100)}% de presença).
- Alunos Ausentes/Faltas: ${absentees.length > 0 ? absentees.map(a => `${a.studentName} (${a.status}: ${a.absenceReason || 'Sem motivo registrado'})`).join('; ') : 'Nenhuma falta hoje, 100% de presença!'}
- Destaques Positivos (Excelente): ${highPerformers.map(p => p.studentName).join(', ') || 'Nenhum'}
- Alunos com Desempenho Abaixo do Esperado: ${lowPerformers.length > 0 ? lowPerformers.map(p => `${p.studentName} - Motivo: ${p.lowPerformanceReason || 'Sem justificativa'} (Obs: ${p.notes || ''})`).join('; ') : 'Nenhum aluno abaixo do esperado hoje.'}
- Observações Gerais do Instrutor: ${report.generalObservations || 'Sem observações adicionais'}

INSTRUÇÕES DE RESPOSTA:
Gere a resposta em formato JSON estrito, sem markdown ao redor ou com bloco \`\`\`json, contendo exatamente estas chaves:
{
  "subject": "Assunto claro, formal e com identificação da turma e data",
  "executiveSummary": "Resumo executivo de 2 a 3 parágrafos destacando os principais marcos do dia, prontidão técnica e engajamento",
  "actionPlan": "Plano de ação pedagógico pontual para os alunos com baixo rendimento ou faltas (caso haja algum)",
  "bodyText": "Corpo completo do e-mail em texto puro legível com marcadores, cabeçalho e assinatura",
  "bodyHtml": "Corpo completo do e-mail em HTML limpo e responsivo com tabelas ou listas estilizadas prontas para colar no Outlook ou Gmail"
}
`;

      const interaction = await client.interactions.create({
        model: "gemini-3.8-flash",
        input: prompt,
      });

      if (interaction.output_text) {
        // Limpar possíveis delimitadores de markdown json
        let cleanText = interaction.output_text.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();

        const parsed = JSON.parse(cleanText);
        return {
          subject: parsed.subject || `Reporte Diário: ${report.className} - ${report.date}`,
          executiveSummary: parsed.executiveSummary || 'Resumo gerado com sucesso.',
          actionPlan: parsed.actionPlan || 'Acompanhamento contínuo dos alunos.',
          bodyText: parsed.bodyText || '',
          bodyHtml: parsed.bodyHtml || '',
          generatedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn("Aviso ao conectar com Gemini API (fallback ativado):", err);
    }
  }

  // Fallback Inteligente (Garante funcionamento 100% mesmo sem chave ou offline)
  return generateDeterministicReport(report);
}

function generateDeterministicReport(report: DailyReport): AiGeneratedReport {
  const presentCount = report.attendance.filter(a => a.status === 'PRESENTE').length;
  const total = report.attendance.length;
  const presencePct = total > 0 ? Math.round((presentCount / total) * 100) : 100;
  const absentees = report.attendance.filter(a => a.status !== 'PRESENTE');
  const lowPerformers = report.studentPerformances.filter(p => p.level === 'ABAIXO_DO_ESPERADO');
  const highPerformers = report.studentPerformances.filter(p => p.level === 'EXCELENTE');

  const subject = `[Reporte Diário] ${report.className} | ${formatDate(report.date)} - Presença: ${presencePct}%`;

  const executiveSummary = `No dia ${formatDate(report.date)}, foi ministrado o conteúdo relativo a "${report.topicsStudied}". A turma registrou uma taxa de presença de ${presencePct}% (${presentCount} de ${total} alunos). ` +
    (report.systemsStatus.operational
      ? 'A infraestrutura técnica e sistemas operacionais dos alunos funcionaram com 100% de estabilidade.'
      : `Houve registro de intercorrência técnica nos sistemas: ${report.systemsStatus.notes}.`) +
    (lowPerformers.length > 0
      ? ` Identificamos ${lowPerformers.length} aluno(s) que demandam atenção pedagógica imediata e plano de reforço individual.`
      : ' Todos os alunos acompanharam o ritmo das atividades práticas satisfatoriamente.');

  const actionPlan = lowPerformers.length > 0
    ? lowPerformers.map(p => `• Aluno ${p.studentName}: Diagnóstico: ${p.lowPerformanceReason}. Ação recomendada: Aplicação de mentoria individual de 20 minutos no início do próximo turno e revisão assistida de exercícios práticos.`).join('\n')
    : '• Manter o cronograma padrão e avançar para o próximo módulo com fixação prática.';

  const bodyText = `
PREZADOS GESTORES E EQUIPE DE COORDENAÇÃO,

Segue o reporte consolidado de treinamento referente à data de ${formatDate(report.date)}.

============================================================
1. IDENTIFICAÇÃO DA TURMA & INSTRUTOR
============================================================
• Turma: ${report.className}
• Data: ${formatDate(report.date)}
• Instrutor: ${report.instructorName}

============================================================
2. STATUS DOS SISTEMAS E FERRAMENTAS
============================================================
• Status Geral: ${report.systemsStatus.operational ? '✅ OPERACIONAL (Sem instabilidades)' : '⚠️ INSTABILIDADE / FALHA REPORTADA'}
• Detalhamento: ${report.systemsStatus.notes || 'Sistemas normais.'}

============================================================
3. ABSENTEÍSMO E FREQUÊNCIA
============================================================
• Presença Geral: ${presentCount}/${total} alunos (${presencePct}%)
${absentees.length > 0 ? absentees.map(a => `• [FALTA/ATRASO] ${a.studentName} (${a.status}): ${a.absenceReason || 'Sem justificativa informada'}`).join('\n') : '• Nenhuma falta registrada no dia.'}

============================================================
4. CONTEÚDO MINISTRADO & PRÁTICA
============================================================
• Tópicos Estudados: ${report.topicsStudied}
• Atividades Práticas: ${report.practicalExercises || 'Exercícios de fixação em ambiente de laboratório'}

============================================================
5. DESEMPENHO E ACOMPANHAMENTO INDIVIDUAL
============================================================
${highPerformers.length > 0 ? `• Destaques Positivos: ${highPerformers.map(h => h.studentName).join(', ')}\n` : ''}
${lowPerformers.length > 0 ? `• ALUNOS EM PONTO DE ATENÇÃO (BAIXO DESEMPENHO):\n${lowPerformers.map(p => `  - ${p.studentName}: ${p.lowPerformanceReason || 'Sem motivo registrado'}`).join('\n')}` : '• Desempenho geral alinhado às metas esperadas da turma.'}

============================================================
6. PLANO DE AÇÃO E DIRECIONAMENTO PEDAGÓGICO
============================================================
${actionPlan}

${report.generalObservations ? `Observações Adicionais: ${report.generalObservations}\n` : ''}
Atenciosamente,
${report.instructorName}
Instrutor / Treinador Responsável
`.trim();

  const bodyHtml = `
<div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 680px; margin: 0 auto; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #780318, #cc092f); color: white; padding: 24px; text-align: left;">
    <h2 style="margin: 0 0 6px 0; font-size: 20px;">Reporte Diário de Treinamento</h2>
    <p style="margin: 0; opacity: 0.95; font-size: 14px;">Turma: <strong>${report.className}</strong> | Data: <strong>${formatDate(report.date)}</strong></p>
  </div>
  
  <div style="padding: 24px;">
    <!-- Resumo Rápido -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
      <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; text-align: center;">
        <span style="font-size: 12px; color: #64748b; display: block;">Presença</span>
        <strong style="font-size: 18px; color: ${presencePct >= 85 ? '#16a34a' : '#ea580c'};">${presencePct}%</strong>
      </div>
      <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; text-align: center;">
        <span style="font-size: 12px; color: #64748b; display: block;">Sistemas Alunos</span>
        <strong style="font-size: 18px; color: ${report.systemsStatus.operational ? '#16a34a' : '#dc2626'};">${report.systemsStatus.operational ? '100% OK' : 'Com Falha'}</strong>
      </div>
      <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; text-align: center;">
        <span style="font-size: 12px; color: #64748b; display: block;">Pontos de Atenção</span>
        <strong style="font-size: 18px; color: ${lowPerformers.length > 0 ? '#dc2626' : '#16a34a'};">${lowPerformers.length} aluno(s)</strong>
      </div>
    </div>

    <!-- Sistemas -->
    <h3 style="font-size: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 18px;">1. Infraestrutura e Sistemas dos Alunos</h3>
    <p style="margin: 6px 0; font-size: 14px;"><strong>Status:</strong> ${report.systemsStatus.operational ? '<span style="color:#16a34a;">● Operacional e Estável</span>' : '<span style="color:#dc2626;">● Instabilidade Reportada</span>'}</p>
    <p style="margin: 6px 0; font-size: 14px; background: #f1f5f9; padding: 10px; border-radius: 6px;">${report.systemsStatus.notes || 'Nenhuma falha de sistema registrada.'}</p>

    <!-- Frequência -->
    <h3 style="font-size: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 20px;">2. Frequência e Absenteísmo</h3>
    <p style="font-size: 14px; margin: 6px 0;"><strong>Total presentes:</strong> ${presentCount} de ${total} alunos.</p>
    ${absentees.length > 0 ? `
    <ul style="margin: 6px 0 12px 18px; padding: 0; font-size: 14px; color: #b91c1c;">
      ${absentees.map(a => `<li><strong>${a.studentName}</strong> (${a.status}): ${a.absenceReason || 'Sem justificativa informada'}</li>`).join('')}
    </ul>` : '<p style="font-size: 14px; color: #16a34a; margin: 4px 0;">Nenhuma ausência registrada hoje.</p>'}

    <!-- Conteúdo -->
    <h3 style="font-size: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 20px;">3. Conteúdo Ministrado & Prática</h3>
    <p style="font-size: 14px; margin: 6px 0;"><strong>Tópicos:</strong> ${report.topicsStudied}</p>
    ${report.practicalExercises ? `<p style="font-size: 14px; margin: 6px 0;"><strong>Exercícios Práticos:</strong> ${report.practicalExercises}</p>` : ''}

    <!-- Desempenho e Baixo Rendimento -->
    <h3 style="font-size: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 20px;">4. Avaliação de Desempenho</h3>
    ${lowPerformers.length > 0 ? `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
        <h4 style="margin: 0 0 6px 0; color: #991b1b; font-size: 14px;">Alunos Abaixo do Desempenho Esperado:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #7f1d1d;">
          ${lowPerformers.map(p => `<li><strong>${p.studentName}:</strong> ${p.lowPerformanceReason || 'Sem justificativa preenchida'}</li>`).join('')}
        </ul>
      </div>
    ` : '<p style="font-size: 14px; color: #16a34a;">Nenhum aluno classificado abaixo do esperado no dia de hoje.</p>'}

    <!-- Ação Recomendada -->
    <h3 style="font-size: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 20px;">5. Plano de Intervenção Pedagógica</h3>
    <div style="font-size: 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 6px;">
      ${actionPlan.split('\n').map(l => `<p style="margin: 4px 0;">${l}</p>`).join('')}
    </div>

    <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
      <p style="margin: 2px 0;"><strong>Instrutor Responsável:</strong> ${report.instructorName}</p>
      <p style="margin: 2px 0;">Relatório gerado via Sistema Integrado de Treinamento</p>
    </div>
  </div>
</div>
`.trim();

  return {
    subject,
    executiveSummary,
    actionPlan,
    bodyText,
    bodyHtml,
    generatedAt: new Date().toISOString()
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
