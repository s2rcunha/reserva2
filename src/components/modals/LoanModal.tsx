import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { Material } from '../../types';

interface LoanModalProps {
  showLoanModal: boolean;
  setShowLoanModal: (show: boolean) => void;
  loading: boolean;
  materiais: Material[];
  selectedForLoan: number[];
  loanQuantities: Record<number, number>;
  setLoanQuantities: (q: Record<number, number>) => void;
  newLoan: {
    solicitante: string;
    telefone: string;
    ramal: string;
    setor: string;
    previsao: string;
  };
  setNewLoan: (l: any) => void;
  createLoan: (e: React.FormEvent) => void;
}

export const LoanModal: React.FC<LoanModalProps> = ({
  showLoanModal, setShowLoanModal, loading, materiais,
  selectedForLoan, loanQuantities, setLoanQuantities,
  newLoan, setNewLoan, createLoan
}) => {
  return (
    <AnimatePresence>
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLoanModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Novo Empréstimo</h3>
                 <button onClick={() => setShowLoanModal(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>
              
              <form onSubmit={createLoan} className="space-y-6">
                 <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Itens Selecionados ({selectedForLoan.length})</p>
                    <div className="max-h-48 overflow-y-auto space-y-2 mb-4 bg-gray-50 p-4 rounded-2xl">
                       {materiais.filter(m => selectedForLoan.includes(m.id)).map(m => {
                          const isConsumo = m.categoria === 'CONSUMO';
                          const currentQty = loanQuantities[m.id] || 1;
                          return (
                            <div key={m.id} className="text-xs font-bold text-gray-600 flex flex-col gap-1 border-b border-gray-100 pb-2 last:border-0 last:pb-0 mb-2">
                               <div className="flex justify-between items-center">
                                  <span className="flex-1 pr-2 truncate">#{m.bmp || 'S/N'} - {m.descricao}</span>
                                  {isConsumo ? (
                                    <div className="flex items-center gap-2">
                                       <span className="text-[9px] uppercase text-gray-400">Qtd:</span>
                                       <input 
                                         type="number" 
                                         min="1" 
                                         max={Number(m.quantidade) || 1} 
                                         className="w-12 h-7 bg-white border border-gray-200 rounded text-center text-[10px] font-black"
                                         value={currentQty}
                                         onChange={e => {
                                           const val = Math.max(1, Math.min(Number(m.quantidade) || 1, parseInt(e.target.value) || 1));
                                           setLoanQuantities({...loanQuantities, [m.id]: val});
                                         }}
                                       />
                                       <span className="text-[9px] text-gray-400">/ {m.quantidade}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-gray-400 italic">Unidade única</span>
                                  )}
                               </div>
                            </div>
                          );
                       })}
                       {selectedForLoan.length === 0 && <p className="text-[10px] text-red-500 font-bold italic">Nenhum item selecionado na tabela!</p>}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <label htmlFor="loan-solicitante" className="modal-label">Nome de quem está retirando</label>
                       <input id="loan-solicitante" name="loan-solicitante" required className="modal-input" value={newLoan.solicitante} onChange={e => setNewLoan({...newLoan, solicitante: e.target.value.toUpperCase()})} placeholder="Ex: Sgt Fulano / Militar tal" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label htmlFor="loan-telefone" className="modal-label">Telefone (xx)-xxxxxxxxx</label>
                         <input 
                           id="loan-telefone" 
                           name="loan-telefone" 
                           required 
                           className="modal-input" 
                           value={newLoan.telefone} 
                           onChange={e => {
                             const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                             let formatted = digits;
                             if (digits.length > 2) {
                               formatted = `(${digits.slice(0, 2)})${digits.slice(2)}`;
                             }
                             setNewLoan({...newLoan, telefone: formatted});
                           }} 
                           placeholder="(00)000000000" 
                         />
                      </div>
                      <div>
                         <label htmlFor="loan-ramal" className="modal-label">Ramal (4 dígitos)</label>
                         <input 
                           id="loan-ramal" 
                           name="loan-ramal" 
                           required 
                           className="modal-input" 
                           maxLength={4}
                           value={newLoan.ramal} 
                           onChange={e => setNewLoan({...newLoan, ramal: e.target.value.replace(/\D/g, '')})} 
                           placeholder="0000" 
                         />
                      </div>
                    </div>

                    <div>
                       <label htmlFor="loan-setor" className="modal-label">Setor do Solicitante</label>
                       <input id="loan-setor" name="loan-setor" required className="modal-input" value={newLoan.setor} onChange={e => setNewLoan({...newLoan, setor: e.target.value.toUpperCase()})} placeholder="Ex: Secretaria, Garagem, etc" />
                    </div>

                    <div>
                       <label htmlFor="loan-previsao" className="modal-label">Previsão de Devolução</label>
                       <input id="loan-previsao" name="loan-previsao" required type="date" className="modal-input" value={newLoan.previsao} onChange={e => setNewLoan({...newLoan, previsao: e.target.value})} />
                    </div>
                 </div>

                 <button disabled={loading || selectedForLoan.length === 0} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-700 flex items-center justify-center gap-3 disabled:opacity-50">
                    {loading ? <RefreshCw className="animate-spin" /> : <><ArrowRightLeft size={20} /> Finalizar e Gerar Recibo</>}
                 </button>
              </form>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
