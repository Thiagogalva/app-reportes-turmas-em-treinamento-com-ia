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
  TrendingDown,
  ShieldCheck,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CalendarDays
} from 'lucide-react';
import {
  ClassGroup,
  DailyReport,
  AttendanceStatus,
  PerformanceLevel,
  StudentAttendance,
  StudentPerformance,
  AiGeneratedReport,
  Segment,
  OperatorSystemTestResult,
  SystemEvidence
} from '@/types';
import AiAgentModal from '@/components/AiAgentModal';
import { compressImageFile } from '@/lib/image-compress';

export default function NovoRelatorioPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Seção 1: Sistemas dos Alunos / Segmento
  const [systemsOperational, setSystemsOperational] = useState<boolean>(true);
  const [systemsNotes, setSystemsNotes] = useState<string>('Sistemas homologados e 100% operacionais.');
  const [selectedSystemTags, setSelectedSystemTags] = useState<string[]>([]);
  const [reportHasSystemIncident, setReportHasSystemIncident] = useState<boolean>(false);
  const [systemEvidences, setSystemEvidences] = useState<Record<string, SystemEvidence>>({});
  const [evidenceUploading, setEvidenceUploading] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [scheduleTogglingId, setScheduleTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.name) setCurrentUserName(json.data.name);
      })
      .catch(() => {});
  }, []);
  const [showSystemTestGrid, setShowSystemTestGrid] = useState<boolean>(false);
  const [operatorChecks, setOperatorChecks] = useState<OperatorSystemTestResult[]>([]);

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

  // Carregar turmas ativas e segmentos
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [resClasses, resSegments] = await Promise.all([
          fetch('/api/classes?onlyActive=true'),
          fetch('/api/segments')
        ]);
        const jsonClasses = await resClasses.json();
        const jsonSegments = await resSegments.json();

        if (jsonClasses.success && jsonClasses.data.length > 0) {
          setClasses(jsonClasses.data);
          setSelectedClassId(jsonClasses.data[0].id);
        }
        if (jsonSegments.success) {
          setSegments(jsonSegments.data);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    }
    loadInitialData();
  }, []);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const currentSegment = segments.find(s => s.id === selectedClass?.segmentId || s.name === selectedClass?.segmentName) || segments[0];

  // Quando muda a turma selecionada, inicializa alunos e testes de sistemas
  useEffect(() => {
    if (!selectedClass) return;

    // Inicializa presença
    const initialAttendance: StudentAttendance[] = selectedClass.students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      enrollmentNumber: s.enrollmentNumber,
      networkLogin: s.networkLogin,
      clientLogin: s.clientLogin,
      status: 'PRESENTE',
      absenceReason: '',
    }));
    setAttendanceList(initialAttendance);

    // Inicializa desempenho
    const initialPerf: StudentPerformance[] = selectedClass.students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      enrollmentNumber: s.enrollmentNumber,
      networkLogin: s.networkLogin,
      clientLogin: s.clientLogin,
      level: 'BOM',
      score: 8.0,
      lowPerformanceReason: '',
      notes: '',
    }));
    setPerformanceList(initialPerf);

    // Inicializa testes dos sistemas do segmento para cada operador
    const systemsList = currentSegment?.systems || [];
    const initialOperatorChecks: OperatorSystemTestResult[] = selectedClass.students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      networkLogin: s.networkLogin,
      clientLogin: s.clientLogin,
      allSystemsOk: true,
      systemStatuses: systemsList.map(sys => ({
        systemId: sys.id,
        systemName: sys.name,
        operational: true,
        notes: '',
      })),
    }));
    setOperatorChecks(initialOperatorChecks);

    // Se a turma já possui sistemas homologados, não precisa perguntar diariamente!
    if (selectedClass.systemsValidated) {
      setSystemsOperational(true);
      setReportHasSystemIncident(false);
      setShowSystemTestGrid(false);
      setSystemsNotes(`Sistemas homologados do segmento ${selectedClass.segmentName || 'Bradesco'} operando normalmente.`);
    } else {
      setShowSystemTestGrid(true);
    }
  }, [selectedClassId, classes, currentSegment]);

  // Helpers de Presença
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

  // Helpers de Desempenho
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

  // Helpers de Teste de Sistemas por Operador
  const handleToggleOperatorSystem = (studentId: string, systemId: string) => {
    setOperatorChecks(prev => prev.map(op => {
      if (op.studentId === studentId) {
        const updatedStatuses = op.systemStatuses.map(sys => {
          if (sys.systemId === systemId) {
            return { ...sys, operational: !sys.operational };
          }
          return sys;
        });
        const allOk = updatedStatuses.every(s => s.operational);
        return {
          ...op,
          allSystemsOk: allOk,
          systemStatuses: updatedStatuses,
        };
      }
      return op;
    }));
  };

  const markAllOperatorsSystemsOk = () => {
    setOperatorChecks(prev => prev.map(op => ({
      ...op,
      allSystemsOk: true,
      systemStatuses: op.systemStatuses.map(sys => ({ ...sys, operational: true })),
    })));
    setSystemsOperational(true);
    setSystemsNotes(`Todos os sistemas do segmento ${currentSegment?.name || 'Bradesco'} testados e 100% aprovados.`);
    setSelectedSystemTags([]);
    setSystemEvidences({});
  };

  const handleToggleScheduleDay = async (dayId: string, completed: boolean) => {
    if (!selectedClassId) return;
    setScheduleTogglingId(dayId);
    try {
      const res = await fetch(`/api/classes/${selectedClassId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, completed }),
      });
      const json = await res.json();
      if (json.success) {
        setClasses(prev => prev.map(c => c.id === selectedClassId ? json.data : c));
      }
    } catch (err) {
      console.error('Erro ao atualizar cronograma:', err);
    } finally {
      setScheduleTogglingId(null);
    }
  };

  const handleEvidenceUpload = async (systemId: string, systemName: string, file: File | null) => {
    if (!file) return;
    setEvidenceUploading(systemId);
    try {
      const imageDataUrl = await compressImageFile(file);
      const now = new Date();
      const expires = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const evidence: SystemEvidence = {
        id: `ev-${Date.now()}-${systemId}`,
        systemId,
        systemName,
        imageDataUrl,
        uploadedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        uploadedBy: currentUserName || undefined,
      };
      setSystemEvidences(prev => ({ ...prev, [systemId]: evidence }));
    } catch (err: any) {
      alert(err.message || 'Erro ao processar a imagem.');
    } finally {
      setEvidenceUploading(null);
    }
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

    if (!systemsOperational) {
      if (selectedSystemTags.length === 0) {
        errors.push('Selecione qual(is) sistema(s) apresentaram falha.');
      }
      selectedSystemTags.forEach(sysId => {
        if (!systemEvidences[sysId]) {
          const sysName = currentSegment?.systems.find(s => s.id === sysId)?.name || sysId;
          errors.push(`Anexe uma evidência (print/foto) do erro do sistema "${sysName}".`);
        }
      });
    }

    // Regra Crítica: Justificativa obrigatória para Alunos Abaixo do Esperado
    performanceList.forEach(perf => {
      if (perf.level === 'ABAIXO_DO_ESPERADO') {
        if (!perf.lowPerformanceReason || perf.lowPerformanceReason.trim().length < 5) {
          errors.push(`Operador(a) "${perf.studentName}" está marcado com desempenho Abaixo do Esperado: é OBRIGATÓRIO informar o motivo/justificativa.`);
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
      segmentName: selectedClass?.segmentName || currentSegment?.name || 'Geral',
      instructorName: selectedClass?.instructor || 'Instrutor',
      date,
      systemsStatus: {
        operational: systemsOperational,
        notes: systemsNotes,
        affectedSystems: selectedSystemTags,
        evidences: selectedSystemTags.map(id => systemEvidences[id]).filter(Boolean),
        operatorChecks: showSystemTestGrid ? operatorChecks : undefined,
        systemsAlreadyValidated: selectedClass?.systemsValidated && !reportHasSystemIncident,
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

  const presentCount = attendanceList.filter(a => a.status === 'PRESENTE').length;
  const absentCount = attendanceList.filter(a => a.status === 'AUSENTE' || a.status === 'JUSTIFICADO').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 shadow-xl border border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-bradesco-900/40 text-bradesco-400 border border-bradesco-600/40">
              Formulário Diário
            </span>
            {selectedClass?.segmentName && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/40">
                Segmento: {selectedClass.segmentName}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            Lançamento do Reporte de Treinamento
          </h1>
          <p className="text-xs text-dark-muted">
            Registro diário com validação de sistemas por segmento e justificativa obrigatória de baixo desempenho.
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
            <span>Corrija os seguintes pontos antes de prosseguir:</span>
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
                  {c.name} ({c.segmentName || 'Segmento Geral'})
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

      {/* SEÇÃO — CRONOGRAMA DA TURMA */}
      {selectedClass && selectedClass.schedule && selectedClass.schedule.length > 0 && (
        <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-3">
          <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-bradesco-500" />
            Cronograma da Turma
          </h2>
          <div className="flex flex-wrap gap-2">
            {selectedClass.schedule.map(day => {
              const isLate = !day.completed && day.plannedDate < date;
              const isToday = day.plannedDate === date;
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => handleToggleScheduleDay(day.id, !day.completed)}
                  disabled={scheduleTogglingId === day.id}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                    day.completed
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                      : isLate
                        ? 'bg-red-950/50 border-red-800 text-red-300'
                        : isToday
                          ? 'bg-sky-950/50 border-sky-700 text-sky-300'
                          : 'bg-dark-bg border-dark-border text-dark-muted'
                  }`}
                  title={`Planejado para ${day.plannedDate}${day.completed ? ` — concluído em ${day.completedDate}` : ''}`}
                >
                  {day.completed ? <Check className="w-3 h-3" /> : <CalendarDays className="w-3 h-3" />}
                  <span>Dia {day.dayNumber}: {day.title}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-dark-muted">
            Clique em um dia para marcar como concluído. Dias em vermelho estão atrasados em relação ao planejado.
          </p>
        </div>
      )}

      {/* SEÇÃO 2: Status dos Sistemas dos Operadores (Inteligente por Segmento) */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border pb-3 gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-bradesco-500" />
              2. Status dos Sistemas do Segmento ({currentSegment?.name})
            </h2>
            <p className="text-[11px] text-dark-muted">
              Sistemas monitorados: {currentSegment?.systems.map(s => s.name).join(', ') || 'Nenhum'}
            </p>
          </div>

          {selectedClass?.systemsValidated && !reportHasSystemIncident ? (
            <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 rounded-full flex items-center gap-1 self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sistemas 100% Homologados
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-950/80 text-amber-400 border border-amber-800/40 rounded-full self-start sm:self-auto">
              Teste Necessário
            </span>
          )}
        </div>

        {/* FLUXO INTELIGENTE: Se os sistemas de todos os operadores já funcionaram, não precisa perguntar diariamente! */}
        {selectedClass?.systemsValidated && !reportHasSystemIncident ? (
          <div className="bg-dark-card p-4 rounded-xl border border-emerald-900/50 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-800/50">
                <Check className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 flex-1">
                <h3 className="text-xs font-bold text-emerald-300">
                  Sistemas dos Operadores já Homologados
                </h3>
                <p className="text-[11px] text-dark-muted leading-relaxed">
                  Os sistemas do segmento <strong>{selectedClass.segmentName}</strong> ({currentSegment?.systems.map(s => s.name).join(', ')}) já foram validados para todos os operadores da turma e estão marcados como <strong>100% Operacionais</strong>. Não é necessário testar novamente no dia a dia.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-dark-border gap-2">
              <span className="text-[10px] text-dark-muted">
                Status hoje: <strong className="text-emerald-400">100% Operacional</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setReportHasSystemIncident(true);
                  setSystemsOperational(false);
                  setShowSystemTestGrid(true);
                  setSystemsNotes('Instabilidade reportada na aula de hoje.');
                }}
                className="text-xs font-bold text-bradesco-400 hover:text-bradesco-300 flex items-center gap-1 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-bradesco-500" />
                <span>Houve instabilidade ou falha hoje? Relatar problema</span>
              </button>
            </div>
          </div>
        ) : (
          /* PAINEL DE TESTE / INSTABILIDADE */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSystemsOperational(true);
                    setReportHasSystemIncident(false);
                    setSystemsNotes(`Todos os sistemas do segmento ${currentSegment?.name} testados e funcionando com normalidade.`);
                    setSelectedSystemTags([]);
                    setSystemEvidences({});
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    systemsOperational
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-400 shadow-md ring-1 ring-emerald-500'
                      : 'bg-dark-card border-dark-border text-dark-muted hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>SIM - Sistemas 100% OK</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSystemsOperational(false);
                    setReportHasSystemIncident(true);
                    if (systemsNotes.includes('Todos os sistemas')) {
                      setSystemsNotes('Instabilidade detectada durante os exercícios práticos.');
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    !systemsOperational
                      ? 'bg-bradesco-950/70 border-bradesco-500 text-bradesco-400 shadow-md ring-1 ring-bradesco-500'
                      : 'bg-dark-card border-dark-border text-dark-muted hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-bradesco-500" />
                  <span>NÃO - Houve Falhas ou Instabilidade</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSystemTestGrid(!showSystemTestGrid)}
                className="text-xs font-bold text-dark-muted hover:text-white flex items-center gap-1"
              >
                <span>{showSystemTestGrid ? 'Ocultar Teste Detalhado por Operador' : 'Ver / Testar por Operador'}</span>
                {showSystemTestGrid ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Teste Detalhado por Operador com Sistemas do Segmento */}
            {showSystemTestGrid && (
              <div className="bg-dark-card p-4 rounded-xl border border-dark-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-border pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      Checklist de Sistemas por Operador ({currentSegment?.name})
                    </h3>
                    <p className="text-[10px] text-dark-muted">
                      Teste cada sistema (GEO, WDE, CRM) para cada operador
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={markAllOperatorsSystemsOk}
                    className="px-3 py-1.5 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/50 rounded-lg text-xs font-bold flex items-center gap-1 self-start sm:self-auto"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Marcar Todos Sistemas de Todos como 100% OK</span>
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {operatorChecks.map((op) => (
                    <div
                      key={op.studentId}
                      className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                        op.allSystemsOk
                          ? 'bg-dark-bg/60 border-dark-border'
                          : 'bg-bradesco-950/20 border-bradesco-900/60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <strong className="text-white text-xs">{op.studentName}</strong>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-dark-muted font-mono">
                          <span>Login Rede: <strong className="text-bradesco-400">{op.networkLogin}</strong></span>
                          {op.clientLogin && <span>Login Cliente: <strong className="text-blue-400">{op.clientLogin}</strong></span>}
                        </div>
                      </div>

                      {/* Botões dos sistemas daquele segmento */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {op.systemStatuses.map((sys) => (
                          <button
                            key={sys.systemId}
                            type="button"
                            onClick={() => handleToggleOperatorSystem(op.studentId, sys.systemId)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              sys.operational
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/60'
                                : 'bg-bradesco-950 text-bradesco-400 border-bradesco-800 hover:bg-bradesco-900'
                            }`}
                            title={`Clique para alternar status do ${sys.systemName}`}
                          >
                            {sys.systemName}: {sys.operational ? '✓ OK' : '✕ FALHA'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sistemas Afetados + Evidência (obrigatória por sistema marcado) */}
            {!systemsOperational && (
            <div className="bg-dark-card p-4 rounded-xl border border-bradesco-900/50 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-bradesco-500" />
                  Quais sistemas apresentaram falha?
                </h3>
                <p className="text-[10px] text-dark-muted">
                  Selecione o(s) sistema(s) e anexe uma captura de tela do erro para cada um. A evidência fica disponível para outros administradores por 5 dias.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(currentSegment?.systems || []).map(sys => {
                  const active = selectedSystemTags.includes(sys.id);
                  return (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() => {
                        setSelectedSystemTags(prev =>
                          active ? prev.filter(id => id !== sys.id) : [...prev, sys.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                        active
                          ? 'bg-bradesco-950 text-bradesco-400 border-bradesco-700'
                          : 'bg-dark-bg text-dark-muted border-dark-border hover:text-white'
                      }`}
                    >
                      {sys.name}
                    </button>
                  );
                })}
              </div>

              {selectedSystemTags.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-dark-border">
                  {selectedSystemTags.map(sysId => {
                    const sys = currentSegment?.systems.find(s => s.id === sysId);
                    if (!sys) return null;
                    const evidence = systemEvidences[sysId];
                    return (
                      <div key={sysId} className="flex items-start gap-3 bg-dark-bg p-3 rounded-lg border border-dark-border">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white mb-1.5">{sys.name} — evidência do erro *</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleEvidenceUpload(sysId, sys.name, e.target.files?.[0] || null)}
                            className="text-[10px] text-dark-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-bradesco-600 file:text-white hover:file:bg-bradesco-700 file:cursor-pointer cursor-pointer"
                          />
                          {evidenceUploading === sysId && (
                            <p className="text-[10px] text-dark-muted mt-1">Comprimindo imagem...</p>
                          )}
                        </div>
                        {evidence && (
                          <img
                            src={evidence.imageDataUrl}
                            alt={`Evidência ${sys.name}`}
                            className="w-16 h-16 object-cover rounded-lg border border-dark-border flex-shrink-0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            <div>
              <label className="block text-xs font-bold text-dark-text mb-1.5">
                Observações Técnicas sobre os Sistemas {systemsOperational ? '' : '(Obrigatório)'}
              </label>
              <textarea
                rows={2}
                value={systemsNotes}
                onChange={(e) => setSystemsNotes(e.target.value)}
                placeholder="Ex: Todos os acessos de CRM, WDE e Sistema GEO operaram normalmente..."
                className="w-full text-xs text-white border border-dark-border rounded-xl p-3 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 3: Frequência e Absenteísmo (abs) com Matrícula e Logins */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border pb-3 gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <UserX className="w-4 h-4 text-bradesco-500" />
              3. Frequência e Absenteísmo (abs) dos Operadores
            </h2>
            <p className="text-[11px] text-dark-muted">
              Identificação completa: Nome, Matrícula e Login de Rede
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
                <div>
                  <span className="text-xs font-bold text-white block">
                    {att.studentName}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-dark-muted font-mono mt-0.5">
                    {att.enrollmentNumber && <span>Matrícula: {att.enrollmentNumber}</span>}
                    {att.networkLogin && <span>• Login Rede: <strong className="text-slate-300">{att.networkLogin}</strong></span>}
                  </div>
                </div>

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

              {att.status !== 'PRESENTE' && (
                <div className="mt-2.5 pt-2.5 border-t border-bradesco-900/40">
                  <label className="block text-[11px] font-bold text-bradesco-300 mb-1">
                    Motivo da Ausência / Atraso:
                  </label>
                  <input
                    type="text"
                    value={att.absenceReason || ''}
                    onChange={(e) => handleAbsenceReasonChange(att.studentId, e.target.value)}
                    placeholder="Ex: Consulta médica, imprevisto de transporte..."
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
              placeholder="Ex: Atendimento prático via WDE, fluxos de abertura e triagem de chamados no CRM e registro no Sistema GEO..."
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
              placeholder="Ex: 5 simulações completas em ambiente de homologação..."
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
              5. Desempenho Individual dos Operadores
            </h2>
            <p className="text-[11px] text-dark-muted">
              Caso alguém tenha baixo desempenho, é <strong className="text-bradesco-400 font-bold">obrigatório comentar o motivo</strong>.
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
                  <div>
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
                    <div className="text-[10px] text-dark-muted font-mono mt-0.5">
                      Login Rede: <strong className="text-slate-300">{perf.networkLogin}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                      placeholder="Ex: Dificuldade na navegação do WDE e registro incorreto de chamados no Sistema GEO. Necessita mentoria prática..."
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
          placeholder="Ex: Turma com ótimo engajamento nos sistemas corporativos..."
          className="w-full text-xs text-white border border-dark-border rounded-xl p-3 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
        />
      </div>

      {/* Rodapé de Ações Finais */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-5 border border-dark-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-dark-muted">
          Após salvar, os dados serão consolidados no Dashboard e no histórico.
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
