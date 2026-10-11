'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 animate-fade-slide-in">
      <Loader2 className="w-7 h-7 text-bradesco-500 animate-spin-slow" />
      <p className="text-xs text-dark-muted font-medium animate-pulse-glow">{label}</p>
    </div>
  );
}
