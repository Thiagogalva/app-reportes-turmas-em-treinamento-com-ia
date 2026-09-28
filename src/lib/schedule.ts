import { ClassGroup, ScheduleDay } from '@/types';
import { addDays, todayStr, daysBetween, formatDatePtBr } from './sla';

/**
 * Gera um cronograma padrão de N dias corridos, um item por dia útil de
 * treinamento, começando na data de início da turma.
 */
export function generateDefaultSchedule(startDate: string, numberOfDays: number): ScheduleDay[] {
  const days: ScheduleDay[] = [];
  for (let i = 0; i < numberOfDays; i++) {
    days.push({
      id: `sched-${Date.now()}-${i}`,
      dayNumber: i + 1,
      title: `Dia ${i + 1}`,
      plannedDate: addDays(startDate, i),
      completed: false,
    });
  }
  return days;
}

export interface ScheduleDeviationResult {
  hasSchedule: boolean;
  lateItems: (ScheduleDay & { daysLate: number })[];
  maxDaysLate: number;
  alert: boolean; // true quando o pior atraso é >= 2 dias
}

/**
 * Avalia o cronograma de uma turma e identifica itens atrasados (não
 * concluídos até hoje, com data planejada já vencida). Um desvio de 2 dias ou
 * mais entra em alerta nos gráficos do Dashboard.
 */
export function evaluateScheduleDeviation(schedule: ScheduleDay[] | undefined): ScheduleDeviationResult {
  if (!schedule || schedule.length === 0) {
    return { hasSchedule: false, lateItems: [], maxDaysLate: 0, alert: false };
  }

  const today = todayStr();
  const lateItems = schedule
    .filter(item => !item.completed && item.plannedDate < today)
    .map(item => ({ ...item, daysLate: daysBetween(item.plannedDate, today) }))
    .sort((a, b) => b.daysLate - a.daysLate);

  const maxDaysLate = lateItems.length > 0 ? lateItems[0].daysLate : 0;

  return {
    hasSchedule: true,
    lateItems,
    maxDaysLate,
    alert: maxDaysLate >= 2,
  };
}

export function evaluateClassScheduleDeviation(classGroup: ClassGroup): ScheduleDeviationResult {
  return evaluateScheduleDeviation(classGroup.schedule);
}

export { formatDatePtBr };
