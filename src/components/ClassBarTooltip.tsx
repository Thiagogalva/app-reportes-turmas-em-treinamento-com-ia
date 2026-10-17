'use client';

import React from 'react';

/**
 * Tooltip dos gráficos de barras por turma: mostra o nome completo, o código
 * e o instrutor (além do valor da barra), em vez de só o nome abreviado.
 */
export default function ClassBarTooltip({
  active,
  payload,
  valueLabel,
  unit = '',
}: {
  active?: boolean;
  payload?: any[];
  valueLabel: string;
  unit?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload || {};
  return (
    <div className="rounded-lg border border-dark-border bg-dark-card px-3 py-2 shadow-xl text-[11px] space-y-0.5">
      <p className="font-bold text-white flex items-center gap-1.5">
        {row.color && <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: row.color }} />}
        {row.fullName || row.name}
      </p>
      {row.code && <p className="text-dark-muted">Código: <span className="text-white font-semibold">{row.code}</span></p>}
      {row.instructor && <p className="text-dark-muted">Instrutor: <span className="text-white font-semibold">{row.instructor}</span></p>}
      <p className="text-dark-muted pt-0.5">{valueLabel}: <span className="text-white font-bold">{payload[0].value}{unit}</span></p>
    </div>
  );
}
