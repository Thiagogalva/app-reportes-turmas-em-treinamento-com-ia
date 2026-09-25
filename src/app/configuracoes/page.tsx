'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Preferências do Sistema
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Configurações & Agente de IA
          </h1>
          <p className="text-xs text-slate-500">
            Gerencie sua chave do Google Gemini e personalize as informações padrão de envio de e-mails.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Seção 1: Agente de IA - Gemini */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Agente de IA (Google Gemini 3.8 Flash)
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  Oficial @google/genai
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Utilizado para sintetizar os relatórios, gerar planos pedagógicos e redigir o e-mail formal
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  Chave de API do Gemini (GEMINI_API_KEY)
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                >
                  <span>Obter chave no Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full text-xs font-mono p-3 pr-10 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-blue-900 block mb-0.5">Modo de Contingência Ativo:</strong>
              Caso você ainda não possua ou não insira uma chave agora, o sistema continua funcionando perfeitamente utilizando o <strong>Agente de IA Determinístico Integrado</strong>, formatando o e-mail e calculando as taxas de presença e baixo rendimento de forma instantânea.
            </div>
          </div>
        </div>

        {/* Seção 2: Dados Padrão de Envio de E-mail */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Mail className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Padrões para Envio de E-mail e Assinatura
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Nome Padrão do Instrutor
              </label>
              <input
                type="text"
                value={instructorDefaultName}
                onChange={(e) => setInstructorDefaultName(e.target.value)}
                placeholder="Ex: Thiago Silva"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                Nome da Empresa / Organização
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Treinamento & Capacitação Corporativa"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Destinatários Padrão para Encaminhamento (separados por vírgula)
            </label>
            <input
              type="text"
              value={defaultRecipients}
              onChange={(e) => setDefaultRecipients(e.target.value)}
              placeholder="Ex: gestao.treinamento@empresa.com, coordenacao@empresa.com"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nota de Rodapé do E-mail
            </label>
            <textarea
              rows={2}
              value={emailFooterNote}
              onChange={(e) => setEmailFooterNote(e.target.value)}
              placeholder="Ex: Reporte gerado automaticamente pelo Sistema de Treinamento com suporte de IA."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
