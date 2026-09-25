'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { DailyReport, ClassGroup, AiGeneratedReport } from '@/types';
import { exportReportsToExcel, exportSingleReportToPdf } from '@/lib/export-helpers';
import AiAgentModal from '@/components/AiAgentModal';

export default function HistoricoPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterOnlyLowPerformers, setFilterOnlyLowPerformers] = useState<boolean>(false);
  const [filterOnlySystemIssues, setFilterOnlySystemIssues] = useState<boolean>(false);

  // Modal de Detalhes
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);

  // Modal Agente de IA
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [currentAiReport, setCurrentAiReport] = useState<DailyReport | null>(null);
  const [aiData, setAiData] = useState<AiGeneratedReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resReports, resClasses] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/classes'),
      ]);
      const jsonReports = await resReports.json();
      const jsonClasses = await resClasses.json();

      if (jsonReports.success) setReports(jsonReports.data);
      if (jsonClasses.success) setClasses(jsonClasses.data);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este reporte? Esta ação não pode ser desfeita.')) return;

    try {
      const res = await fetch(`/api/reports?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setReports(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const handleOpenAiForReport = async (rep: DailyReport) => {
    setCurrentAiReport(rep);
    setIsAiModalOpen(true);

    if (rep.aiGeneratedEmail) {
      setAiData(rep.aiGeneratedEmail);
      return;
    }

    try {
      setAiLoading(true);
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rep),
      });
      const json = await res.json();
      if (json.success) {
        setAiData(json.data);
      }
    } catch (err) {
      console.error("Erro na IA:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Filtragem dos reportes
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (selectedClassId !== 'ALL' && r.classId !== selectedClassId) {
        return false;
      }

      if (filterOnlySystemIssues && r.systemsStatus.operational) {
        return false;
      }

      if (filterOnlyLowPerformers) {
        const hasLow = r.studentPerformances.some(p => p.level === 'ABAIXO_DO_ESPERADO');
        if (!hasLow) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesClass = r.className.toLowerCase().includes(term);
        const matchesTopics = r.topicsStudied.toLowerCase().includes(term);
        const matchesInstructor = r.instructorName.toLowerCase().includes(term);
        const matchesStudent = r.attendance.some(a => a.studentName.toLowerCase().includes(term));
        if (!matchesClass && !matchesTopics && !matchesInstructor && !matchesStudent) {
          return false;
        }
      }

      return true;
    });
  }, [reports, selectedClassId, filterOnlySystemIssues, filterOnlyLowPerformers, searchTerm]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            Arquivo Completo
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Histórico Geral de Reportes
          </h1>
          <p className="text-xs text-slate-500">
            Consulte todos os lançamentos de treinamentos passados, filtre ocorrências e exporte relatórios consolidados.
          </p>
        </div>

        <button
          onClick={() => exportReportsToExcel(filteredReports)}
          disabled={filteredReports.length === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Filtrados (Excel)</span>
        </button>
      </div>

      {/* Painel de Filtros e Busca */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Busca por texto */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por turma, conteúdo ou aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            />
          </div>

          {/* Filtro por Turma */}
          <div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            >
              <option value="ALL">Todas as Turmas (Ativas e Concluídas)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.status === 'CONCLUIDA' ? '(Concluída)' : '(Em treinamento)'}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes de Filtros Especiais */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOnlyLowPerformers}
                onChange={(e) => setFilterOnlyLowPerformers(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-rose-700">Apenas c/ Baixo Desempenho</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOnlySystemIssues}
                onChange={(e) => setFilterOnlySystemIssues(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-amber-800">Falhas nos Sistemas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Lista de Reportes */}
      <div className="space-y-3">
        {filteredReports.length > 0 ? (
          filteredReports.map((rep) => {
            const total = rep.attendance.length;
            const present = rep.attendance.filter(a => a.status === 'PRESENTE').length;
            const rate = total > 0 ? Math.round((present / total) * 100) : 100;
            const lowCount = rep.studentPerformances.filter(p => p.level === 'ABAIXO_DO_ESPERADO').length;

            return (
              <div
                key={rep.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-blue-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {rep.date}
                    </span>
                    <strong className="text-sm text-slate-900 font-bold">
                      {rep.className}
                    </strong>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs text-slate-500">
                      Instrutor: {rep.instructorName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1">
                    <strong>Conteúdo:</strong> {rep.topicsStudied}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                    <span className={`font-semibold ${rate >= 85 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      ● Presença: {rate}% ({present}/{total})
                    </span>

                    <span>
                      {rep.systemsStatus.operational ? (
                        <span className="text-emerald-700 font-semibold">● Sistemas: OK</span>
                      ) : (
                        <span className="text-rose-700 font-bold">● Sistemas: Falhas reportadas</span>
                      )}
                    </span>

                    {lowCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                        ⚠️ {lowCount} aluno(s) abaixo do esperado
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => setViewingReport(rep)}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-semibold flex items-center gap-1"
                    title="Ver detalhes completos do reporte"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Detalhes</span>
                  </button>

                  <button
                    onClick={() => handleOpenAiForReport(rep)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>E-mail IA</span>
                  </button>

                  <button
                    onClick={() => exportSingleReportToPdf(rep)}
                    className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Baixar PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteReport(rep.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
            Nenhum reporte encontrado com os filtros selecionados.
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES COMPLETOS DO REPORTE */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Detalhes do Reporte Diário
                </h2>
                <p className="text-xs text-slate-400">
                  {viewingReport.className} - {viewingReport.date}
                </p>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Sistemas */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Sistemas dos Alunos:</span>
                <p className="text-slate-700">
                  Status: <strong>{viewingReport.systemsStatus.operational ? '100% Operacional' : 'Com Problemas'}</strong>
                </p>
                <p className="text-slate-600">{viewingReport.systemsStatus.notes}</p>
              </div>

              {/* Tópicos */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Conteúdo Ministrado:</span>
                <p className="text-slate-700">{viewingReport.topicsStudied}</p>
                {viewingReport.practicalExercises && (
                  <p className="text-slate-600 mt-1">Prática: {viewingReport.practicalExercises}</p>
                )}
              </div>

              {/* Desempenho e Frequência */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 block">Desempenho dos Alunos:</span>
                <div className="space-y-1.5">
                  {viewingReport.studentPerformances.map((p, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                        p.level === 'ABAIXO_DO_ESPERADO'
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{p.studentName}</span>
                        <span className="text-[10px] uppercase">{p.level.replace(/_/g, ' ')}</span>
                      </div>
                      {p.lowPerformanceReason && (
                        <p className="text-[11px] text-rose-800">
                          <strong>Motivo do Baixo Desempenho:</strong> {p.lowPerformanceReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => exportSingleReportToPdf(viewingReport)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Baixar PDF</span>
              </button>
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal IA */}
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
