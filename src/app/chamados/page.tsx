'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  Plus,
  X,
  Save,
  Check,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Chamado, ClassGroup, ChamadoType, ChamadoStatus } from '@/types';
import { addDays, todayStr, formatDatePtBr, daysBetween } from '@/lib/sla';

const TYPE_LABELS: Record<ChamadoType, string> = {
  ERRO_SISTEMA: 'Erro de Sistema',
  SOLICITACAO_ACESSO: 'Solicitação de Acesso',
};

function getDeadlineInfo(chamado: Chamado) {
  const deadline = addDays(chamado.openedDate, chamado.slaDays);
  const today = todayStr();
  const overdue = chamado.status === 'PENDENTE' && deadline < today;
  const daysLate = overdue ? daysBetween(deadline, today) : 0;
  return { deadline, overdue, daysLate };
}

export default function ChamadosPage() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'TODOS' | ChamadoStatus>('TODOS');
  const [classFilter, setClassFilter] = useState('TODAS');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChamado, setEditingChamado] = useState<Chamado | null>(null);
  const [formNumero, setFormNumero] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formType, setFormType] = useState<ChamadoType>('ERRO_SISTEMA');
  const [formSlaDays, setFormSlaDays] = useState('5');
  const [formOpenedDate, setFormOpenedDate] = useState(todayStr());
  const [formDescription, setFormDescription] = useState('');

  const loadData = async () => {
    const [chamadosRes, classesRes] = await Promise.all([
      fetch('/api/chamados'),
      fetch('/api/classes'),
    ]);
    const chamadosJson = await chamadosRes.json();
    const classesJson = await classesRes.json();
    if (chamadosJson.success) setChamados(chamadosJson.data);
    if (classesJson.success) setClasses(classesJson.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(json => { if (json.success && json.data?.role === 'admin') setIsAdmin(true); })
      .catch(() => {});
  }, []);

  const filteredChamados = useMemo(() => {
    return chamados
      .filter(c => statusFilter === 'TODOS' || c.status === statusFilter)
      .filter(c => classFilter === 'TODAS' || c.classId === classFilter)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [chamados, statusFilter, classFilter]);

  const stats = useMemo(() => {
    const pendentes = chamados.filter(c => c.status === 'PENDENTE');
    const foraDoPrazo = pendentes.filter(c => getDeadlineInfo(c).overdue);
    const aprovados = chamados.filter(c => c.status === 'APROVADO');
    return { pendentes: pendentes.length, foraDoPrazo: foraDoPrazo.length, aprovados: aprovados.length };
  }, [chamados]);

  const openCreateModal = () => {
    setEditingChamado(null);
    setFormNumero('');
    setFormClassId(classes[0]?.id || '');
    setFormType('ERRO_SISTEMA');
    setFormSlaDays('5');
    setFormOpenedDate(todayStr());
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNumero.trim() || !formClassId) return;
    const cls = classes.find(c => c.id === formClassId);

    const payload = {
      ...(editingChamado ? { id: editingChamado.id, status: editingChamado.status } : {}),
      numeroChamado: formNumero.trim(),
      classId: formClassId,
      className: cls?.name || '',
      type: formType,
      slaDays: Number(formSlaDays),
      openedDate: formOpenedDate,
      description: formDescription.trim() || undefined,
    };

    const res = await fetch('/api/chamados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      setIsModalOpen(false);
      await loadData();
    } else {
      alert(json.error || 'Erro ao salvar chamado.');
    }
  };

  const handleApprove = async (chamado: Chamado) => {
    const res = await fetch(`/api/chamados/${chamado.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APROVADO' }),
    });
    const json = await res.json();
    if (json.success) {
      await loadData();
    } else {
      alert(json.error || 'Erro ao aprovar chamado.');
    }
  };

  const handleDelete = async (chamado: Chamado) => {
    if (!confirm(`Excluir o chamado ${chamado.numeroChamado}?`)) return;
    const res = await fetch(`/api/chamados?id=${chamado.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      await loadData();
    } else {
      alert(json.error || 'Erro ao excluir chamado.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-bradesco-500" />
          <h1 className="text-lg font-bold text-white">Chamados — Erros e Solicitações de Acesso</h1>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-bradesco-600 hover:bg-bradesco-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-bradesco-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Chamado</span>
          </button>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-dark-surface rounded-2xl p-4 border border-dark-border">
          <p className="text-[10px] font-bold text-dark-muted uppercase">Pendentes</p>
          <p className="text-2xl font-extrabold text-sky-400">{stats.pendentes}</p>
        </div>
        <div className="bg-dark-surface rounded-2xl p-4 border border-red-900/50">
          <p className="text-[10px] font-bold text-dark-muted uppercase">Fora do Prazo</p>
          <p className="text-2xl font-extrabold text-red-400">{stats.foraDoPrazo}</p>
        </div>
        <div className="bg-dark-surface rounded-2xl p-4 border border-dark-border">
          <p className="text-[10px] font-bold text-dark-muted uppercase">Aprovados</p>
          <p className="text-2xl font-extrabold text-emerald-400">{stats.aprovados}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-dark-muted" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-dark-border bg-dark-input text-white">
          <option value="TODOS">Todos os status</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="APROVADO">Aprovados</option>
        </select>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-dark-border bg-dark-input text-white">
          <option value="TODAS">Todas as turmas</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Lista de chamados */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-xs text-dark-muted">Carregando...</p>
        ) : filteredChamados.length === 0 ? (
          <p className="text-xs text-dark-muted">Nenhum chamado encontrado.</p>
        ) : (
          filteredChamados.map(chamado => {
            const { deadline, overdue, daysLate } = getDeadlineInfo(chamado);
            return (
              <div
                key={chamado.id}
                className={`bg-dark-surface rounded-xl p-4 border space-y-2 ${
                  overdue ? 'border-red-800/60' : chamado.status === 'APROVADO' ? 'border-emerald-800/40' : 'border-dark-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-white">#{chamado.numeroChamado}</p>
                    <p className="text-xs text-dark-muted">{chamado.className} — {TYPE_LABELS[chamado.type]}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {chamado.status === 'APROVADO' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3" /> Aprovado em {chamado.approvedDate && formatDatePtBr(chamado.approvedDate)}
                      </span>
                    ) : overdue ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-red-950/50 text-red-300 border border-red-800/50">
                        <AlertTriangle className="w-3 h-3" /> {daysLate}d fora do prazo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-950/50 text-sky-300 border border-sky-800/50">
                        <Clock className="w-3 h-3" /> Prazo: {formatDatePtBr(deadline)}
                      </span>
                    )}
                  </div>
                </div>
                {chamado.description && <p className="text-xs text-dark-text">{chamado.description}</p>}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-dark-muted">
                    Aberto em {formatDatePtBr(chamado.openedDate)} · SLA {chamado.slaDays}d
                    {chamado.createdBy && ` · por ${chamado.createdBy}`}
                  </p>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      {chamado.status === 'PENDENTE' && (
                        <button
                          onClick={() => handleApprove(chamado)}
                          className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/40 rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Aprovar
                        </button>
                      )}
                      <button onClick={() => handleDelete(chamado)} className="p-1.5 text-dark-muted hover:text-bradesco-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de criação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-surface rounded-2xl border border-dark-border w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Novo Chamado</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-dark-muted hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">Número do Chamado</label>
                <input value={formNumero} onChange={e => setFormNumero(e.target.value)} required placeholder="Ex: INC0012345" className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">Turma vinculada</label>
                <select value={formClassId} onChange={e => setFormClassId(e.target.value)} required className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none">
                  <option value="">Selecione...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">Tipo</label>
                <select value={formType} onChange={e => setFormType(e.target.value as ChamadoType)} className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none">
                  <option value="ERRO_SISTEMA">Erro de Sistema</option>
                  <option value="SOLICITACAO_ACESSO">Solicitação de Acesso</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1">Data de Abertura</label>
                  <input type="date" value={formOpenedDate} onChange={e => setFormOpenedDate(e.target.value)} required className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1">Prazo p/ Tratativa (dias)</label>
                  <input type="number" min={1} value={formSlaDays} onChange={e => setFormSlaDays(e.target.value)} required className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">Descrição (opcional)</label>
                <textarea rows={2} value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-dark-border bg-dark-input text-white focus:ring-2 focus:ring-bradesco-500 focus:outline-none" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-bradesco-600 hover:bg-bradesco-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-bradesco-600/30">
                <Save className="w-3.5 h-3.5" />
                <span>Cadastrar Chamado</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
