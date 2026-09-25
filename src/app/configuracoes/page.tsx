'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  Mail,
  Building,
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { AppSettings } from '@/types';

export default function ConfiguracoesPage() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [defaultRecipients, setDefaultRecipients] = useState('');
  const [instructorDefaultName, setInstructorDefaultName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [emailFooterNote, setEmailFooterNote] = useState('');

  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success && json.data) {
          const s: AppSettings = json.data;
          setGeminiApiKey(s.geminiApiKey || '');
          setDefaultRecipients(s.defaultRecipients || '');
          setInstructorDefaultName(s.instructorDefaultName || '');
          setCompanyName(s.companyName || '');
          setEmailFooterNote(s.emailFooterNote || '');
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: AppSettings = {
        geminiApiKey: geminiApiKey.trim(),
        defaultRecipients: defaultRecipients.trim(),
        instructorDefaultName: instructorDefaultName.trim(),
        companyName: companyName.trim(),
        emailFooterNote: emailFooterNote.trim(),
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({ text: 'Configurações salvas com sucesso!', type: 'success' });
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        setStatusMsg({ text: json.error || 'Erro ao salvar configurações.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Erro de conexão.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 shadow-xl border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-bradesco-900/40 text-bradesco-400 border border-bradesco-600/40">
            Preferências do Sistema
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
            Configurações & Agente de IA
          </h1>
          <p className="text-xs text-dark-muted">
            Gerencie sua chave do Google Gemini gratuito e personalize os dados padrão de envio de e-mails.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
          statusMsg.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            : 'bg-bradesco-950/60 border-bradesco-800 text-bradesco-300'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-bradesco-400 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Seção 1: Agente de IA - Gemini */}
        <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-dark-border pb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-bradesco-600 to-rose-700 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                Agente de IA (Google Gemini 3.8 Flash)
                <span className="text-[10px] bg-bradesco-900/60 text-bradesco-300 px-2 py-0.5 rounded-full font-bold border border-bradesco-700/50">
                  Camada Gratuita
                </span>
              </h2>
              <p className="text-xs text-dark-muted">
                Sintetiza os relatórios diários, formula planos pedagógicos e gera o e-mail formal
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-dark-text mb-1.5 flex flex-wrap items-center justify-between gap-1">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-bradesco-500" />
                  Chave de API do Gemini (GEMINI_API_KEY)
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-bradesco-400 hover:text-bradesco-300 flex items-center gap-1 font-bold"
                >
                  <span>Pegar chave gratuita no Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full text-xs font-mono p-3 pr-10 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-3 text-dark-muted hover:text-white"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-dark-card border border-dark-border p-3.5 rounded-xl text-[11px] text-dark-muted leading-relaxed">
              <strong className="text-white block mb-0.5">Modo Gratuito de Contingência Ativo:</strong>
              Caso você não insira uma chave agora, o sistema opera utilizando o <strong>Motor de IA Local Integrado</strong>, gerando resumos executivos, e-mails em HTML e planos de ação sem nenhum custo e sem necessidade de conexão externa.
            </div>
          </div>
        </div>

        {/* Seção 2: Dados Padrão de Envio de E-mail */}
        <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-dark-border pb-3">
            <Mail className="w-4 h-4 text-bradesco-500" />
            <h2 className="text-sm font-bold text-white">
              Padrões para Envio de E-mail e Assinatura
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-muted mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-bradesco-400" />
                Nome Padrão do Instrutor
              </label>
              <input
                type="text"
                value={instructorDefaultName}
                onChange={(e) => setInstructorDefaultName(e.target.value)}
                placeholder="Ex: Thiago Silva"
                className="w-full text-xs p-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark-muted mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-bradesco-400" />
                Empresa / Área
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Bradesco - Treinamento & Capacitação"
                className="w-full text-xs p-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-dark-muted mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-bradesco-400" />
              Destinatários Padrão para Encaminhamento (separados por vírgula)
            </label>
            <input
              type="text"
              value={defaultRecipients}
              onChange={(e) => setDefaultRecipients(e.target.value)}
              placeholder="Ex: coordenacao@empresa.com, gestao@empresa.com"
              className="w-full text-xs p-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-dark-muted mb-1">
              Nota de Rodapé do E-mail
            </label>
            <textarea
              rows={2}
              value={emailFooterNote}
              onChange={(e) => setEmailFooterNote(e.target.value)}
              placeholder="Ex: Reporte diário gerado automaticamente com suporte de IA."
              className="w-full text-xs p-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
            />
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-bradesco-600 hover:bg-bradesco-700 text-white text-xs font-bold shadow-lg shadow-bradesco-600/30 transition-all disabled:opacity-50 w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
