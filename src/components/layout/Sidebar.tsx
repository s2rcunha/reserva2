import React from 'react';
import { 
  Flame, ArrowRightLeft, Shield, Boxes, CheckSquare, 
  Database, UserCheck, Settings, Users, FileText, 
  ShieldAlert, LogOut, Instagram, ChevronUp, ChevronDown, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { User, Loan } from '../../types';
import { isOverdue } from '../../utils';

interface SidebarProps {
  view: string;
  setView: (view: any) => void;
  currentUser: User | null;
  logout: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  loans: Loan[];
  agentesWarningsBadgeCount: number;
  eprWarningsBadgeCount: number;
  epiWarningsBadgeCount: number;
  onlineUsers: any[];
  generateAnalyticReport: () => void;
  isAgentesMenuOpen: boolean;
  setIsAgentesMenuOpen: (open: boolean) => void;
  setAgentesSubView: (view: 'LGE' | 'PQS') => void;
  agentesSubView: 'LGE' | 'PQS';
  isEpiMenuOpen: boolean;
  setIsEpiMenuOpen: (open: boolean) => void;
  showAdminMenu: boolean;
  setShowAdminMenu: (show: boolean) => void;
  showSettingsMenu: boolean;
  setShowSettingsMenu: (show: boolean) => void;
  setShowSectorModal: (show: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  view, setView, currentUser, logout, isMobileMenuOpen, setIsMobileMenuOpen,
  loans, agentesWarningsBadgeCount, eprWarningsBadgeCount, epiWarningsBadgeCount,
  onlineUsers, generateAnalyticReport, isAgentesMenuOpen, setIsAgentesMenuOpen,
  setAgentesSubView, agentesSubView, isEpiMenuOpen, setIsEpiMenuOpen,
  showAdminMenu, setShowAdminMenu, showSettingsMenu, setShowSettingsMenu,
  setShowSectorModal
}) => {
  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] p-6 flex flex-col transition-transform duration-300 transform md:relative md:translate-x-0 overflow-y-auto",
      isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex items-center gap-3 mb-10 px-2 justify-between md:justify-start">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 flex items-center justify-center">
             <img 
               src="logo-unidade.png" 
               alt="" 
               className="w-full h-full object-contain" 
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.parentElement!.innerHTML = '<div class="bg-red-600 p-1.5 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg></div>';
               }}
             />
           </div>
           <div>
             <h1 className="font-bold text-lg leading-tight uppercase tracking-tighter text-white">SESCINC-CO</h1>
             <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">RESERVA DE MATERIAL</p>
           </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        <button onClick={() => { setView('DASHBOARD'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5", view === 'DASHBOARD' && "active bg-white/10 text-white")}>
           <Flame size={18} /> Painel Operacional
        </button>
        <button onClick={() => { setView('LOANS'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5 relative group", view === 'LOANS' && "active bg-white/10 text-white")}>
           <ArrowRightLeft size={18} /> Movimentações
           {(() => {
              const overdueCount = loans.filter(l => l.status === 'EMPRESTADO' && l.previsao && isOverdue(l.previsao)).length;
              if (overdueCount > 0) {
                return (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg animate-pulse">
                    {overdueCount}
                  </span>
                );
              }
              return null;
           })()}
        </button>
        <div className="flex flex-col">
          <button onClick={() => setIsAgentesMenuOpen(!isAgentesMenuOpen)} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5 flex justify-between items-center w-full relative", view === 'AGENTES' && "text-white")}>
             <div className="flex items-center gap-2">
               <Flame size={18} /> Agentes Extintores
             </div>
             <div className="flex items-center gap-2">
               {agentesWarningsBadgeCount > 0 && (
                 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                   {agentesWarningsBadgeCount}
                 </span>
               )}
               {isAgentesMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </div>
          </button>
          <AnimatePresence>
            {isAgentesMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-col pl-6 overflow-hidden"
              >
                <button onClick={() => { setView('AGENTES'); setAgentesSubView('LGE'); setIsMobileMenuOpen(false); }} className={cn("nav-btn flex items-center justify-between text-slate-400 hover:text-white hover:bg-white/5 py-2 relative", view === 'AGENTES' && agentesSubView === 'LGE' && "active bg-white/10 text-white")}>
                   LGE
                </button>
                <button onClick={() => { setView('AGENTES'); setAgentesSubView('PQS'); setIsMobileMenuOpen(false); }} className={cn("nav-btn flex items-center justify-between text-slate-400 hover:text-white hover:bg-white/5 py-2 relative", view === 'AGENTES' && agentesSubView === 'PQS' && "active bg-white/10 text-white")}>
                   PQS
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col">
          <button onClick={() => setIsEpiMenuOpen(!isEpiMenuOpen)} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5 flex justify-between items-center w-full relative", (view === 'EPI' || view === 'EPR') && "text-white")}>
             <div className="flex items-center gap-2">
               <Shield size={18} /> Gestão de EPIs/EPRs
             </div>
             <div className="flex items-center gap-2">
               {(eprWarningsBadgeCount + epiWarningsBadgeCount) > 0 && (
                 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                   {eprWarningsBadgeCount + epiWarningsBadgeCount}
                 </span>
               )}
               {isEpiMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </div>
          </button>
          <AnimatePresence>
            {isEpiMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-col pl-6 overflow-hidden"
              >
                <button onClick={() => { setView('EPI'); setIsMobileMenuOpen(false); }} className={cn("nav-btn flex items-center justify-between text-slate-400 hover:text-white hover:bg-white/5 py-2 relative", view === 'EPI' && "active bg-white/10 text-white")}>
                   Gestão de EPIs
                   {epiWarningsBadgeCount > 0 && (
                     <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                       {epiWarningsBadgeCount}
                     </span>
                   )}
                </button>
                <button onClick={() => { setView('EPR'); setIsMobileMenuOpen(false); }} className={cn("nav-btn flex items-center justify-between text-slate-400 hover:text-white hover:bg-white/5 py-2 relative", view === 'EPR' && "active bg-white/10 text-white")}>
                   Gestão de EPRs
                   {eprWarningsBadgeCount > 0 && (
                     <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                       {eprWarningsBadgeCount}
                     </span>
                   )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => { setView('STOCK'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5", view === 'STOCK' && "active bg-white/10 text-white")}>
           <Boxes size={18} /> Consumo e Duradouro
        </button>
        <button onClick={() => { setView('INVENTORY'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5", view === 'INVENTORY' && "active bg-white/10 text-white")}>
           <CheckSquare size={18} /> Inventariar
        </button>
        <button onClick={() => { setView('COMPARE'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5", view === 'COMPARE' && "active bg-white/10 text-white")}>
           <Database size={18} /> Comparador BMP
        </button>
        <button onClick={() => { setView('CLEARANCE'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-slate-400 hover:text-white hover:bg-white/5", view === 'CLEARANCE' && "active bg-white/10 text-white")}>
          <UserCheck size={18} /> Desimpedimento
        </button>
        {currentUser?.nivel === 'ADMIN' && (
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setShowAdminMenu(!showAdminMenu)} 
              className={cn("nav-btn justify-between text-slate-400 hover:text-white", showAdminMenu && "text-white bg-white/5")}
            >
              <div className="flex items-center gap-3">
                <Settings size={18} /> Administração
              </div>
              {showAdminMenu ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            <AnimatePresence>
              {showAdminMenu && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden flex flex-col gap-1 pl-4"
                >
                  <button onClick={() => { setView('ADMIN'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-xs py-3 text-slate-400 hover:text-white", view === 'ADMIN' && "active bg-white/10 text-white")}>
                    <Users size={16} /> Gestão de Pessoal
                  </button>
                  
                  <button onClick={generateAnalyticReport} className="nav-btn text-xs py-3 text-emerald-400 hover:text-white hover:bg-emerald-500/10">
                    <FileText size={16} /> Relatório Analítico
                  </button>
                  
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => setShowSettingsMenu(!showSettingsMenu)} 
                      className={cn("nav-btn text-xs py-3 justify-between text-slate-400 hover:text-white", showSettingsMenu && "text-white bg-white/5")}
                    >
                      <div className="flex items-center gap-2">
                        <Settings size={14} /> Configurações
                      </div>
                      {showSettingsMenu ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <AnimatePresence>
                      {showSettingsMenu && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden flex flex-col gap-1 pl-4"
                        >
                          <button onClick={() => { setShowSectorModal(true); setIsMobileMenuOpen(false); }} className="nav-btn text-[10px] py-2 text-slate-400 hover:text-white">
                            <Boxes size={14} /> Gerenciar Setores
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button onClick={() => { setView('AUDIT'); setIsMobileMenuOpen(false); }} className={cn("nav-btn text-xs py-3 text-slate-400 hover:text-white", view === 'AUDIT' && "active bg-white/10 text-white")}>
                    <ShieldAlert size={16} /> Log de Auditoria
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      <div className="mt-auto">
        {/* Usuários Online */}
        {onlineUsers.length > 1 && (
          <div className="p-4 bg-emerald-500/10 rounded-2xl mb-4 border border-emerald-500/20">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[9px] text-emerald-400 uppercase font-black">Militares Online ({onlineUsers.length})</p>
             </div>
             <div className="flex flex-wrap gap-1">
                {onlineUsers.map((u, i) => (
                  <div key={u.id || i} className="group relative">
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black border border-white/10 hover:border-emerald-500 cursor-help transition-all">
                      {typeof u.nome === 'string' ? u.nome.charAt(0) : '?'}
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-[10px] text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      {typeof u.nome === 'string' ? u.nome : (u.nome ? u.nome.nome || String(u.nome) : 'User')}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        <div className="p-4 bg-white/5 rounded-2xl mb-4">
           <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Militar Identificado</p>
           <p className="font-bold text-sm truncate">{currentUser?.nome}</p>
           <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-md mt-2 inline-block">
              {currentUser?.nivel}
           </span>
        </div>
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:text-white hover:bg-red-600/10 rounded-xl transition-all text-xs font-bold uppercase tracking-widest">
          <LogOut size={16} /> Encerrar Sessão
        </button>
        
        <div className="mt-8 pt-4 border-t border-white/5 text-center">
           <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Desenvolvido por SGT R.CUNHA</p>
           <a 
             href="https://instagram.com/rcunhalrc" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="text-[10px] text-pink-500 hover:text-pink-400 font-black transition-colors flex items-center justify-center gap-1.5"
           >
              <Instagram size={10} /> @rcunhalrc
           </a>
        </div>
      </div>
    </aside>
  );
};
