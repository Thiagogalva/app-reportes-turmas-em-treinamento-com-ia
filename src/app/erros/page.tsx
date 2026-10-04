'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertOctagon,
  Lock,
  Image as ImageIcon,
  Ticket,
  CheckCircle2,
  Plus,
  X,
  Save,
  Filter,
} from 'lucide-react';
import { DailyReport, Chamado, ClassGroup } from '@/types';
import { buildErrorIncidents, ErrorIncident } from '@/lib/errors';
import { formatDatePtBr, todayStr } from '@/lib/sla';

export default function ErrosPage() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [classFilter, setClassFilter] = useState('TODAS');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'COM_CHAMADO' | 'SEM_CHAMADO'>('TODOS');

  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [openingChamadoFor, setOpeningChamadoFor] = useState<ErrorIncident | null>(null);
  const [formNumero, setFormNumero] = useState('');
  const [formSlaDays, setFormSlaDays] = useState('5');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [reportsRes, chamadosRes, classesRes] = await Promise.all([
      fetch('/api/reports').then(r => r.json()),
      fetch('/api/chamados').then(r => r.json()),
      fetch('/api/classes').then(r => r.json()),
    ]);
    if (reportsRes.success) setReports(reportsRes.data);
    if (chamadosRes.success) setChamados(chamadosRes.data);
    if (classesRes.success) setClasses(classesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(async json => {
        const admin = json.success && json.data?.role === 'admin';
        setHasAccess(admin);
        setCheckingAccess(false);
        if (admin) await loadData();
      })
      .catch(() => setCheckingAccess(false));
  }, []);

  const incidents = useMemo(() => buildErrorIncidents(reports, chamados), [reports, chamados]);

  const filteredIncidents = useMemo(() => {
    return incidents
      .filter(i => classFilter === 'TODAS' || i.classId === classFilter)
      .filter(i => {
        if (statusFilter === 'COM_CHAMADO') return !!i.chamado;
        if (statusFilter === 'SEM_CHAMADO') return !i.chamado;
        return true;
      });
  }, [incidents, classFilter, statusFilter]);

  const openChamadoModal = (incident: ErrorIncident) => {
    setOpeningChamadoFor(incident);
    setFormNumero('');
    setFormSlaDays('5');
  };

  const handleCreateChamado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingChamadoFor || !formNumero.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/chamados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroChamado: formNumero.trim(),
          classId: openingChamadoFor.classId,
          className: openingChamadoFor.className,
          type: 'ERRO_SISTEMA',
          relatedSystemId: openingChamadoFor.systemId,
          slaDays: Number(formSlaDays),
          openedDate: todayStr(),
          description: `Erro no sistema "${openingChamadoFor.systemName}" reportado em ${formatDatePtBr(openingChamadoFor.date)}.`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOpeningChamadoFor(null);
        await loadData();
      } else {
        alert(json.error || 'Erro ao abrir chamado.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (checkingAccess) {
    return <div className="p-6 text-dark-muted text-sm">Carregando...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="p-6 sm:p-8 max-w-lg mx-auto text-center mt-10">
        <div className="w-14 h-14 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-dark-muted" />
        </div>
        <h1 className="text-lg font-bold text-white mb-1">Acesso restrito</h1>
        <p className="text-sm text-dark-muted">Essa área é exclusiva para usuários com perfil Administrador.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <AlertOctagon className="w-5 h-5 text-bradesco-500" />
        <h1 className="text-lg font-bold text-white">Erros Reportados & Chamados</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-dark-muted" />
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-dark-border bg-dark-input text-white">
          <option value="TODAS">Todas as turmas</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-dark-border bg-dark-input text-white">
          <option value="TODOS">Todos</option>
          <option value="SEM_CHAMADO">Sem chamado</option>
          <option value="COM_CHAMADO">Com chamado</option>
        </select>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-xs text-dark-muted">Carregando...</p>
        ) : filteredIncidents.length === 0 ? (
          <p className="text-xs text-dark-muted">Nenhum erro reportado encontrado com esse filtro.</p>
        ) : (
          filteredIncidents.map(incident => (
            <div key={incident.id} className={`bg-dark-surface rounded-xl p-4 border space-y-2 ${incident.chamado ? 'border-dark-border' : 'border-red-800/60'}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  {incident.hasEvidence && incident.evidenceImageDataUrl && (
                    <button onClick={() => setEvidencePreview(incident.evidenceImageDataUrl!)} className="flex-shrink-0">
                      <img src={incident.evidenceImageDataUrl} alt="Evidência" className="w-14 h-14 object-cover rounded-lg border border-dark-border hover:border-bradesco-500 transition-colors" />
                    </button>
                  )}
                  {!incident.hasEvidence && (
                    <div className="w-14 h-14 rounded-lg border border-dark-border bg-dark-bg flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-5 h-5 text-dark-muted" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{incident.systemName}</p>
                    <p className="text-xs text-dark-muted">{incident.className} — {formatDatePtBr(incident.date)} — {incident.instructorName}</p>
                    {incident.notes && <p className="text-[11px] text-dark-text mt-1 line-clamp-2">{incident.notes}</p>}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {incident.chamado ? (
                    incident.chamado.status === 'APROVADO' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3" /> #{incident.chamado.numeroChamado} Aprovado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-950/50 text-sky-300 border border-sky-800/50">
                        <Ticket className="w-3 h-3" /> #{incident.chamado.numeroChamado} Pendente
                      </span>
                    )
                  ) : (
                    <button
                      onClick={() => openChamadoModal(incident)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-bradesco-600 hover:bg-bradesco-700 text-white shadow-md shadow-bradesco-600/30"
                    >
                      <Plus className="w-3 h-3" /> Abrir Chamado
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview de evidência em tamanho grande */}
      {evidencePreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setEvidencePreview(null)}>
          <img src={evidencePreview} alt="Evidência" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}

      {/* Modal de abertura de chamado */}
      {openingChamadoFor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-surface rounded-2xl border border-dark-border w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Abrir Chamado</h3>
              <button onClick={() => setOpeningChamadoFor(null)} className="text-dark-muted hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-dark-muted">
              {openingChamadoFor.systemName} — {openingChamadoFor.className} ({formatDatePtBr(openingChamadoFor.date)})
            </p>
            <form onSubmit={handleCreateChamado} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">Número do Chamado</label>
                <input value={formNumero} onChange={e => setFormNumero(e.target.value)} required autoFocus placeholder="Ex: INC0012345" className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">Prazo p/ Tratativa (dias)</label>
                <input type="number" min={1} value={formSlaDays} onChange={e => setFormSlaDays(e.target.value)} required className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-bradesco-600 hover:bg-bradesco-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-bradesco-600/30 disabled:opacity-50">
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Salvando...' : 'Abrir Chamado'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
