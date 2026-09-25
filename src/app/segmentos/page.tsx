'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Server,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
  Save,
  Check,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Segment, SegmentSystem } from '@/types';

export default function SegmentosPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal de Segmento (Criar / Editar)
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDesc, setSegmentDesc] = useState('');

  // Modal de Sistema (Criar / Editar sistema do segmento)
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<SegmentSystem | null>(null);
  const [systemName, setSystemName] = useState('');
  const [systemDesc, setSystemDesc] = useState('');
  const [systemMandatory, setSystemMandatory] = useState(true);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadSegments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/segments');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setSegments(json.data);
        if (!selectedSegmentId || !json.data.some((s: Segment) => s.id === selectedSegmentId)) {
          setSelectedSegmentId(json.data[0].id);
        }
      } else {
        setSegments([]);
      }
    } catch (err) {
      console.error("Erro ao carregar segmentos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSegments();
  }, []);

  const activeSegment = segments.find(s => s.id === selectedSegmentId);

  // Handlers para Segmento
  const openCreateSegmentModal = () => {
    setEditingSegment(null);
    setSegmentName('');
    setSegmentDesc('');
    setIsSegmentModalOpen(true);
  };

  const openEditSegmentModal = (s: Segment) => {
    setEditingSegment(s);
    setSegmentName(s.name);
    setSegmentDesc(s.description || '');
    setIsSegmentModalOpen(true);
  };

  const handleSaveSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentName.trim()) return;

    const payload = {
      ...(editingSegment ? { id: editingSegment.id, systems: editingSegment.systems } : { systems: [] }),
      name: segmentName.trim(),
      description: segmentDesc.trim(),
    };

    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setIsSegmentModalOpen(false);
        await loadSegments();
        setSelectedSegmentId(json.data.id);
        setFeedbackMsg({ text: 'Segmento salvo com sucesso!', type: 'success' });
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar segmento.');
    }
  };

  const handleDeleteSegment = async (s: Segment) => {
    if (!window.confirm(`Tem certeza que deseja excluir o segmento "${s.name}" e seus sistemas configurados?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/segments?id=${s.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await loadSegments();
        setFeedbackMsg({ text: 'Segmento excluído com sucesso.', type: 'success' });
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (err) {
      console.error("Erro ao excluir segmento:", err);
    }
  };

  // Handlers para Sistemas do Segmento
  const openCreateSystemModal = () => {
    setEditingSystem(null);
    setSystemName('');
    setSystemDesc('');
    setSystemMandatory(true);
    setIsSystemModalOpen(true);
  };

  const openEditSystemModal = (sys: SegmentSystem) => {
    setEditingSystem(sys);
    setSystemName(sys.name);
    setSystemDesc(sys.description || '');
    setSystemMandatory(sys.mandatory ?? true);
    setIsSystemModalOpen(true);
  };

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSegment || !systemName.trim()) return;

    let updatedSystems = [...activeSegment.systems];

    if (editingSystem) {
      updatedSystems = updatedSystems.map(item =>
        item.id === editingSystem.id
          ? {
              ...item,
              name: systemName.trim(),
              description: systemDesc.trim(),
              mandatory: systemMandatory,
            }
          : item
      );
    } else {
      const newSys: SegmentSystem = {
        id: `sys-${Date.now()}`,
        name: systemName.trim(),
        description: systemDesc.trim(),
        mandatory: systemMandatory,
      };
      updatedSystems.push(newSys);
    }

    const payload = {
      ...activeSegment,
      systems: updatedSystems,
    };

    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setIsSystemModalOpen(false);
        await loadSegments();
        setFeedbackMsg({
          text: editingSystem ? 'Sistema atualizado!' : 'Novo sistema incluído no segmento!',
          type: 'success',
        });
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar sistema.');
    }
  };

  const handleDeleteSystem = async (systemId: string, systemName: string) => {
    if (!activeSegment) return;
    if (!window.confirm(`Deseja remover o sistema "${systemName}" do segmento "${activeSegment.name}"?`)) {
      return;
    }

    const updatedSystems = activeSegment.systems.filter(s => s.id !== systemId);
    const payload = {
      ...activeSegment,
      systems: updatedSystems,
    };

    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        await loadSegments();
        setFeedbackMsg({ text: 'Sistema removido do segmento.', type: 'success' });
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (err) {
      console.error("Erro ao remover sistema:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 shadow-xl border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-bradesco-900/40 text-bradesco-400 border border-bradesco-600/40">
            Segmentação Operacional
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
            Gestão de Segmentos & Sistemas
          </h1>
          <p className="text-xs text-dark-muted">
            Configure quais sistemas (como Sistema GEO, WDE, CRM) pertencem a cada segmento do treinamento.
          </p>
        </div>

        <button
          onClick={openCreateSegmentModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-bradesco-600 hover:bg-bradesco-700 text-white text-xs font-bold shadow-lg shadow-bradesco-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Segmento</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            : 'bg-bradesco-950/60 border-bradesco-800 text-bradesco-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Informativo de Funcionamento */}
      <div className="bg-dark-surface border border-dark-border rounded-2xl p-4 flex items-start gap-3 text-xs text-dark-muted">
        <Info className="w-5 h-5 text-bradesco-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Como a homologação de sistemas funciona:</strong>
          <p className="mt-0.5 text-dark-muted leading-relaxed">
            Ao criar uma turma, você seleciona o segmento correspondente (ex: Varejo, Prime, Cartões). Os operadores dessa turma serão testados nos sistemas configurados abaixo. Caso todos os sistemas de cada operador funcionem, <strong>a turma é marcada como homologada e o sistema não precisa perguntar diariamente se os sistemas funcionaram</strong>, poupando tempo nos lançamentos diários!
          </p>
        </div>
      </div>

      {/* Conteúdo Principal: Seletor de Segmentos e Lista de Sistemas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Lista de Segmentos */}
        <div className="bg-dark-surface rounded-2xl p-4 sm:p-5 border border-dark-border shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-dark-border pb-3">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-bradesco-500" />
              Segmentos Cadastrados
            </h3>
            <span className="text-[11px] font-bold text-dark-muted">
              {segments.length}
            </span>
          </div>

          <div className="space-y-2">
            {segments.map((seg) => {
              const isSelected = seg.id === selectedSegmentId;
              return (
                <div
                  key={seg.id}
                  onClick={() => setSelectedSegmentId(seg.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-bradesco-600/15 border-bradesco-600 text-white shadow-md'
                      : 'bg-dark-card border-dark-border text-dark-muted hover:text-white hover:bg-dark-border'
                  }`}
                >
                  <div className="truncate flex-1">
                    <span className={`text-xs font-bold block truncate ${isSelected ? 'text-bradesco-400' : 'text-white'}`}>
                      {seg.name}
                    </span>
                    <span className="text-[11px] text-dark-muted block mt-0.5">
                      {seg.systems.length} sistema(s) configurado(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditSegmentModal(seg)}
                      className="p-1.5 text-dark-muted hover:text-white hover:bg-dark-bg rounded-lg transition-colors"
                      title="Editar Segmento"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {segments.length > 1 && (
                      <button
                        onClick={() => handleDeleteSegment(seg)}
                        className="p-1.5 text-dark-muted hover:text-bradesco-400 hover:bg-bradesco-950/40 rounded-lg transition-colors"
                        title="Excluir Segmento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna 2 e 3: Sistemas do Segmento Selecionado */}
        <div className="lg:col-span-2 bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
          {activeSegment ? (
            <>
              {/* Header do Segmento Selecionado */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-bradesco-950 text-bradesco-400 border border-bradesco-800/40">
                      Segmento Ativo
                    </span>
                    <h2 className="text-lg font-bold text-white">
                      {activeSegment.name}
                    </h2>
                  </div>
                  {activeSegment.description && (
                    <p className="text-xs text-dark-muted mt-1">
                      {activeSegment.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={openCreateSystemModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bradesco-600 hover:bg-bradesco-700 text-white text-xs font-bold shadow-md shadow-bradesco-600/30 transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Incluir Sistema</span>
                </button>
              </div>

              {/* Lista de Sistemas do Segmento */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-bradesco-500" />
                  Sistemas do Segmento {activeSegment.name} ({activeSegment.systems.length})
                </h3>

                {activeSegment.systems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeSegment.systems.map((sys) => (
                      <div
                        key={sys.id}
                        className="bg-dark-card rounded-xl p-4 border border-dark-border flex flex-col justify-between space-y-3 hover:border-dark-borderHover transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-white">
                              {sys.name}
                            </span>
                            {sys.mandatory && (
                              <span className="text-[9px] bg-bradesco-950 text-bradesco-400 font-bold px-1.5 py-0.5 rounded border border-bradesco-800/40">
                                Obrigatório
                              </span>
                            )}
                          </div>
                          {sys.description && (
                            <p className="text-[11px] text-dark-muted leading-relaxed">
                              {sys.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-dark-border">
                          <button
                            onClick={() => openEditSystemModal(sys)}
                            className="p-1.5 text-dark-muted hover:text-white hover:bg-dark-bg rounded-lg transition-colors text-xs flex items-center gap-1"
                            title="Editar Sistema"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSystem(sys.id, sys.name)}
                            className="p-1.5 text-dark-muted hover:text-bradesco-400 hover:bg-bradesco-950/40 rounded-lg transition-colors text-xs flex items-center gap-1"
                            title="Excluir Sistema"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-dark-card rounded-xl border border-dark-border text-dark-muted text-xs">
                    Nenhum sistema configurado para este segmento ainda.
                    <div className="mt-2">
                      <button
                        onClick={openCreateSystemModal}
                        className="text-xs font-bold text-bradesco-400 hover:text-bradesco-300"
                      >
                        + Adicionar primeiro sistema (ex: Sistema GEO, WDE)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-dark-muted text-xs">
              Selecione um segmento para visualizar e configurar seus sistemas.
            </div>
          )}
        </div>
      </div>

      {/* MODAL CRIAR / EDITAR SEGMENTO */}
      {isSegmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full border border-dark-border text-dark-text overflow-hidden">
            <div className="p-4 border-b border-dark-border bg-gradient-to-r from-bradesco-700 to-rose-700 text-white flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-white" />
                {editingSegment ? 'Editar Segmento' : 'Novo Segmento'}
              </h2>
              <button
                onClick={() => setIsSegmentModalOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSegment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">
                  Nome do Segmento *
                </label>
                <input
                  type="text"
                  required
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="Ex: Varejo, Prime, Cartões, Empresas..."
                  className="w-full text-xs font-medium text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">
                  Descrição do Segmento
                </label>
                <textarea
                  rows={2}
                  value={segmentDesc}
                  onChange={(e) => setSegmentDesc(e.target.value)}
                  placeholder="Ex: Atendimento especializado a clientes de alta renda..."
                  className="w-full text-xs text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
                />
              </div>

              <div className="pt-3 border-t border-dark-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSegmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-dark-muted hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bradesco-600 hover:bg-bradesco-700 text-white text-xs font-bold shadow-lg shadow-bradesco-600/30"
                >
                  Salvar Segmento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR / EDITAR SISTEMA DO SEGMENTO */}
      {isSystemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full border border-dark-border text-dark-text overflow-hidden">
            <div className="p-4 border-b border-dark-border bg-gradient-to-r from-bradesco-700 to-rose-700 text-white flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Server className="w-4 h-4 text-white" />
                  {editingSystem ? 'Editar Sistema' : 'Novo Sistema no Segmento'}
                </h2>
                <p className="text-[11px] text-rose-100">
                  Segmento: <strong>{activeSegment?.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsSystemModalOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSystem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">
                  Nome do Sistema *
                </label>
                <input
                  type="text"
                  required
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  placeholder="Ex: Sistema GEO, WDE, CRM, Vision Plus..."
                  className="w-full text-xs font-medium text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark-muted mb-1">
                  Descrição ou Finalidade
                </label>
                <textarea
                  rows={2}
                  value={systemDesc}
                  onChange={(e) => setSystemDesc(e.target.value)}
                  placeholder="Ex: Softphone Genesys para recebimento de chamadas e discador..."
                  className="w-full text-xs text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-mandatory"
                  checked={systemMandatory}
                  onChange={(e) => setSystemMandatory(e.target.checked)}
                  className="rounded border-dark-border bg-dark-input text-bradesco-600 focus:ring-bradesco-500"
                />
                <label htmlFor="chk-mandatory" className="text-xs font-bold text-dark-text cursor-pointer">
                  Sistema Crítico / Obrigatório para Homologação
                </label>
              </div>

              <div className="pt-3 border-t border-dark-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSystemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-dark-muted hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bradesco-600 hover:bg-bradesco-700 text-white text-xs font-bold shadow-lg shadow-bradesco-600/30"
                >
                  {editingSystem ? 'Atualizar Sistema' : 'Adicionar ao Segmento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
