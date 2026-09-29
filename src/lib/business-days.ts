/**
 * Soma dias ÚTEIS (Dias Úteis / DU) a uma data — pula sábados e domingos.
 * Não considera feriados (calendário de feriados não está mapeado no sistema).
 */
export function addBusinessDays(dateStr: string, businessDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  let remaining = businessDays;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const dayOfWeek = date.getUTCDay(); // 0 = domingo, 6 = sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining--;
    }
  }
  return date.toISOString().slice(0, 10);
}
