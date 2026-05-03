import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, RefreshCw } from 'lucide-react';
import { Material, Loan } from '../../types';
import { SITUACOES } from '../../constants';
import { cn } from '../../lib/utils';

interface ReturnLoanModalProps {
  showReturnModal: boolean;
  setShowReturnModal: (s: boolean) => void;
  returningLoanId: number | string | null;
  loans: Loan[];
  materiais: Material[];
  selectedReturnStatus: string;
  setSelectedReturnStatus: (s: string) => void;
  confirmReturnLoan: () => void;
  loading: boolean;
}

export const ReturnLoanModal: React.FC<ReturnLoanModalProps> = ({
  showReturnModal, setShowReturnModal, returningLoanId, loans, materiais,
  selectedReturnStatus, setSelectedReturnStatus, confirmReturnLoan, loading
}) => {
  return (
    <AnimatePresence>
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReturnModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Registrar Devolução</h3>
                 <button onClick={() => setShowReturnModal(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>
              
              <div className="space-y-6">
                 <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
                    <p className="text-xs text-amber-900 font-bold leading-relaxed mb-4">
                      Ao devolver os itens, selecione em qual situação eles retornarão ao estoque. 
                      Isso atualizará automaticamente o status de todos os materiais vinculados a este empréstimo.
                    </p>
                    
                    {returningLoanId && typeof returningLoanId !== 'object' && (
                      <div className="space-y-2 border-t border-amber-200/50 pt-4">
                         <p className="text-[10px] font-black uppercase text-amber-800 mb-2">Itens para conferência:</p>
                         {(() => {
                            const loanIdStr = String(returningLoanId);
                            const loan = loans.find(l => String(l.id) === loanIdStr);
                            if (!loan) return null;
                            try {
                               const items = JSON.parse(loan.materiais_json || '[]');
                               return items.map((item: any, idx: number) => {
                                  const mid = typeof item === 'object' ? item.id : item;
                                  const qty = typeof item === 'object' ? item.qty : 1;
                                  const mat = materiais.find(m => String(m.id) === String(mid));
                                  return (
                                    <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-amber-900 bg-white/50 px-3 py-2 rounded-xl">
                                       <span className="truncate pr-2">{mat?.descricao || 'Material '+mid}</span>
                                       <span className="bg-amber-200 px-2 py-0.5 rounded-lg text-[9px] whitespace-nowrap">Qtd: {qty}</span>
                                    </div>
                                  );
                               });
                            } catch(e) { return <p className="text-[10px] italic">Erro ao ler itens</p>; }
                         })()}
                      </div>
                    )}
                 </div>

                 <div className="space-y-4">
                    <label className="modal-label">Situação de Retorno</label>
                    <div className="flex flex-col gap-2">
                      {SITUACOES.filter(s => s !== 'EMPRESTADO').map(sit => (
                        <button 
                          key={sit}
                          type="button"
                          onClick={() => setSelectedReturnStatus(sit)}
                          className={cn(
                            "w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between",
                            selectedReturnStatus === sit 
                              ? "bg-red-600 border-red-700 text-white shadow-lg shadow-red-200" 
                              : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                          )}
                        >
                          {sit}
                          {selectedReturnStatus === sit && <CheckCircle size={16} />}
                        </button>
                      ))}
                    </div>
                 </div>

                 <button 
                  onClick={confirmReturnLoan}
                  disabled={loading} 
                  className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-600 flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <><CheckCircle size={20} /> Confirmar Entrega</>}
                 </button>
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
