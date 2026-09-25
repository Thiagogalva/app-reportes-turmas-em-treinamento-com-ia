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
  AlertCircle,
  UserX,
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

  // Quando muda a turma selecionada, inicializa a lista de alunos
  useEffect(() => {
    if (!selectedClassId) return;
    const currentClass = classes.find(c => c.id === selectedClassId);
    if (!currentClass) return;

    // Inicializa presença: todos começam como PRESENTE
    const initialAttendance: StudentAttendance[] = currentClass.students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      status: 'PRESENTE',
      absenceReason: '',
    }));
    setAttendanceList(initialAttendance);

    // Inicializa desempenho: todos começam como BOM
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

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceList(prev => prev.map(item => {
      if (item.studentId === studentId) {
        return {
          ...item,
          status,
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

  // Validação estrita
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!selectedClassId) errors.push('Selecione uma turma ativa.');
    if (!date) errors.push('Informe a data do reporte.');
    if (!topicsStudied.trim()) errors.push('Informe os tópicos estudados hoje.');

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
    'Ambiente de Treinamento'
  ];

  const presentCount = attendanceList.filter(a => a.status === 'PRESENTE').length;
  const absentCount = attendanceList.filter(a => a.status === 'AUSENTE' || a.status === 'JUSTIFICADO').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 shadow-xl border border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-bradesco-900/40 text-bradesco-400 border border-bradesco-600/40">
            Formulário Oficial Bradesco
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
            Lançamento do Reporte Diário
          </h1>
          <p className="text-xs text-dark-muted">
            Preencha os dados da aula. Validação estrita para alunos com baixo rendimento.
          </p>
        </div>

        {/* Botões de Ação Topo */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerAiAgent}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-bradesco-600 to-rose-700 hover:from-bradesco-700 hover:to-rose-800 text-white text-xs font-bold shadow-lg shadow-bradesco-600/30 transition-all"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>Gerar E-mail IA</span>
          </button>

          <button
            type="button"
            onClick={handleSaveReport}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-dark-card hover:bg-dark-border text-white text-xs font-bold border border-dark-border shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Salvando...' : 'Salvar Reporte'}</span>
          </button>
        </div>
      </div>

      {/* Mensagens de Sucesso e Erros */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{saveSuccessMsg} Redirecionando para o Dashboard...</span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="p-4 bg-bradesco-950/70 border border-bradesco-800/80 text-bradesco-200 rounded-xl text-xs space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-bradesco-300">
            <AlertCircle className="w-4 h-4 text-bradesco-400" />
            <span>Atenção: Corrija os seguintes pontos antes de prosseguir:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-bradesco-200">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* SEÇÃO 1: Turma e Data */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
        <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 border-b border-dark-border pb-3">
          <Users className="w-4 h-4 text-bradesco-500" />
          1. Identificação da Turma e Data
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-dark-muted mb-1.5">
              Turma (Apenas Ativas) *
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-bold text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-dark-muted mb-1.5">
              Data da Aula *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs font-bold text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-dark-muted mb-1.5">
              Instrutor Responsável
            </label>
            <input
              type="text"
              disabled
              value={selectedClass?.instructor || 'Nenhum selecionado'}
              className="w-full text-xs font-bold text-dark-muted border border-dark-border rounded-xl p-2.5 bg-dark-bg cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: Status dos Sistemas dos Alunos */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border pb-3 gap-1">
          <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-bradesco-500" />
            2. Status dos Sistemas dos Alunos
          </h2>
          <span className="text-[10px] text-dark-muted">
            VPN, CRM, Laboratório, Senhas e Conexões
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-dark-text mb-2">
              Os sistemas dos alunos estão funcionando normalmente? *
            </label>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSystemsOperational(true);
                  if (systemsNotes.includes('Falha') || systemsNotes.includes('Instabilidade')) {
                    setSystemsNotes('Todos os sistemas e ferramentas operaram com normalidade.');
                  }
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  systemsOperational
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-400 shadow-md ring-1 ring-emerald-500'
                    : 'bg-dark-card border-dark-border text-dark-muted hover:bg-dark-border hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SIM - Sistemas 100% OK</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSystemsOperational(false);
                  if (systemsNotes.includes('Todos os sistemas')) {
                    setSystemsNotes('Instabilidade reportada durante as atividades práticas.');
                  }
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  !systemsOperational
                    ? 'bg-bradesco-950/70 border-bradesco-500 text-bradesco-400 shadow-md ring-1 ring-bradesco-500'
                    : 'bg-dark-card border-dark-border text-dark-muted hover:bg-dark-border hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-bradesco-500" />
                <span>NÃO - Houve Falhas/Instabilidade</span>
              </button>
            </div>
          </div>

          {/* Tags de Sistemas */}
          <div>
            <label className="block text-[11px] font-bold text-dark-muted mb-1.5">
              Selecione as ferramentas afetadas (opcional):
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
                        ? 'bg-bradesco-600 text-white border-bradesco-600 shadow-xs'
                        : 'bg-dark-card text-dark-muted border-dark-border hover:bg-dark-border hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-dark-text mb-1.5">
              Observações e Detalhes dos Sistemas {systemsOperational ? '' : '(Obrigatório)'}
            </label>
            <textarea
              rows={2}
              value={systemsNotes}
              onChange={(e) => setSystemsNotes(e.target.value)}
              placeholder="Descreva o status ou instabilidades encontradas..."
              className="w-full text-xs text-white border border-dark-border rounded-xl p-3 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: Frequência e Absenteísmo (abs) */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border pb-3 gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <UserX className="w-4 h-4 text-bradesco-500" />
              3. Frequência e Absenteísmo (abs)
            </h2>
            <p className="text-[11px] text-dark-muted">
              Registre presenças, faltas e atrasos com justificativa
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg font-bold">
              {presentCount} Presentes
            </span>
            <span className="px-2.5 py-1 bg-bradesco-950/60 text-bradesco-400 border border-bradesco-800/40 rounded-lg font-bold">
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
                  ? 'bg-dark-card border-dark-border'
                  : 'bg-bradesco-950/30 border-bradesco-900/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-white">
                  {att.studentName}
                </span>

                <div className="grid grid-cols-4 sm:flex items-center gap-1 sm:gap-1.5">
                  {(['PRESENTE', 'AUSENTE', 'ATRASADO', 'JUSTIFICADO'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleAttendanceChange(att.studentId, st)}
                      className={`px-2 py-1 sm:px-2.5 rounded-lg text-[10px] sm:text-[11px] font-bold text-center transition-all ${
                        att.status === st
                          ? st === 'PRESENTE'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : st === 'AUSENTE'
                            ? 'bg-bradesco-600 text-white shadow-xs'
                            : st === 'ATRASADO'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-blue-600 text-white shadow-xs'
                          : 'bg-dark-bg text-dark-muted border border-dark-border hover:bg-dark-border hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campo para motivo de falta ou atraso */}
              {att.status !== 'PRESENTE' && (
                <div className="mt-2.5 pt-2.5 border-t border-bradesco-900/40">
                  <label className="block text-[11px] font-bold text-bradesco-300 mb-1">
                    Motivo da Ausência / Atraso:
                  </label>
                  <input
                    type="text"
                    value={att.absenceReason || ''}
                    onChange={(e) => handleAbsenceReasonChange(att.studentId, e.target.value)}
                    placeholder="Ex: Consulta médica, imprevisto de deslocamento..."
                    className="w-full text-xs text-white border border-bradesco-800 rounded-lg p-2 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-bg"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 4: Conteúdo Ministrado */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
        <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 border-b border-dark-border pb-3">
          <FileText className="w-4 h-4 text-bradesco-500" />
          4. Conteúdo Ministrado no Dia
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-dark-text mb-1.5">
              O que estudamos naquele dia? (Tópicos e Módulos Abordados) *
            </label>
            <textarea
              rows={3}
              value={topicsStudied}
              onChange={(e) => setTopicsStudied(e.target.value)}
              placeholder="Ex: Módulo 3 - Abertura e triagem de chamados, procedimentos operacionais..."
              className="w-full text-xs text-white border border-dark-border rounded-xl p-3 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-dark-text mb-1.5">
              Exercícios Práticos e Laboratórios Realizados (Opcional)
            </label>
            <input
              type="text"
              value={practicalExercises}
              onChange={(e) => setPracticalExercises(e.target.value)}
              placeholder="Ex: 5 simulações em ambiente de laboratório..."
              className="w-full text-xs text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 5: Desempenho Individual & Justificativa Obrigatória */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
        <div className="border-b border-dark-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-bradesco-500" />
              5. Desempenho Individual dos Alunos
            </h2>
            <p className="text-[11px] text-dark-muted">
              Para alunos abaixo do desempenho esperado, é <strong className="text-bradesco-400 font-bold">obrigatório comentar o motivo</strong>.
            </p>
          </div>
          <span className="text-[10px] font-bold text-bradesco-300 bg-bradesco-950 px-2.5 py-1 rounded-lg border border-bradesco-800/60 self-start sm:self-auto">
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
                    ? 'bg-bradesco-950/40 border-bradesco-700 shadow-md ring-1 ring-bradesco-800'
                    : 'bg-dark-card border-dark-border'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {perf.studentName}
                    </span>
                    {isLow && (
                      <span className="text-[10px] bg-bradesco-600 text-white font-black px-2 py-0.5 rounded-full">
                        Abaixo do Esperado
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Botões de Conceito */}
                    {(['EXCELENTE', 'BOM', 'REGULAR', 'ABAIXO_DO_ESPERADO'] as PerformanceLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handlePerformanceLevelChange(perf.studentId, lvl)}
                        className={`px-2 py-1 sm:px-2.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                          perf.level === lvl
                            ? lvl === 'EXCELENTE'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : lvl === 'BOM'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : lvl === 'REGULAR'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-bradesco-600 text-white shadow-xs animate-pulse'
                            : 'bg-dark-bg text-dark-muted border border-dark-border hover:bg-dark-border hover:text-white'
                        }`}
                      >
                        {lvl === 'ABAIXO_DO_ESPERADO' ? 'Abaixo do Esperado' : lvl}
                      </button>
                    ))}

                    {/* Nota Numérica */}
                    <div className="flex items-center gap-1 bg-dark-bg px-2 py-0.5 rounded-lg border border-dark-border">
                      <span className="text-[10px] font-semibold text-dark-muted">Nota:</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={perf.score !== undefined ? perf.score : ''}
                        onChange={(e) => handleScoreChange(perf.studentId, e.target.value)}
                        placeholder="0-10"
                        className="w-12 text-xs font-bold text-white text-center focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Justificativa Obrigatória */}
                {isLow ? (
                  <div className="mt-3 pt-3 border-t border-bradesco-900/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-bradesco-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-bradesco-500" />
                        Motivo do Baixo Desempenho (Obrigatório) *
                      </label>
                      <span className="text-[10px] text-bradesco-400 font-semibold">
                        Justifique a dificuldade observada
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={perf.lowPerformanceReason || ''}
                      onChange={(e) => handleLowPerfReasonChange(perf.studentId, e.target.value)}
                      placeholder="Ex: Demonstrou dificuldade no fluxo do sistema, erros recorrentes no preenchimento de campos..."
                      className="w-full text-xs text-white border border-bradesco-700 rounded-lg p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-bg font-medium"
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
                      placeholder="Observações complementares sobre a participação (opcional)..."
                      className="w-full text-xs text-dark-muted border border-dark-border rounded-lg p-1.5 focus:outline-none bg-dark-bg"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 6: Observações Gerais */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-3">
        <h2 className="text-xs sm:text-sm font-bold text-white">
          6. Observações Gerais do Instrutor (Opcional)
        </h2>
        <textarea
          rows={2}
          value={generalObservations}
          onChange={(e) => setGeneralObservations(e.target.value)}
          placeholder="Ex: Turma engajada, ritmo acelerado..."
          className="w-full text-xs text-white border border-dark-border rounded-xl p-3 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
        />
      </div>

      {/* Rodapé de Ações Finais */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-5 border border-dark-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-dark-muted">
          Após salvar, os dados serão incorporados ao Dashboard e aos gráficos consolidados.
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleTriggerAiAgent}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-bradesco-600 to-rose-700 hover:from-bradesco-700 hover:to-rose-800 text-white text-xs font-bold shadow-lg shadow-bradesco-600/30 transition-all"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Gerar E-mail com IA</span>
          </button>

          <button
            type="button"
            onClick={handleSaveReport}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-dark-card hover:bg-dark-border text-white text-xs font-bold border border-dark-border transition-all disabled:opacity-50"
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
