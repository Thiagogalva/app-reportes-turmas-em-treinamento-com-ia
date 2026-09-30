'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Ticket, AlertTriangle } from 'lucide-react';
import { Chamado } from '@/types';
import { addDays, todayStr, formatDatePtBr } from '@/lib/sla';

const TYPE_LABELS: Record<string, string> = {
  ERRO_SISTEMA: 'Erro de Sistema',
  SOLICITACAO_ACESSO: 'Solicitação de Acesso',
};

export default function ChamadosCard() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/chamados')
      .then(res => res.json())
      .then(json => { if (json.success) setChamados(json.data); })
      .catch(err => console.error('Erro ao carregar chamados:', err))
      .finally(() => setLoading(false));
  }, []);

  const { pendentesNoPrazo, foraDoPrazo, aprovados } = useMemo(() => {
    const today = todayStr();
    let pendentesNoPrazo = 0;
    const foraDoPrazo: Chamado[] = [];
    let aprovados = 0;

    chamados.forEach(c => {
      if (c.status === 'APROVADO') {
        aprovados++;
      } else {
        const deadline = addDays(c.openedDate, c.slaDays);
        if (deadline < today) foraDoPrazo.push(c);
        else pendentesNoPrazo++;
      }
    });

    return { pendentesNoPrazo, foraDoPrazo, aprovados };
  }, [chamados]);

  const chartData = [
    { name: 'No prazo', value: pendentesNoPrazo, color: '#38bdf8' },
    { name: 'Fora do prazo', value: foraDoPrazo.length, color: '#e11d48' },
    { name: 'Aprovados', value: aprovados, color: '#10b981' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm">
        <p className="text-xs text-dark-muted">Carregando chamados...</p>
      </div>
    );
  }

  if (chamados.length === 0) {
    return null; // nenhum chamado cadastrado ainda — não polui o dashboard
  }

  return (
    <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-bradesco-500" />
          <h2 className="text-sm font-bold text-white">Chamados — Erros e Acessos</h2>
        </div>
        <Link href="/chamados" className="text-[10px] font-bold text-bradesco-400 hover:text-bradesco-300 underline underline-offset-2">
          Ver todos →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 items-center">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={60} paddingAngle={2}>
                {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #2a3441', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-1.5">
          {foraDoPrazo.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-300 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {foraDoPrazo.length} chamado{foraDoPrazo.length !== 1 ? 's' : ''} fora do prazo
            </div>
          )}
          {foraDoPrazo.slice(0, 4).map(c => (
            <div key={c.id} className="text-[10px] bg-red-950/20 border border-red-900/40 rounded-lg px-2.5 py-1.5">
              <span className="text-white font-bold">#{c.numeroChamado}</span>
              <span className="text-dark-muted"> — {c.className} ({TYPE_LABELS[c.type]})</span>
            </div>
          ))}
          {foraDoPrazo.length === 0 && (
            <p className="text-[11px] text-emerald-400 font-semibold">Nenhum chamado fora do prazo 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}
