import React, { useState } from 'react';
import { 
  Shield, Edit, Trash2, RefreshCw, AlertCircle, Settings, ChevronUp, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Material, Sector, User, Loan } from '../../types';
import { SITUACOES } from '../../constants';

interface EprViewProps {
  materiais: Material[];
  loans: Loan[];
  sectores: Sector[];
  currentUser: User | null;
  loading: boolean;
  saveMaterial: (e: React.FormEvent | null, m: Partial<Material>) => Promise<any>;
  deleteMaterial: (m: Material) => void;
  eprWarnings: any[];
  setEditingMaterial: (m: any) => void;
  editingMaterial: any;
  setEprToRecarga: (m: any) => void;
  setEprRecargaDate: (d: string) => void;
  setEprProximaRecargaDate: (d: string) => void;
  setEprAvisoRecarga: (a: string) => void;
  setShowEprRecargaModal: (show: boolean) => void;
  eprSubView: 'LISTA' | 'CADASTRO';
  setEprSubView: (v: 'LISTA' | 'CADASTRO') => void;
}

export const EprView: React.FC<EprViewProps> = ({
  materiais,
  loans,
  sectores,
  currentUser,
  loading,
  saveMaterial,
  deleteMaterial,
  eprWarnings,
  setEditingMaterial,
  editingMaterial,
  setEprToRecarga,
  setEprRecargaDate,
  setEprProximaRecargaDate,
  setEprAvisoRecarga,
  setShowEprRecargaModal,
  eprSubView,
  setEprSubView
}) => {
  const [eprListFilterStatus, setEprListFilterStatus] = useState('');
  const [eprListFilterSector, setEprListFilterSector] = useState('');

  const eprMaterials = materiais.filter(m => 
    m.categoria === 'PERMANENTE' && 
    (m.classificacao?.toUpperCase() === 'EPR' || 
     (m as any)['classificação']?.toUpperCase() === 'EPR' || 
     (m as any)['Classificação']?.toUpperCase() === 'EPR' || 
     m.descricao === 'EPR' || 
     !!m.epr_fabricante || 
     !!m.epr_validade_cilindro)
  );

  const filteredEprs = eprMaterials.filter(m => 
    (!eprListFilterStatus || m.situacao === eprListFilterStatus) && 
    (!eprListFilterSector || m.setor === eprListFilterSector)
  );

  return (
    <motion.div key="epr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase italic">Controle de EPRs</h2>
          <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">Gestão e Cadastro de Equipamentos de Proteção Respiratória</p>
        </div>
      </div>

      <div className="flex bg-gray-100 p-2 rounded-[20px] mb-8 w-max gap-2">
         <button
           onClick={() => setEprSubView('LISTA')}
           className={cn("px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", eprSubView === 'LISTA' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-200")}
         >
           <Shield size={16} className="inline-block mr-2 -mt-1" />
           Lista de EPRs
         </button>
         {currentUser?.nivel === 'ADMIN' && (
           <button
             onClick={() => {
                setEprSubView('CADASTRO');
                setEditingMaterial({ responsavel: currentUser?.nome } as any);
             }}
             className={cn("px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", eprSubView === 'CADASTRO' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-200")}
           >
             <Settings size={16} className="inline-block mr-2 -mt-1" />
             Cadastro de EPR
           </button>
         )}
      </div>

      {eprSubView === 'LISTA' && eprWarnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <AlertCircle className="text-orange-500" size={24} />
             <h3 className="font-black text-orange-700 tracking-tight text-lg">Avisos de Manutenção EPR</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {eprWarnings.map((w, i) => (
                <div key={i} className="bg-white/80 p-4 rounded-xl border border-orange-100 flex flex-col gap-1">
                   <div className="flex justify-between items-center">
                     <span className="font-black text-xs text-orange-800">BMP: {w.bmp}</span>
                     <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase", w.days <= 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")}>
                       {w.days < 0 ? `Atrasado ${Math.abs(w.days)} d` : w.days === 0 ? "Vence hoje" : `Em ${w.days} d`}
                     </span>
                   </div>
                   <span className="text-[11px] text-gray-600 font-medium">{w.msg}</span>
                   <button onClick={() => {
                      const m = materiais.find(mat => mat.id === w.id);
                      if (m) {
                        setEditingMaterial(m);
                        setEprSubView('CADASTRO');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                   }} className="text-blue-600 text-[10px] font-bold mt-2 self-start hover:underline">Ver Cadastro</button>
                </div>
             ))}
          </div>
        </div>
      )}

      {eprSubView === 'LISTA' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">
              EPRs Cadastrados ({filteredEprs.length})
            </h3>
            <div className="flex gap-2 w-full md:w-auto">
              <select className="modal-input bg-gray-50 border-transparent focus:bg-white text-xs w-full md:w-48" value={eprListFilterStatus} onChange={e => setEprListFilterStatus(e.target.value)}>
                <option value="">Todas as Situações</option>
                {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="modal-input bg-gray-50 border-transparent focus:bg-white text-xs w-full md:w-48" value={eprListFilterSector} onChange={e => setEprListFilterSector(e.target.value)}>
                <option value="">Todos os Locais</option>
                {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr className="text-left">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Nº Controle/BMP</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEprs.map(m => (
                  <React.Fragment key={m.id}>
                    <tr 
                      className="hover:bg-gray-50/50 transition-colors"
                      title={[
                        m.documento ? `Documento: ${m.documento}` : '',
                        m.observacoes ? `Observações: ${m.observacoes}` : ''
                      ].filter(Boolean).join('\n') || undefined}
                    >
                      <td className="p-6 text-xs font-black text-gray-900">{m.bmp || m.epi_numero || '-'}</td>
                      <td className="p-6 text-xs text-gray-900">{m.descricao || '-'}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={2} className="p-6 border-t border-gray-100">
                        <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-[11px] text-gray-600">
                            <div>
                              <span className="font-black uppercase tracking-widest">Fabricante</span>
                              <div className="mt-1 text-gray-900">{m.epr_fabricante || '-'}</div>
                            </div>
                            <div>
                              <span className="font-black uppercase tracking-widest">Modelo</span>
                              <div className="mt-1 text-gray-900">{m.epr_modelo || '-'}</div>
                            </div>
                            <div>
                              <span className="font-black uppercase tracking-widest">Validade</span>
                              <div className="mt-1 text-gray-900">{m.epr_validade_cilindro ? new Date(m.epr_validade_cilindro).toLocaleDateString() : '-'}</div>
                            </div>
                            <div>
                              <span className="font-black uppercase tracking-widest">Teste Hidrostático</span>
                              <div className="mt-1 text-gray-900">{m.epr_teste_hidrostatico ? new Date(m.epr_teste_hidrostatico).toLocaleDateString() : '-'}{m.epr_proximo_teste_anos ? ` · ${m.epr_proximo_teste_anos} anos` : ''}</div>
                            </div>
                            <div>
                              <span className="font-black uppercase tracking-widest">Recargas</span>
                              <div className="mt-1 text-gray-900">{m.epr_recargas_count || 0} feitas{m.epr_recargas_limite ? ` · Lim: ${m.epr_recargas_limite}` : ''}</div>
                            </div>
                            <div>
                              <span className="font-black uppercase tracking-widest">Localização</span>
                              <div className="mt-1 text-gray-900">{m.setor || '-'}</div>
                            </div>
                            <div>
                              <span className="font-black uppercase tracking-widest">Situação</span>
                              <div className="mt-1 inline-flex items-center gap-2 text-gray-900">
                                <span className={cn("px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", m.situacao === 'PERFEITO' ? 'bg-emerald-50 text-emerald-600' : m.situacao === 'EMPRESTADO' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600')}>
                                  {m.situacao}
                                </span>
                                {m.situacao === 'EMPRESTADO' && (() => {
                                  const activeLoan = loans.find(l => {
                                    try {
                                      const mats = JSON.parse(l.materiais_json || '[]');
                                      return l.status === 'EMPRESTADO' && mats.some((item: any) => 
                                        String(typeof item === 'object' ? item.id : item) === String(m.id)
                                      );
                                    } catch(e) { return false; }
                                  });
                                  if (activeLoan) {
                                    return (
                                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                                        {activeLoan.solicitante.split(' ')[0]}{(activeLoan as any).solicitante_setor ? ` - ${(activeLoan as any).solicitante_setor}` : ''}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
                            <button onClick={() => { 
                              setEprToRecarga(m); 
                              setEprRecargaDate(new Date().toISOString().split('T')[0]);
                              setEprProximaRecargaDate(m.epr_proxima_recarga ? new Date(m.epr_proxima_recarga).toISOString().split('T')[0] : '');
                              setEprAvisoRecarga(m.epr_aviso_recarga || '');
                              setShowEprRecargaModal(true); 
                            }} className="ctrl-btn text-indigo-600 bg-indigo-50 px-3 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all font-sans whitespace-nowrap">Recarregar</button>
                            {currentUser?.nivel === 'ADMIN' && (
                              <>
                                <button onClick={() => {
                                  setEditingMaterial(m);
                                  setEprSubView('CADASTRO');
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }} className="ctrl-btn text-blue-600 bg-blue-50"><Edit size={16} /></button>
                                <button onClick={() => deleteMaterial(m)} className="ctrl-btn text-red-600 bg-red-50"><Trash2 size={16} /></button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {eprSubView === 'CADASTRO' && currentUser?.nivel === 'ADMIN' && (
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 max-w-4xl mx-auto">
           <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
             <Shield size={20} className="text-red-600" /> {editingMaterial?.id ? 'Editar EPR' : 'Cadastrar Novo EPR'}
           </h3>
           <form onSubmit={e => {
              const matToSave = {
                ...(editingMaterial || {}),
                categoria: 'PERMANENTE',
                classificacao: 'EPR',
                responsavel: editingMaterial?.responsavel || currentUser?.nome || ''
              } as any;
              saveMaterial(e, matToSave);
           }} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div>
                   <label htmlFor="epr-bmp" className="modal-label">Nº Controle / BMP {editingMaterial?.fora_de_carga === 'SIM' ? '(Opcional)' : '(Obrigatório)'}</label>
                   <input id="epr-bmp" className="modal-input" required={editingMaterial?.fora_de_carga !== 'SIM'} value={editingMaterial?.bmp || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), bmp: e.target.value})} placeholder={editingMaterial?.fora_de_carga === 'SIM' ? "Opcional p/ fora de carga" : "Número do equipamento..."} />
                 </div>
                 <div>
                   <label htmlFor="epr-desc" className="modal-label">Descrição</label>
                   <input id="epr-desc" className="modal-input" required value={editingMaterial?.descricao || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), descricao: e.target.value})} placeholder="Ex: CONJUNTO EPR COMPLETO" />
                 </div>
                 <div>
                   <label htmlFor="epr-setor" className="modal-label">Setor</label>
                   <select id="epr-setor" required className="modal-input" value={editingMaterial?.setor || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), setor: e.target.value})}>
                     <option value="">Selecione...</option>
                     {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                   </select>
                 </div>
                 <div>
                   <label htmlFor="epr-situacao" className="modal-label">Situação</label>
                   <select id="epr-situacao" required className="modal-input" value={editingMaterial?.situacao || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), situacao: e.target.value})}>
                     <option value="">Selecione...</option>
                     {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                 </div>
                 <div className="flex flex-col justify-end pb-1">
                   <label className="modal-label mb-3">Item Fora de Carga?</label>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={editingMaterial?.fora_de_carga === true || editingMaterial?.fora_de_carga === 'SIM'} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), fora_de_carga: e.target.checked ? 'SIM' : 'NÃO'})} />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                     <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                       {editingMaterial?.fora_de_carga === 'SIM' ? 'SIM' : 'NÃO'}
                     </span>
                   </label>
                 </div>
                 <div>
                   <label htmlFor="epr-fabricante" className="modal-label">Fabricante</label>
                   <input id="epr-fabricante" className="modal-input" value={editingMaterial?.epr_fabricante || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_fabricante: e.target.value})} placeholder="Fabricante..." />
                 </div>
                 <div>
                   <label htmlFor="epr-modelo" className="modal-label">Modelo</label>
                   <input id="epr-modelo" className="modal-input" value={editingMaterial?.epr_modelo || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_modelo: e.target.value})} placeholder="Modelo..." />
                 </div>
                 <div className="flex flex-col gap-4 col-span-1 border border-gray-100 rounded-3xl p-4 bg-gray-50/30">
                   <label htmlFor="epr-validade-cil" className="modal-label">Validade do Cilindro</label>
                   <input id="epr-validade-cil" type="date" className="modal-input" required value={editingMaterial?.epr_validade_cilindro ? new Date(editingMaterial.epr_validade_cilindro).toISOString().split('T')[0] : ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_validade_cilindro: e.target.value})} />
                   
                   <label htmlFor="epr-aviso-cil" className="modal-label">Aviso Validade (Antes)</label>
                   <select id="epr-aviso-cil" className="modal-input" value={editingMaterial?.epr_aviso_validade_cilindro || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_aviso_validade_cilindro: e.target.value})}>
                     <option value="">Sem aviso</option>
                     <option value="15">15 dias</option>
                     <option value="30">1 mês</option>
                     <option value="60">2 meses</option>
                     <option value="90">3 meses</option>
                     <option value="180">6 meses</option>
                     <option value="365">1 ano</option>
                   </select>
                 </div>
                 <div>
                   <label htmlFor="epr-data-ent" className="modal-label">Mês/Ano de Entrada</label>
                   <input id="epr-data-ent" type="date" required className="modal-input" value={editingMaterial?.data_entrada ? new Date(editingMaterial.data_entrada).toISOString().split('T')[0] : ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), data_entrada: e.target.value})} />
                 </div>
                 <div className="flex flex-col gap-4 col-span-1 border border-gray-100 rounded-3xl p-4 bg-gray-50/30">
                   <label htmlFor="epr-recarga" className="modal-label">Data da Última Recarga</label>
                   <input id="epr-recarga" type="date" className="modal-input" value={editingMaterial?.epr_ultima_recarga ? new Date(editingMaterial.epr_ultima_recarga).toISOString().split('T')[0] : ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_ultima_recarga: e.target.value})} />
                   
                   <label htmlFor="epr-proxima-recarga" className="modal-label">Data da Próx. Recarga</label>
                   <input id="epr-proxima-recarga" type="date" className="modal-input" value={editingMaterial?.epr_proxima_recarga ? new Date(editingMaterial.epr_proxima_recarga).toISOString().split('T')[0] : ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_proxima_recarga: e.target.value})} />
                   
                   <label htmlFor="epr-aviso-recarga" className="modal-label">Aviso Recarga (Antes)</label>
                   <select id="epr-aviso-recarga" className="modal-input" value={editingMaterial?.epr_aviso_recarga || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_aviso_recarga: e.target.value})}>
                     <option value="">Sem aviso</option>
                     <option value="15">15 dias</option>
                     <option value="30">1 mês</option>
                     <option value="60">2 meses</option>
                     <option value="90">3 meses</option>
                     <option value="180">6 meses</option>
                     <option value="365">1 ano</option>
                   </select>
                   
                   <label htmlFor="epr-recargas-limite" className="modal-label mt-2">Limite de Recargas</label>
                   <input id="epr-recargas-limite" type="number" min="0" className="modal-input" value={editingMaterial?.epr_recargas_limite || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_recargas_limite: e.target.value})} placeholder="Ilimitado" />
                 </div>
                 <div className="flex flex-col gap-4 col-span-1 border border-gray-100 rounded-3xl p-4 bg-gray-50/30">
                   <label htmlFor="epr-teste-hid" className="modal-label">Teste Hidrostático</label>
                   <input id="epr-teste-hid" type="date" className="modal-input" required value={editingMaterial?.epr_teste_hidrostatico ? new Date(editingMaterial.epr_teste_hidrostatico).toISOString().split('T')[0] : ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_teste_hidrostatico: e.target.value})} />
                   
                   <label htmlFor="epr-aviso-teste" className="modal-label">Aviso Teste (Antes)</label>
                   <select id="epr-aviso-teste" className="modal-input" value={editingMaterial?.epr_aviso_teste || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), epr_aviso_teste: e.target.value})}>
                     <option value="">Sem aviso</option>
                     <option value="15">15 dias</option>
                     <option value="30">1 mês</option>
                     <option value="60">2 meses</option>
                     <option value="90">3 meses</option>
                     <option value="180">6 meses</option>
                     <option value="365">1 ano</option>
                   </select>
                 </div>
               </div>
               
               <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6">
                  <label className="modal-label mb-4 block">Frequência do Próximo Teste Hidrostático</label>
                  <div className="flex gap-4 max-w-sm">
                     <button
                       type="button"
                       onClick={() => setEditingMaterial({...(editingMaterial || {} as any), epr_proximo_teste_anos: 5})}
                       className={cn("flex-1 py-4 border-2 rounded-2xl font-black tracking-widest uppercase transition-all", editingMaterial?.epr_proximo_teste_anos === 5 ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400 bg-white")}
                     >
                       5 Anos
                     </button>
                     <button
                       type="button"
                       onClick={() => setEditingMaterial({...(editingMaterial || {} as any), epr_proximo_teste_anos: 10})}
                       className={cn("flex-1 py-4 border-2 rounded-2xl font-black tracking-widest uppercase transition-all", editingMaterial?.epr_proximo_teste_anos === 10 ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400 bg-white")}
                     >
                       10 Anos
                     </button>
                  </div>
                  {!editingMaterial?.epr_proximo_teste_anos && <p className="text-red-500 text-[10px] mt-2 font-bold uppercase tracking-widest pl-2">Por favor, selecione uma opção</p>}
                  
                  {editingMaterial?.epr_teste_hidrostatico && editingMaterial?.epr_proximo_teste_anos && (
                     <div className="mt-4 p-4 bg-blue-50 text-blue-600 rounded-2xl text-[11px] font-bold">
                       Próximo Teste Hidrostático (Calculado): {
                         (() => {
                           const testDate = new Date(editingMaterial.epr_teste_hidrostatico);
                           testDate.setUTCFullYear(testDate.getUTCFullYear() + parseInt(editingMaterial.epr_proximo_teste_anos as any, 10));
                           return testDate.toLocaleDateString();
                         })()
                       }
                     </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                 <div>
                   <label htmlFor="epr-nf" className="modal-label">Documento/SP</label>
                   <input id="epr-nf" className="modal-input" value={editingMaterial?.documento || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), documento: e.target.value})} placeholder="..." />
                 </div>
               </div>
               
               <div>
                 <label htmlFor="epr-obs" className="modal-label">Observações</label>
                 <textarea id="epr-obs" className="modal-input min-h-[100px] resize-none" value={editingMaterial?.observacoes || ''} onChange={e => setEditingMaterial({...(editingMaterial || {} as any), observacoes: e.target.value})} placeholder="Avarias, detalhes adicionais..."></textarea>
               </div>
               
              <button 
                 type="submit" 
                 disabled={loading} 
                 className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : (editingMaterial?.id ? 'Atualizar EPR' : 'Adicionar EPR')}
              </button>
              
              {editingMaterial?.id && (
                <button type="button" onClick={() => { setEditingMaterial(null); setEprSubView('LISTA'); }} className="w-full text-gray-500 py-3 uppercase font-black text-[10px] tracking-widest">
                  Cancelar Edição
                </button>
              )}
           </form>
        </div>
      )}
    </motion.div>
  );
};
