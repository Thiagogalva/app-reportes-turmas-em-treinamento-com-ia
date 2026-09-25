'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  CheckCircle,
  Archive,
  Edit2,
  Trash2,
  RotateCcw,
  UserPlus,
  X,
  Info,
  Layers,
  Key,
  CreditCard
} from 'lucide-react';
import { ClassGroup, ClassStatus, Student, Segment } from '@/types';

export default function TurmasPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeTab, setActiveTab] = useState<'EM_TREINAMENTO' | 'CONCLUIDA'>('EM_TREINAMENTO');
  const [loading, setLoading] = useState(true);

  // Modal de Criação / Edição de Turma
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);

  // Campos do formulário de turma
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('Thiago Instrutor');
  const [segmentId, setSegmentId] = useState('');
  const [status, setStatus] = useState<ClassStatus>('EM_TREINAMENTO');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [students, setStudents] = useState<Student[]>([]);

  // Novo operador rápido
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEnrollment, setNewStudentEnrollment] = useState('');
  const [newStudentNetworkLogin, setNewStudentNetworkLogin] = useState('');
  const [newStudentClientLogin, setNewStudentClientLogin] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [bulkStudentsText, setBulkStudentsText] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resClasses, resSegments] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/segments')
      ]);
      const jsonClasses = await resClasses.json();
      const jsonSegments = await resSegments.json();

      if (jsonClasses.success) setClasses(jsonClasses.data);
      if (jsonSegments.success) {
        setSegments(jsonSegments.data);
        if (jsonSegments.data.length > 0 && !segmentId) {
          setSegmentId(jsonSegments.data[0].id);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingClass(null);
    setName('');
    setCode(`TURMA-${new Date().getFullYear()}.${classes.length + 1}`);
    setInstructor('Thiago Instrutor');
    setSegmentId(segments[0]?.id || '');
    setStatus('EM_TREINAMENTO');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setDescription('');
    setStudents([]);
    setShowBulkAdd(false);
    setIsModalOpen(true);
  };

  const openEditModal = (c: ClassGroup) => {
    setEditingClass(c);
    setName(c.name);
    setCode(c.code);
    setInstructor(c.instructor);
    setSegmentId(c.segmentId || (segments[0]?.id || ''));
    setStatus(c.status);
    setStartDate(c.startDate);
    setEndDate(c.endDate || '');
    setDescription(c.description || '');
    setStudents(c.students || []);
    setShowBulkAdd(false);
    setIsModalOpen(true);
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;

    const matricula = newStudentEnrollment.trim() || `MAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const rede = newStudentNetworkLogin.trim() || `B${Math.floor(100000 + Math.random() * 900000)}`;
    const cliente = newStudentClientLogin.trim() || `CLI-${Math.floor(100 + Math.random() * 900)}`;

    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newStudentName.trim(),
      email: newStudentEmail.trim() || undefined,
      enrollmentNumber: matricula,
      networkLogin: rede,
      clientLogin: cliente,
      active: true,
    };
    setStudents(prev => [...prev, newStudent]);
    setNewStudentName('');
    setNewStudentEnrollment('');
    setNewStudentNetworkLogin('');
    setNewStudentClientLogin('');
    setNewStudentEmail('');
  };

  const handleRemoveStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleBulkAddStudents = () => {
    if (!bulkStudentsText.trim()) return;
    const lines = bulkStudentsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newStudents: Student[] = lines.map((line, idx) => {
      // Suporta formato "Nome; Matrícula; Login Rede; Login Cliente" ou apenas "Nome"
      const parts = line.split(';').map(p => p.trim());
      const name = parts[0];
      const matricula = parts[1] || `MAT-${Math.floor(1000 + Math.random() * 9000)}`;
      const rede = parts[2] || `B${Math.floor(100000 + Math.random() * 900000)}`;
      const cliente = parts[3] || `CLI-${Math.floor(100 + Math.random() * 900)}`;

      return {
        id: `std-${Date.now()}-${idx}`,
        name,
        enrollmentNumber: matricula,
        networkLogin: rede,
        clientLogin: cliente,
        active: true,
      };
    });
    setStudents(prev => [...prev, ...newStudents]);
    setBulkStudentsText('');
    setShowBulkAdd(false);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Nome e Código são obrigatórios.');
      return;
    }

    const currentSegment = segments.find(s => s.id === segmentId);

    const payload = {
      ...(editingClass ? { id: editingClass.id } : {}),
      name: name.trim(),
      code: code.trim(),
      instructor: instructor.trim(),
      segmentId,
      segmentName: currentSegment?.name || 'Geral',
      status,
      startDate,
      endDate: endDate || undefined,
      description: description.trim() || undefined,
      students,
    };

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        await loadData();
        setFeedbackMsg({
          text: editingClass ? 'Turma atualizada com sucesso!' : 'Nova turma cadastrada com sucesso!',
          type: 'success',
        });
        setTimeout(() => setFeedbackMsg(null), 3000);
      } else {
        alert(json.error || 'Erro ao salvar turma.');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar turma.');
    }
  };

  // Alternar status da turma: "EM_TREINAMENTO" <-> "CONCLUIDA"
  const toggleClassStatus = async (c: ClassGroup) => {
    const newStatus: ClassStatus = c.status === 'EM_TREINAMENTO' ? 'CONCLUIDA' : 'EM_TREINAMENTO';
    const confirmText = newStatus === 'CONCLUIDA'
      ? `Deseja realmente marcar a turma "${c.name}" como CONCLUÍDA?\n\nEla sairá da tela principal (Dashboard) e da seleção de novos reportes, ficando arquivada no histórico de turmas concluídas.`
      : `Deseja reativar a turma "${c.name}" para EM TREINAMENTO?\n\nEla voltará a ser exibida no Dashboard principal e na seleção de relatórios diários.`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...c,
          status: newStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await loadData();
        setFeedbackMsg({
          text: newStatus === 'CONCLUIDA'
            ? `Turma "${c.name}" concluída! Ela foi movida para o arquivo e retirada do Dashboard.`
            : `Turma "${c.name}" reativada com sucesso! Ela voltou para o Dashboard.`,
          type: 'info',
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  };

  const handleDeleteClass = async (c: ClassGroup) => {
    if (!window.confirm(`Tem certeza que deseja excluir a turma "${c.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/classes?id=${c.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await loadData();
        setFeedbackMsg({ text: 'Turma excluída com sucesso.', type: 'info' });
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const filteredClasses = classes.filter(c => c.status === activeTab);
  const activeCount = classes.filter(c => c.status === 'EM_TREINAMENTO').length;
  const concludedCount = classes.filter(c => c.status === 'CONCLUIDA').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 shadow-xl border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-bradesco-900/40 text-bradesco-400 border border-bradesco-600/40">
            Controle de Turmas
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
            Gestão de Turmas & Operadores
          </h1>
          <p className="text-xs text-dark-muted">
            Defina o segmento de cada turma e gerencie matrículas, logins de rede e clientes dos operadores.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-bradesco-600 hover:bg-bradesco-700 text-white text-xs font-bold shadow-lg shadow-bradesco-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Turma</span>
        </button>
      </div>

      {/* Alerta de Feedback */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            : feedbackMsg.type === 'error'
            ? 'bg-bradesco-950/60 border-bradesco-800 text-bradesco-300'
            : 'bg-dark-card border-dark-border text-white'
        }`}>
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Regra de Negócio */}
      <div className="bg-dark-surface border border-dark-border rounded-2xl p-4 flex items-start gap-3 text-xs text-dark-muted">
        <Info className="w-5 h-5 text-bradesco-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Segmentação e Credenciais:</strong>
          <p className="mt-0.5 text-dark-muted leading-relaxed">
            Cada turma está vinculada a um <strong>Segmento</strong> (como Varejo, Prime, Cartões), determinando automaticamente quais sistemas corporativos (Sistema GEO, WDE, CRM, etc.) devem ser testados e homologados para os operadores.
          </p>
        </div>
      </div>

      {/* Tabs: Em Treinamento vs Concluídas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-dark-border pb-2">
        <button
          onClick={() => setActiveTab('EM_TREINAMENTO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'EM_TREINAMENTO'
              ? 'bg-bradesco-600 text-white shadow-lg shadow-bradesco-600/30'
              : 'text-dark-muted hover:text-white hover:bg-dark-card'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Em Treinamento (Ativas no Dashboard)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-black/30 text-white">
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CONCLUIDA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'CONCLUIDA'
              ? 'bg-dark-card text-white border border-dark-border shadow-sm'
              : 'text-dark-muted hover:text-white hover:bg-dark-card'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Turmas Concluídas (Fora do Dashboard)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-dark-bg text-dark-muted">
            {concludedCount}
          </span>
        </button>
      </div>

      {/* Grid de Cards de Turmas */}
      {filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredClasses.map((c) => (
            <div
              key={c.id}
              className={`bg-dark-surface rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
                c.status === 'EM_TREINAMENTO'
                  ? 'border-dark-border hover:border-bradesco-600/60'
                  : 'border-dark-border opacity-80'
              }`}
            >
              <div className="space-y-3">
                {/* Header do Card */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-dark-card text-dark-muted border border-dark-border tracking-wider">
                    {c.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {c.segmentName && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/40">
                        {c.segmentName}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.status === 'EM_TREINAMENTO'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                          : 'bg-dark-card text-dark-muted border-dark-border'
                      }`}
                    >
                      {c.status === 'EM_TREINAMENTO' ? '● Em Treinamento' : '✓ Concluída'}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {c.name}
                  </h3>
                  <p className="text-xs text-dark-muted mt-0.5">
                    Instrutor: <strong className="text-slate-300">{c.instructor}</strong>
                  </p>
                </div>

                {c.description && (
                  <p className="text-xs text-dark-muted bg-dark-card p-2.5 rounded-xl border border-dark-border leading-relaxed line-clamp-2">
                    {c.description}
                  </p>
                )}

                {/* Status de Homologação de Sistemas */}
                <div className="p-2.5 rounded-xl bg-dark-card border border-dark-border flex items-center justify-between text-xs">
                  <span className="text-dark-muted font-medium">Sistemas Operadores:</span>
                  {c.systemsValidated ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      100% Homologados
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold text-[11px]">
                      Pendente de Teste
                    </span>
                  )}
                </div>

                {/* Métricas do Card */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-dark-card p-2.5 rounded-xl border border-dark-border">
                    <span className="text-[10px] text-dark-muted block font-bold">Operadores</span>
                    <strong className="text-white">{c.students.length} cadastrados</strong>
                  </div>
                  <div className="bg-dark-card p-2.5 rounded-xl border border-dark-border">
                    <span className="text-[10px] text-dark-muted block font-bold">Início</span>
                    <strong className="text-white">{c.startDate}</strong>
                  </div>
                </div>
              </div>

              {/* Ações do Card */}
              <div className="mt-5 pt-4 border-t border-dark-border flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleClassStatus(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    c.status === 'EM_TREINAMENTO'
                      ? 'bg-dark-card hover:bg-dark-border text-amber-400 border border-amber-900/40'
                      : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/40'
                  }`}
                  title={c.status === 'EM_TREINAMENTO' ? 'Concluir turma' : 'Reativar turma'}
                >
                  {c.status === 'EM_TREINAMENTO' ? (
                    <>
                      <Archive className="w-3.5 h-3.5 text-amber-400" />
                      <span>Concluir Turma</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Reativar no Dashboard</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 text-dark-muted hover:text-white hover:bg-dark-card rounded-lg transition-colors"
                    title="Editar Turma e Alunos"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteClass(c)}
                    className="p-1.5 text-dark-muted hover:text-bradesco-400 hover:bg-bradesco-950/40 rounded-lg transition-colors"
                    title="Excluir Turma"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-surface rounded-2xl p-12 border border-dark-border text-center space-y-3">
          <Archive className="w-10 h-10 text-dark-muted mx-auto" />
          <h3 className="text-base font-bold text-white">
            Nenhuma turma encontrada nesta categoria
          </h3>
          <p className="text-xs text-dark-muted max-w-sm mx-auto">
            {activeTab === 'EM_TREINAMENTO'
              ? 'Não há turmas em andamento. Cadastre uma nova turma para começar a gerar relatórios.'
              : 'Nenhuma turma foi concluída ainda.'}
          </p>
          {activeTab === 'EM_TREINAMENTO' && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bradesco-600 hover:bg-bradesco-700 text-white text-xs font-bold shadow-md shadow-bradesco-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Turma</span>
            </button>
          )}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-surface rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-dark-border text-dark-text">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-dark-border bg-gradient-to-r from-bradesco-700 via-bradesco-600 to-rose-700 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-white" />
                  {editingClass ? 'Editar Turma e Operadores' : 'Nova Turma de Treinamento'}
                </h2>
                <p className="text-xs text-rose-100">
                  Configure o segmento da turma e cadastre os operadores com matrícula, login de rede e cliente
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveClass} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-dark-muted mb-1">
                    Nome da Turma *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Turma Operações Varejo - 2026.1"
                    className="w-full text-xs font-medium text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1">
                    Código Identificador *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: OPS-2026.1"
                    className="w-full text-xs font-medium text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-bradesco-500" />
                    Segmento da Turma *
                  </label>
                  <select
                    value={segmentId}
                    onChange={(e) => setSegmentId(e.target.value)}
                    className="w-full text-xs font-bold text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
                  >
                    {segments.map((seg) => (
                      <option key={seg.id} value={seg.id}>
                        {seg.name} ({seg.systems.length} sistemas)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1">
                    Instrutor Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="Ex: Thiago Silva"
                    className="w-full text-xs font-medium text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1">
                    Status da Turma *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ClassStatus)}
                    className="w-full text-xs font-bold text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
                  >
                    <option value="EM_TREINAMENTO">Em treinamento (Ativa no Dashboard)</option>
                    <option value="CONCLUIDA">Concluída (Fora do Dashboard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-medium text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark-muted mb-1">
                    Data Prevista de Término
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs font-medium text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
                  />
                </div>
              </div>

              {/* SEÇÃO DE OPERADORES DA TURMA COM CREDENCIAIS */}
              <div className="border-t border-dark-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-bradesco-500" />
                      Operadores da Turma ({students.length})
                    </h3>
                    <p className="text-[11px] text-dark-muted">
                      Cadastre com matrícula, login de rede e login cliente
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBulkAdd(!showBulkAdd)}
                    className="text-xs font-bold text-bradesco-400 hover:text-bradesco-300"
                  >
                    {showBulkAdd ? 'Adicionar individualmente' : '+ Colar Lista em Lote'}
                  </button>
                </div>

                {showBulkAdd ? (
                  <div className="p-3 bg-dark-card rounded-xl border border-dark-border space-y-2">
                    <label className="block text-[11px] font-bold text-dark-muted">
                      Cole a lista de operadores (um por linha, formato: <code>Nome; Matrícula; Login Rede; Login Cliente</code>):
                    </label>
                    <textarea
                      rows={4}
                      value={bulkStudentsText}
                      onChange={(e) => setBulkStudentsText(e.target.value)}
                      placeholder="Ana Beatriz; MAT-9011; B812341; CLI-VAR-101&#10;Carlos Eduardo; MAT-9012; B812342; CLI-VAR-102"
                      className="w-full text-xs p-2 rounded-lg border border-dark-border bg-dark-input text-white focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleBulkAddStudents}
                      className="px-3 py-1.5 bg-bradesco-600 text-white rounded-lg text-xs font-bold hover:bg-bradesco-700"
                    >
                      Inserir Operadores
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-dark-card rounded-xl border border-dark-border space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Nome do Operador..."
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        className="text-xs p-2 rounded-xl border border-dark-border bg-dark-input text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Matrícula (ex: MAT-1029)..."
                        value={newStudentEnrollment}
                        onChange={(e) => setNewStudentEnrollment(e.target.value)}
                        className="text-xs p-2 rounded-xl border border-dark-border bg-dark-input text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Login Rede (ex: B812341)..."
                        value={newStudentNetworkLogin}
                        onChange={(e) => setNewStudentNetworkLogin(e.target.value)}
                        className="text-xs p-2 rounded-xl border border-dark-border bg-dark-input text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Login Cliente (ex: CLI-101)..."
                        value={newStudentClientLogin}
                        onChange={(e) => setNewStudentClientLogin(e.target.value)}
                        className="text-xs p-2 rounded-xl border border-dark-border bg-dark-input text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddStudent}
                        className="px-4 py-2 bg-bradesco-600 text-white rounded-xl text-xs font-bold hover:bg-bradesco-700 flex items-center gap-1 shadow-md shadow-bradesco-600/30"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Adicionar Operador</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Alunos Adicionados com detalhes de credenciais */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-dark-border rounded-xl p-2 bg-dark-input">
                  {students.length > 0 ? (
                    students.map((st, i) => (
                      <div
                        key={st.id || i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-dark-card rounded-lg border border-dark-border text-xs gap-2"
                      >
                        <div className="space-y-0.5">
                          <strong className="text-white text-xs">{st.name}</strong>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-dark-muted font-mono">
                            <span className="bg-dark-bg px-1.5 py-0.5 rounded border border-dark-border">
                              Matrícula: <strong className="text-slate-200">{st.enrollmentNumber}</strong>
                            </span>
                            <span className="bg-dark-bg px-1.5 py-0.5 rounded border border-dark-border">
                              Login Rede: <strong className="text-bradesco-400">{st.networkLogin}</strong>
                            </span>
                            {st.clientLogin && (
                              <span className="bg-dark-bg px-1.5 py-0.5 rounded border border-dark-border">
                                Login Cliente: <strong className="text-blue-400">{st.clientLogin}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(st.id)}
                          className="self-end sm:self-center text-dark-muted hover:text-bradesco-400 p-1 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-dark-muted">
                      Nenhum operador adicionado ainda.
                    </div>
                  )}
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 border-t border-dark-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-dark-muted hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bradesco-600 hover:bg-bradesco-700 text-white text-xs font-bold shadow-lg shadow-bradesco-600/30"
                >
                  {editingClass ? 'Atualizar Turma' : 'Salvar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
