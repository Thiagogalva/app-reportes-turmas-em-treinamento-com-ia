import { describe, it, expect } from 'vitest';
import {
  getSystemStage,
  getMaxStage,
  getReleasedStage,
  isSystemReleased,
  getReleasedSystems,
  getPendingSystems,
  getStageSummary,
} from '../stages';
import { ClassGroup, Segment, SegmentSystem } from '@/types';

const sys = (id: string, releaseStage?: number): SegmentSystem => ({ id, name: id, releaseStage });

function makeSegment(systems: SegmentSystem[]): Segment {
  return { id: 's1', name: 'Varejo', systems, createdAt: '', updatedAt: '' };
}

function makeClass(releasedStage?: number): ClassGroup {
  return {
    id: 'c1', name: 'Turma', code: 'T1', instructor: 'X', status: 'EM_TREINAMENTO',
    startDate: '2026-09-01', students: [], releasedStage, createdAt: '', updatedAt: '',
  };
}

// Cenário real descrito: login de rede -> login M (cliente) -> demais sistemas
const segment = makeSegment([
  sys('login-rede', 1),
  sys('login-m', 2),
  sys('geo', 3),
  sys('wde', 3),
]);

describe('getSystemStage', () => {
  it('sem etapa definida, o sistema é da etapa 1 (disponível desde o início)', () => {
    expect(getSystemStage(sys('a'))).toBe(1);
  });
  it('valores inválidos (0, negativo) caem na etapa 1', () => {
    expect(getSystemStage(sys('a', 0))).toBe(1);
    expect(getSystemStage(sys('a', -2))).toBe(1);
  });
  it('respeita a etapa definida', () => {
    expect(getSystemStage(sys('a', 3))).toBe(3);
  });
});

describe('getMaxStage', () => {
  it('é a maior etapa entre os sistemas', () => {
    expect(getMaxStage(segment)).toBe(3);
  });
  it('segmento sem sistemas ou indefinido tem etapa máxima 1', () => {
    expect(getMaxStage(makeSegment([]))).toBe(1);
    expect(getMaxStage(undefined)).toBe(1);
  });
});

describe('getReleasedStage — compatibilidade', () => {
  it('turma sem releasedStage = todas as etapas liberadas (comportamento antigo)', () => {
    expect(getReleasedStage(makeClass(undefined), segment)).toBe(3);
  });
  it('respeita a etapa definida na turma', () => {
    expect(getReleasedStage(makeClass(2), segment)).toBe(2);
  });
  it('nunca passa da etapa máxima do segmento', () => {
    expect(getReleasedStage(makeClass(99), segment)).toBe(3);
  });
  it('nunca fica abaixo de 1', () => {
    expect(getReleasedStage(makeClass(0), segment)).toBe(1);
  });
});

describe('sistemas liberados x pendentes', () => {
  it('etapa 1: só o login de rede está liberado', () => {
    const released = getReleasedSystems(makeClass(1), segment).map(s => s.id);
    expect(released).toEqual(['login-rede']);
    expect(getPendingSystems(makeClass(1), segment).map(s => s.id)).toEqual(['login-m', 'geo', 'wde']);
  });

  it('etapa 2: login de rede + login M', () => {
    expect(getReleasedSystems(makeClass(2), segment).map(s => s.id)).toEqual(['login-rede', 'login-m']);
  });

  it('etapa 3: todos liberados, nenhum pendente', () => {
    expect(getReleasedSystems(makeClass(3), segment)).toHaveLength(4);
    expect(getPendingSystems(makeClass(3), segment)).toHaveLength(0);
  });

  it('duas turmas do mesmo segmento podem estar em etapas diferentes', () => {
    expect(isSystemReleased(sys('geo', 3), makeClass(1), segment)).toBe(false);
    expect(isSystemReleased(sys('geo', 3), makeClass(3), segment)).toBe(true);
  });
});

describe('getStageSummary', () => {
  it('resume a etapa atual da turma', () => {
    const summary = getStageSummary(makeClass(2), segment);
    expect(summary).toEqual({ hasStages: true, current: 2, max: 3, allReleased: false, pendingCount: 2 });
  });

  it('segmento sem etapas (tudo etapa 1) não tem estágios', () => {
    const flat = makeSegment([sys('a'), sys('b')]);
    const summary = getStageSummary(makeClass(1), flat);
    expect(summary.hasStages).toBe(false);
    expect(summary.allReleased).toBe(true);
    expect(summary.pendingCount).toBe(0);
  });
});
