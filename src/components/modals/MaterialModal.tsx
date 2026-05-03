import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Save } from 'lucide-react';
import { Material, Sector } from '../../types';
import { cn } from '../../lib/utils';
import { CATEGORIES, SUB_CATEGORIES, SITUACOES } from '../../constants';

interface MaterialModalProps {
  showMaterialModal: boolean;
  setShowMaterialModal: (show: boolean) => void;
  editingMaterial: Partial<Material> | null;
  setEditingMaterial: (m: Partial<Material> | null) => void;
  saveMaterial: (e: React.FormEvent) => Promise<void>; // Alterado para Promise<void>
  sectores: Sector[];
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  showMaterialModal, setShowMaterialModal, editingMaterial, setEditingMaterial,
  saveMaterial, sectores
}) => {
  return (
    <AnimatePresence>
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMaterialModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-3xl rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black">{editingMaterial?.id ? 'Atualizar Ficha Técnica' : 'Novos Dados de Carga'}</h3>
                 <button onClick={() => setShowMaterialModal(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>
              <form onSubmit={saveMaterial} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="mat-bmp" className="modal-label">Número BMP {editingMaterial?.fora_de_carga === 'SIM' ? '(Opcional)' : '(Obrigatório)'}</label>
                        <input 
                          id="mat-bmp"
                          name="mat-bmp"
                          required={editingMaterial?.fora_de_carga !== 'SIM'} 
                          className="modal-input" 
                          value={editingMaterial?.bmp || ''} 
                          onChange={e => setEditingMaterial({...(editingMaterial || {}), bmp: e.target.value})} 
                          placeholder={editingMaterial?.fora_de_carga === 'SIM' ? "Opcional p/ fora de carga" : "Ex: 501234"} 
                        />
                      </div>
                      <div>
                        <label htmlFor="mat-doc" className="modal-label">Documento</label>
                        <input 
                          id="mat-doc"
                          name="mat-doc"
                          className="modal-input" 
                          value={editingMaterial?.documento || ''} 
                          onChange={e => setEditingMaterial({...(editingMaterial || {}), documento: e.target.value})} 
                          placeholder="SP, OBSERVAÇÕES..." 
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="mat-qty" className="modal-label">Quantidade</label>
                      <input 
                        id="mat-qty"
                        name="mat-qty"
                        type="number"
                        min="1"
                        disabled={!editingMaterial?.id && editingMaterial?.categoria === 'PERMANENTE'}
                        className={cn("modal-input", (!editingMaterial?.id && editingMaterial?.categoria === 'PERMANENTE') ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "")} 
                        value={(!editingMaterial?.id && editingMaterial?.categoria === 'PERMANENTE') ? 1 : (editingMaterial?.quantidade || 1)} 
                        onChange={e => setEditingMaterial({...(editingMaterial || {}), quantidade: parseInt(e.target.value) || 1})} 
                      />
                    </div>
                    <div className="pt-2">
                      <label htmlFor="mat-size" className="modal-label">Tamanho / Modelo</label>
                      <input id="mat-size" name="mat-size" className="modal-input" value={editingMaterial?.tamanho || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), tamanho: e.target.value})} placeholder="Ex: 41, G" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="mat-conta" className="modal-label">Conta (Sem Letras)</label>
                        <input 
                          id="mat-conta" 
                          name="mat-conta" 
                          className="modal-input" 
                          value={editingMaterial?.conta || ''} 
                          onChange={e => {
                            const val = e.target.value.replace(/[a-zA-ZÀ-ÿ]/g, '');
                            setEditingMaterial({...(editingMaterial || {}), conta: val});
                          }} 
                          placeholder="Apenas nº e símbolos" 
                        />
                      </div>
                      <div>
                        <label htmlFor="mat-classe" className="modal-label">Classe (4 Números)</label>
                        <input 
                          id="mat-classe" 
                          name="mat-classe" 
                          className="modal-input" 
                          maxLength={4}
                          value={editingMaterial?.classe || ''} 
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setEditingMaterial({...(editingMaterial || {}), classe: val});
                          }} 
                          placeholder="Ex: 1234" 
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="mat-desc" className="modal-label">Descrição Detalhada</label>
                      <textarea id="mat-desc" name="mat-desc" required rows={4} className="modal-input resize-none" value={editingMaterial?.descricao || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), descricao: e.target.value})} placeholder="Ex: MANGUEIRA DE INCÊNDIO..." />
                      {(editingMaterial?.descricao && /\b(epr|respiraç([ãa]o)|respiracao|cilindro|aut[ôo]nom[ao]|capacete|balaclava|luva|cal[çc]a|casaco|blus[ãa]o|jaqueta|bota)\b/i.test(editingMaterial.descricao) && editingMaterial?.categoria !== 'EPI_PRETO' && editingMaterial?.categoria !== 'EPI_AMARELO' && editingMaterial?.classificacao !== 'EPR') && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-start gap-2">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <span>Atenção: EPI ou EPR devem ser cadastrados no menu "Gestão de EPIs/EPRs".</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="mat-obs" className="modal-label">Observações Internas (Não obrigatório)</label>
                      <textarea 
                        id="mat-obs"
                        name="mat-obs"
                        rows={3} 
                        className="modal-input resize-none border-gray-100 bg-gray-50/50" 
                        value={editingMaterial?.observacoes || ''} 
                        onChange={e => setEditingMaterial({...(editingMaterial || {}), observacoes: e.target.value})} 
                        placeholder="Ex: Item em processo de descarga, aguardando parecer técnico..." 
                      />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div>
                      <label htmlFor="mat-sector" className="modal-label">Setor / Localização Exata</label>
                      <select id="mat-sector" name="mat-sector" required className="modal-input" value={editingMaterial?.setor || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), setor: e.target.value})}>
                         <option value="">Selecione o Setor...</option>
                         {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="mat-status" className="modal-label">Situação Operacional</label>
                      <select id="mat-status" name="mat-status" required className="modal-input" value={editingMaterial?.situacao || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), situacao: e.target.value})}>
                         <option value="">Selecione Situação...</option>
                         {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="mat-cat" className="modal-label">Tipo de Material</label>
                      <select id="mat-cat" name="mat-cat" required className="modal-input" value={editingMaterial?.categoria || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), categoria: e.target.value})}>
                         <option value="">Selecione Categoria...</option>
                         {CATEGORIES.filter(c => c.id !== 'EPI_PRETO' && c.id !== 'EPI_AMARELO').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    
                    {editingMaterial?.categoria === 'EXTINTORES' && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-300 space-y-4">
                        <div>
                          <label htmlFor="mat-ext-type" className="modal-label">Tipo de Extintor</label>
                          <select 
                            id="mat-ext-type"
                            name="mat-ext-type"
                            className="modal-input" 
                            value={editingMaterial?.extintor_tipo || ''} 
                            onChange={e => setEditingMaterial({...(editingMaterial || {}), extintor_tipo: e.target.value})}
                          >
                            <option value="">Selecione o Agente...</option>
                            <option value="ÁGUA (H2O)">ÁGUA (H2O)</option>
                            <option value="CLASSE D">CLASSE D (METAIS)</option>
                            <option value="CO2">CO2 (DIÓXIDO DE CARBONO)</option>
                            <option value="ESPUMA MECÂNICA">ESPUMA MECÂNICA</option>
                            <option value="OUTROS">OUTROS</option>
                            <option value="PQS ABC">PQS ABC</option>
                            <option value="PQS BC">PQS BC</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="mat-ext-weight" className="modal-label">Peso / Capacidade (kg/L)</label>
                          <input 
                            id="mat-ext-weight"
                            name="mat-ext-weight"
                            className="modal-input" 
                            value={editingMaterial?.extintor_peso || ''} 
                            onChange={e => setEditingMaterial({...(editingMaterial || {}), extintor_peso: e.target.value})} 
                            placeholder="Ex: 4kg, 6kg, 10L, 50kg" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                     {(editingMaterial?.categoria === 'CONSUMO' || editingMaterial?.categoria === 'PERMANENTE') && SUB_CATEGORIES.map(sub => (
                       <label key={sub.id} className="relative inline-flex items-center cursor-pointer bg-gray-50 p-4 rounded-2xl transition-all border-2 border-transparent has-[:checked]:bg-red-50 has-[:checked]:border-red-200">
                         <input 
                           type="checkbox" 
                           className="sr-only peer" 
                           checked={editingMaterial?.[sub.id as keyof Material] === true || editingMaterial?.[sub.id as keyof Material] === 'SIM'} 
                           onChange={e => setEditingMaterial({...(editingMaterial || {}), [sub.id]: e.target.checked ? 'SIM' : 'NÃO'})} 
                         />
                         <div className="w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                         <span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-red-700">{sub.label}</span>
                       </label>
                     ))}
                     {(editingMaterial?.categoria === 'CONSUMO' || editingMaterial?.categoria === 'PERMANENTE' || editingMaterial?.categoria === 'EXTINTORES') && (
                       <label className="relative inline-flex items-center cursor-pointer bg-gray-50 p-4 rounded-2xl transition-all border-2 border-transparent has-[:checked]:bg-red-50 has-[:checked]:border-red-200">
                          <input type="checkbox" className="sr-only peer" checked={editingMaterial?.fora_de_carga === true || editingMaterial?.fora_de_carga === 'SIM'} onChange={e => setEditingMaterial({...(editingMaterial || {}), fora_de_carga: e.target.checked ? 'SIM' : 'NÃO'})} />
                          <div className="w-11 h-6 shrink-0 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                          <span className="ml-3 text-[10px] font-black uppercase text-gray-500 peer-checked:text-red-700">Material Fora de Carga</span>
                       </label>
                     )}
                  </div>
                 <button className="col-span-2 bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-700 flex items-center justify-center gap-3">
                    <Save size={20} /> Salvar Alterações
                 </button>
              </form>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
