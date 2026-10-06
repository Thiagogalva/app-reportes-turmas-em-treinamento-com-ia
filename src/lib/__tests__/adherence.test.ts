import { describe, it, expect } from 'vitest';
import { getBusinessDaysInRange, evaluateClassAdherence } from '../adherence';
import { ClassGroup, DailyReport } from '@/types';

describe('getBusinessDaysInRange', () => {
  it('conta corretamente dias úteis numa semana cheia (seg a sex)', () => {
    // 2026-09-14 é segunda, 2026-09-18 é sexta
    const days = getBusinessDaysInRange('2026-09-14', '2026-09-18');
    expect(days).toHaveLength(5);
    expect(days).toEqual(['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18']);
  });

  it('exclui sábado e domingo de uma semana completa', () => {
    // 2026-09-14 (seg) até 2026-09-20 (dom) = 7 dias corridos, 5 úteis
    const days = getBusinessDaysInRange('2026-09-14', '2026-09-20');
    expect(days).toHaveLength(5);
    expect(days).not.toContain('2026-09-19'); // sábado
    expect(days).not.toContain('2026-09-20'); // domingo
  });

  it('início e fim no mesmo dia útil retorna só esse dia', () => {
    const days = getBusinessDaysInRange('2026-09-16', '2026-09-16'); // quarta
    expect(days).toEqual(['2026-09-16']);
  });

  it('início e fim no mesmo fim de semana retorna lista vazia', () => {
    const days = getBusinessDaysInRange('2026-09-19', '2026-09-20'); // sáb e dom
    expect(days).toEqual([]);
  });

  it('atravessa duas semanas corretamente (11 dias úteis em 2 semanas)', () => {
    const days = getBusinessDaysInRange('2026-09-16', '2026-09-30');
    expect(days).toHaveLength(11);
  });
});

function makeClass(overrides: Partial<ClassGroup>): ClassGroup {
  return {
    id: 'c1', name: 'Turma Teste', code: 'T1', instructor: 'Fulano',
    status: 'EM_TREINAMENTO', startDate: '2026-09-16', students: [],
    createdAt: '', updatedAt: '', ...overrides,
  };
}

function makeReport(classId: string, date: string): DailyReport {
  return {
    id: `r-${date}`, classId, className: 'Turma Teste', instructorName: 'Fulano', date,
    systemsStatus: { operational: true, notes: '' },
    topicsStudied: '', attendance: [], studentPerformances: [],
    createdAt: '', updatedAt: '',
  };
}

describe('evaluateClassAdherence', () => {
  it('100% de aderência quando todos os dias úteis têm reporte', () => {
    const classGroup = makeClass({ startDate: '2026-09-16', endDate: '2026-09-18' });
    const reports = [
      makeReport('c1', '2026-09-16'),
      makeReport('c1', '2026-09-17'),
      makeReport('c1', '2026-09-18'),
    ];
    const result = evaluateClassAdherence(classGroup, reports);
    expect(result.expectedDays).toHaveLength(3);
    expect(result.adherencePercent).toBe(100);
    expect(result.missingDays).toHaveLength(0);
  });

  it('0% de aderência quando nenhum dia foi reportado', () => {
    const classGroup = makeClass({ startDate: '2026-09-16', endDate: '2026-09-18' });
    const result = evaluateClassAdherence(classGroup, []);
    expect(result.adherencePercent).toBe(0);
    expect(result.missingDays).toHaveLength(3);
  });

  it('calcula porcentagem parcial corretamente (2 de 3 dias = 67%)', () => {
    const classGroup = makeClass({ startDate: '2026-09-16', endDate: '2026-09-18' });
    const reports = [makeReport('c1', '2026-09-16'), makeReport('c1', '2026-09-17')];
    const result = evaluateClassAdherence(classGroup, reports);
    expect(result.adherencePercent).toBe(67); // Math.round(2/3 * 100)
  });

  it('ignora reportes de OUTRAS turmas no cálculo', () => {
    const classGroup = makeClass({ startDate: '2026-09-16', endDate: '2026-09-16' });
    const reports = [makeReport('turma-de-outra-pessoa', '2026-09-16')];
    const result = evaluateClassAdherence(classGroup, reports);
    expect(result.adherencePercent).toBe(0);
  });

  it('turma sem nenhum dia útil decorrido retorna 100% (nada esperado ainda)', () => {
    const classGroup = makeClass({ startDate: '2026-09-19', endDate: '2026-09-20' }); // só fim de semana
    const result = evaluateClassAdherence(classGroup, []);
    expect(result.expectedDays).toHaveLength(0);
    expect(result.adherencePercent).toBe(100);
  });
});
