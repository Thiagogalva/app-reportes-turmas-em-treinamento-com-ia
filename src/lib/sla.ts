import { ClassGroup, Segment } from '@/types';

/**
 * Soma dias corridos a uma data no formato YYYY-MM-DD, retornando no mesmo formato.
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calcula a data-limite (deadline) em que os acessos de uma turma deveriam
 * estar liberados, com base na data de início da turma + o prazo de SLA (em
 * dias) configurado no segmento. Retorna null se o segmento não tiver SLA
 * configurado.
 */
export function calculateSlaDeadline(startDate: string, slaDays: number | undefined | null): string | null {
  if (!slaDays || slaDays <= 0 || !startDate) return null;
  return addDays(startDate, slaDays);
}

export interface SlaImpactResult {
  hasSla: boolean;
  deadline: string | null;
  impacted: boolean;
  reason: string;
  daysOverdue?: number;
}

/**
 * Determina se uma turma (real ou simulada) sofre impacto de SLA:
 * - Se a turma já tem data de término: o impacto ocorre quando o prazo de
 *   liberação dos acessos (deadline) cai DEPOIS da data de término — ou seja,
 *   os operadores terminariam o treinamento sem ainda ter acesso liberado.
 * - Se a turma ainda está em andamento (sem data de término): o impacto
 *   ocorre quando o deadline já passou da data de hoje.
 */
export function evaluateSlaImpact(
  startDate: string,
  endDate: string | undefined | null,
  slaDays: number | undefined | null
): SlaImpactResult {
  const deadline = calculateSlaDeadline(startDate, slaDays);

  if (!deadline) {
    return { hasSla: false, deadline: null, impacted: false, reason: 'Segmento sem prazo de SLA configurado.' };
  }

  const reference = endDate || todayStr();
  const impacted = deadline > reference;

  if (impacted) {
    const daysOverdue = daysBetween(reference, deadline);
    return {
      hasSla: true,
      deadline,
      impacted: true,
      reason: endDate
        ? `Os acessos só seriam liberados em ${formatDatePtBr(deadline)}, ${daysOverdue} dia(s) após o término previsto da turma (${formatDatePtBr(endDate)}).`
        : `O prazo de liberação de acessos (${formatDatePtBr(deadline)}) já venceu e a turma ainda está em treinamento.`,
      daysOverdue,
    };
  }

  return {
    hasSla: true,
    deadline,
    impacted: false,
    reason: `Acessos previstos para ${formatDatePtBr(deadline)}, dentro do prazo.`,
  };
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const dateA = Date.UTC(ay, am - 1, ad);
  const dateB = Date.UTC(by, bm - 1, bd);
  return Math.round((dateB - dateA) / (1000 * 60 * 60 * 24));
}

export function formatDatePtBr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Avalia o impacto de SLA para uma turma real, buscando o segmento correspondente.
 */
export function evaluateClassSlaImpact(classGroup: ClassGroup, segments: Segment[]): SlaImpactResult {
  const segment = segments.find(s => s.id === classGroup.segmentId);
  return evaluateSlaImpact(classGroup.startDate, classGroup.endDate, segment?.slaDays);
}
