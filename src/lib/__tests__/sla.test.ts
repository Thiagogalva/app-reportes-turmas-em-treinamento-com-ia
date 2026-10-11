import { describe, it, expect, vi, afterEach } from 'vitest';
import { addDays, daysBetween, calculateSlaDeadline, evaluateSlaImpact, formatDatePtBr, todayStr } from '../sla';

describe('todayStr', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('usa o dia correto do horário de Brasília, mesmo quando já é o dia seguinte em UTC', () => {
    // 01:30 UTC de 05/10 = 22:30 em Brasília, ainda 04/10 — cenário real do
    // bug relatado: perto da virada do dia, o servidor (UTC) já achava que
    // era "amanhã" enquanto no Brasil ainda era "hoje".
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-05T01:30:00.000Z'));
    expect(todayStr()).toBe('2026-10-04');
  });

  it('bate com UTC em horários "de dia" (sem risco de virada), só pra garantir consistência', () => {
    // 15:00 UTC = 12:00 em Brasília, mesmo dia calendário nos dois fusos.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-04T15:00:00.000Z'));
    expect(todayStr()).toBe('2026-10-04');
  });

  it('não vira o dia cedo demais — meia-noite em Brasília só acontece às 03:00 UTC', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-05T02:59:00.000Z')); // 23:59 em Brasília, ainda 04/10
    expect(todayStr()).toBe('2026-10-04');
    vi.setSystemTime(new Date('2026-10-05T03:00:00.000Z')); // 00:00 em Brasília, já 05/10
    expect(todayStr()).toBe('2026-10-05');
  });
});

describe('addDays', () => {
  it('soma dias corridos dentro do mesmo mês', () => {
    expect(addDays('2026-09-01', 5)).toBe('2026-09-06');
  });

  it('atravessa a virada de mês corretamente', () => {
    expect(addDays('2026-09-28', 5)).toBe('2026-10-03');
  });

  it('atravessa a virada de ano corretamente', () => {
    expect(addDays('2026-12-29', 5)).toBe('2027-01-03');
  });

  it('lida com ano bissexto (2028 é bissexto)', () => {
    expect(addDays('2028-02-27', 2)).toBe('2028-02-29');
  });

  it('soma zero dias retorna a mesma data', () => {
    expect(addDays('2026-09-01', 0)).toBe('2026-09-01');
  });
});

describe('daysBetween', () => {
  it('calcula a diferença correta entre duas datas', () => {
    expect(daysBetween('2026-09-01', '2026-09-10')).toBe(9);
  });

  it('retorna negativo quando a primeira data é posterior', () => {
    expect(daysBetween('2026-09-10', '2026-09-01')).toBe(-9);
  });

  it('retorna zero para datas iguais', () => {
    expect(daysBetween('2026-09-01', '2026-09-01')).toBe(0);
  });
});

describe('calculateSlaDeadline', () => {
  it('calcula o prazo corretamente quando slaDays é positivo', () => {
    expect(calculateSlaDeadline('2026-09-01', 10)).toBe('2026-09-11');
  });

  it('retorna null quando slaDays não está definido', () => {
    expect(calculateSlaDeadline('2026-09-01', undefined)).toBeNull();
  });

  it('retorna null quando slaDays é zero', () => {
    expect(calculateSlaDeadline('2026-09-01', 0)).toBeNull();
  });

  it('retorna null quando slaDays é negativo', () => {
    expect(calculateSlaDeadline('2026-09-01', -5)).toBeNull();
  });
});

describe('evaluateSlaImpact', () => {
  it('não gera impacto quando o segmento não tem SLA configurado', () => {
    const result = evaluateSlaImpact('2026-09-01', '2026-09-10', undefined);
    expect(result.hasSla).toBe(false);
    expect(result.impacted).toBe(false);
  });

  it('marca como impactada quando o prazo de acesso passa da data de término', () => {
    // início 01/09 + 10 dias = prazo 11/09, mas a turma termina em 05/09 → impactada
    const result = evaluateSlaImpact('2026-09-01', '2026-09-05', 10);
    expect(result.hasSla).toBe(true);
    expect(result.impacted).toBe(true);
    expect(result.deadline).toBe('2026-09-11');
    expect(result.daysOverdue).toBe(6);
  });

  it('NÃO marca como impactada quando o prazo de acesso cabe antes do término', () => {
    // início 01/09 + 3 dias = prazo 04/09, turma termina em 10/09 → dentro do prazo
    const result = evaluateSlaImpact('2026-09-01', '2026-09-10', 3);
    expect(result.hasSla).toBe(true);
    expect(result.impacted).toBe(false);
  });

  it('turma sem data de término usa a data de hoje como referência', () => {
    const farPast = evaluateSlaImpact('2020-01-01', undefined, 5);
    expect(farPast.hasSla).toBe(true);
    expect(farPast.impacted).toBe(true); // prazo de 2020 já passou muito de "hoje"
  });

  it('considera o prazo exatamente igual à data de término como dentro do prazo (não impactada)', () => {
    const result = evaluateSlaImpact('2026-09-01', '2026-09-11', 10);
    expect(result.impacted).toBe(false);
  });
});

describe('formatDatePtBr', () => {
  it('formata uma data YYYY-MM-DD para DD/MM/YYYY', () => {
    expect(formatDatePtBr('2026-09-05')).toBe('05/09/2026');
  });
});
