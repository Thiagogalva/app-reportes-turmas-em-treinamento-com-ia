import { describe, it, expect } from 'vitest';
import { purgeExpiredEvidences, purgeOrphanedEvidences, stripEvidencesForClass } from '../db';

function makeReport(classId: string, evidences: any[]) {
  return {
    id: `r-${classId}`,
    classId,
    systemsStatus: { operational: false, notes: '', evidences },
  };
}

function makeEvidence(id: string, expiresAt: string) {
  return { id, systemId: 'sys-geo', systemName: 'Sistema GEO', imageDataUrl: 'data:...', uploadedAt: '', expiresAt };
}

describe('purgeExpiredEvidences', () => {
  it('remove evidências com data de expiração no passado', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(); // ontem
    const reports = [makeReport('c1', [makeEvidence('e1', past)])];
    const { reports: result, changed } = purgeExpiredEvidences(reports);
    expect(changed).toBe(true);
    expect(result[0].systemsStatus.evidences).toHaveLength(0);
  });

  it('mantém evidências cuja expiração ainda não chegou', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // amanhã
    const reports = [makeReport('c1', [makeEvidence('e1', future)])];
    const { reports: result, changed } = purgeExpiredEvidences(reports);
    expect(changed).toBe(false);
    expect(result[0].systemsStatus.evidences).toHaveLength(1);
  });

  it('reporte sem evidência nenhuma não é afetado', () => {
    const reports = [{ id: 'r1', classId: 'c1', systemsStatus: { operational: true, notes: '' } }];
    const { changed } = purgeExpiredEvidences(reports);
    expect(changed).toBe(false);
  });

  it('lista de reportes undefined retorna lista vazia sem erro', () => {
    const { reports, changed } = purgeExpiredEvidences(undefined);
    expect(reports).toEqual([]);
    expect(changed).toBe(false);
  });
});

describe('purgeOrphanedEvidences', () => {
  it('remove evidências de turmas que não existem mais', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const reports = [makeReport('turma-deletada', [makeEvidence('e1', future)])];
    const existingClassIds = new Set(['turma-que-ainda-existe']);
    const { reports: result, changed } = purgeOrphanedEvidences(reports, existingClassIds);
    expect(changed).toBe(true);
    expect(result[0].systemsStatus.evidences).toHaveLength(0);
  });

  it('mantém evidências de turmas que ainda existem', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const reports = [makeReport('c1', [makeEvidence('e1', future)])];
    const existingClassIds = new Set(['c1']);
    const { reports: result, changed } = purgeOrphanedEvidences(reports, existingClassIds);
    expect(changed).toBe(false);
    expect(result[0].systemsStatus.evidences).toHaveLength(1);
  });
});

describe('stripEvidencesForClass', () => {
  it('remove TODAS as evidências da turma indicada, mesmo não expiradas', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const reports = [makeReport('c1', [makeEvidence('e1', future), makeEvidence('e2', future)])];
    const { reports: result, changed } = stripEvidencesForClass(reports, 'c1');
    expect(changed).toBe(true);
    expect(result[0].systemsStatus.evidences).toHaveLength(0);
  });

  it('NÃO afeta evidências de outras turmas', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const reports = [
      makeReport('c1', [makeEvidence('e1', future)]),
      makeReport('c2', [makeEvidence('e2', future)]),
    ];
    const { reports: result, changed } = stripEvidencesForClass(reports, 'c1');
    expect(changed).toBe(true);
    expect(result[0].systemsStatus.evidences).toHaveLength(0); // c1 limpo
    expect(result[1].systemsStatus.evidences).toHaveLength(1); // c2 intacto
  });

  it('turma sem nenhuma evidência não marca como alterado', () => {
    const reports = [{ id: 'r1', classId: 'c1', systemsStatus: { operational: true, notes: '' } }];
    const { changed } = stripEvidencesForClass(reports, 'c1');
    expect(changed).toBe(false);
  });
});
