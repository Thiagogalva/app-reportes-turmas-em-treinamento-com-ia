import { describe, it, expect } from 'vitest';
import { generateDefaultSchedule, evaluateScheduleDeviation, evaluateClassScheduleDeviation } from '../schedule';
import { addDays, todayStr } from '../sla';
import { ClassGroup, ScheduleDay } from '@/types';

describe('generateDefaultSchedule', () => {
  it('gera o número correto de dias, sequenciais a partir do início', () => {
    const schedule = generateDefaultSchedule('2026-09-01', 5);
    expect(schedule).toHaveLength(5);
    expect(schedule[0].dayNumber).toBe(1);
    expect(schedule[0].plannedDate).toBe('2026-09-01');
    expect(schedule[4].dayNumber).toBe(5);
    expect(schedule[4].plannedDate).toBe('2026-09-05');
  });

  it('todos os dias começam como não concluídos', () => {
    const schedule = generateDefaultSchedule('2026-09-01', 3);
    expect(schedule.every(d => d.completed === false)).toBe(true);
  });

  it('gera ids únicos para cada dia', () => {
    const schedule = generateDefaultSchedule('2026-09-01', 3);
    const ids = new Set(schedule.map(d => d.id));
    expect(ids.size).toBe(3);
  });
});

describe('evaluateScheduleDeviation', () => {
  const today = todayStr();

  it('turma sem cronograma não tem desvio', () => {
    const result = evaluateScheduleDeviation(undefined);
    expect(result.hasSchedule).toBe(false);
    expect(result.alert).toBe(false);
  });

  it('cronograma vazio não tem desvio', () => {
    const result = evaluateScheduleDeviation([]);
    expect(result.hasSchedule).toBe(false);
  });

  it('dia planejado para o futuro NÃO é considerado atrasado', () => {
    const schedule: ScheduleDay[] = [
      { id: '1', dayNumber: 1, title: 'Dia 1', plannedDate: addDays(today, 5), completed: false },
    ];
    const result = evaluateScheduleDeviation(schedule);
    expect(result.lateItems).toHaveLength(0);
    expect(result.alert).toBe(false);
  });

  it('dia concluído, mesmo que no passado, NÃO conta como atrasado', () => {
    const schedule: ScheduleDay[] = [
      { id: '1', dayNumber: 1, title: 'Dia 1', plannedDate: addDays(today, -10), completed: true, completedDate: today },
    ];
    const result = evaluateScheduleDeviation(schedule);
    expect(result.lateItems).toHaveLength(0);
    expect(result.alert).toBe(false);
  });

  it('1 dia de atraso NÃO dispara alerta (limite é >= 2)', () => {
    const schedule: ScheduleDay[] = [
      { id: '1', dayNumber: 1, title: 'Dia 1', plannedDate: addDays(today, -1), completed: false },
    ];
    const result = evaluateScheduleDeviation(schedule);
    expect(result.maxDaysLate).toBe(1);
    expect(result.alert).toBe(false);
  });

  it('2 dias de atraso JÁ dispara alerta', () => {
    const schedule: ScheduleDay[] = [
      { id: '1', dayNumber: 1, title: 'Dia 1', plannedDate: addDays(today, -2), completed: false },
    ];
    const result = evaluateScheduleDeviation(schedule);
    expect(result.maxDaysLate).toBe(2);
    expect(result.alert).toBe(true);
  });

  it('usa o PIOR atraso entre vários dias pendentes, ordenado do mais atrasado pro menos', () => {
    const schedule: ScheduleDay[] = [
      { id: '1', dayNumber: 1, title: 'Dia 1', plannedDate: addDays(today, -3), completed: false },
      { id: '2', dayNumber: 2, title: 'Dia 2', plannedDate: addDays(today, -7), completed: false },
      { id: '3', dayNumber: 3, title: 'Dia 3', plannedDate: addDays(today, -1), completed: false },
    ];
    const result = evaluateScheduleDeviation(schedule);
    expect(result.maxDaysLate).toBe(7);
    expect(result.lateItems[0].dayNumber).toBe(2); // o mais atrasado vem primeiro
    expect(result.alert).toBe(true);
  });
});

describe('evaluateClassScheduleDeviation', () => {
  it('delega corretamente para o cronograma da turma', () => {
    const classGroup: ClassGroup = {
      id: 'c1', name: 'Turma X', code: 'X1', instructor: 'Fulano',
      status: 'EM_TREINAMENTO', startDate: '2026-09-01', students: [],
      schedule: [{ id: '1', dayNumber: 1, title: 'Dia 1', plannedDate: addDays(todayStr(), -5), completed: false }],
      createdAt: '', updatedAt: '',
    };
    const result = evaluateClassScheduleDeviation(classGroup);
    expect(result.alert).toBe(true);
  });
});
