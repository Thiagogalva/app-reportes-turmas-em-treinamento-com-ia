'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertOctagon, ArrowRight } from 'lucide-react';
import { DailyReport, Chamado } from '@/types';
import { buildErrorIncidents } from '@/lib/errors';

export default function ErrorsCard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkedAccess, setCheckedAccess] = useState(false);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(async json => {
        const admin = json.success && json.data?.role === 'admin';
        setIsAdmin(admin);
        setCheckedAccess(true);
        if (admin) {
          const [reportsRes, chamadosRes] = await Promise.all([
            fetch('/api/reports').then(r => r.json()),
            fetch('/api/chamados').then(r => r.json()),
          ]);
          if (reportsRes.success) setReports(reportsRes.data);
          if (chamadosRes.success) setChamados(chamadosRes.data);
        }
        setLoading(false);
      })
      .catch(() => { setCheckedAccess(true); setLoading(false); });
  }, []);

  const incidents = useMemo(() => buildErrorIncidents(reports, chamados), [reports, chamados]);

  const chartData = useMemo(() => {
    const byClass = new Map<string, { name: string; comChamado: number; semChamado: number }>();
    incidents.forEach(inc => {
      const entry = byClass.get(inc.classId) || { name: inc.className, comChamado: 0, semChamado: 0 };
      if (inc.chamado) entry.comChamado++;
      else entry.semChamado++;
      byClass.set(inc.classId, entry);
    });
    return Array.from(byClass.values())
      .map(d => ({ ...d, name: d.name.length > 14 ? d.name.slice(0, 14) + '…' : d.name }))
      .sort((a, b) => (b.comChamado + b.semChamado) - (a.comChamado + a.semChamado))
      .slice(0, 8);
  }, [incidents]);

  const semChamadoTotal = incidents.filter(i => !i.chamado).length;

  if (!checkedAccess || !isAdmin) return null; // visão exclusiva de administradores
  if (loading) {
    return (
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm">
        <p className="text-xs text-dark-muted">Carregando erros reportados...</p>
      </div>
    );
  }
  if (incidents.length === 0) return null;

  return (
    <Link href="/erros" className="block bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4 hover:border-bradesco-600/40 transition-colors group">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-bradesco-500" />
          <h2 className="text-sm font-bold text-white">Erros Reportados nas Turmas</h2>
        </div>
        <span className="text-[10px] font-bold text-bradesco-400 flex items-center gap-1 group-hover:gap-1.5 transition-all">
          Ver detalhes <ArrowRight className="w-3 h-3" />
        </span>
      </div>

      {semChamadoTotal > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-red-950/50 text-red-300 border border-red-800/50">
          {semChamadoTotal} erro(s) ainda sem chamado aberto
        </span>
      )}

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3441" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: '#8891a5', fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#8891a5', fontSize: 10 }} width={100} />
            <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #2a3441', borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="comChamado" name="Com chamado" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="semChamado" name="Sem chamado" stackId="a" fill="#e11d48" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Link>
  );
}
