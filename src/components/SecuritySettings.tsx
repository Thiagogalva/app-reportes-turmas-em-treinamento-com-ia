'use client';

import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Users, CheckCircle2, AlertCircle } from 'lucide-react';

function StatusBanner({ status }: { status: { text: string; type: 'success' | 'error' } | null }) {
  if (!status) return null;
  return (
    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
      status.type === 'success'
        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
        : 'bg-bradesco-950/60 border-bradesco-800 text-bradesco-300'
    }`}>
      {status.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{status.text}</span>
    </div>
  );
}

export default function SecuritySettings() {
  // Trocar a própria senha de login
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Trocar a senha compartilhada do /viewer
  const [newViewerPassword, setNewViewerPassword] = useState('');
  const [savingViewer, setSavingViewer] = useState(false);
  const [viewerStatus, setViewerStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setPasswordStatus({ text: 'Senha alterada com sucesso!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordStatus({ text: json.error || 'Erro ao trocar senha.', type: 'error' });
      }
    } catch {
      setPasswordStatus({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setSavingPassword(false);
      setTimeout(() => setPasswordStatus(null), 4000);
    }
  };

  const handleChangeViewerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setViewerStatus(null);
    setSavingViewer(true);
    try {
      const res = await fetch('/api/auth/change-viewer-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newViewerPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setViewerStatus({ text: 'Senha do /viewer atualizada!', type: 'success' });
        setNewViewerPassword('');
      } else {
        setViewerStatus({ text: json.error || 'Erro ao trocar senha do viewer.', type: 'error' });
      }
    } catch {
      setViewerStatus({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setSavingViewer(false);
      setTimeout(() => setViewerStatus(null), 4000);
    }
  };

  return (
    <div className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-bradesco-500" />
        <h2 className="text-sm font-bold text-white">Segurança & Acesso</h2>
      </div>

      {/* Trocar minha senha */}
      <form onSubmit={handleChangePassword} className="space-y-3 pb-6 border-b border-dark-border">
        <div className="flex items-center gap-1.5 text-xs font-bold text-dark-muted">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Minha senha de acesso</span>
        </div>
        <StatusBanner status={passwordStatus} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Senha atual"
            required
            className="w-full text-xs p-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
          />
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Nova senha (mín. 6 caracteres)"
            required
            minLength={6}
            className="w-full text-xs p-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
          />
        </div>
        <button
          type="submit"
          disabled={savingPassword}
          className="px-4 py-2 rounded-xl bg-dark-bg hover:bg-dark-border text-white text-xs font-bold border border-dark-border transition-colors disabled:opacity-50"
        >
          {savingPassword ? 'Salvando...' : 'Trocar minha senha'}
        </button>
      </form>

      {/* Trocar senha do viewer */}
      <form onSubmit={handleChangeViewerPassword} className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-dark-muted">
          <Users className="w-3.5 h-3.5" />
          <span>Senha do painel /viewer (Visão Coordenadora)</span>
        </div>
        <p className="text-[11px] text-dark-muted -mt-1">
          Senha simples e compartilhada, para dar acesso somente-leitura a coordenadores sem criar um usuário para cada um.
        </p>
        <StatusBanner status={viewerStatus} />
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            value={newViewerPassword}
            onChange={e => setNewViewerPassword(e.target.value)}
            placeholder="Nova senha do viewer"
            required
            minLength={4}
            className="w-full sm:flex-1 text-xs p-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
          />
          <button
            type="submit"
            disabled={savingViewer}
            className="px-4 py-2 rounded-xl bg-dark-bg hover:bg-dark-border text-white text-xs font-bold border border-dark-border transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {savingViewer ? 'Salvando...' : 'Definir nova senha'}
          </button>
        </div>
      </form>
    </div>
  );
}
