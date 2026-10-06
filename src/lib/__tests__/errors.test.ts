import { describe, it, expect } from 'vitest';
import { buildErrorIncidents } from '../errors';
import { DailyReport, Chamado } from '@/types';

function makeReport(overrides: Partial<DailyReport>): DailyReport {
  return {
    id: 'r1', classId: 'c1', className: 'Turma X', instructorName: 'Fulano', date: '2026-09-20',
    systemsStatus: { operational: false, notes: 'falhou', affectedSystems: ['sys-geo'] },
    topicsStudied: '', attendance: [], studentPerformances: [],
    createdAt: '', updatedAt: '',
    ...overrides,
  } as DailyReport;
}

function makeChamado(overrides: Partial<Chamado>): Chamado {
  return {
    id: 'cham1', numeroChamado: 'INC001', classId: 'c1', className: 'Turma X',
    type: 'ERRO_SISTEMA', slaDays: 5, openedDate: '2026-09-20', status: 'PENDENTE',
    createdAt: '', updatedAt: '', ...overrides,
  };
}

describe('buildErrorIncidents', () => {
  it('ignora reportes com sistemas 100% operacionais', () => {
    const reports = [makeReport({ systemsStatus: { operational: true, notes: '' } })];
    expect(buildErrorIncidents(reports, [])).toHaveLength(0);
  });

  it('gera um incidente por sistema afetado no reporte', () => {
    const reports = [makeReport({ systemsStatus: { operational: false, notes: '', affectedSystems: ['sys-geo', 'sys-wde'] } })];
    const incidents = buildErrorIncidents(reports, []);
    expect(incidents).toHaveLength(2);
    expect(incidents.map(i => i.systemId).sort()).toEqual(['sys-geo', 'sys-wde']);
  });

  it('incidente sem chamado algum fica com chamado=null', () => {
    const incidents = buildErrorIncidents([makeReport({})], []);
    expect(incidents[0].chamado).toBeNull();
  });

  it('vincula corretamente ao chamado com relatedSystemId específico', () => {
    const chamados = [makeChamado({ relatedSystemId: 'sys-geo' })];
    const incidents = buildErrorIncidents([makeReport({})], chamados);
    expect(incidents[0].chamado?.numeroChamado).toBe('INC001');
  });

  it('NÃO vincula a um chamado de outro sistema da mesma turma', () => {
    const chamados = [makeChamado({ relatedSystemId: 'sys-wde' })]; // sistema diferente
    const incidents = buildErrorIncidents([makeReport({})], chamados); // erro é no sys-geo
    expect(incidents[0].chamado).toBeNull();
  });

  it('usa um chamado genérico (sem relatedSystemId) como fallback', () => {
    const chamados = [makeChamado({ relatedSystemId: undefined })];
    const incidents = buildErrorIncidents([makeReport({})], chamados);
    expect(incidents[0].chamado?.numeroChamado).toBe('INC001');
  });

  it('prioriza o chamado específico do sistema sobre o genérico, quando ambos existem', () => {
    const chamados = [
      makeChamado({ id: 'generico', numeroChamado: 'GENERICO', relatedSystemId: undefined }),
      makeChamado({ id: 'especifico', numeroChamado: 'ESPECIFICO', relatedSystemId: 'sys-geo' }),
    ];
    const incidents = buildErrorIncidents([makeReport({})], chamados);
    expect(incidents[0].chamado?.numeroChamado).toBe('ESPECIFICO');
  });

  it('NÃO vincula a um chamado de outra turma', () => {
    const chamados = [makeChamado({ classId: 'outra-turma', relatedSystemId: 'sys-geo' })];
    const incidents = buildErrorIncidents([makeReport({})], chamados);
    expect(incidents[0].chamado).toBeNull();
  });

  it('identifica corretamente quando há evidência anexada', () => {
    const reports = [makeReport({
      systemsStatus: {
        operational: false, notes: '', affectedSystems: ['sys-geo'],
        evidences: [{ id: 'e1', systemId: 'sys-geo', systemName: 'Sistema GEO', imageDataUrl: 'data:...', uploadedAt: '', expiresAt: '' }],
      },
    })];
    const incidents = buildErrorIncidents(reports, []);
    expect(incidents[0].hasEvidence).toBe(true);
    expect(incidents[0].systemName).toBe('Sistema GEO');
  });

  it('ordena os incidentes do mais recente para o mais antigo', () => {
    const reports = [
      makeReport({ id: 'r1', date: '2026-09-10' }),
      makeReport({ id: 'r2', date: '2026-09-20' }),
    ];
    const incidents = buildErrorIncidents(reports, []);
    expect(incidents[0].date).toBe('2026-09-20');
    expect(incidents[1].date).toBe('2026-09-10');
  });
});
