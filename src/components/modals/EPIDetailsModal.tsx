import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, ShieldCheck, Tag } from 'lucide-react';
import { Material, Bombeiro } from '../../types';
import { cn } from '../../lib/utils';

interface EPIDetailsModalProps {
  showEpiDetailsModal: boolean;
  setShowEpiDetailsModal: (show: boolean) => void;
  selectedEpi: Material | null;
  bombeiros: Bombeiro[];
}

export const EPIDetailsModal: React.FC<EPIDetailsModalProps> = ({
  showEpiDetailsModal, setShowEpiDetailsModal, selectedEpi, bombeiros
}) => {
  const holder = selectedEpi?.bombeiro_id ? bombeiros.find(b => b.id === selectedEpi.bombeiro_id) : null;

  return (
    <AnimatePresence>
      {showEpiDetailsModal && selectedEpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEpiDetailsModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl overflow-hidden text-[11px] italic">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black uppercase tracking-tighter italic">Detalhes do EPI</h3>
                 <button onClick={() => setShowEpiDetailsModal(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                       <Tag className="text-red-600" size={14} />
                       <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Identificação</span>
                    </div>
                    <p className="text-lg font-black text-gray-900 uppercase">{selectedEpi.descricao}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-gray-900 text-white rounded text-[8px] font-black uppercase">BMP {selectedEpi.bmp}</span>
                      {selectedEpi.epi_numero && <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[8px] font-black uppercase">Nº {selectedEpi.epi_numero}</span>}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                         <Calendar className="text-blue-600" size={12} />
                         <span className="text-[8px] font-black uppercase text-blue-400">Validade</span>
                      </div>
                      <p className="font-black text-blue-900">{selectedEpi.validade_epi ? new Date(selectedEpi.validade_epi).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                      <div className="flex items-center gap-2 mb-1">
                         <ShieldCheck className="text-orange-600" size={12} />
                         <span className="text-[8px] font-black uppercase text-orange-400">Estado</span>
                      </div>
                      <p className="font-black text-orange-900 uppercase">{selectedEpi.situacao}</p>
                    </div>
                 </div>

                 <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100">
                    <div className="flex items-center gap-2 mb-3">
                       <User className="text-indigo-600" size={14} />
                       <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Cautelado para</span>
                    </div>
                    {holder ? (
                       <div>
                         <p className="text-sm font-black text-indigo-900 uppercase">{holder.nome_guerra}</p>
                         <p className="text-[9px] font-bold text-indigo-400 uppercase mt-1 italic">{holder.ala} - {holder.setor}</p>
                       </div>
                    ) : (
                       <p className="text-xs font-black text-indigo-300 uppercase italic">Em carga (Reserva)</p>
                    )}
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
