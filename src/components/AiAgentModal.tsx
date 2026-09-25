'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Mail,
  FileText,
  AlertTriangle,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { AiGeneratedReport, DailyReport } from '@/types';

interface AiAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DailyReport;
  aiData: AiGeneratedReport | null;
  isLoading: boolean;
  onRegenerate?: () => void;
  onSaveReport?: () => void;
}

export default function AiAgentModal({
  isOpen,
  onClose,
  report,
  aiData,
  isLoading,
  onRegenerate,
  onSaveReport
}: AiAgentModalProps) {
  const [activeTab, setActiveTab] = useState<'formatted' | 'text' | 'plan'>('formatted');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async (type: 'html' | 'text') => {
    if (!aiData) return;

    try {
      if (type === 'html' && navigator.clipboard && (window as any).ClipboardItem) {
        // Copia tanto HTML quanto Texto puro, para o Outlook/Gmail colarem formatados
        const blobHtml = new Blob([aiData.bodyHtml], { type: 'text/html' });
        const blobText = new Blob([aiData.bodyText], { type: 'text/plain' });
        const item = new (window as any).ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(aiData.bodyText);
      }
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.warn("Falha no clipboard rico, usando texto simples:", err);
      await navigator.clipboard.writeText(aiData.bodyText);
      setCopiedType('text');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const openMailto = () => {
    if (!aiData) return;
    const subject = encodeURIComponent(aiData.subject);
    const body = encodeURIComponent(aiData.bodyText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Agente de IA Pedagógico
                <span className="text-xs bg-yellow-400/20 text-yellow-200 px-2 py-0.5 rounded-full border border-yellow-400/30">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-xs text-blue-100">
                Resumo executivo, análise de desempenho e redação formal de e-mail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-blue-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  O Agente de IA está analisando os dados da aula...
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Correlacionando status dos sistemas, faltas, motivos de baixo desempenho e sintetizando o e-mail executivo.
                </p>
              </div>
            </div>
          ) : aiData ? (
            <>
              {/* Assunto do E-mail */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Assunto Sugerido do E-mail
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {aiData.subject}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiData.subject);
                    setCopiedType('subject');
                    setTimeout(() => setCopiedType(null), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
                >
                  {copiedType === 'subject' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'subject' ? 'Copiado!' : 'Copiar Assunto'}</span>
                </button>
              </div>

              {/* Cards de Resumo Rápido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Resumo Executivo da Aula</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {aiData.executiveSummary}
                  </p>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>Plano de Intervenção Pedagógica</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {aiData.actionPlan}
                  </p>
                </div>
              </div>

              {/* Tabs de Prévia */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTab('formatted')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        activeTab === 'formatted'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Visualização Formatada (Outlook/Gmail)
                    </button>
                    <button
                      onClick={() => setActiveTab('text')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        activeTab === 'text'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Texto Puro
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard('html')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                      title="Copia HTML rico formatado para colar direto no corpo do e-mail"
                    >
                      {copiedType === 'html' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === 'html' ? 'Copiado para o E-mail!' : 'Copiar E-mail Formatado'}</span>
                    </button>
                    <button
                      onClick={openMailto}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir no E-mail</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white max-h-96 overflow-y-auto">
                  {activeTab === 'formatted' ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: aiData.bodyHtml }}
                    />
                  ) : (
                    <pre className="text-xs text-slate-800 font-mono bg-slate-50 p-4 rounded-lg whitespace-pre-wrap leading-relaxed border border-slate-200">
                      {aiData.bodyText}
                    </pre>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              Nenhum dado gerado ainda. Clique em Gerar com IA.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {aiData?.generatedAt ? `Gerado em ${new Date(aiData.generatedAt).toLocaleTimeString('pt-BR')}` : ''}
          </div>
          <div className="flex items-center gap-3">
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Gerar Novamente
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
