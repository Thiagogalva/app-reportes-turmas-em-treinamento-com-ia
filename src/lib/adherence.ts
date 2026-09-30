import { ClassGroup, DailyReport } from '@/types';
import { todayStr } from './sla';

/**
 * Retorna todas as datas de dia útil (segunda a sexta) entre start e end,
 * inclusive nos dois extremos, no formato YYYY-MM-DD.
 */
export function getBusinessDaysInRange(start: string, end: string): string[] {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const startDate = new Date(Date.UTC(sy, sm - 1, sd));
  const endDate = new Date(Date.UTC(ey, em - 1, ed));

  const days: string[] = [];
  const cursor = new Date(startDate);
  let guard = 0;
  while (cursor <= endDate && guard < 400) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      days.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    guard++;
  }
  return days;
}

export interface ClassAdherenceResult {
  classId: string;
  className: string;
  expectedDays: string[];
  submittedDays: string[];
  missingDays: string[];
  adherencePercent: number; // 0-100
  reportedToday: boolean;
  todayIsExpected: boolean;
}

/**
 * Calcula a aderência de reporte diário de uma turma: dos dias úteis desde o
 * início da turma até hoje (ou até a conclusão, se já concluída), quantos
 * tiveram um reporte lançado pelo instrutor.
 */
export function evaluateClassAdherence(classGroup: ClassGroup, reports: DailyReport[]): ClassAdherenceResult {
  const today = todayStr();
  const rangeEnd = classGroup.endDate && classGroup.endDate < today ? classGroup.endDate : today;
  const expectedDays = classGroup.startDate <= rangeEnd
    ? getBusinessDaysInRange(classGroup.startDate, rangeEnd)
    : [];

  const classReportDates = new Set(
    reports.filter(r => r.classId === classGroup.id).map(r => r.date)
  );

  const submittedDays = expectedDays.filter(d => classReportDates.has(d));
  const missingDays = expectedDays.filter(d => !classReportDates.has(d));
  const adherencePercent = expectedDays.length > 0
    ? Math.round((submittedDays.length / expectedDays.length) * 100)
    : 100;

  const todayDow = new Date(`${today}T12:00:00Z`).getUTCDay();
  const todayIsExpected = todayDow !== 0 && todayDow !== 6 && classGroup.startDate <= today && rangeEnd === today;

  return {
    classId: classGroup.id,
    className: classGroup.name,
    expectedDays,
    submittedDays,
    missingDays,
    adherencePercent,
    reportedToday: classReportDates.has(today),
    todayIsExpected,
  };
}
