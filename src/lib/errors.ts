import { DailyReport, Chamado } from '@/types';

export interface ErrorIncident {
  id: string;
  classId: string;
  className: string;
  systemId: string;
  systemName: string;
  date: string;
  instructorName: string;
  reportId: string;
  notes: string;
  hasEvidence: boolean;
  evidenceImageDataUrl?: string;
  chamado: Chamado | null;
}

/**
 * Cruza os reportes diários (sistemas marcados como com falha) com os
 * chamados cadastrados, para montar a lista de "incidentes de erro" — cada
 * sistema com problema reportado numa turma, num dia específico, e se já
 * existe (ou não) um chamado aberto para tratar aquilo.
 */
export function buildErrorIncidents(reports: DailyReport[], chamados: Chamado[]): ErrorIncident[] {
  const incidents: ErrorIncident[] = [];

  for (const r of reports) {
    if (!r.systemsStatus || r.systemsStatus.operational) continue;
    const affected = r.systemsStatus.affectedSystems || [];

    for (const systemId of affected) {
      const evidence = r.systemsStatus.evidences?.find(e => e.systemId === systemId);

      // Prioriza um chamado vinculado especificamente a esse sistema; na
      // falta disso, considera qualquer chamado de erro já aberto pra turma
      // (melhor que nada, já que chamados antigos podem não ter o vínculo).
      const chamado =
        chamados.find(c => c.classId === r.classId && c.relatedSystemId === systemId) ||
        chamados.find(c => c.classId === r.classId && c.type === 'ERRO_SISTEMA' && !c.relatedSystemId) ||
        null;

      incidents.push({
        id: `${r.id}-${systemId}`,
        classId: r.classId,
        className: r.className,
        systemId,
        systemName: evidence?.systemName || systemId,
        date: r.date,
        instructorName: r.instructorName,
        reportId: r.id,
        notes: r.systemsStatus.notes,
        hasEvidence: !!evidence,
        evidenceImageDataUrl: evidence?.imageDataUrl,
        chamado,
      });
    }
  }

  return incidents.sort((a, b) => b.date.localeCompare(a.date));
}
