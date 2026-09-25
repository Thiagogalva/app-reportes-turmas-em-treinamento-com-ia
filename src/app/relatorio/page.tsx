'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Server,
  Users,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Save,
  Download,
  AlertCircle,
  HelpCircle,
  Clock,
  UserX,
  XCircle,
  TrendingDown
} from 'lucide-react';
import {
  ClassGroup,
  DailyReport,
  AttendanceStatus,
  PerformanceLevel,
  StudentAttendance,
  StudentPerformance,
  AiGeneratedReport
} from '@/types';
import AiAgentModal from '@/components/AiAgentModal';
import { exportSingleReportToPdf } from '@/lib/export-helpers';

export default function NovoRelatorioPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Seção 1: Sistemas dos Alunos
  const [systemsOperational, setSystemsOperational] = useState<boolean>(true);
  const [systemsNotes, setSystemsNotes] = useState<string>('Todos os sistemas e acessos operando com normalidade.');
  const [selectedSystemTags, setSelectedSystemTags] = useState<string[]>([]);

  // Seção 2: Frequência
  const [attendanceList, setAttendanceList] = useState<StudentAttendance[]>([]);

  // Seção 3: Conteúdo
  const [topicsStudied, setTopicsStudied] = useState<string>('');
  const [practicalExercises, setPracticalExercises] = useState<string>('');

  // Seção 4: Desempenho
  const [performanceList, setPerformanceList] = useState<StudentPerformance[]>([]);

  // Seção 5: Observações
  const [generalObservations, setGeneralObservations] = useState<string>('');

  // Estados de controle e validação
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Agente de IA Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [currentAiReport, setCurrentAiReport] = useState<DailyReport | null>(null);
  const [aiData, setAiData] = useState<AiGeneratedReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Carregar turmas ativas ("EM_TREINAMENTO")
  useEffect(() => {
    async function loadActiveClasses() {
      try {
        const res = await fetch('/api/classes?onlyActive=true');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setClasses(json.data);
          setSelectedClassId(json.data[0].id);
        }
      } catch (err) {
        console.error("Erro ao carregar turmas ativas:", err);
      }
    }
    loadActiveClasses();
  }, []);

  // Quando muda a turma selecionada, inicializa a lista de alunos para presença e desempenho
  useEffect(() => {
    if (!selectedClassId) return;
    const currentClass = classes.find(c => c.id === selectedClassId);
    if (!currentClass) return;

    // Inicializa presença: todos começam como PRESENTE por padrão
    const initialAttendance: StudentAttendance[] = currentClass.students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      status: 'PRESENTE',
      absenceReason: '',
    }));
    setAttendanceList(initialAttendance);

    // Inicializa desempenho: todos começam como BOM por padrão
    const initialPerf: StudentPerformance[] = currentClass.students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      level: 'BOM',
      score: 8.0,
      lowPerformanceReason: '',
      notes: '',
    }));
    setPerformanceList(initialPerf);
  }, [selectedClassId, classes]);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  // Helpers para atualizar presença
  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceList(prev => prev.map(item => {
      if (item.studentId === studentId) {
        return {
          ...item,
          status,
          // Limpa motivo se voltou a ser presente
          absenceReason: status === 'PRESENTE' ? '' : item.absenceReason,
        };
      }
      return item;
    }));
  };

  const handleAbsenceReasonChange = (studentId: string, reason: string) => {
    setAttendanceList(prev => prev.map(item => {
      if (item.studentId === studentId) {
        return { ...item, absenceReason: reason };
      }
      return item;
    }));
  };

  // Helpers para atualizar desempenho
  const handlePerformanceLevelChange = (studentId: string, level: PerformanceLevel) => {
    setPerformanceList(prev => prev.map(item => {
      if (item.studentId === studentId) {
        return {
          ...item,
          level,
          lowPerformanceReason: level === 'ABAIXO_DO_ESPERADO' ? item.lowPerformanceReason : '',
        };
      }
      return item;
    }));
  };

  const handleLowPerfReasonChange = (studentId: string, reason: string) => {
    setPerformanceList(prev => prev.map(item => {
      if (item.studentId === studentId) {
        return { ...item, lowPerformanceReason: reason };
      }
      return item;
    }));
  };

  const handleScoreChange = (studentId: string, scoreStr: string) => {
    const val = parseFloat(scoreStr);
    setPerformanceList(prev => prev.map(item => {
      if (item.studentId === studentId) {
        return { ...item, score: isNaN(val) ? undefined : val };
      }
      return item;
    }));
  };

  const toggleSystemTag = (tag: string) => {
    setSelectedSystemTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Validação estrita dos dados antes de salvar
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!selectedClassId) {
      errors.push('Selecione uma turma ativa.');
    }
    if (!date) {
      errors.push('Informe a data do reporte.');
    }
    if (!topicsStudied.trim()) {
      errors.push('Informe os tópicos estudados hoje.');
    }

    if (!systemsOperational && (!systemsNotes || systemsNotes.trim().length < 5)) {
      errors.push('Como os sistemas apresentaram falhas, informe uma descrição técnica do problema.');
    }

    // Regra Crítica: Justificativa obrigatória para Alunos Abaixo do Esperado
    performanceList.forEach(perf => {
      if (perf.level === 'ABAIXO_DO_ESPERADO') {
        if (!perf.lowPerformanceReason || perf.lowPerformanceReason.trim().length < 5) {
          errors.push(`Aluno(a) "${perf.studentName}" está marcado com desempenho Abaixo do Esperado: é OBRIGATÓRIO informar o motivo/justificativa.`);
        }
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const buildReportObject = (): DailyReport => {
    return {
      id: `rep-${Date.now()}`,
      classId: selectedClassId,
      className: selectedClass?.name || 'Turma',
      instructorName: selectedClass?.instructor || 'Instrutor',
      date,
      systemsStatus: {
        operational: systemsOperational,
        notes: systemsNotes,
        affectedSystems: selectedSystemTags,
      },
      topicsStudied,
      practicalExercises,
      attendance: attendanceList,
      studentPerformances: performanceList,
      generalObservations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSaveReport = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setIsSubmitting(true);
      const report = buildReportObject();

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccessMsg('Reporte salvo com sucesso!');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setValidationErrors([json.error || 'Erro ao salvar reporte.']);
      }
    } catch (err: any) {
      setValidationErrors([err.message || 'Erro de conexão ao salvar.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerAiAgent = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const report = buildReportObject();
    setCurrentAiReport(report);
    setIsAiModalOpen(true);
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      const json = await res.json();
      if (json.success) {
        setAiData(json.data);
      } else {
        alert(json.error || 'Falha ao processar com IA.');
      }
    } catch (err) {
      console.error("Erro na IA:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const commonSystemTags = [
    'VPN Corporativa',
    'CRM / Atendimento',
    'Máquinas Virtuais (VMs)',
    'Acessos e Senhas',
    'Conexão de Internet',
    'Headsets / Áudio',
    'Ambiente de Banco de Dados'
  ];

  const presentCount = attendanceList.filter(a => a.status === 'PRESENTE').length;
  const absentCount = attendanceList.filter(a => a.status === 'AUSENTE' || a.status === 'JUSTIFICADO').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            Formulário Oficial
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Lançamento do Reporte Diário de Treinamento
          </h1>
          <p className="text-xs text-slate-500">
            Preencha os dados da aula. O sistema valida se todos os alunos com baixo desempenho possuem comentários explicativos.
          </p>
        </div>

        {/* Botões de Ação Topo */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTriggerAiAgent}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>Gerar E-mail com IA</span>
          </button>

          <button
            type="button"
            onClick={handleSaveReport}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Salvando...' : 'Salvar Reporte'}</span>
          </button>
        </div>
      </div>

      {/* Mensagens de Sucesso e Erros */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{saveSuccessMsg} Redirecionando para o Dashboard...</span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Por favor, corrija os seguintes pontos antes de prosseguir:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-rose-700">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* SEÇÃO 1: Turma e Data */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="w-4 h-4 text-blue-600" />
          1. Identificação da Turma e Data
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Turma (Apenas Ativas / Em Treinamento) *
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Data da Aula *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Instrutor Responsável
            </label>
            <input
              type="text"
              disabled
              value={selectedClass?.instructor || 'Nenhum selecionado'}
              className="w-full text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl p-2.5 bg-slate-100 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: Status dos Sistemas dos Alunos */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            2. Status dos Sistemas dos Alunos
          </h2>
          <span className="text-[11px] text-slate-400">
            VPN, CRM, Softwares, Laboratório e Conexões
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Os sistemas dos alunos estão funcionando normalmente? *
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setSystemsOperational(true);
                  if (systemsNotes.includes('Falha')) {
                    setSystemsNotes('Todos os sistemas e ferramentas operaram com normalidade.');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  systemsOperational
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>SIM - Sistemas 100% Operacionais</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSystemsOperational(false);
                  if (systemsNotes.includes('Todos os sistemas')) {
                    setSystemsNotes('Instabilidade reportada durante as atividades práticas.');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  !systemsOperational
                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm ring-1 ring-rose-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>NÃO - Houve Instabilidade ou Falhas</span>
              </button>
            </div>
          </div>

          {/* Tags de Sistemas afetados */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              Identifique os sistemas afetados (opcional):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {commonSystemTags.map(tag => {
                const isSelected = selectedSystemTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleSystemTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Observações e Detalhes sobre os Sistemas {systemsOperational ? '' : '(Obrigatório)'}
            </label>
            <textarea
              rows={2}
              value={systemsNotes}
              onChange={(e) => setSystemsNotes(e.target.value)}
              placeholder="Ex: Todos os acessos de CRM e máquinas funcionaram perfeitamente ou houve queda de VPN às 14h..."
              className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: Frequência e Absenteísmo (abs) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserX className="w-4 h-4 text-blue-600" />
              3. Frequência e Absenteísmo (abs)
            </h2>
            <p className="text-xs text-slate-500">
              Registre presenças, atrasos e faltas com a devida justificativa
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
              {presentCount} Presentes
            </span>
            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg font-bold">
              {absentCount} Ausentes (abs)
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {attendanceList.map((att) => (
            <div
              key={att.studentId}
              className={`p-3.5 rounded-xl border transition-all ${
                att.status === 'PRESENTE'
                  ? 'bg-slate-50/80 border-slate-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800">
                  {att.studentName}
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(['PRESENTE', 'AUSENTE', 'ATRASADO', 'JUSTIFICADO'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleAttendanceChange(att.studentId, st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        att.status === st
                          ? st === 'PRESENTE'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : st === 'AUSENTE'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : st === 'ATRASADO'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campo para motivo de falta ou atraso */}
              {att.status !== 'PRESENTE' && (
                <div className="mt-2.5 pt-2.5 border-t border-rose-200/60">
                  <label className="block text-[11px] font-semibold text-rose-800 mb-1">
                    Motivo da Ausência / Atraso:
                  </label>
                  <input
                    type="text"
                    value={att.absenceReason || ''}
                    onChange={(e) => handleAbsenceReasonChange(att.studentId, e.target.value)}
                    placeholder="Ex: Consulta médica, problemas de deslocamento, sem justificativa informada..."
                    className="w-full text-xs text-slate-800 border border-rose-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 4: Conteúdo Ministrado */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 text-blue-600" />
          4. Conteúdo Ministrado no Dia
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              O que estudamos naquele dia? (Tópicos e Módulos Abordados) *
            </label>
            <textarea
              rows={3}
              value={topicsStudied}
              onChange={(e) => setTopicsStudied(e.target.value)}
              placeholder="Ex: Módulo 3 - Abertura de chamados no CRM, triagem de incidentes, SLAs e simulação de atendimento..."
              className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Exercícios Práticos e Laboratórios Realizados (Opcional)
            </label>
            <input
              type="text"
              value={practicalExercises}
              onChange={(e) => setPracticalExercises(e.target.value)}
              placeholder="Ex: 5 simulações em ambiente de homologação e questionário de fixação"
              className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 5: Desempenho Individual de Cada Aluno & Justificativa Obrigatória */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              5. Desempenho Individual dos Alunos
            </h2>
            <p className="text-xs text-slate-500">
              Caso alguém tenha um abaixo desempenho, é <strong className="text-rose-600 font-bold">obrigatório comentar o motivo</strong>.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
            Validação Estrita Ativa
          </span>
        </div>

        <div className="space-y-4">
          {performanceList.map((perf) => {
            const isLow = perf.level === 'ABAIXO_DO_ESPERADO';

            return (
              <div
                key={perf.studentId}
                className={`p-4 rounded-xl border transition-all ${
                  isLow
                    ? 'bg-rose-50/60 border-rose-300 shadow-xs ring-1 ring-rose-200'
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {perf.studentName}
                    </span>
                    {isLow && (
                      <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                        Abaixo do Esperado
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botões de Conceito */}
                    {(['EXCELENTE', 'BOM', 'REGULAR', 'ABAIXO_DO_ESPERADO'] as PerformanceLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handlePerformanceLevelChange(perf.studentId, lvl)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          perf.level === lvl
                            ? lvl === 'EXCELENTE'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : lvl === 'BOM'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : lvl === 'REGULAR'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-rose-600 text-white shadow-xs animate-pulse'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lvl === 'ABAIXO_DO_ESPERADO' ? 'Abaixo do Esperado' : lvl}
                      </button>
                    ))}

                    {/* Nota Numérica Opcional */}
                    <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500">Nota:</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={perf.score !== undefined ? perf.score : ''}
                        onChange={(e) => handleScoreChange(perf.studentId, e.target.value)}
                        placeholder="0-10"
                        className="w-12 text-xs font-bold text-slate-800 text-center focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Justificativa Obrigatória para Baixo Desempenho */}
                {isLow ? (
                  <div className="mt-3 pt-3 border-t border-rose-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Motivo do Baixo Desempenho (Obrigatório) *
                      </label>
                      <span className="text-[10px] text-rose-600 font-medium">
                        Detalhe a dificuldade ou comportamento
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={perf.lowPerformanceReason || ''}
                      onChange={(e) => handleLowPerfReasonChange(perf.studentId, e.target.value)}
                      placeholder="Ex: Demonstrou dificuldade na fixação do fluxo de atendimento, dispersão durante o laboratório e necessita revisão individual no início da próxima aula..."
                      className="w-full text-xs text-slate-900 border border-rose-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
                    />
                  </div>
                ) : (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={perf.notes || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPerformanceList(prev => prev.map(item => item.studentId === perf.studentId ? { ...item, notes: val } : item));
                      }}
                      placeholder="Observações complementares sobre a participação do aluno (opcional)..."
                      className="w-full text-xs text-slate-600 border border-slate-200 rounded-lg p-1.5 focus:outline-none bg-white"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 6: Observações Gerais */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          6. Observações Gerais do Instrutor (Opcional)
        </h2>
        <textarea
          rows={2}
          value={generalObservations}
          onChange={(e) => setGeneralObservations(e.target.value)}
          placeholder="Ex: Clima excelente da turma, ritmo acelerado e prontidão para a avaliação prática de amanhã..."
          className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
        />
      </div>

      {/* Rodapé de Ações Finais */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Após salvar, os dados serão incorporados ao Dashboard e aos gráficos consolidados.
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTriggerAiAgent}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Gerar E-mail com IA</span>
          </button>

          <button
            type="button"
            onClick={handleSaveReport}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Salvando...' : 'Salvar Reporte'}</span>
          </button>
        </div>
      </div>

      {/* Modal do Agente de IA */}
      {currentAiReport && (
        <AiAgentModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          report={currentAiReport}
          aiData={aiData}
          isLoading={aiLoading}
          onRegenerate={handleTriggerAiAgent}
          onSaveReport={handleSaveReport}
        />
      )}
    </div>
  );
}
