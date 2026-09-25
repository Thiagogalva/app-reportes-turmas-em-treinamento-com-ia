'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileSpreadsheet,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  FileText,
  AlertCircle,
  PlusCircle,
  BookOpen
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { ClassGroup, DailyReport, AiGeneratedReport } from '@/types';
import { exportReportsToExcel, exportSingleReportToPdf } from '@/lib/export-helpers';
import AiAgentModal from '@/components/AiAgentModal';

export default function DashboardPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal IA
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [currentAiReport, setCurrentAiReport] = useState<DailyReport | null>(null);
  const [aiData, setAiData] = useState<AiGeneratedReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Carregar apenas turmas ativas ("EM_TREINAMENTO") para a tela principal
  useEffect(() => {
    async function loadActiveClasses() {
      try {
        setLoading(true);
        const res = await fetch('/api/classes?onlyActive=true');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setClasses(json.data);
          setSelectedClassId(json.data[0].id);
        } else {
          setClasses([]);
          setSelectedClassId('');
        }
      } catch (err) {
        console.error("Erro ao carregar turmas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadActiveClasses();
  }, []);

  // Carregar relatórios da turma selecionada
  useEffect(() => {
    if (!selectedClassId) {
      setReports([]);
      return;
    }

    async function loadReports() {
      try {
        const res = await fetch(`/api/reports?classId=${selectedClassId}`);
        const json = await res.json();
        if (json.success) {
          setReports(json.data);
        }
      } catch (err) {
        console.error("Erro ao carregar reportes:", err);
      }
    }
    loadReports();
  }, [selectedClassId]);

  const selectedClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId);
  }, [classes, selectedClassId]);

  // Cálculos de métricas da turma selecionada
  const kpis = useMemo(() => {
    if (reports.length === 0) {
      return {
        totalReports: 0,
        avgPresenceRate: 100,
        systemsHealthRate: 100,
        lowPerformersTotal: 0,
        studentsCount: selectedClass?.students.length || 0,
      };
    }

    let totalAttendanceEntries = 0;
    let totalPresents = 0;
    let systemsOperationalCount = 0;
    let lowPerformersCount = 0;

    reports.forEach(r => {
      if (r.systemsStatus.operational) systemsOperationalCount++;

      r.attendance.forEach(a => {
        totalAttendanceEntries++;
        if (a.status === 'PRESENTE') totalPresents++;
      });

      r.studentPerformances.forEach(p => {
        if (p.level === 'ABAIXO_DO_ESPERADO') lowPerformersCount++;
      });
    });

    const avgPresenceRate = totalAttendanceEntries > 0
      ? Math.round((totalPresents / totalAttendanceEntries) * 100)
      : 100;

    const systemsHealthRate = Math.round((systemsOperationalCount / reports.length) * 100);

    return {
      totalReports: reports.length,
      avgPresenceRate,
      systemsHealthRate,
      lowPerformersTotal: lowPerformersCount,
      studentsCount: selectedClass?.students.length || 0,
    };
  }, [reports, selectedClass]);

  // Dados para o Gráfico de Evolução de Presença
  const attendanceChartData = useMemo(() => {
    return [...reports]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(r => {
        const total = r.attendance.length;
        const present = r.attendance.filter(a => a.status === 'PRESENTE').length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 100;
        const parts = r.date.split('-');
        const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : r.date;
        return {
          date: shortDate,
          fullDate: r.date,
          taxa: rate,
          presentes: present,
          ausentes: total - present,
        };
      });
  }, [reports]);

  // Dados para Gráfico de Pizza com paleta Bradesco
  const performanceChartData = useMemo(() => {
    const counts = {
      'Excelente': 0,
      'Bom': 0,
      'Regular': 0,
      'Abaixo do Esperado': 0,
    };

    reports.forEach(r => {
      r.studentPerformances.forEach(p => {
        if (p.level === 'EXCELENTE') counts['Excelente']++;
        else if (p.level === 'BOM') counts['Bom']++;
        else if (p.level === 'REGULAR') counts['Regular']++;
        else if (p.level === 'ABAIXO_DO_ESPERADO') counts['Abaixo do Esperado']++;
      });
    });

    return [
      { name: 'Excelente', value: counts['Excelente'], color: '#10b981' },
      { name: 'Bom', value: counts['Bom'], color: '#3b82f6' },
      { name: 'Regular', value: counts['Regular'], color: '#f59e0b' },
      { name: 'Abaixo do Esperado', value: counts['Abaixo do Esperado'], color: '#cc092f' }, // Vermelho Bradesco
    ].filter(item => item.value > 0);
  }, [reports]);

  // Alunos que demandam atenção pedagógica
  const attentionStudents = useMemo(() => {
    const map = new Map<string, { studentName: string; lowPerfs: number; absences: number; reasons: string[] }>();

    reports.forEach(r => {
      r.attendance.forEach(a => {
        if (a.status !== 'PRESENTE') {
          const cur = map.get(a.studentId) || { studentName: a.studentName, lowPerfs: 0, absences: 0, reasons: [] };
          cur.absences++;
          if (a.absenceReason) cur.reasons.push(`Falta: ${a.absenceReason}`);
          map.set(a.studentId, cur);
        }
      });

      r.studentPerformances.forEach(p => {
        if (p.level === 'ABAIXO_DO_ESPERADO') {
          const cur = map.get(p.studentId) || { studentName: p.studentName, lowPerfs: 0, absences: 0, reasons: [] };
          cur.lowPerfs++;
          if (p.lowPerformanceReason) cur.reasons.push(`Desempenho: ${p.lowPerformanceReason}`);
          map.set(p.studentId, cur);
        }
      });
    });

    return Array.from(map.values())
      .filter(item => item.lowPerfs > 0 || item.absences > 0)
      .sort((a, b) => (b.lowPerfs * 2 + b.absences) - (a.lowPerfs * 2 + a.absences));
  }, [reports]);

  // Abrir Agente de IA para um reporte
  const handleOpenAiForReport = async (report: DailyReport) => {
    setCurrentAiReport(report);
    setIsAiModalOpen(true);

    if (report.aiGeneratedEmail) {
      setAiData(report.aiGeneratedEmail);
      return;
    }

    try {
      setAiLoading(true);
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      const json = await res.json();
      if (json.success) {
        setAiData(json.data);
      }
    } catch (err) {
      console.error("Erro ao gerar com IA:", err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Seletor de Turma Ativa */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 shadow-xl border border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-bradesco-900/40 text-bradesco-400 border border-bradesco-600/40">
              <span className="w-1.5 h-1.5 rounded-full bg-bradesco-500 animate-pulse"></span>
              Em Treinamento (Turma Ativa)
            </span>
            <span className="text-xs text-dark-muted">|</span>
            <span className="text-xs text-dark-muted font-medium">
              Turmas concluídas ficam fora deste painel
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Dashboard de Acompanhamento
          </h1>
          <p className="text-xs sm:text-sm text-dark-muted mt-0.5">
            Métricas em tempo real, status dos sistemas e relatórios diários de treinamento.
          </p>
        </div>

        {/* Seletor de Turmas e Ações Rápidas */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {classes.length > 0 ? (
            <div className="flex items-center gap-2 bg-dark-card p-1.5 rounded-xl border border-dark-border w-full sm:w-auto">
              <span className="text-xs font-bold text-dark-muted px-2">Turma:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-dark-bg text-xs font-bold text-white border border-dark-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-bradesco-500 flex-1 sm:flex-initial"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-xs text-amber-400 font-semibold bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/50">
              Nenhuma turma em treinamento no momento.
            </div>
          )}

          <button
            onClick={() => exportReportsToExcel(reports, selectedClass)}
            disabled={reports.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-card hover:bg-dark-border text-white text-xs font-bold border border-dark-border transition-all disabled:opacity-40"
            title="Exportar todos os relatórios desta turma para Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>

          <Link
            href="/relatorio"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-bradesco-600 hover:bg-bradesco-700 text-white text-xs font-bold shadow-lg shadow-bradesco-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lançar Reporte</span>
          </Link>
        </div>
      </div>

      {/* Caso não haja turma ativa cadastrada */}
      {classes.length === 0 && !loading && (
        <div className="bg-dark-surface border border-amber-900/40 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-white">
            Nenhuma turma com status &ldquo;Em treinamento&rdquo; encontrada
          </h3>
          <p className="text-xs text-dark-muted max-w-md mx-auto">
            Todas as turmas foram concluídas ou ainda não foram cadastradas. Acesse a gestão de turmas para reativar uma turma ou criar uma nova turma em treinamento.
          </p>
          <Link
            href="/turmas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-bradesco-600 text-white text-xs font-bold rounded-xl hover:bg-bradesco-700 shadow-md shadow-bradesco-600/30"
          >
            <Users className="w-4 h-4" />
            <span>Gerenciar Turmas</span>
          </Link>
        </div>
      )}

      {/* Cards de KPIs Principais */}
      {selectedClass && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: Presença Média */}
            <div className="bg-dark-surface rounded-2xl p-4 sm:p-5 border border-dark-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-bold text-dark-muted uppercase tracking-wider">
                  Frequência
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl sm:text-2xl font-black ${kpis.avgPresenceRate >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {kpis.avgPresenceRate}%
                  </span>
                  <span className="text-[10px] text-dark-muted font-medium">
                    média
                  </span>
                </div>
                <p className="text-[10px] text-dark-muted mt-1 truncate">
                  {kpis.studentsCount} alunos matriculados
                </p>
              </div>
            </div>

            {/* KPI 2: Saúde dos Sistemas dos Alunos */}
            <div className="bg-dark-surface rounded-2xl p-4 sm:p-5 border border-dark-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-bold text-dark-muted uppercase tracking-wider">
                  Sistemas
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-950/60 text-blue-400 flex items-center justify-center border border-blue-800/40">
                  <Server className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl sm:text-2xl font-black ${kpis.systemsHealthRate >= 90 ? 'text-blue-400' : 'text-bradesco-400'}`}>
                    {kpis.systemsHealthRate}%
                  </span>
                  <span className="text-[10px] text-dark-muted font-medium">
                    estabilidade
                  </span>
                </div>
                <p className="text-[10px] text-dark-muted mt-1 truncate">
                  dias 100% operacionais
                </p>
              </div>
            </div>

            {/* KPI 3: Alertas de Baixo Desempenho */}
            <div className="bg-dark-surface rounded-2xl p-4 sm:p-5 border border-dark-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-bold text-dark-muted uppercase tracking-wider">
                  Pontos de Atenção
                </span>
                <div className="w-8 h-8 rounded-lg bg-bradesco-950/60 text-bradesco-400 flex items-center justify-center border border-bradesco-800/40">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl sm:text-2xl font-black ${kpis.lowPerformersTotal > 0 ? 'text-bradesco-400' : 'text-slate-300'}`}>
                    {kpis.lowPerformersTotal}
                  </span>
                  <span className="text-[10px] text-dark-muted font-medium">
                    ocorrências
                  </span>
                </div>
                <p className="text-[10px] text-dark-muted mt-1 truncate">
                  casos justificados
                </p>
              </div>
            </div>

            {/* KPI 4: Total de Reportes Lançados */}
            <div className="bg-dark-surface rounded-2xl p-4 sm:p-5 border border-dark-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-bold text-dark-muted uppercase tracking-wider">
                  Dias de Aula
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-950/60 text-bradesco-300 flex items-center justify-center border border-rose-900/40">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {kpis.totalReports}
                  </span>
                  <span className="text-[10px] text-dark-muted font-medium">
                    lançados
                  </span>
                </div>
                <p className="text-[10px] text-dark-muted mt-1 truncate">
                  {selectedClass.instructor}
                </p>
              </div>
            </div>
          </div>

          {/* Gráficos Interativos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Gráfico 1: Evolução da Frequência */}
            <div className="lg:col-span-2 bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-bradesco-500" />
                    Evolução Diária da Frequência (% Presença)
                  </h3>
                  <p className="text-[11px] text-dark-muted">
                    Acompanhamento da assiduidade dos alunos
                  </p>
                </div>
              </div>

              {attendanceChartData.length > 0 ? (
                <div className="h-56 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceChartData}>
                      <defs>
                        <linearGradient id="presenceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#cc092f" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#cc092f" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232b3e" />
                      <XAxis dataKey="date" stroke="#8e9bb0" fontSize={10} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#8e9bb0" fontSize={10} tickLine={false} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#161c2b',
                          borderColor: '#232b3e',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                        formatter={(value: any) => [`${value}%`, 'Presença']}
                      />
                      <Area
                        type="monotone"
                        dataKey="taxa"
                        stroke="#cc092f"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#presenceGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-dark-muted">
                  Nenhum dado de frequência registrado ainda.
                </div>
              )}
            </div>

            {/* Gráfico 2: Distribuição de Desempenho */}
            <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-bradesco-500" />
                  Níveis de Desempenho
                </h3>
                <p className="text-[11px] text-dark-muted mb-2">
                  Distribuição acumulada de notas e conceitos
                </p>
              </div>

              {performanceChartData.length > 0 ? (
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={performanceChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {performanceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#161c2b',
                          borderColor: '#232b3e',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center text-xs text-dark-muted">
                  Nenhum registro de desempenho ainda.
                </div>
              )}

              <div className="pt-3 border-t border-dark-border flex items-center justify-between text-xs text-dark-muted">
                <span>Alunos abaixo do esperado:</span>
                <span className="font-bold text-bradesco-400">{kpis.lowPerformersTotal} ocorrências</span>
              </div>
            </div>
          </div>

          {/* Painel de Alunos em Atenção Pedagógica */}
          {attentionStudents.length > 0 && (
            <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-bradesco-900/60 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-bradesco-950/80 text-bradesco-400 flex items-center justify-center border border-bradesco-800/40 flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-bradesco-500" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      Painel de Atenção Pedagógica (Alunos em Risco)
                    </h3>
                    <p className="text-[11px] text-dark-muted">
                      Alunos com baixo desempenho ou faltas com motivos justificados
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-bradesco-950 text-bradesco-300 rounded-lg border border-bradesco-800/50 self-start sm:self-auto">
                  {attentionStudents.length} aluno(s) em observação
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {attentionStudents.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-dark-card rounded-xl border border-dark-border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {st.studentName}
                      </span>
                      <div className="flex gap-1.5 text-[10px]">
                        {st.lowPerfs > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-bradesco-950 text-bradesco-400 font-bold border border-bradesco-800/40">
                            {st.lowPerfs}x Baixo
                          </span>
                        )}
                        {st.absences > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 font-bold border border-amber-800/40">
                            {st.absences}x Falta
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-dark-muted space-y-1 bg-dark-bg p-2 rounded-lg border border-dark-border max-h-24 overflow-y-auto">
                      {st.reasons.map((r, rIdx) => (
                        <p key={rIdx} className="leading-snug">• {r}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabela de Relatórios Recentes da Turma */}
          <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Histórico de Reportes Diários Desta Turma
                </h3>
                <p className="text-[11px] text-dark-muted">
                  Acompanhe os dados enviados, acione o Agente de IA para e-mail ou exporte em PDF
                </p>
              </div>
              <span className="text-[11px] font-medium text-dark-muted">
                {reports.length} reporte(s) registrado(s)
              </span>
            </div>

            {reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-card text-dark-muted uppercase tracking-wider font-bold border-y border-dark-border">
                    <tr>
                      <th className="py-3 px-3 sm:px-4">Data</th>
                      <th className="py-3 px-3 sm:px-4">Sistemas</th>
                      <th className="py-3 px-3 sm:px-4">Frequência</th>
                      <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Conteúdo</th>
                      <th className="py-3 px-3 sm:px-4">Atenção</th>
                      <th className="py-3 px-3 sm:px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border text-dark-text">
                    {reports.map((rep) => {
                      const total = rep.attendance.length;
                      const present = rep.attendance.filter(a => a.status === 'PRESENTE').length;
                      const rate = total > 0 ? Math.round((present / total) * 100) : 100;
                      const lowCount = rep.studentPerformances.filter(p => p.level === 'ABAIXO_DO_ESPERADO').length;

                      return (
                        <tr key={rep.id} className="hover:bg-dark-card/60 transition-colors">
                          <td className="py-3 px-3 sm:px-4 font-bold text-white whitespace-nowrap">
                            {rep.date}
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            {rep.systemsStatus.operational ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                                100% OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-bradesco-400 bg-bradesco-950/60 px-2 py-0.5 rounded-full border border-bradesco-800/40">
                                Com Falhas
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                            <span className={`font-bold ${rate >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {rate}%
                            </span>
                            <span className="text-[10px] text-dark-muted ml-1">
                              ({present}/{total})
                            </span>
                          </td>
                          <td className="py-3 px-3 sm:px-4 max-w-xs truncate hidden md:table-cell text-dark-muted" title={rep.topicsStudied}>
                            {rep.topicsStudied}
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            {lowCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-bradesco-950 text-bradesco-400 font-bold text-[10px] border border-bradesco-800/40">
                                {lowCount} aluno(s)
                              </span>
                            ) : (
                              <span className="text-[11px] text-dark-muted">Nenhum</span>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botão Agente de IA para E-mail */}
                              <button
                                onClick={() => handleOpenAiForReport(rep)}
                                className="px-2.5 py-1.5 rounded-xl bg-bradesco-600/20 hover:bg-bradesco-600 text-bradesco-400 hover:text-white font-bold text-[11px] flex items-center gap-1 border border-bradesco-500/30 transition-all"
                                title="Ver ou gerar e-mail com Agente de IA"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-bradesco-400" />
                                <span className="hidden sm:inline">E-mail IA</span>
                              </button>

                              {/* Botão Exportar PDF */}
                              <button
                                onClick={() => exportSingleReportToPdf(rep)}
                                className="p-1.5 rounded-xl text-dark-muted hover:text-white hover:bg-dark-card border border-dark-border transition-colors"
                                title="Baixar PDF formatado deste reporte"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-dark-muted text-xs">
                Nenhum reporte diário lançado para esta turma ainda.
                <div className="mt-3">
                  <Link
                    href="/relatorio"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bradesco-600 text-white rounded-xl text-xs font-bold hover:bg-bradesco-700 shadow-md shadow-bradesco-600/30"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Lançar Primeiro Reporte</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal do Agente de IA */}
      {currentAiReport && (
        <AiAgentModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          report={currentAiReport}
          aiData={aiData}
          isLoading={aiLoading}
          onRegenerate={() => handleOpenAiForReport(currentAiReport)}
        />
      )}
    </div>
  );
}
