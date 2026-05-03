import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Shield } from 'lucide-react';
import { Bombeiro, Material } from '../../types';
import { EPI_COMPONENTS } from '../../constants';
import { cn } from '../../lib/utils';

interface EPILoanModalProps {
  show: boolean;
  onClose: () => void;
  loading: boolean;
  editingBombeiro: Partial<Bombeiro> | null;
  epiLoanExtras: {
    categoria: 'EPI_PRETO' | 'EPI_AMARELO';
    telefone: string;
    ramal: string;
    setor: string;
  };
  setEpiLoanExtras: (extras: any) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const EPILoanModal: React.FC<EPILoanModalProps> = ({
  show,
  onClose,
  loading,
  editingBombeiro,
  epiLoanExtras,
  setEpiLoanExtras,
  onSubmit
}) => {
  return (
    <AnimatePresence>
      {show && editingBombeiro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Cautela de EPI</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{editingBombeiro.nome_guerra} • {editingBombeiro.saram}</p>
                 </div>
                 <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>
              
              <form onSubmit={onSubmit} className="space-y-6">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest pl-1">Cor Predominante (Afeta apenas seleção inicial)</p>
                    <div className="flex gap-4">
                       <button
                         type="button"
                         onClick={() => setEpiLoanExtras({...epiLoanExtras, categoria: 'EPI_PRETO'})}
                         className={cn(
                           "flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ring-1",
                           epiLoanExtras.categoria === 'EPI_PRETO' 
                             ? "bg-slate-900 text-white ring-slate-900 shadow-lg shadow-slate-900/20" 
                             : "bg-white text-slate-400 ring-slate-100 hover:bg-slate-50"
                         )}
                       >
                         EPI Preto
                       </button>
                       <button
                         type="button"
                         onClick={() => setEpiLoanExtras({...epiLoanExtras, categoria: 'EPI_AMARELO'})}
                         className={cn(
                           "flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ring-1",
                           epiLoanExtras.categoria === 'EPI_AMARELO' 
                             ? "bg-yellow-500 text-yellow-950 ring-yellow-500 shadow-lg shadow-yellow-500/30" 
                             : "bg-white text-slate-400 ring-slate-100 hover:bg-slate-50"
                         )}
                       >
                         EPI Amarelo
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {EPI_COMPONENTS.map(comp => (
                      <div key={comp} className="space-y-2 flex flex-col">
                         <label htmlFor={`epi-loan-${comp}`} className="modal-label">{comp}</label>
                         <div className="flex bg-gray-50 p-1 border border-gray-200 rounded-2xl w-full">
                            <select key={`cat_${comp}_${epiLoanExtras.categoria}`} name={`category_${comp}`} defaultValue={epiLoanExtras.categoria} className="bg-transparent text-xs font-bold px-2 outline-none border-r border-gray-200 text-gray-500 w-[110px]">
                              <option value="EPI_PRETO">PRETO</option>
                              <option value="EPI_AMARELO">AMARELO</option>
                            </select>
                            <input 
                             id={`epi-loan-${comp}`}
                             name={`number_${comp}`}
                             className="bg-transparent flex-1 px-3 py-3 text-sm outline-none w-full" 
                             placeholder="Nº (Ex: 001)" 
                            />
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="space-y-4 border-t border-gray-100 pt-6">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Dados de Contato do Solicitante</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="modal-label">Telefone (xx)-xxxxxxxxx</label>
                         <input 
                           required 
                           className="modal-input" 
                           value={epiLoanExtras.telefone} 
                           onChange={e => {
                             const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                             let formatted = digits;
                             if (digits.length > 2) {
                               formatted = `(${digits.slice(0, 2)})${digits.slice(2)}`;
                             }
                             setEpiLoanExtras({...epiLoanExtras, telefone: formatted});
                           }} 
                           placeholder="(00)000000000" 
                         />
                      </div>
                      <div>
                         <label className="modal-label">Ramal (4 dígitos)</label>
                         <input 
                           required 
                           className="modal-input" 
                           maxLength={4}
                           value={epiLoanExtras.ramal || ''} 
                           onChange={e => setEpiLoanExtras({...epiLoanExtras, ramal: e.target.value.replace(/\D/g, '')})} 
                           placeholder="0000" 
                         />
                      </div>
                    </div>
                    <div>
                       <label className="modal-label">Setor Atual do Militar</label>
                       <input required className="modal-input" value={epiLoanExtras.setor} onChange={e => setEpiLoanExtras({...epiLoanExtras, setor: e.target.value.toUpperCase()})} placeholder="Ex: Garagem, SCI, etc" />
                    </div>
                 </div>

                 <div className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-2">Instrução</p>
                    <p className="text-xs text-gray-600 leading-relaxed italic">Digite a numeração apenas das peças que estão sendo entregues ao militar agora.</p>
                 </div>

                 <button disabled={loading || (epiLoanExtras.ramal || '').length !== 4} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-700 mt-4 flex items-center justify-center gap-2">
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <><Shield size={20} /> Confirmar Cautela de EPI</>}
                 </button>
              </form>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
