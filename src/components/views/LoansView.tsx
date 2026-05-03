import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, AlertCircle, MessageCircle, CheckCircle } from 'lucide-react';
import { Loan, Material } from '../../types';
import { cn } from '../../lib/utils';
import { isOverdue } from '../../utils';

interface LoansViewProps {
  loans: Loan[];
  materiais: Material[];
  loanStatusFilter: 'ALL' | 'EMPRESTADO' | 'DEVOLVIDO';
  setLoanStatusFilter: (status: 'ALL' | 'EMPRESTADO' | 'DEVOLVIDO') => void;
  setShowLoanModal: (show: boolean) => void;
  handleReturnLoan: (id: number) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({
  loans, materiais, loanStatusFilter, setLoanStatusFilter,
  setShowLoanModal, handleReturnLoan
}) => {
  const overdueLoans = loans.filter(l => l.status === 'EMPRESTADO' && l.previsao && isOverdue(l.previsao));

  return (
    <motion.div key="loans" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Movimentações</h2>
            <div className="flex gap-2 mt-4 text-[10px]">
              {['ALL', 'EMPRESTADO', 'DEVOLVIDO'].map((status) => (
                <button
                  key={status}
                  onClick={() => setLoanStatusFilter(status as any)}
                  className={cn(
                    "px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all",
                    loanStatusFilter === status 
                      ? "bg-black text-white shadow-lg" 
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  )}
                >
                  {status === 'ALL' ? 'Todos' : status === 'EMPRESTADO' ? 'Emprestados' : 'Devolvidos'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowLoanModal(true)} className="flex items-center gap-2 px-6 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:bg-red-600 transition-all">
             <ArrowRightLeft size={20} /> Registrar Novo Empréstimo
          </button>
       </div>

       {overdueLoans.length > 0 && (
         <div className="mb-6 bg-red-50 rounded-3xl p-6 border border-red-100 shadow-sm transition-all text-[11px]">
           <div className="flex items-center gap-3 mb-4">
             <AlertCircle className="text-red-500 animate-pulse" size={24} />
             <h3 className="text-red-900 font-black text-lg uppercase tracking-tighter">Atenção! Materiais em Atraso</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
             {overdueLoans.map(ol => {
                const phone = ol.telefone || (ol as any).solicitante_telefone;
                const matsList = JSON.parse(ol.materiais_json || '[]').map((item: any) => {
                  const mid = typeof item === 'object' ? item.id : item;
                  const qty = typeof item === 'object' ? item.qty : 1;
                  const mat = materiais.find(m => String(m.id) === String(mid));
                  return `• ${mat?.descricao || mat?.bmp || mid}${qty > 1 ? ` (x${qty})` : ''}`;
                }).join('\n');
                
                const message = `Olá ${ol.solicitante}, verificamos que há materiais da Célula Contraincêndio (SESCINC-CO) pendentes de devolução (prazo: ${new Date(ol.previsao).toLocaleDateString()}):\n\n${matsList}\n\nPor favor, regularize a situação o quanto antes.`;

                return (
                <div key={ol.id} className="flex flex-col justify-between bg-white border border-red-100 p-4 rounded-2xl shadow-sm">
                  <div className="mb-3">
                    <p className="text-xs font-black text-red-950 uppercase line-clamp-1 truncate">{ol.solicitante}</p>
                    <p className="text-[10px] text-red-600 font-bold mt-1 uppercase italic">Venceu em: {new Date(ol.previsao).toLocaleDateString()}</p>
                  </div>
                  {phone && (
                    <a 
                      href={`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-xl text-[10px] font-black uppercase transition-colors"
                    >
                      <MessageCircle size={15} /> Notificar
                    </a>
                  )}
                </div>
                );
             })}
           </div>
         </div>
       )}
       
       <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden text-[11px]">
          <div className="overflow-x-auto">
             <table className="w-full">
                <thead className="bg-gray-50/50">
                   <tr className="text-left font-black text-[10px] text-gray-400 uppercase tracking-widest">
                      <th className="p-8">Retirada</th>
                      <th className="p-8">Solicitante</th>
                      <th className="p-8">Materiais</th>
                      <th className="p-8">Status</th>
                      <th className="p-8">Devolução</th>
                      <th className="p-8 text-right">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 uppercase italic">
                   {[...loans]
                     .filter(l => loanStatusFilter === 'ALL' ? true : l.status === loanStatusFilter)
                     .reverse()
                     .map(loan => {
                       const overdue = loan.status === 'EMPRESTADO' && loan.previsao && isOverdue(loan.previsao);
                       return (
                      <tr key={loan.id} className={cn("transition-colors", overdue ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-gray-50/50")}>
                         <td className="p-8">
                            <div className="flex flex-col">
                               <span className="text-xs font-black text-gray-900">{new Date(loan.retirada).toLocaleDateString()}</span>
                               <span className="text-[9px] text-gray-400 lowercase">{new Date(loan.retirada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                         </td>
                         <td className="p-8 font-black text-gray-700">{loan.solicitante}</td>
                         <td className="p-8">
                            <div className="flex flex-wrap gap-1 max-w-[250px]">
                               {JSON.parse(loan.materiais_json || '[]').map((item: any, idx: number) => {
                                  const mid = typeof item === 'object' ? item.id : item;
                                  const qty = typeof item === 'object' ? item.qty : 1;
                                  const mat = materiais.find(m => String(m.id) === String(mid));
                                  return (
                                    <span key={`${mid}-${idx}`} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase" title={mat?.descricao}>
                                      {mat?.descricao || mat?.bmp || mid} {qty > 1 ? `(x${qty})` : ''}
                                    </span>
                                  );
                               })}
                            </div>
                         </td>
                         <td className="p-8">
                            <span className={cn(
                               "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                               loan.status === 'DEVOLVIDO' ? "bg-green-50 text-green-700 ring-1 ring-green-100" : (overdue ? "bg-red-500 text-white shadow-md" : "bg-red-50 text-red-700 ring-1 ring-red-100")
                            )}>
                               {overdue ? 'ATRASADO' : loan.status}
                            </span>
                         </td>
                         <td className="p-8">
                            {loan.status === 'DEVOLVIDO' ? (
                              <div className="flex flex-col">
                                <span className="font-black text-gray-900 lowercase">{loan.data_devolucao ? new Date(loan.data_devolucao).toLocaleDateString() : '-'}</span>
                                <span className="text-[9px] text-gray-400 lowercase">{loan.data_devolucao ? new Date(loan.data_devolucao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                              </div>
                            ) : (
                               <div className={overdue ? "text-red-600" : "opacity-40"}>
                                 <span className="text-[10px] font-bold uppercase">{loan.previsao ? new Date(loan.previsao).toLocaleDateString() : 'Sem prazo'}</span>
                               </div>
                            )}
                         </td>
                         <td className="p-8 text-right">
                            {loan.status !== 'DEVOLVIDO' && (
                               <div className="flex gap-2 justify-end items-center">
                                  <button onClick={() => handleReturnLoan(loan.id)} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm">
                                     <CheckCircle size={18} />
                                  </button>
                               </div>
                            )}
                         </td>
                      </tr>
                       );
                     })}
                </tbody>
             </table>
          </div>
       </div>
    </motion.div>
  );
};
