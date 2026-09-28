'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Gauge, Calendar, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Segment } from '@/types';
import { evaluateSlaImpact, formatDatePtBr } from '@/lib/sla';

export default function SimuladorSlaPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  const [segmentId, setSegmentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetch('/api/segments')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setSegments(json.data);
          if (json.data.length > 0) setSegmentId(json.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedSegment = segments.find(s => s.id === segmentId);

  const result = useMemo(() => {
    if (!selectedSegment || !startDate) return null;
    return evaluateSlaImpact(startDate, endDate || undefined, selectedSegment.slaDays);
  }, [selectedSegment, startDate, endDate]);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Gauge className="w-5 h-5 text-bradesco-500" />
        <h1 className="text-lg font-bold text-white">Simulador de Impacto de SLA</h1>
      </div>
      <p className="text-xs text-dark-muted -mt-4">
        Simule o cenário de uma turma antes mesmo de criá-la, para saber se o prazo de liberação de acessos do segmento vai bater com a data de término planejada.
      </p>

      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-dark-muted mb-1.5">Segmento</label>
          <select
            value={segmentId}
            onChange={e => setSegmentId(e.target.value)}
            disabled={loading}
            className="w-full text-xs font-medium p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none"
          >
            {segments.length === 0 && <option value="">Nenhum segmento cadastrado</option>}
            {segments.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.slaDays ? `— SLA: ${s.slaDays}d` : '— sem SLA configurado'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-dark-muted mb-1.5">Data de início planejada</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-dark-muted mb-1.5">Data de término planejada (opcional)</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none"
            />
          </div>
        </div>

        {!endDate && (
          <div className="flex items-start gap-2 text-[11px] text-dark-muted bg-dark-bg border border-dark-border rounded-xl p-3">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Sem data de término, o simulador compara o prazo de liberação de acessos com a data de hoje — útil para turmas já em andamento.</span>
          </div>
        )}
      </div>

      {result && (
        <div className={`rounded-2xl p-5 border shadow-sm ${
          !result.hasSla
            ? 'bg-dark-surface border-dark-border'
            : result.impacted
              ? 'bg-red-950/30 border-red-800/50'
              : 'bg-emerald-950/30 border-emerald-800/50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {!result.hasSla ? (
              <Info className="w-5 h-5 text-dark-muted" />
            ) : result.impacted ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className={`text-sm font-bold ${!result.hasSla ? 'text-dark-muted' : result.impacted ? 'text-red-300' : 'text-emerald-300'}`}>
              {!result.hasSla ? 'Sem SLA configurado' : result.impacted ? 'Turma teria impacto de SLA' : 'Turma dentro do prazo'}
            </h3>
          </div>
          <p className="text-xs text-dark-text leading-relaxed">{result.reason}</p>
          {result.deadline && (
            <div className="flex items-center gap-1.5 text-xs text-dark-muted mt-3 pt-3 border-t border-dark-border/60">
              <Calendar className="w-3.5 h-3.5" />
              <span>Data estimada de liberação dos acessos: <strong className="text-white">{formatDatePtBr(result.deadline)}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
