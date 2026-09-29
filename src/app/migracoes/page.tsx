'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRightLeft,
  Gauge,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { MigrationSlaRule } from '@/types';
import { addDays, formatDatePtBr } from '@/lib/sla';
import { addBusinessDays } from '@/lib/business-days';

export default function MigracoesPage() {
  const [rules, setRules] = useState<MigrationSlaRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Simulador
  const [simOrigin, setSimOrigin] = useState('');
  const [simDestination, setSimDestination] = useState('');
  const [simDate, setSimDate] = useState('');

  // Gestão (admin)
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MigrationSlaRule | null>(null);
  const [formOrigin, setFormOrigin] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formChamado, setFormChamado] = useState('');
  const [formTreino, setFormTreino] = useState('');

  const loadRules = async () => {
    const res = await fetch('/api/migration-rules');
    const json = await res.json();
    if (json.success) setRules(json.data);
    setLoading(false);
  };

  useEffect(() => {
    loadRules();
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(json => { if (json.success && json.data?.role === 'admin') setIsAdmin(true); })
      .catch(() => {});
  }, []);

  const origins = useMemo(() => Array.from(new Set(rules.map(r => r.origin))).sort(), [rules]);
  const destinationsFor = (origin: string) =>
    Array.from(new Set(rules.filter(r => r.origin === origin).map(r => r.destination))).sort();

  const simResult = useMemo(() => {
    return rules.find(r => r.origin === simOrigin && r.destination === simDestination) || null;
  }, [rules, simOrigin, simDestination]);

  const simChamadoDeadline = simResult && simDate ? addBusinessDays(simDate, simResult.chamadoSlaDays) : null;
  const simTreinoDeadline = simResult && simDate && simResult.trainingSlaDays != null
    ? addDays(simDate, simResult.trainingSlaDays)
    : null;

  const rulesForSelectedOrigin = selectedOrigin ? rules.filter(r => r.origin === selectedOrigin) : [];

  const openCreateModal = (origin?: string) => {
    setEditingRule(null);
    setFormOrigin(origin || selectedOrigin || '');
    setFormDestination('');
    setFormChamado('');
    setFormTreino('');
    setIsModalOpen(true);
  };

  const openEditModal = (rule: MigrationSlaRule) => {
    setEditingRule(rule);
    setFormOrigin(rule.origin);
    setFormDestination(rule.destination);
    setFormChamado(String(rule.chamadoSlaDays));
    setFormTreino(rule.trainingSlaDays != null ? String(rule.trainingSlaDays) : '');
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOrigin.trim() || !formDestination.trim() || !formChamado.trim()) return;

    const payload = {
      ...(editingRule ? { id: editingRule.id } : {}),
      origin: formOrigin.trim(),
      destination: formDestination.trim(),
      chamadoSlaDays: Number(formChamado),
      trainingSlaDays: formTreino.trim() ? Number(formTreino) : null,
    };

    const res = await fetch('/api/migration-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      setSelectedOrigin(payload.origin);
      setIsModalOpen(false);
      await loadRules();
    } else {
      alert(json.error || 'Erro ao salvar regra.');
    }
  };

  const handleDeleteRule = async (rule: MigrationSlaRule) => {
    if (!confirm(`Remover a regra "${rule.origin} → ${rule.destination}"?`)) return;
    const res = await fetch(`/api/migration-rules?id=${rule.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      await loadRules();
    } else {
      alert(json.error || 'Erro ao excluir regra.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <ArrowRightLeft className="w-5 h-5 text-bradesco-500" />
        <h1 className="text-lg font-bold text-white">Migração de Operadores entre Segmentos</h1>
      </div>

      {/* SIMULADOR */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Gauge className="w-4 h-4 text-bradesco-500" />
          Simulador de Migração
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-dark-muted mb-1.5">Segmento de Origem</label>
            <select
              value={simOrigin}
              onChange={e => { setSimOrigin(e.target.value); setSimDestination(''); }}
              className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none"
            >
              <option value="">Selecione...</option>
              {origins.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-dark-muted mb-1.5">Segmento de Destino</label>
            <select
              value={simDestination}
              onChange={e => setSimDestination(e.target.value)}
              disabled={!simOrigin}
              className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">Selecione...</option>
              {simOrigin && destinationsFor(simOrigin).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-dark-muted mb-1.5">Data da migração (opcional)</label>
            <input
              type="date"
              value={simDate}
              onChange={e => setSimDate(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none"
            />
          </div>
        </div>

        {simOrigin && simDestination && (
          simResult ? (
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
                <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">SLA do Chamado</p>
                <p className="text-lg font-extrabold text-white">{simResult.chamadoSlaDays} <span className="text-xs font-medium text-dark-muted">dias úteis</span></p>
                {simChamadoDeadline && (
                  <p className="text-[11px] text-sky-400 mt-1">Prazo estimado: {formatDatePtBr(simChamadoDeadline)}</p>
                )}
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
                <p className="text-[10px] font-bold text-dark-muted uppercase mb-1">SLA do Treinamento</p>
                <p className="text-lg font-extrabold text-white">
                  {simResult.trainingSlaDays != null ? <>{simResult.trainingSlaDays} <span className="text-xs font-medium text-dark-muted">dias corridos</span></> : 'Não aplicável'}
                </p>
                {simTreinoDeadline && (
                  <p className="text-[11px] text-sky-400 mt-1">Prazo estimado: {formatDatePtBr(simTreinoDeadline)}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-dark-muted bg-dark-bg border border-dark-border rounded-xl p-3">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Não existe regra cadastrada para essa combinação de origem/destino.</span>
            </div>
          )
        )}
      </div>

      {/* MATRIZ / GESTÃO */}
      <div className="bg-dark-surface rounded-2xl border border-dark-border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 pb-3 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-bradesco-500" />
            Matriz de Regras ({rules.length})
          </h2>
          {isAdmin && (
            <button
              onClick={() => openCreateModal()}
              className="px-3 py-1.5 bg-bradesco-600 hover:bg-bradesco-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-bradesco-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Regra</span>
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-[180px_1fr] border-t border-dark-border">
          {/* Lista de origens */}
          <div className="border-r border-dark-border max-h-[420px] overflow-y-auto">
            {origins.map(o => (
              <button
                key={o}
                onClick={() => setSelectedOrigin(o)}
                className={`w-full text-left px-4 py-2.5 text-xs font-semibold border-b border-dark-border transition-colors ${
                  selectedOrigin === o ? 'bg-bradesco-950/50 text-bradesco-400' : 'text-dark-muted hover:bg-dark-card hover:text-white'
                }`}
              >
                {o}
              </button>
            ))}
          </div>

          {/* Regras da origem selecionada */}
          <div className="p-4 sm:p-6">
            {!selectedOrigin ? (
              <p className="text-xs text-dark-muted">Selecione uma origem à esquerda para ver as regras de migração.</p>
            ) : rulesForSelectedOrigin.length === 0 ? (
              <p className="text-xs text-dark-muted">Nenhuma regra cadastrada para "{selectedOrigin}".</p>
            ) : (
              <div className="space-y-2">
                {rulesForSelectedOrigin.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between gap-2 bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-white truncate">{rule.origin} → {rule.destination}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[10px] text-dark-muted">Chamado: <strong className="text-white">{rule.chamadoSlaDays}DU</strong></span>
                      <span className="text-[10px] text-dark-muted">Treino: <strong className="text-white">{rule.trainingSlaDays != null ? `${rule.trainingSlaDays}d` : '—'}</strong></span>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(rule)} className="p-1 text-dark-muted hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteRule(rule)} className="p-1 text-dark-muted hover:text-bradesco-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO/EDIÇÃO (admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-surface rounded-2xl border border-dark-border w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{editingRule ? 'Editar Regra' : 'Nova Regra de Migração'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-dark-muted hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveRule} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">Origem</label>
                <input value={formOrigin} onChange={e => setFormOrigin(e.target.value)} required className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">Destino</label>
                <input value={formDestination} onChange={e => setFormDestination(e.target.value)} required className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1">SLA Chamado (DU)</label>
                  <input type="number" min={0} value={formChamado} onChange={e => setFormChamado(e.target.value)} required className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1">SLA Treino (dias)</label>
                  <input type="number" min={0} value={formTreino} onChange={e => setFormTreino(e.target.value)} placeholder="—" className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-bradesco-600 hover:bg-bradesco-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-bradesco-600/30">
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Regra</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
