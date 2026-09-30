'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  History,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Bot,
  Layers,
  ShieldCheck,
  Gauge,
  ArrowRightLeft,
  Ticket
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.role === 'admin') setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

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
      label: 'Segmentos & Sistemas',
      href: '/segmentos',
      icon: Layers,
      desc: 'GEO, WDE e Segmentos'
    },
    {
      label: 'Gestão de Turmas',
      href: '/turmas',
      icon: Users,
      desc: 'Ativas e Concluídas'
    },
    {
      label: 'Simulador de SLA',
      href: '/simulador-sla',
      icon: Gauge,
      desc: 'Impacto antes de criar a turma'
    },
    {
      label: 'Migração de Operadores',
      href: '/migracoes',
      icon: ArrowRightLeft,
      desc: 'Matriz de SLA entre segmentos'
    },
    {
      label: 'Chamados',
      href: '/chamados',
      icon: Ticket,
      desc: 'Erros e solicitações de acesso'
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
    ...(isAdmin ? [{
      label: 'Usuários',
      href: '/usuarios',
      icon: ShieldCheck,
      desc: 'Criar contas e senhas'
    }] : []),
  ];

  return (
    <>
      {/* Backdrop para telas mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Barra Lateral / Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-dark-surface border-r border-dark-border text-dark-text transition-all duration-300 ease-in-out shadow-2xl lg:static ${
          // Mobile: slide-in drawer
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop: minimizado (w-20) vs expandido (w-64)
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-72`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-dark-border flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 overflow-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-bradesco-600 via-bradesco-700 to-rose-700 flex items-center justify-center shadow-lg shadow-bradesco-600/30 flex-shrink-0">
                <Bot className="w-6 h-6 text-white" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="truncate">
                  <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                    TreinaReport
                    <span className="text-[10px] bg-bradesco-600/20 text-bradesco-400 font-bold px-1.5 py-0.5 rounded border border-bradesco-500/30">
                      IA
                    </span>
                  </h1>
                  <p className="text-[11px] text-dark-muted truncate">Padrão Bradesco</p>
                </div>
              )}
            </Link>

            {/* Botão fechar no mobile */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-dark-card lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navegação */}
          <nav className="p-3 space-y-1.5">
            {(!isCollapsed || isMobileOpen) && (
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-muted">
                Menu de Acesso
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-bradesco-600 to-bradesco-700 text-white shadow-md shadow-bradesco-600/30 font-bold'
                      : 'text-dark-muted hover:bg-dark-card hover:text-white'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar & Botão de Minimizar */}
        <div className="p-3 border-t border-dark-border space-y-2">
          {(!isCollapsed || isMobileOpen) && (
            <div className="p-3 rounded-xl bg-dark-bg/80 border border-dark-border text-xs">
              <div className="flex items-center gap-1.5 text-bradesco-400 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-bradesco-500" />
                <span className="text-[11px]">Agente IA Treinamento</span>
              </div>
              <p className="text-dark-muted text-[10px] leading-snug">
                Geração executiva e análise pedagógica com suporte a Gemini gratuito.
              </p>
            </div>
          )}

          {/* Botão de Minimizar / Expandir no Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-dark-card hover:bg-dark-border text-dark-muted hover:text-white text-xs font-semibold border border-dark-border transition-all"
            title={isCollapsed ? 'Expandir Menu Lateral' : 'Minimizar Menu Lateral'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-bradesco-400" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-bradesco-400" />
                <span>Minimizar Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
