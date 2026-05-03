import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, RefreshCw } from 'lucide-react';
import { SITUACOES } from '../../constants';

interface StatusModalProps {
  showStatusModal: boolean;
  setShowStatusModal: (show: boolean) => void;
  selectedItems: number[];
  batchStatus: string;
  setBatchStatus: (s: string) => void;
  updateBatchStatus: () => void;
  loading: boolean;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  showStatusModal, setShowStatusModal, selectedItems, batchStatus,
  setBatchStatus, updateBatchStatus, loading
}) => {
  return (
    <AnimatePresence>
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStatusModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl overflow-hidden text-[11px] italic">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black uppercase tracking-tighter">Alterar Situação ({selectedItems.length} Itens)</h3>
                 <button onClick={() => setShowStatusModal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="filter-label uppercase text-[9px] tracking-widest block mb-1">Nova Situação Operacional</label>
                    <select className="filter-input uppercase" value={batchStatus} onChange={e => setBatchStatus(e.target.value)}>
                       <option value="">Selecione...</option>
                       {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <button onClick={updateBatchStatus} disabled={!batchStatus || loading} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-red-600/20 disabled:opacity-50 transition-all">
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />} Aplicar Alteração
                 </button>
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
