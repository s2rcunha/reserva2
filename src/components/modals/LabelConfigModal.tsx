import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LabelConfig, Material } from '../../types';

interface LabelConfigModalProps {
  showLabelConfig: boolean;
  setShowLabelConfig: (show: boolean) => void;
  labelConfig: LabelConfig;
  setLabelConfig: (config: LabelConfig) => void;
  materiais: Material[];
  inventoryState: { sector: string };
  generateLabelsPDF: (items: Material[], config: LabelConfig) => void;
}

export const LabelConfigModal: React.FC<LabelConfigModalProps> = ({
  showLabelConfig,
  setShowLabelConfig,
  labelConfig,
  setLabelConfig,
  materiais,
  inventoryState,
  generateLabelsPDF
}) => {
  return (
    <AnimatePresence>
      {showLabelConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLabelConfig(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-lg rounded-3xl md:rounded-[40px] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[95vh]"
          >
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">Configurações de Etiquetas</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ajuste o layout antes de gerar o PDF</p>
              </div>
              <button onClick={() => setShowLabelConfig(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="modal-label">Margem Superior (mm)</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.marginY} 
                  onChange={e => setLabelConfig({...labelConfig, marginY: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="modal-label">Margem Esquerda (mm)</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.marginX} 
                  onChange={e => setLabelConfig({...labelConfig, marginX: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="modal-label">Gap Horizontal (mm)</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.gapX} 
                  onChange={e => setLabelConfig({...labelConfig, gapX: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="modal-label">Gap Vertical (mm)</label>
                <input 
                  type="number" 
                  className="modal-input" 
                  value={labelConfig.gapY} 
                  onChange={e => setLabelConfig({...labelConfig, gapY: Number(e.target.value)})} 
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={() => setLabelConfig({
                  labelWidth: 60,
                  labelHeight: 25,
                  marginX: 15,
                  marginY: 25,
                  gapX: 10,
                  gapY: 5,
                  labelsPerRow: 2,
                  labelsPerCol: 8
                })}
                className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all"
              >
                Resetar Padrão
              </button>
              <button 
                onClick={() => {
                  const sectorItems = materiais.filter(m => m.setor === inventoryState.sector);
                  generateLabelsPDF(sectorItems, labelConfig);
                  setShowLabelConfig(false);
                }}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all"
              >
                Gerar PDF com Configurações
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
