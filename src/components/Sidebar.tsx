'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  History,
  Settings,
  Bot,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      desc: 'Visão geral da turma ativa'
    },
    {
      label: 'Novo Reporte',
      href: '/relatorio',
      icon: FileSpreadsheet,
      desc: 'Lançar dados do dia'
    },
    {
      label: 'Gestão de Turmas',
      href: '/turmas',
      icon: Users,
      desc: 'Ativas e Concluídas'
    },
    {
      label: 'Histórico',
      href: '/historico',
      icon: History,
      desc: 'Todos os reportes'
    },
    {
      label: 'Configurações & IA',
      href: '/configuracoes',
      icon: Settings,
      desc: 'Chaves e Destinatários'
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col justify-between shadow-xl flex-shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                TreinaReport
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-1.5 py-0.5 rounded border border-blue-500/30">AI</span>
              </h1>
              <p className="text-xs text-slate-400">Gestão & Reporte Diário</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navegação Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <div className="flex flex-col">
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* AI Assistant Banner Footer */}
      <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Agente IA Integrado</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Gera resumos executivos, analisa desvios de desempenho e formata e-mails prontos para envio.
        </p>
      </div>
    </aside>
  );
}
