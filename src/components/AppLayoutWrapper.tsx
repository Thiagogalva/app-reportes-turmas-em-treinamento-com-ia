'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import { Menu, Bot, Calendar, LogOut } from 'lucide-react';

const subscribeNoop = () => () => {};

const formatToday = () =>
  new Date().toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const todayFormatted = useSyncExternalStore(
    subscribeNoop,
    formatToday,
    () => null,
  );

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-bg text-dark-text antialiased">
      {/* Sidebar Lateral */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Barra Móvel & Desktop */}
        <header className="sticky top-0 z-30 bg-dark-surface/95 backdrop-blur-md border-b border-dark-border px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Botão Hambúrguer no Mobile */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-xl bg-dark-card border border-dark-border text-dark-muted hover:text-white hover:border-bradesco-600/50 lg:hidden transition-colors"
              aria-label="Abrir Menu"
            >
              <Menu className="w-5 h-5 text-bradesco-500" />
            </button>

            {/* Identificação visível no mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-bradesco-600 to-rose-700 flex items-center justify-center shadow-md">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-sm text-white tracking-tight">
                TreinaReport <span className="text-bradesco-500">AI</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-dark-muted font-medium bg-dark-card px-3 py-1.5 rounded-xl border border-dark-border">
              <Calendar className="w-3.5 h-3.5 text-bradesco-500" />
              <span className="capitalize min-w-[6.5rem]">{todayFormatted ?? '\u00A0'}</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Sistema Online" />
            <PushNotificationToggle />
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-dark-card border border-dark-border text-dark-muted hover:text-white hover:border-red-600/50 transition-colors"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Área de Visualização com Padding Responsivo */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
