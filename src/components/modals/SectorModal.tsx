import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Sector } from '../../types';

interface SectorModalProps {
  show: boolean;
  onClose: () => void;
  loading: boolean;
  saveSector: (e: React.FormEvent) => void;
  newSectorName: string;
  setNewSectorName: (name: string) => void;
  sectores: Sector[];
  deleteSector: (id: number) => void;
}

export const SectorModal: React.FC<SectorModalProps> = ({
  show,
  onClose,
  loading,
  saveSector,
  newSectorName,
  setNewSectorName,
  sectores,
  deleteSector
}) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Gestão de Setores</h3>
                 <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>
              
              <form onSubmit={saveSector} className="mb-8 flex gap-2">
                 <div className="flex-1">
                   <label htmlFor="new-sector-name" className="sr-only">Nome do Novo Setor</label>
                   <input 
                     id="new-sector-name"
                     name="new-sector-name"
                     className="modal-input w-full" 
                     value={newSectorName} 
                     onChange={e => setNewSectorName(e.target.value)} 
                     placeholder="Nome do Novo Setor"
                     required
                   />
                 </div>
                 <button disabled={loading} className="bg-red-600 text-white p-4 rounded-2xl hover:bg-red-700 transition-colors">
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
                 </button>
              </form>

              <div className="space-y-3">
                 {sectores.map(s => (
                   <div key={s.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl group hover:bg-red-50 transition-colors">
                      <span className="font-bold text-gray-700 group-hover:text-red-700">{s.nome}</span>
                      <button onClick={() => deleteSector(s.id)} className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                         <Trash2 size={16} />
                      </button>
                   </div>
                 ))}
                 {sectores.length === 0 && <p className="text-center text-gray-400 text-xs py-10">Nenhum setor cadastrado.</p>}
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
