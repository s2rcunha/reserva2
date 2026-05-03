import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import { Material } from '../../types';
import { cn } from '../../lib/utils';

interface EprRecargaModalProps {
  show: boolean;
  onClose: () => void;
  loading: boolean;
  eprToRecarga: Partial<Material> | null;
  eprRecargaDate: string;
  setEprRecargaDate: (d: string) => void;
  eprProximaRecargaDate: string;
  setEprProximaRecargaDate: (d: string) => void;
  eprAvisoRecarga: string;
  setEprAvisoRecarga: (a: string) => void;
  handleEprRecarga: (e: React.FormEvent) => void;
}

export const EprRecargaModal: React.FC<EprRecargaModalProps> = ({
  show,
  onClose,
  loading,
  eprToRecarga,
  eprRecargaDate,
  setEprRecargaDate,
  eprProximaRecargaDate,
  setEprProximaRecargaDate,
  eprAvisoRecarga,
  setEprAvisoRecarga,
  handleEprRecarga
}) => {
  if (!eprToRecarga) return null;

  const count = parseInt(eprToRecarga.epr_recargas_count as any, 10) || 0;
  const lim = parseInt(eprToRecarga.epr_recargas_limite as any, 10) || 0;
  const exceeded = lim > 0 && count >= lim;
  const remaining = lim > 0 ? lim - count : null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 hidden md:flex">
              <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Recarga EPR <span className="text-indigo-600 font-mono">#{eprToRecarga.bmp || eprToRecarga.epi_numero}</span></h3>
              <button onClick={onClose} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-6 md:hidden">
                 <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Recarga EPR <span className="text-indigo-600 font-mono">#{eprToRecarga.bmp || eprToRecarga.epi_numero}</span></h3>
                 <button onClick={onClose} className="text-gray-400 hover:text-red-600 p-2"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleEprRecarga} className="flex flex-col gap-6">
                
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
                  {exceeded && <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />}
                  {!exceeded && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />}
                  <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Status de Recargas</h4>
                  <div className={cn("text-xs font-bold leading-relaxed", exceeded ? "text-red-600" : "text-slate-600")}>
                    {exceeded ? 'Este EPR já atingiu o limite.' : (
                      <>Esse EPR foi recarregado <strong>{count}</strong> vezes{lim > 0 && remaining !== null ? ` e restam ainda ${remaining} recargas a serem feitas definidas pelo administrador` : ''}.</>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="modal-label">Data da Recarga</label>
                  <input type="date" required disabled={exceeded || loading} className="modal-input" value={eprRecargaDate} onChange={e => setEprRecargaDate(e.target.value)} />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="modal-label">Próxima Recarga</label>
                  <input type="date" disabled={exceeded || loading} className="modal-input" value={eprProximaRecargaDate} onChange={e => setEprProximaRecargaDate(e.target.value)} />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="modal-label">Aviso de Recarga (Antes)</label>
                  <select className="modal-input" disabled={exceeded || loading} value={eprAvisoRecarga} onChange={e => setEprAvisoRecarga(e.target.value)}>
                    <option value="">Sem aviso</option>
                    <option value="15">15 dias</option>
                    <option value="30">1 mês</option>
                    <option value="60">2 meses</option>
                    <option value="90">3 meses</option>
                    <option value="180">6 meses</option>
                    <option value="365">1 ano</option>
                  </select>
                </div>
                
                {!exceeded && (
                  <button type="submit" disabled={loading || !eprRecargaDate} className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-indigo-600/30">
                    {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Registrar Recarga'}
                  </button>
                )}
                
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
