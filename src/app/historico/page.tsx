'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Download,
  FileSpreadsheet,
  Sparkles,
  AlertTriangle,
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
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 shadow-xl border border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-bradesco-900/40 text-bradesco-400 border border-bradesco-600/40">
            Arquivo Completo
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
            Histórico Geral de Reportes
          </h1>
          <p className="text-xs text-dark-muted">
            Consulte todos os lançamentos passados, filtre ocorrências e exporte relatórios consolidados.
          </p>
        </div>

        <button
          onClick={() => exportReportsToExcel(filteredReports)}
          disabled={filteredReports.length === 0}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-dark-card hover:bg-dark-border text-white text-xs font-bold border border-dark-border shadow-sm transition-all disabled:opacity-40 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Exportar Filtrados (Excel)</span>
        </button>
      </div>

      {/* Painel de Filtros e Busca */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-5 border border-dark-border shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Busca por texto */}
          <div className="relative">
            <Search className="w-4 h-4 text-dark-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por turma, conteúdo ou aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
            />
          </div>

          {/* Filtro por Turma */}
          <div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs font-bold text-white border border-dark-border rounded-xl p-2.5 focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input"
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
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold text-dark-muted pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOnlyLowPerformers}
                onChange={(e) => setFilterOnlyLowPerformers(e.target.checked)}
                className="rounded border-dark-border bg-dark-input text-bradesco-600 focus:ring-bradesco-500"
              />
              <span className="text-bradesco-400">Apenas c/ Baixo Desempenho</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOnlySystemIssues}
                onChange={(e) => setFilterOnlySystemIssues(e.target.checked)}
                className="rounded border-dark-border bg-dark-input text-amber-500 focus:ring-amber-500"
              />
              <span className="text-amber-400">Falhas nos Sistemas</span>
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
                className="bg-dark-surface rounded-2xl p-4 sm:p-5 border border-dark-border shadow-sm hover:border-bradesco-600/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-white bg-dark-card border border-dark-border px-2.5 py-1 rounded-lg">
                      {rep.date}
                    </span>
                    <strong className="text-sm text-white font-bold">
                      {rep.className}
                    </strong>
                    <span className="text-xs text-dark-muted hidden sm:inline">|</span>
                    <span className="text-xs text-dark-muted">
                      Instrutor: {rep.instructorName}
                    </span>
                  </div>

                  <p className="text-xs text-dark-muted line-clamp-1">
                    <strong className="text-slate-300">Conteúdo:</strong> {rep.topicsStudied}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                    <span className={`font-bold ${rate >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      ● Presença: {rate}% ({present}/{total})
                    </span>

                    <span>
                      {rep.systemsStatus.operational ? (
                        <span className="text-emerald-400 font-bold">● Sistemas: OK</span>
                      ) : (
                        <span className="text-bradesco-400 font-bold">● Sistemas: Falhas reportadas</span>
                      )}
                    </span>

                    {lowCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-bradesco-950 text-bradesco-300 font-bold text-[10px] border border-bradesco-800/40">
                        ⚠️ {lowCount} aluno(s) abaixo do esperado
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => setViewingReport(rep)}
                    className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-card border border-dark-border transition-colors text-xs font-semibold flex items-center gap-1"
                    title="Ver detalhes completos do reporte"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Detalhes</span>
                  </button>

                  <button
                    onClick={() => handleOpenAiForReport(rep)}
                    className="px-3 py-1.5 rounded-xl bg-bradesco-600/20 hover:bg-bradesco-600 text-bradesco-400 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-bradesco-500/30 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>E-mail IA</span>
                  </button>

                  <button
                    onClick={() => exportSingleReportToPdf(rep)}
                    className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-card border border-dark-border transition-colors"
                    title="Baixar PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteReport(rep.id)}
                    className="p-2 rounded-xl text-dark-muted hover:text-bradesco-400 hover:bg-bradesco-950/40 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-dark-surface rounded-2xl p-12 text-center text-dark-muted border border-dark-border text-xs">
            Nenhum reporte encontrado com os filtros selecionados.
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES COMPLETOS DO REPORTE */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-surface rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-dark-border text-dark-text">
            <div className="p-4 sm:p-5 border-b border-dark-border bg-gradient-to-r from-bradesco-700 via-bradesco-600 to-rose-700 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white" />
                  Detalhes do Reporte Diário
                </h2>
                <p className="text-xs text-rose-100">
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

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* Sistemas */}
              <div className="p-3.5 bg-dark-card rounded-xl border border-dark-border space-y-1">
                <span className="font-bold text-white block">Sistemas dos Alunos:</span>
                <p className="text-slate-300">
                  Status: <strong>{viewingReport.systemsStatus.operational ? '100% Operacional' : 'Com Problemas'}</strong>
                </p>
                <p className="text-dark-muted">{viewingReport.systemsStatus.notes}</p>
              </div>

              {/* Tópicos */}
              <div className="p-3.5 bg-dark-card rounded-xl border border-dark-border space-y-1">
                <span className="font-bold text-white block">Conteúdo Ministrado:</span>
                <p className="text-slate-300">{viewingReport.topicsStudied}</p>
                {viewingReport.practicalExercises && (
                  <p className="text-dark-muted mt-1">Prática: {viewingReport.practicalExercises}</p>
                )}
              </div>

              {/* Desempenho e Frequência */}
              <div className="space-y-2">
                <span className="font-bold text-white block">Desempenho dos Alunos:</span>
                <div className="space-y-1.5">
                  {viewingReport.studentPerformances.map((p, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                        p.level === 'ABAIXO_DO_ESPERADO'
                          ? 'bg-bradesco-950/40 border-bradesco-800 text-bradesco-200'
                          : 'bg-dark-card border-dark-border text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{p.studentName}</span>
                        <span className="text-[10px] uppercase font-black">{p.level.replace(/_/g, ' ')}</span>
                      </div>
                      {p.lowPerformanceReason && (
                        <p className="text-[11px] text-bradesco-300 font-medium">
                          <strong>Motivo do Baixo Desempenho:</strong> {p.lowPerformanceReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-dark-border bg-dark-card flex items-center justify-end gap-2">
              <button
                onClick={() => exportSingleReportToPdf(viewingReport)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-dark-surface hover:bg-dark-border text-white border border-dark-border flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-bradesco-400" />
                <span>Baixar PDF</span>
              </button>
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-700"
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
