'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, AlertTriangle, Info } from 'lucide-react';
import { ClassGroup } from '@/types';
import { addDays, todayStr, formatDatePtBr } from '@/lib/sla';
import { evaluateClassScheduleDeviation } from '@/lib/schedule';

type DayStatus = 'completed-on-time' | 'completed-late' | 'overdue' | 'today' | 'future' | 'empty';

function dayStatusColor(status: DayStatus): string {
  switch (status) {
    case 'completed-on-time': return '#10b981'; // emerald-500
    case 'completed-late': return '#f59e0b';     // amber-500
    case 'overdue': return '#e11d48';            // rose-600
    case 'today': return '#38bdf8';              // sky-400
    case 'future': return '#2a3441';             // dark border tone
    default: return 'transparent';
  }
}

export default function ScheduleGanttCard() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/classes?onlyActive=true')
      .then(res => res.json())
      .then(json => { if (json.success) setClasses(json.data); })
      .catch(err => console.error('Erro ao carregar cronogramas:', err))
      .finally(() => setLoading(false));
  }, []);

  const classesWithSchedule = useMemo(
    () => classes.filter(c => c.schedule && c.schedule.length > 0),
    [classes]
  );

  const { dateRange, alertCount } = useMemo(() => {
    if (classesWithSchedule.length === 0) return { dateRange: [] as string[], alertCount: 0 };

    let minDate = todayStr();
    let maxDate = todayStr();
    let alerts = 0;

    classesWithSchedule.forEach(c => {
      (c.schedule || []).forEach(day => {
        if (day.plannedDate < minDate) minDate = day.plannedDate;
        if (day.plannedDate > maxDate) maxDate = day.plannedDate;
      });
      if (evaluateClassScheduleDeviation(c).alert) alerts++;
    });

    const range: string[] = [];
    let cursor = minDate;
    let guard = 0;
    while (cursor <= maxDate && guard < 120) {
      range.push(cursor);
      cursor = addDays(cursor, 1);
      guard++;
    }
    return { dateRange: range, alertCount: alerts };
  }, [classesWithSchedule]);

  if (loading) {
    return (
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm">
        <p className="text-xs text-dark-muted">Carregando cronogramas...</p>
      </div>
    );
  }

  if (classesWithSchedule.length === 0) {
    return null; // nenhuma turma com cronograma cadastrado ainda
  }

  const today = todayStr();

  return (
    <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-bradesco-500" />
          <h2 className="text-sm font-bold text-white">Cronograma das Turmas (Gantt)</h2>
        </div>
        {alertCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-red-950/50 text-red-300 border border-red-800/50">
            <AlertTriangle className="w-3 h-3" />
            {alertCount} turma{alertCount !== 1 ? 's' : ''} com desvio ≥ 2 dias
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${140 + dateRange.length * 28}px` }}>
          {/* Cabeçalho de datas */}
          <div className="flex items-end sticky top-0 z-10 bg-dark-surface">
            <div className="w-[140px] flex-shrink-0" />
            {dateRange.map(d => (
              <div
                key={d}
                className={`w-7 flex-shrink-0 text-center text-[8px] font-mono pb-1 ${d === today ? 'text-sky-400 font-bold' : 'text-dark-muted'}`}
                style={{ writingMode: 'vertical-rl' }}
              >
                {formatDatePtBr(d).slice(0, 5)}
              </div>
            ))}
          </div>

          {/* Linhas — uma por turma */}
          <div className="space-y-1.5 mt-1">
            {classesWithSchedule.map(c => {
              const deviation = evaluateClassScheduleDeviation(c);
              const scheduleByDate = new Map((c.schedule || []).map(d => [d.plannedDate, d]));

              return (
                <div key={c.id} className="flex items-center">
                  <div className="w-[140px] flex-shrink-0 pr-2">
                    <p className="text-[11px] font-bold text-white truncate" title={c.name}>{c.name}</p>
                    {deviation.alert && (
                      <p className="text-[9px] text-red-400 font-semibold">{deviation.maxDaysLate}d de atraso</p>
                    )}
                  </div>
                  <div className="flex gap-px">
                    {dateRange.map(d => {
                      const day = scheduleByDate.get(d);
                      let status: DayStatus = 'empty';
                      if (day) {
                        if (day.completed) {
                          status = day.completedDate && day.completedDate > day.plannedDate ? 'completed-late' : 'completed-on-time';
                        } else if (d === today) {
                          status = 'today';
                        } else if (d < today) {
                          status = 'overdue';
                        } else {
                          status = 'future';
                        }
                      }
                      return (
                        <div
                          key={d}
                          className="w-7 h-6 flex-shrink-0 rounded-sm"
                          style={{ backgroundColor: dayStatusColor(status) }}
                          title={day ? `${c.name} — Dia ${day.dayNumber}: ${day.title}\nPlanejado: ${formatDatePtBr(day.plannedDate)}${day.completed ? `\nConcluído: ${formatDatePtBr(day.completedDate!)}` : ''}` : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[10px] text-dark-muted pt-2 border-t border-dark-border">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: dayStatusColor('completed-on-time') }} /> No prazo</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: dayStatusColor('completed-late') }} /> Concluído com atraso</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: dayStatusColor('overdue') }} /> Atrasado (não concluído)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: dayStatusColor('today') }} /> Hoje</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: dayStatusColor('future') }} /> Planejado (futuro)</span>
      </div>
    </div>
  );
}
