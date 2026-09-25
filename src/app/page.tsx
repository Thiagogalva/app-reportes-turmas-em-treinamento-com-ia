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
  ExternalLink,
  ChevronRight,
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

  // Dados para Gráfico de Pizza de Níveis de Desempenho
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
      { name: 'Excelente', value: counts['Excelente'], color: '#16a34a' },
      { name: 'Bom', value: counts['Bom'], color: '#2563eb' },
      { name: 'Regular', value: counts['Regular'], color: '#eab308' },
      { name: 'Abaixo do Esperado', value: counts['Abaixo do Esperado'], color: '#dc2626' },
    ].filter(item => item.value > 0);
  }, [reports]);

  // Alunos que demandam atenção pedagógica (baixo desempenho recente ou faltas)
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Em Treinamento (Turma Ativa)
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">
              Turmas concluídas ficam fora deste painel
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard de Acompanhamento
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Métricas em tempo real, status dos sistemas e relatórios diários de treinamento.
          </p>
        </div>

        {/* Seletor de Turmas e Ações Rápidas */}
        <div className="flex flex-wrap items-center gap-3">
          {classes.length > 0 ? (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 px-2">Turma:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-white text-xs font-bold text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              Nenhuma turma em treinamento no momento.
            </div>
          )}

          <button
            onClick={() => exportReportsToExcel(reports, selectedClass)}
            disabled={reports.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            title="Exportar todos os relatórios desta turma para Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          <Link
            href="/relatorio"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lançar Reporte</span>
          </Link>
        </div>
      </div>

      {/* Caso não haja turma ativa cadastrada */}
      {classes.length === 0 && !loading && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhuma turma com status &ldquo;Em treinamento&rdquo; encontrada
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Todas as turmas foram concluídas ou ainda não foram cadastradas. Acesse a gestão de turmas para reativar uma turma ou criar uma nova turma em treinamento.
          </p>
          <Link
            href="/turmas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700"
          >
            <Users className="w-4 h-4" />
            <span>Gerenciar Turmas</span>
          </Link>
        </div>
      )}

      {/* Cards de KPIs Principais */}
      {selectedClass && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Presença Média */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Frequência Média
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl font-black ${kpis.avgPresenceRate >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {kpis.avgPresenceRate}%
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {kpis.studentsCount} alunos
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Média geral acumulada nos reportes
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 2: Saúde dos Sistemas dos Alunos */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Sistemas dos Alunos
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl font-black ${kpis.systemsHealthRate >= 90 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {kpis.systemsHealthRate}%
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Estabilidade
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Dias com sistemas 100% operacionais
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Server className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 3: Alertas de Baixo Desempenho */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Pontos de Atenção
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl font-black ${kpis.lowPerformersTotal > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {kpis.lowPerformersTotal}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    ocorrências
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Casos de baixo rendimento justificados
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 4: Total de Reportes Lançados */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total de Dias Reportados
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-indigo-600">
                    {kpis.totalReports}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    aulas registradas
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Instrutor: {selectedClass.instructor}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Gráficos Interativos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico 1: Evolução da Frequência */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Evolução Diária da Frequência (% Presença)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Acompanhamento de assiduidade dos alunos ao longo das aulas
                  </p>
                </div>
              </div>

              {attendanceChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceChartData}>
                      <defs>
                        <linearGradient id="presenceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                          border: 'none',
                        }}
                        formatter={(value: any) => [`${value}%`, 'Presença']}
                      />
                      <Area
                        type="monotone"
                        dataKey="taxa"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#presenceGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  Nenhum dado de frequência registrado ainda.
                </div>
              )}
            </div>

            {/* Gráfico 2: Distribuição de Desempenho */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Níveis de Desempenho
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Distribuição acumulada de notas e conceitos
                </p>
              </div>

              {performanceChartData.length > 0 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={performanceChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {performanceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                  Nenhum registro de desempenho ainda.
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Alunos abaixo do esperado:</span>
                <span className="font-bold text-rose-600">{kpis.lowPerformersTotal} ocorrências</span>
              </div>
            </div>
          </div>

          {/* Painel de Alunos em Atenção Pedagógica */}
          {attentionStudents.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Painel de Atenção Pedagógica (Alunos em Risco)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Alunos que registraram baixo desempenho ou faltas com motivos justificados
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                  {attentionStudents.length} aluno(s) requerem acompanhamento
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {attentionStudents.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">
                        {st.studentName}
                      </span>
                      <div className="flex gap-1.5 text-[10px]">
                        {st.lowPerfs > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                            {st.lowPerfs}x Baixo
                          </span>
                        )}
                        {st.absences > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
                            {st.absences}x Falta
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2 rounded-lg border border-slate-100 max-h-24 overflow-y-auto">
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Histórico de Reportes Diários Desta Turma
                </h3>
                <p className="text-xs text-slate-500">
                  Acompanhe os dados enviados, acione o Agente de IA para e-mail ou exporte em PDF
                </p>
              </div>
              <span className="text-xs font-medium text-slate-400">
                Mostrando {reports.length} reporte(s)
              </span>
            </div>

            {reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Sistemas dos Alunos</th>
                      <th className="py-3 px-4">Frequência</th>
                      <th className="py-3 px-4">Conteúdo Ministrado</th>
                      <th className="py-3 px-4">Baixo Desempenho</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {reports.map((rep) => {
                      const total = rep.attendance.length;
                      const present = rep.attendance.filter(a => a.status === 'PRESENTE').length;
                      const rate = total > 0 ? Math.round((present / total) * 100) : 100;
                      const lowCount = rep.studentPerformances.filter(p => p.level === 'ABAIXO_DO_ESPERADO').length;

                      return (
                        <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {rep.date}
                          </td>
                          <td className="py-3 px-4">
                            {rep.systemsStatus.operational ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                100% OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Com Falhas
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`font-semibold ${rate >= 85 ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {rate}%
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1">
                              ({present}/{total})
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate" title={rep.topicsStudied}>
                            {rep.topicsStudied}
                          </td>
                          <td className="py-3 px-4">
                            {lowCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                                {lowCount} aluno(s)
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Nenhum</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {/* Botão Agente de IA para E-mail */}
                              <button
                                onClick={() => handleOpenAiForReport(rep)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                                title="Ver ou gerar e-mail com Agente de IA"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                <span>E-mail IA</span>
                              </button>

                              {/* Botão Exportar PDF */}
                              <button
                                onClick={() => exportSingleReportToPdf(rep)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
              <div className="text-center py-10 text-slate-400 text-xs">
                Nenhum reporte diário lançado para esta turma ainda.
                <div className="mt-3">
                  <Link
                    href="/relatorio"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
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
