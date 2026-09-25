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
  AlertCircle,
  X,
  Save,
  Check,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { ClassGroup, ClassStatus, Student } from '@/types';

export default function TurmasPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'EM_TREINAMENTO' | 'CONCLUIDA'>('EM_TREINAMENTO');
  const [loading, setLoading] = useState(true);

  // Modal de Criação / Edição de Turma
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);

  // Campos do formulário de turma
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('Thiago Instrutor');
  const [status, setStatus] = useState<ClassStatus>('EM_TREINAMENTO');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [students, setStudents] = useState<Student[]>([]);

  // Novo aluno rápido
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [bulkStudentsText, setBulkStudentsText] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/classes');
      const json = await res.json();
      if (json.success) {
        setClasses(json.data);
      }
    } catch (err) {
      console.error("Erro ao carregar turmas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const openCreateModal = () => {
    setEditingClass(null);
    setName('');
    setCode(`TURMA-${new Date().getFullYear()}.${classes.length + 1}`);
    setInstructor('Thiago Instrutor');
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
    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newStudentName.trim(),
      email: newStudentEmail.trim() || undefined,
      enrollmentNumber: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      active: true,
    };
    setStudents(prev => [...prev, newStudent]);
    setNewStudentName('');
    setNewStudentEmail('');
  };

  const handleRemoveStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleBulkAddStudents = () => {
    if (!bulkStudentsText.trim()) return;
    const lines = bulkStudentsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newStudents: Student[] = lines.map((line, idx) => ({
      id: `std-${Date.now()}-${idx}`,
      name: line,
      enrollmentNumber: `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      active: true,
    }));
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

    const payload = {
      ...(editingClass ? { id: editingClass.id } : {}),
      name: name.trim(),
      code: code.trim(),
      instructor: instructor.trim(),
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
        await loadClasses();
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
        await loadClasses();
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
        await loadClasses();
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
            Controle de Turmas
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Gestão de Turmas e Alunos
          </h1>
          <p className="text-xs text-slate-500">
            Alterne o status das turmas. Apenas turmas <strong className="text-emerald-700">Em treinamento</strong> alimentam o Dashboard e os reportes ativos.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Turma</span>
        </button>
      </div>

      {/* Alerta de Feedback */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : feedbackMsg.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Regra de Negócio Explicada em Banner Informativo */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/70 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900">Como funciona a regra de status de turmas:</strong>
          <p className="mt-0.5 text-slate-600">
            • <strong>Em treinamento:</strong> A turma é ativa, seus dados são exibidos na tela principal (Dashboard) e está disponível para o preenchimento de reportes diários.<br />
            • <strong>Concluída:</strong> Fica automaticamente arquivada. Não aparece no seletor de novos reportes nem no Dashboard ativo, mantendo seus dados históricos seguros. Você pode reativá-la a qualquer momento.
          </p>
        </div>
      </div>

      {/* Tabs: Em Treinamento vs Concluídas */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('EM_TREINAMENTO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'EM_TREINAMENTO'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
          <span>Em Treinamento (Ativas no Dashboard)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CONCLUIDA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'CONCLUIDA'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Turmas Concluídas (Fora do Dashboard)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {concludedCount}
          </span>
        </button>
      </div>

      {/* Grid de Cards de Turmas */}
      {filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
                c.status === 'EM_TREINAMENTO'
                  ? 'border-emerald-200 hover:border-emerald-300'
                  : 'border-slate-200 opacity-90'
              }`}
            >
              <div className="space-y-3">
                {/* Header do Card */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 tracking-wider">
                    {c.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      c.status === 'EM_TREINAMENTO'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {c.status === 'EM_TREINAMENTO' ? '● Em Treinamento' : '✓ Concluída'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instrutor: <strong className="text-slate-700">{c.instructor}</strong>
                  </p>
                </div>

                {c.description && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed line-clamp-2">
                    {c.description}
                  </p>
                )}

                {/* Métricas do Card */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Alunos</span>
                    <strong className="text-slate-800">{c.students.length} cadastrados</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Início</span>
                    <strong className="text-slate-800">{c.startDate}</strong>
                  </div>
                </div>
              </div>

              {/* Ações do Card */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* Botão de Alternar Status (Em treinamento / Concluída) */}
                <button
                  onClick={() => toggleClassStatus(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    c.status === 'EM_TREINAMENTO'
                      ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                  title={
                    c.status === 'EM_TREINAMENTO'
                      ? 'Concluir turma (retira do Dashboard ativo)'
                      : 'Reativar turma (volta para o Dashboard)'
                  }
                >
                  {c.status === 'EM_TREINAMENTO' ? (
                    <>
                      <Archive className="w-3.5 h-3.5 text-amber-600" />
                      <span>Concluir Turma</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reativar no Dashboard</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Editar Turma e Alunos"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteClass(c)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <Archive className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">
            Nenhuma turma encontrada nesta categoria
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeTab === 'EM_TREINAMENTO'
              ? 'Não há turmas em andamento. Cadastre uma nova turma para começar a gerar relatórios.'
              : 'Nenhuma turma foi concluída ainda.'}
          </p>
          {activeTab === 'EM_TREINAMENTO' && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Turma</span>
            </button>
          )}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  {editingClass ? 'Editar Turma e Alunos' : 'Nova Turma de Treinamento'}
                </h2>
                <p className="text-xs text-slate-400">
                  Configure os dados da turma e adicione a lista de alunos
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
            <form onSubmit={handleSaveClass} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome da Turma *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Turma Atendimento & Operações - 2026.1"
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código Identificador *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: OPS-2026.1"
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instrutor Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    placeholder="Ex: Thiago Silva"
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status da Turma *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ClassStatus)}
                    className="w-full text-xs font-bold text-slate-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="EM_TREINAMENTO">Em treinamento (Ativa no Dashboard)</option>
                    <option value="CONCLUIDA">Concluída (Fora do Dashboard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Prevista de Término
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição ou Objetivo do Treinamento
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Capacitação técnica em sistemas corporativos e procedimentos operacionais..."
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* SEÇÃO DE ALUNOS DA TURMA */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      Alunos Matriculados ({students.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Adicione os alunos individualmente ou cole a lista de nomes
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBulkAdd(!showBulkAdd)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {showBulkAdd ? 'Adicionar um por um' : '+ Colar Lista em Lote'}
                  </button>
                </div>

                {showBulkAdd ? (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                    <label className="block text-[11px] font-semibold text-blue-900">
                      Cole a lista de nomes (um aluno por linha):
                    </label>
                    <textarea
                      rows={4}
                      value={bulkStudentsText}
                      onChange={(e) => setBulkStudentsText(e.target.value)}
                      placeholder="Ana Paula Silva&#10;Bruno Mendes&#10;Carlos Eduardo"
                      className="w-full text-xs p-2 rounded-lg border border-blue-300 bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleBulkAddStudents}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                    >
                      Inserir Alunos
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Aluno..."
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="flex-1 text-xs p-2 rounded-xl border border-slate-300 focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="E-mail (opcional)..."
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      className="w-48 text-xs p-2 rounded-xl border border-slate-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddStudent}
                      className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                )}

                {/* Lista de Alunos Adicionados */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {students.length > 0 ? (
                    students.map((st, i) => (
                      <div
                        key={st.id || i}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/80 text-xs"
                      >
                        <div>
                          <strong className="text-slate-800">{st.name}</strong>
                          {st.email && (
                            <span className="text-[11px] text-slate-400 ml-2">({st.email})</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(st.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Nenhum aluno adicionado ainda.
                    </div>
                  )}
                </div>
              </div>

              {/* Botões do Rodapé do Modal */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
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
