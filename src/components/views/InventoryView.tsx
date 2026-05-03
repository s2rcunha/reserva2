import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Printer, Trash2, Filter, CheckSquare, MessageCircle } from 'lucide-react';
import { Material, Sector, User } from '../../types';
import { InventoryScanner } from '../InventoryScanner';
import { cn } from '../../lib/utils';
import { getMaterialQty } from '../../utils';
import { CATEGORIES } from '../../constants';
import { generatePDFReport } from '../../lib/exportUtils';

interface InventoryViewProps {
  view: string;
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  inventoryState: any;
  setInventoryState: React.Dispatch<React.SetStateAction<any>>;
  materiais: Material[];
  rawMateriais: Material[];
  sectores: Sector[];
  currentUser: User | null;
  saveMaterial: (e: any, m: Material) => Promise<void>;
  addToast: (msg: string, type?: any) => void;
  filters: any;
  setFilters: (f: any) => void;
  executeFilter: (v?: any, f?: any) => void;
  setShowLabelConfig: (show: boolean) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  isScannerOpen, setIsScannerOpen, inventoryState, setInventoryState,
  materiais, rawMateriais, sectores, currentUser, saveMaterial,
  addToast, filters, setFilters, executeFilter, setShowLabelConfig
}) => {
  return (
    <motion.div key="inv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header and Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase">CONFERÊNCIA DE INVENTÁRIO</h2>
          <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">Checklist de Verificação Física de Carga</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button onClick={() => setIsScannerOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95">
             <Camera size={18} /> Escaneamento QR
           </button>
           <button onClick={() => {
             if (!inventoryState.sector) return alert('Selecione um setor primeiro');
             const sectorItems = materiais.filter(m => m.setor === inventoryState.sector);
             if (sectorItems.length === 0) return alert('Nenhum item encontrado neste setor');
             setShowLabelConfig(true);
           }} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95">
             <Printer size={18} /> Gerar Etiquetas
           </button>
        </div>
      </div>

      {isScannerOpen && (
        <InventoryScanner 
          onClose={() => setIsScannerOpen(false)}
          onScan={(bmp) => {
            const cleanBmp = bmp.trim().toUpperCase();
            const material = rawMateriais.find(m => String(m.bmp || m.id).toUpperCase() === cleanBmp);
            
            if (material) {
              const totalQty = getMaterialQty(material);
              const currentFound = inventoryState.foundQuantities[material.id] || 0;
              if (currentFound < totalQty) {
                if (inventoryState.sector && material.setor !== inventoryState.sector) {
                  if (window.confirm(`ATENÇÃO: O item ${material.bmp} (${material.descricao}) está registrado no setor ${material.setor}.\n\nDeseja realizar a TRANSFERÊNCIA para o setor ${inventoryState.sector} agora?`)) {
                     if (currentUser?.nivel !== 'ADMIN') {
                       addToast("Apenas administradores podem realizar transferências automáticas.", "error");
                       return;
                     }
                     saveMaterial(null as any, { ...material, setor: inventoryState.sector }).then(() => {
                        addToast(`${material.bmp} transferido para ${inventoryState.sector} e registrado.`, 'info');
                        const foundVal = (totalQty > 1 && material.categoria === 'CONSUMO') ? totalQty : totalQty;
                        setInventoryState((prev: any) => ({ ...prev, foundQuantities: { ...prev.foundQuantities, [material.id]: foundVal } }));
                     }).catch(() => addToast("Falha ao salvar transferência no banco de dados.", "error"));
                     return;
                  }
                  return;
                }
                let foundVal = totalQty;
                if (totalQty > 1 && material.categoria === 'CONSUMO') {
                   const input = window.prompt(`Quantas unidades de ${material.descricao} encontrou? (Total: ${totalQty})`, String(totalQty));
                   if (input !== null) {
                     const parsed = parseInt(input);
                     if (!isNaN(parsed)) foundVal = Math.min(parsed, totalQty);
                   } else return;
                }
                addToast(`Item encontrado: ${material.bmp} - ${material.descricao} (${foundVal}/${totalQty})`, 'info');
                setInventoryState((prev: any) => ({ ...prev, foundQuantities: { ...prev.foundQuantities, [material.id]: foundVal } }));
              } else addToast(`Item ${material.bmp} já foi registrado`, 'info');
            } else addToast(`BMP ${cleanBmp} não encontrado no sistema`, 'error');
          }}
        />
      )}

      {/* Inventory Progress */}
      {inventoryState.sector && (
        <div className="mb-8 p-6 bg-white rounded-[40px] border border-gray-100 shadow-sm">
           <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Progresso do Inventário: <span className="text-gray-900">{inventoryState.sector}</span></p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => {
                  if (window.confirm("Deseja realmente LIMPAR o inventário em andamento?")) {
                    setInventoryState({ sector: '', foundQuantities: {}, filter: 'ALL', categories: [] });
                    addToast("Inventário reiniciado.", "info");
                  }
                }} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors">
                  <Trash2 size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Limpar</span>
                </button>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Encontrados</span>
                    <span className="text-xl font-black text-green-600 italic">
                      {materiais.filter(m => m && m.setor === inventoryState.sector && (inventoryState.categories.length === 0 || inventoryState.categories.includes(m.categoria)))
                        .reduce((acc, m) => acc + (inventoryState.foundQuantities[m.id] || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 -mt-1 justify-end">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Esperado</span>
                    <span className="text-sm font-black text-blue-600">
                      {materiais.filter(m => m && m.setor === inventoryState.sector && (inventoryState.categories.length === 0 || inventoryState.categories.includes(m.categoria)))
                        .reduce((acc, m) => acc + getMaterialQty(m), 0)}
                    </span>
                  </div>
                </div>
              </div>
           </div>
           <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <motion.div initial={{ width: 0 }} animate={{ 
                width: `${(materiais.filter(m => m && m.setor === inventoryState.sector && (inventoryState.categories.length === 0 || inventoryState.categories.includes(m.categoria))).reduce((acc, m) => acc + (inventoryState.foundQuantities[m.id] || 0), 0) / (materiais.filter(m => m && m.setor === inventoryState.sector && (inventoryState.categories.length === 0 || inventoryState.categories.includes(m.categoria))).reduce((acc, m) => acc + getMaterialQty(m), 0) || 1)) * 100}%` 
              }} className="h-full bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.3)]" />
           </div>
        </div>
      )}

      {/* Inventory Filters */}
      <div className="bg-white rounded-[30px] p-6 mb-8 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div>
            <label htmlFor="inv-sector-filter" className="filter-label">Setor para Inventariar</label>
            <select id="inv-sector-filter" className="filter-input" value={inventoryState.sector} onChange={e => {
              const newSector = e.target.value;
              setInventoryState({ ...inventoryState, sector: newSector });
              if (newSector) executeFilter('INVENTORY', { setor: newSector, fora_de_carga: 'all' });
            }}>
               <option value="">Selecione um Setor...</option>
               {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
            </select>
         </div>
         <div>
            <label className="filter-label">Estado de Verificação</label>
            <div className="flex bg-gray-100 p-1 rounded-xl">
               <button onClick={() => setInventoryState({...inventoryState, filter: 'ALL'})} className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", inventoryState.filter === 'ALL' ? "bg-white shadow-sm" : "text-gray-400")}>Todos</button>
               <button onClick={() => setInventoryState({...inventoryState, filter: 'FOUND'})} className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", inventoryState.filter === 'FOUND' ? "bg-white shadow-sm text-green-600" : "text-gray-400")}>Encontrados</button>
               <button onClick={() => setInventoryState({...inventoryState, filter: 'NOT_FOUND'})} className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", inventoryState.filter === 'NOT_FOUND' ? "bg-white shadow-sm text-red-600" : "text-gray-400")}>Faltantes</button>
            </div>
         </div>
         <div>
            <label className="filter-label">Categorias para Inventariar</label>
            <div className="flex flex-wrap gap-2 mt-2">
               {CATEGORIES.map(cat => {
                  const isSelected = inventoryState.categories.includes(cat.id);
                  return (
                    <button key={cat.id} onClick={() => {
                      const newCats = isSelected ? inventoryState.categories.filter((id: string) => id !== cat.id) : [...inventoryState.categories, cat.id];
                      setInventoryState({...inventoryState, categories: newCats});
                    }} className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all", isSelected ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100")}>
                      {cat.label}
                    </button>
                  );
               })}
            </div>
         </div>
         <div className="flex items-end gap-2 text-right">
            <button onClick={() => {
              if (!inventoryState.sector) return alert('Selecione um setor primeiro');
              const items = materiais.filter(m => m.setor === inventoryState.sector);
              const filtered = items.filter(m => {
                const categoryMatch = inventoryState.categories.length === 0 || inventoryState.categories.includes(m.categoria);
                const foundQty = inventoryState.foundQuantities[m.id] || 0;
                const totalQty = getMaterialQty(m);
                if (!categoryMatch) return false;
                if (inventoryState.filter === 'FOUND') return foundQty === totalQty;
                if (inventoryState.filter === 'NOT_FOUND') return foundQty < totalQty;
                return true;
              });
              generatePDFReport(filtered, `Inventário: ${inventoryState.sector}`);
            }} className="flex-1 bg-black text-white h-[46px] rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
               <Printer size={16} /> PDF
            </button>
         </div>
      </div>

      {/* Items for Inventory */}
      <div className="space-y-4 mb-20 text-[11px]">
         {materiais
           .filter(m => m && (!inventoryState.sector || m.setor === inventoryState.sector))
           .filter(m => inventoryState.categories.length === 0 || (m && inventoryState.categories.includes(m.categoria)))
           .filter(m => {
               const foundQty = inventoryState.foundQuantities[m.id] || 0; 
               const totalQty = getMaterialQty(m);
               if (inventoryState.filter === 'FOUND') return foundQty === totalQty;
               if (inventoryState.filter === 'NOT_FOUND') return foundQty < totalQty;
               return true;
           })
           .map(m => {
               const foundQty = inventoryState.foundQuantities[m.id] || 0; 
               const totalQty = getMaterialQty(m);
               const isFullyFound = foundQty === totalQty;
               const isPartial = foundQty > 0 && foundQty < totalQty;
              return (
                 <div key={m.id} className={cn("bg-white p-6 rounded-[30px] border flex items-center justify-between transition-all shadow-sm", isFullyFound ? "border-green-100 bg-green-50/10" : isPartial ? "border-amber-100 bg-amber-50/10" : "border-gray-100")}>
                   <div className="flex items-center gap-6">
                      <button onClick={() => {
                         if (totalQty > 1 && m.categoria === 'CONSUMO') {
                            const input = window.prompt(`Quantidade encontrada de ${m.descricao} (Total: ${totalQty})`, String(foundQty || totalQty));
                            if (input !== null) {
                               const parsed = parseInt(input);
                               if (!isNaN(parsed)) setInventoryState({...inventoryState, foundQuantities: {...inventoryState.foundQuantities, [m.id]: Math.max(0, Math.min(parsed, totalQty))}});
                            }
                         } else setInventoryState({...inventoryState, foundQuantities: {...inventoryState.foundQuantities, [m.id]: isFullyFound ? 0 : totalQty}});
                      }} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", isFullyFound ? "bg-green-600 text-white shadow-lg" : isPartial ? "bg-amber-500 text-white shadow-lg" : "bg-gray-100 text-gray-400 hover:bg-gray-200")}>
                         <CheckSquare size={24} />
                      </button>
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black bg-gray-900 text-white px-2 py-0.5 rounded leading-none uppercase">BMP {m.bmp}</span>
                         </div>
                         <h4 className="font-bold text-gray-900 uppercase tracking-tight">{m.descricao}</h4>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">S.: {m.setor} | Q.: {foundQty}/{totalQty}</p>
                      </div>
                   </div>
                 </div>
              );
           })}
      </div>
    </motion.div>
  );
};
