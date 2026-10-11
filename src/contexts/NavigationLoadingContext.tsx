'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationLoadingContextValue {
  isNavigating: boolean;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextValue>({ isNavigating: false });

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext);
}

/**
 * Detecta cliques em qualquer link interno do site (sidebar, "ver todos →",
 * cards do dashboard etc.) e mostra feedback de carregamento até a nova
 * página efetivamente trocar — sem precisar instrumentar cada botão/link
 * manualmente. Também funciona como uma proteção visual contra cliques
 * duplicados: o usuário vê que algo já está acontecendo.
 */
export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // A rota mudou de verdade — navegação concluída.
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setIsNavigating(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || !href.startsWith('/')) return; // só rotas internas
      if (target.target === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return; // abrir em nova aba etc.
      if (href === pathname) return; // já está nessa página

      setIsNavigating(true);
      // Proteção: se por algum motivo a navegação não completar (erro, link
      // quebrado), não deixa a barra travada pra sempre.
      setTimeout(() => setIsNavigating(false), 8000);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  return (
    <NavigationLoadingContext.Provider value={{ isNavigating }}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}
