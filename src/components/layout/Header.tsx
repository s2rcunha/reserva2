import React from 'react';
import { Filter, Plane } from 'lucide-react';

interface HeaderProps {
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ setIsMobileMenuOpen }) => {
  return (
    <header className="md:hidden flex items-center justify-between mb-4 bg-[#0F172A] p-3 rounded-2xl shadow-lg border border-white/5">
      <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all">
        <Filter size={18} />
      </button>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1.5">
           <Plane size={14} className="text-red-600" />
           <h2 className="text-xs font-black italic text-white leading-none uppercase tracking-tighter">SESCINC-CO</h2>
        </div>
      </div>
      <div className="w-10"></div> {/* Spacer for symmetry */}
    </header>
  );
};
