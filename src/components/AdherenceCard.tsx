'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ClipboardCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ClassGroup, DailyReport } from '@/types';
import { evaluateClassAdherence } from '@/lib/adherence';

function adherenceColor(percent: number): string {
  if (percent >= 90) return '#10b981'; // emerald-500
  if (percent >= 70) return '#f59e0b'; // amber-500
  return '#e11d48'; // rose-600
}

export default function AdherenceCard() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/classes?onlyActive=true').then(r => r.json()),
      fetch('/api/reports').then(r => r.json()),
    ])
      .then(([classesJson, reportsJson]) => {
        if (classesJson.success) setClasses(classesJson.data);
        if (reportsJson.success) setReports(reportsJson.data);
      })
      .catch(err => console.error('Erro ao carregar aderência:', err))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(
    () => classes.map(c => evaluateClassAdherence(c, reports)).filter(r => r.expectedDays.length > 0),
    [classes, reports]
  );

  const pendingToday = results.filter(r => r.todayIsExpected && !r.reportedToday);

  const chartData = results
    .map(r => ({
      name: r.className.length > 16 ? r.className.slice(0, 16) + '…' : r.className,
      aderencia: r.adherencePercent,
    }))
    .sort((a, b) => a.aderencia - b.aderencia);

  if (loading) {
    return (
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm">
        <p className="text-xs text-dark-muted">Calculando aderência...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return null; // nenhuma turma ativa com dias úteis decorridos ainda
  }

  return (
    <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-bradesco-500" />
          <h2 className="text-sm font-bold text-white">Aderência ao Reporte Diário</h2>
        </div>
        {pendingToday.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-red-950/50 text-red-300 border border-red-800/50">
            <AlertCircle className="w-3 h-3" />
            {pendingToday.length} turma{pendingToday.length !== 1 ? 's' : ''} sem report hoje
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3" />
            Todas as turmas em dia hoje
          </span>
        )}
      </div>

      {pendingToday.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pendingToday.map(r => (
            <span key={r.classId} className="text-[10px] font-semibold bg-red-950/30 border border-red-900/40 text-red-300 rounded-lg px-2 py-1">
              {r.className}
            </span>
          ))}
        </div>
      )}

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3441" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8891a5', fontSize: 10 }} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fill: '#8891a5', fontSize: 10 }} width={100} />
            <Tooltip
              contentStyle={{ background: '#1a2332', border: '1px solid #2a3441', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number) => [`${value}%`, 'Aderência']}
            />
            <Bar dataKey="aderencia" radius={[0, 4, 4, 0]}>
              {chartData.map((d, idx) => (
                <Cell key={idx} fill={adherenceColor(d.aderencia)} />
              ))}
              <LabelList dataKey="aderencia" position="right" formatter={(v: number) => `${v}%`} fill="#e5e7eb" fontSize={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-dark-muted">
        Considera dias úteis (seg–sex) desde o início de cada turma até hoje. Verde ≥ 90%, âmbar 70–89%, vermelho &lt; 70%.
      </p>
    </div>
  );
}
