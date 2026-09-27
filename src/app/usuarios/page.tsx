'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users as UsersIcon,
  ShieldCheck,
  UserPlus,
  Trash2,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { AuthUser } from '@/types';

type SafeUser = Omit<AuthUser, 'passwordHash'>;

function StatusBanner({ status }: { status: { text: string; type: 'success' | 'error' } | null }) {
  if (!status) return null;
  return (
    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
      status.type === 'success'
        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
        : 'bg-bradesco-950/60 border-bradesco-800 text-bradesco-300'
    }`}>
      {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span>{status.text}</span>
    </div>
  );
}

export default function UsuariosPage() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Formulário de novo usuário
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'instrutor'>('instrutor');
  const [creating, setCreating] = useState(false);

  // Reset de senha por usuário (chave = userId)
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [resettingId, setResettingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users');
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (json.success && json.data?.role === 'admin') {
          setHasAccess(true);
          setCurrentUserId(json.data.sub || null);
          await loadUsers();
        }
      } finally {
        setCheckingAccess(false);
      }
    })();
  }, [loadUsers]);

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatus({ text, type });
    setTimeout(() => setStatus(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, name: newName, password: newPassword, role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        showStatus(`Usuário "${json.data.username}" criado com sucesso!`, 'success');
        setNewUsername('');
        setNewName('');
        setNewPassword('');
        setNewRole('instrutor');
        await loadUsers();
      } else {
        showStatus(json.error || 'Erro ao criar usuário.', 'error');
      }
    } catch {
      showStatus('Erro de conexão.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (user: SafeUser) => {
    if (!confirm(`Remover o usuário "${user.username}"? Essa ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/auth/users/${user.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showStatus('Usuário removido.', 'success');
        await loadUsers();
      } else {
        showStatus(json.error || 'Erro ao remover usuário.', 'error');
      }
    } catch {
      showStatus('Erro de conexão.', 'error');
    }
  };

  const handleResetPassword = async (user: SafeUser) => {
    const newPass = resetPasswords[user.id];
    if (!newPass || newPass.length < 6) {
      showStatus('Digite uma nova senha com ao menos 6 caracteres.', 'error');
      return;
    }
    setResettingId(user.id);
    try {
      const res = await fetch(`/api/auth/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPass }),
      });
      const json = await res.json();
      if (json.success) {
        showStatus(`Senha de "${user.username}" atualizada.`, 'success');
        setResetPasswords(prev => ({ ...prev, [user.id]: '' }));
      } else {
        showStatus(json.error || 'Erro ao trocar senha.', 'error');
      }
    } catch {
      showStatus('Erro de conexão.', 'error');
    } finally {
      setResettingId(null);
    }
  };

  const handleRoleChange = async (user: SafeUser, role: 'admin' | 'instrutor') => {
    try {
      const res = await fetch(`/api/auth/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (json.success) {
        showStatus(`Perfil de "${user.username}" atualizado.`, 'success');
        await loadUsers();
      } else {
        showStatus(json.error || 'Erro ao trocar perfil.', 'error');
      }
    } catch {
      showStatus('Erro de conexão.', 'error');
    }
  };

  if (checkingAccess) {
    return <div className="p-6 text-dark-muted text-sm">Carregando...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="p-6 sm:p-8 max-w-lg mx-auto text-center mt-10">
        <div className="w-14 h-14 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-dark-muted" />
        </div>
        <h1 className="text-lg font-bold text-white mb-1">Acesso restrito</h1>
        <p className="text-sm text-dark-muted">
          Essa área é exclusiva para usuários com perfil Administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <UsersIcon className="w-5 h-5 text-bradesco-500" />
        <h1 className="text-lg font-bold text-white">Usuários do Sistema</h1>
      </div>

      <StatusBanner status={status} />

      {/* Formulário de novo usuário */}
      <form onSubmit={handleCreate} className="bg-dark-surface rounded-2xl p-4 sm:p-6 border border-dark-border shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-dark-muted mb-1">
          <UserPlus className="w-3.5 h-3.5" />
          <span>Criar novo usuário</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            placeholder="Nome de usuário (login)"
            required
            className="w-full text-xs p-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
          />
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nome completo"
            required
            className="w-full text-xs p-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
          />
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Senha (mín. 6 caracteres)"
            required
            minLength={6}
            className="w-full text-xs p-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as 'admin' | 'instrutor')}
            className="w-full text-xs p-2.5 rounded-xl border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
          >
            <option value="instrutor">Instrutor (uso normal do sistema)</option>
            <option value="admin">Administrador (acesso total + gestão de usuários)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 rounded-xl bg-bradesco-600 hover:bg-bradesco-700 text-white text-xs font-bold shadow-md shadow-bradesco-600/30 transition-colors disabled:opacity-50"
        >
          {creating ? 'Criando...' : 'Criar usuário'}
        </button>
      </form>

      {/* Lista de usuários */}
      <div className="bg-dark-surface rounded-2xl border border-dark-border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 pb-2 flex items-center gap-1.5 text-xs font-bold text-dark-muted">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Usuários cadastrados</span>
        </div>
        {loading ? (
          <div className="p-6 text-xs text-dark-muted">Carregando usuários...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-xs text-dark-muted">Nenhum usuário cadastrado ainda.</div>
        ) : (
          <div className="divide-y divide-dark-border">
            {users.map(user => (
              <div key={user.id} className="p-4 sm:p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {user.name}{' '}
                      {user.id === currentUserId && <span className="text-[10px] text-dark-muted font-normal">(você)</span>}
                    </p>
                    <p className="text-xs text-dark-muted">@{user.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user, e.target.value as 'admin' | 'instrutor')}
                      className="text-[11px] px-2 py-1.5 rounded-lg border border-dark-border bg-dark-input text-white"
                    >
                      <option value="instrutor">Instrutor</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-red-900/50 transition-colors"
                      title="Remover usuário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-dark-muted flex-shrink-0" />
                  <input
                    type="password"
                    value={resetPasswords[user.id] || ''}
                    onChange={e => setResetPasswords(prev => ({ ...prev, [user.id]: e.target.value }))}
                    placeholder="Nova senha para redefinir"
                    className="flex-1 text-xs p-2 rounded-lg border border-dark-border focus:ring-2 focus:ring-bradesco-500 focus:outline-none bg-dark-input text-white"
                  />
                  <button
                    onClick={() => handleResetPassword(user)}
                    disabled={resettingId === user.id}
                    className="px-3 py-2 rounded-lg bg-dark-bg hover:bg-dark-border text-white text-[11px] font-bold border border-dark-border transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    Redefinir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
