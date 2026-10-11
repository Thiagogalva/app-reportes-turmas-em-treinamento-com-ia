'use client';

import React from 'react';
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext';

export default function RouteProgressBar() {
  const { isNavigating } = useNavigationLoading();

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-dark-bg/50 overflow-hidden pointer-events-none">
      <div className="route-progress-bar h-full w-1/3 bg-gradient-to-r from-bradesco-700 via-bradesco-500 to-bradesco-700 rounded-full shadow-[0_0_8px_rgba(204,9,47,0.6)]" />
    </div>
  );
}
