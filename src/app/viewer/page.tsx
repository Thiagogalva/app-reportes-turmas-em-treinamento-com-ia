'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  CalendarDays,
  Shield,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ClassGroup, DailyReport, AttendanceStatus } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function relativeDay(iso: string) {
  const today = new Date(todayStr());
  const date = new Date(iso);
  const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff <= 7) return `${diff} dias atrás`;
  return formatDate(iso);
}

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  ATRASADO: 'Atrasado',
  JUSTIFICADO: 'Justificado',
};

const PERF_COLOR: Record<string, string> = {
  EXCELENTE: 'text-emerald-400',
  BOM: 'text-blue-400',
  REGULAR: 'text-amber-400',
  ABAIXO_DO_ESPERADO: 'text-bradesco-400',
};

const PERF_LABEL: Record<string, string> = {
  EXCELENTE: 'Excelente',
  BOM: 'Bom',
  REGULAR: 'Regular',
  ABAIXO_DO_ESPERADO: 'Abaixo do Esperado',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViewerPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadData = async () => {
    try {
      const [resC, resR] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/reports'),
      ]);
      const jc = await resC.json();
      const jr = await resR.json();
      if (jc.success) setClasses(jc.data.filter((c: ClassGroup) => c.status === 'EM_TREINAMENTO'));
      if (jr.success) setReports(jr.data);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const recentReports = reports
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 30);

  // Relatório mais recente por turma
  const latestByClass: Record<string, DailyReport> = {};
  for (const r of recentReports) {
    if (!latestByClass[r.classId]) latestByClass[r.classId] = r;
  }

  // Métricas globais dos últimos 7 dias
  const last7 = recentReports.filter(r => {
    const diff = Math.round((new Date(todayStr()).getTime() - new Date(r.date).getTime()) / 86400000);
    return diff <= 7;
  });

  const totalAttendances = last7.flatMap(r => r.attendance);
  const presentCount = totalAttendances.filter(a => a.status === 'PRESENTE').length;
  const absentCount = totalAttendances.filter(a => a.status === 'AUSENTE').length;
  const presentPct = totalAttendances.length > 0
    ? Math.round((presentCount / totalAttendances.length) * 100)
    : null;

  const totalPerfs = last7.flatMap(r => r.studentPerformances);
  const belowCount = totalPerfs.filter(p => p.level === 'ABAIXO_DO_ESPERADO').length;
  const excelCount = totalPerfs.filter(p => p.level === 'EXCELENTE').length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0d1f3c] via-[#1a3260] to-[#0d1f3c] border-b border-blue-900/50 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-bradesco-600 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-none">TreinaReport AI</h1>
              <p className="text-[10px] text-blue-300 font-medium mt-0.5">Painel da Coordenação • Somente Leitura</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-blue-400 font-medium">
              <Shield className="w-3 h-3" />
              Modo Somente Leitura
            </span>
            <button
              onClick={loadData}
              className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-900/50 rounded-lg transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-dark-muted hidden sm:block">
              {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-5 space-y-5 pb-10">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-dark-muted">
            <RefreshCw className="w-8 h-8 animate-spin text-bradesco-500" />
            <span className="text-sm">Carregando dados...</span>
          </div>
        ) : (
          <>
            {/* Métricas Globais (últimos 7 dias) */}
            {last7.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-dark-surface rounded-2xl p-4 border border-dark-border text-center">
                  <span className="text-[10px] text-dark-muted font-bold block mb-1">Turmas Ativas</span>
                  <strong className="text-2xl font-black text-white">{classes.length}</strong>
                </div>

                <div className="bg-dark-surface rounded-2xl p-4 border border-dark-border text-center">
                  <span className="text-[10px] text-dark-muted font-bold block mb-1">Presença 7 dias</span>
                  <strong className={`text-2xl font-black ${
                    (presentPct ?? 0) >= 85 ? 'text-emerald-400' :
                    (presentPct ?? 0) >= 70 ? 'text-amber-400' : 'text-bradesco-400'
                  }`}>
                    {presentPct !== null ? `${presentPct}%` : '–'}
                  </strong>
                </div>

                <div className="bg-dark-surface rounded-2xl p-4 border border-dark-border text-center">
                  <span className="text-[10px] text-dark-muted font-bold block mb-1">Ausências 7 dias</span>
                  <strong className={`text-2xl font-black ${absentCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {absentCount}
                  </strong>
                </div>

                <div className="bg-dark-surface rounded-2xl p-4 border border-dark-border text-center">
                  <span className="text-[10px] text-dark-muted font-bold block mb-1">Destaques 7 dias</span>
                  <strong className="text-2xl font-black text-emerald-400">{excelCount}</strong>
                  {belowCount > 0 && (
                    <span className="text-[10px] text-bradesco-400 block">({belowCount} alertas)</span>
                  )}
                </div>
              </div>
            )}

            {/* Turmas Ativas */}
            <section>
              <h2 className="text-xs font-black text-dark-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Turmas em Treinamento ({classes.length})
              </h2>

              {classes.length === 0 ? (
                <div className="bg-dark-surface rounded-2xl p-8 border border-dark-border text-center text-dark-muted text-sm">
                  Nenhuma turma ativa no momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {classes.map(cls => {
                    const latest = latestByClass[cls.id];
                    const lastDate = latest ? relativeDay(latest.date) : null;

                    // Calcula presença do último relatório
                    const lastPresent = latest
                      ? latest.attendance.filter(a => a.status === 'PRESENTE').length
                      : null;
                    const lastTotal = latest ? latest.attendance.length : null;

                    // Contagem de sistemas OK
                    const sysOk = latest?.systemsStatus?.operational !== false;

                    return (
                      <div
                        key={cls.id}
                        className="bg-dark-surface rounded-2xl p-4 border border-dark-border space-y-3"
                      >
                        {/* Turma Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-black text-dark-muted bg-dark-card px-2 py-0.5 rounded border border-dark-border">
                                {cls.code}
                              </span>
                              {cls.segmentName && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/40">
                                  {cls.segmentName}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-white mt-1 leading-snug">{cls.name}</h3>
                            <p className="text-[11px] text-dark-muted">Instrutor: {cls.instructor}</p>
                          </div>

                          {/* Sistemas */}
                          {cls.systemsValidated ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold flex-shrink-0">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Sistemas OK
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-bold flex-shrink-0">
                              Sistemas Pendentes
                            </span>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                          <div className="bg-dark-card rounded-xl p-2 border border-dark-border">
                            <span className="text-dark-muted block font-bold">Operadores</span>
                            <strong className="text-white text-sm">{cls.students.length}</strong>
                          </div>
                          <div className="bg-dark-card rounded-xl p-2 border border-dark-border">
                            <span className="text-dark-muted block font-bold">Início</span>
                            <strong className="text-white">{formatDate(cls.startDate)}</strong>
                          </div>
                          <div className="bg-dark-card rounded-xl p-2 border border-dark-border">
                            <span className="text-dark-muted block font-bold">Último Rel.</span>
                            <strong className={`text-white ${lastDate ? '' : 'text-dark-muted'}`}>
                              {lastDate ?? 'Nenhum'}
                            </strong>
                          </div>
                        </div>

                        {/* Último relatório resumo */}
                        {latest && (
                          <div className="p-2.5 rounded-xl bg-dark-card border border-dark-border space-y-1.5">
                            <p className="text-[10px] font-bold text-dark-muted flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              Último relatório — {formatDate(latest.date)}
                            </p>

                            {/* Presença */}
                            {lastTotal !== null && lastTotal > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${Math.round((lastPresent! / lastTotal) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-emerald-400 flex-shrink-0">
                                  {lastPresent}/{lastTotal} presentes
                                </span>
                              </div>
                            )}

                            {/* Sistemas */}
                            <div className="flex items-center gap-1.5">
                              {sysOk ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  <span className="text-[10px] text-emerald-400 font-medium">Sistemas operacionais</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 text-amber-400" />
                                  <span className="text-[10px] text-amber-400 font-medium">
                                    Problema nos sistemas reportado
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Relatórios Recentes (últimos 10) */}
            {recentReports.length > 0 && (
              <section>
                <h2 className="text-xs font-black text-dark-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Relatórios Recentes
                </h2>

                <div className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
                  {recentReports.slice(0, 10).map((r, i) => {
                    const presentN = r.attendance.filter(a => a.status === 'PRESENTE').length;
                    const totalN = r.attendance.length;
                    const pct = totalN > 0 ? Math.round((presentN / totalN) * 100) : null;
                    const hasIssue = r.systemsStatus?.operational === false;
                    const belowPerfs = r.studentPerformances.filter(p => p.level === 'ABAIXO_DO_ESPERADO');
                    const excelPerfs = r.studentPerformances.filter(p => p.level === 'EXCELENTE');

                    return (
                      <div
                        key={r.id}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center gap-2.5 ${
                          i < recentReports.slice(0, 10).length - 1 ? 'border-b border-dark-border' : ''
                        }`}
                      >
                        {/* Data */}
                        <div className="flex-shrink-0 text-center w-16">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg block ${
                            r.date === todayStr()
                              ? 'bg-bradesco-600/40 text-bradesco-300'
                              : 'bg-dark-card text-dark-muted'
                          }`}>
                            {relativeDay(r.date)}
                          </span>
                        </div>

                        {/* Turma */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{r.className}</p>
                          {r.segmentName && (
                            <p className="text-[10px] text-blue-400 font-medium">{r.segmentName}</p>
                          )}
                        </div>

                        {/* Indicadores */}
                        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                          {/* Presença */}
                          {pct !== null && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              pct >= 85
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                                : pct >= 70
                                ? 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                                : 'bg-bradesco-950/60 text-bradesco-400 border-bradesco-800/40'
                            }`}>
                              {pct}% presença
                            </span>
                          )}

                          {/* Sistema */}
                          {hasIssue ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" />
                              Sistema
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-500 border border-emerald-900/40 flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5" />
                              Sistemas OK
                            </span>
                          )}

                          {/* Destaques */}
                          {excelPerfs.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-400 border border-blue-800/40 flex items-center gap-1">
                              <TrendingUp className="w-2.5 h-2.5" />
                              {excelPerfs.length} destaque{excelPerfs.length > 1 ? 's' : ''}
                            </span>
                          )}

                          {/* Alertas */}
                          {belowPerfs.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bradesco-950/60 text-bradesco-400 border border-bradesco-800/40 flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" />
                              {belowPerfs.length} alerta{belowPerfs.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Destaques e Alertas de Performance */}
            {last7.length > 0 && (belowCount > 0 || excelCount > 0) && (
              <section>
                <h2 className="text-xs font-black text-dark-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Destaques & Alertas — Últimos 7 dias
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Destaques */}
                  {excelCount > 0 && (
                    <div className="bg-dark-surface rounded-2xl border border-emerald-900/40 overflow-hidden">
                      <div className="px-4 py-2.5 bg-emerald-950/40 border-b border-emerald-900/40 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300">Desempenho Excelente</span>
                      </div>
                      <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
                        {last7
                          .flatMap(r =>
                            r.studentPerformances
                              .filter(p => p.level === 'EXCELENTE')
                              .map(p => ({ ...p, className: r.className, date: r.date }))
                          )
                          .slice(0, 8)
                          .map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                              <span className="text-white font-medium truncate">{p.studentName}</span>
                              <span className="text-dark-muted flex-shrink-0">{relativeDay(p.date)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Alertas */}
                  {belowCount > 0 && (
                    <div className="bg-dark-surface rounded-2xl border border-bradesco-900/40 overflow-hidden">
                      <div className="px-4 py-2.5 bg-bradesco-950/40 border-b border-bradesco-900/40 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-bradesco-400" />
                        <span className="text-xs font-bold text-bradesco-300">Precisam de Atenção</span>
                      </div>
                      <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
                        {last7
                          .flatMap(r =>
                            r.studentPerformances
                              .filter(p => p.level === 'ABAIXO_DO_ESPERADO')
                              .map(p => ({ ...p, className: r.className, date: r.date }))
                          )
                          .slice(0, 8)
                          .map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                              <span className="text-white font-medium truncate">{p.studentName}</span>
                              <span className="text-dark-muted flex-shrink-0">{relativeDay(p.date)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {reports.length === 0 && (
              <div className="bg-dark-surface rounded-2xl p-10 border border-dark-border text-center space-y-2">
                <Clock className="w-8 h-8 text-dark-muted mx-auto" />
                <p className="text-sm font-bold text-white">Ainda não há relatórios registrados</p>
                <p className="text-xs text-dark-muted">Os dados aparecerão aqui assim que o instrutor registrar o primeiro relatório diário.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border py-4 text-center">
        <p className="text-[10px] text-dark-muted">
          TreinaReport AI • Painel de Coordenação • Atualização automática a cada 5 min
        </p>
      </footer>
    </div>
  );
}
