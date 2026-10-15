import { ClassGroup, Segment, SegmentSystem } from '@/types';

/**
 * Liberação gradual de sistemas: cada sistema do segmento tem uma "etapa de
 * liberação" (1 = disponível desde o início; 2, 3... = liberados depois), e
 * cada turma tem a etapa atualmente liberada. Sistemas de etapas acima da
 * liberada ainda não existem para aquela turma — não são testados no report
 * nem contam como falha.
 *
 * Compatibilidade: turma sem `releasedStage` = todas as etapas liberadas
 * (comportamento anterior, antes dessa funcionalidade existir).
 */

export function getSystemStage(system: SegmentSystem): number {
  return system.releaseStage && system.releaseStage >= 1 ? Math.floor(system.releaseStage) : 1;
}

/** Maior etapa existente no segmento (mínimo 1). */
export function getMaxStage(segment: Segment | undefined | null): number {
  if (!segment || !segment.systems || segment.systems.length === 0) return 1;
  return Math.max(1, ...segment.systems.map(getSystemStage));
}

/** Etapa efetivamente liberada para a turma (sem valor definido = tudo liberado). */
export function getReleasedStage(classGroup: ClassGroup | undefined | null, segment: Segment | undefined | null): number {
  const max = getMaxStage(segment);
  if (!classGroup || classGroup.releasedStage == null) return max;
  return Math.min(Math.max(1, Math.floor(classGroup.releasedStage)), Math.max(max, 1));
}

export function isSystemReleased(system: SegmentSystem, classGroup: ClassGroup | undefined | null, segment: Segment | undefined | null): boolean {
  return getSystemStage(system) <= getReleasedStage(classGroup, segment);
}

export function getReleasedSystems(classGroup: ClassGroup | undefined | null, segment: Segment | undefined | null): SegmentSystem[] {
  return (segment?.systems || []).filter(s => isSystemReleased(s, classGroup, segment));
}

export function getPendingSystems(classGroup: ClassGroup | undefined | null, segment: Segment | undefined | null): SegmentSystem[] {
  return (segment?.systems || []).filter(s => !isSystemReleased(s, classGroup, segment));
}

export interface StageSummary {
  hasStages: boolean;      // o segmento tem mais de uma etapa?
  current: number;
  max: number;
  allReleased: boolean;
  pendingCount: number;
}

export function getStageSummary(classGroup: ClassGroup | undefined | null, segment: Segment | undefined | null): StageSummary {
  const max = getMaxStage(segment);
  const current = getReleasedStage(classGroup, segment);
  return {
    hasStages: max > 1,
    current,
    max,
    allReleased: current >= max,
    pendingCount: getPendingSystems(classGroup, segment).length,
  };
}
