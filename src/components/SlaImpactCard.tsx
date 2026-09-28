'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Clock, CheckCircle2, Gauge } from 'lucide-react';
import { ClassGroup, Segment } from '@/types';
import { evaluateClassSlaImpact, formatDatePtBr } from '@/lib/sla';

export default function SlaImpactCard() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [classesRes, segmentsRes] = await Promise.all([
          fetch('/api/classes?onlyActive=true'),
          fetch('/api/segments'),
        ]);
        const classesJson = await classesRes.json();
        const segmentsJson = await segmentsRes.json();
        if (classesJson.success) setClasses(classesJson.data);
        if (segmentsJson.success) setSegments(segmentsJson.data);
      } catch (err) {
        console.error('Erro ao carregar dados de SLA:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const results = useMemo(() => {
    return classes
      .map(c => ({ classGroup: c, impact: evaluateClassSlaImpact(c, segments) }))
      .filter(r => r.impact.hasSla);
  }, [classes, segments]);

  const impacted = results.filter(r => r.impact.impacted);
  const onTime = results.filter(r => !r.impact.impacted);

  const chartData = impacted
    .map(r => ({
      name: r.classGroup.name.length > 14 ? r.classGroup.name.slice(0, 14) + '…' : r.classGroup.name,
      dias: r.impact.daysOverdue || 0,
    }))
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 8);

  if (loading) {
    return (
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm">
        <p className="text-xs text-dark-muted">Calculando impacto de SLA...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return null; // nenhum segmento com SLA configurado ainda — não polui o dashboard
  }

  return (
    <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-bradesco-500" />
          <h2 className="text-sm font-bold text-white">Impacto de SLA nas Turmas</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-red-950/50 text-red-300 border border-red-800/50">
            <AlertTriangle className="w-3 h-3" />
            {impacted.length} impactada{impacted.length !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3" />
            {onTime.length} no prazo
          </span>
          <Link href="/simulador-sla" className="text-[10px] font-bold text-bradesco-400 hover:text-bradesco-300 underline underline-offset-2">
            Simular novo cenário →
          </Link>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3441" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#8891a5', fontSize: 10 }} label={{ value: 'dias de atraso', position: 'insideBottom', offset: -2, fill: '#8891a5', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8891a5', fontSize: 10 }} width={90} />
              <Tooltip
                contentStyle={{ background: '#1a2332', border: '1px solid #2a3441', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="dias" radius={[0, 4, 4, 0]}>
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill="#e11d48" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {impacted.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-dark-border">
          {impacted.slice(0, 6).map(({ classGroup, impact }) => (
            <div key={classGroup.id} className="flex items-center justify-between text-xs bg-red-950/20 border border-red-900/40 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="text-white font-bold truncate">{classGroup.name}</span>
                <span className="text-dark-muted truncate hidden sm:inline">({classGroup.segmentName})</span>
              </div>
              <span className="text-red-300 font-semibold whitespace-nowrap ml-2">
                {impact.deadline && `previsto ${formatDatePtBr(impact.deadline)}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
