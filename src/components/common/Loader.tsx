import React from 'react';
import { Plane } from 'lucide-react';

export const Loader = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin" />
        <Plane size={24} className="absolute inset-x-0 inset-y-0 m-auto text-red-600 animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Sincronizando Dados...</p>
    </div>
  </div>
);
