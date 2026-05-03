import React, { useState } from 'react';
import { 
  Shield, Edit, Trash2, Truck, RefreshCw, FilterX, 
  ChevronUp, ChevronDown, PieChart, TrendingUp, Printer,
  Search, AlertCircle, X, Users, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Material, Bombeiro, EPILoan, Sector, User } from '../../types';
import { 
  EPI_COMPONENTS, SITUACOES, SCRIPT_URL, EPI_FUNCTIONS 
} from '../../constants';
import { generateEpiLoanReceipt } from '../../lib/exportUtils';

interface EpiViewProps {
  currentUser: User | null;
  epiWarnings: any[];
  materiais: Material[];
  bombeiros: Bombeiro[];
  epiLoans: EPILoan[];
  loading: boolean;
  setEditingMaterial: (m: Partial<Material> | null) => void;
  setIsEpiCadastroOpen: (b: boolean) => void;
  isEpiCadastroOpen: boolean;
  isBombeiroCadastroOpen: boolean;
  setIsBombeiroCadastroOpen: (b: boolean) => void;
  editingBombeiro: Partial<Bombeiro> | null;
  setEditingBombeiro: (b: Partial<Bombeiro> | null) => void;
  newBombeiro: Partial<Bombeiro>;
  setNewBombeiro: (b: Partial<Bombeiro>) => void;
  saveBombeiro: (e: React.FormEvent) => void;
  deleteBombeiro: (id: number) => void;
  bombeiroSearch: string;
  setBombeiroSearch: (s: string) => void;
  epiFilterType: string;
  setEpiFilterType: (s: string) => void;
  epiFilterSize: string;
  setEpiFilterSize: (s: string) => void;
  returnEPI: (id: number) => void;
  setShowEPILoanModal: (b: boolean) => void;
  editingMaterial: Partial<Material> | null;
  sectores: Sector[];
  authenticatedFetch: any;
  executeFilter: () => void;
  epiListFilterColor: string;
  setEpiListFilterColor: (s: string) => void;
  epiListFilterType: string;
  setEpiListFilterType: (s: string) => void;
  epiListFilterSize: string;
  setEpiListFilterSize: (s: string) => void;
  epiListFilterStatus: string;
  setEpiListFilterStatus: (s: string) => void;
  saveMaterial: (e: React.FormEvent | null, mat: Partial<Material>) => Promise<any>;
  deleteMaterial: (m: Material) => Promise<any>; // Alterado para Promise<any>
  epiSubView: 'GESTAO' | 'CADASTRO';
  setEpiSubView: (v: 'GESTAO' | 'CADASTRO') => void;
}

export const EpiView: React.FC<EpiViewProps> = ({
  currentUser,
  epiWarnings,
  materiais,
  bombeiros,
  epiLoans,
  loading,
  setEditingMaterial,
  setIsEpiCadastroOpen,
  isEpiCadastroOpen,
  isBombeiroCadastroOpen,
  setIsBombeiroCadastroOpen,
  editingBombeiro,
  setEditingBombeiro,
  newBombeiro,
  setNewBombeiro,
  saveBombeiro,
  deleteBombeiro,
  bombeiroSearch,
  setBombeiroSearch,
  epiFilterType,
  setEpiFilterType,
  epiFilterSize,
  setEpiFilterSize,
  returnEPI,
  setShowEPILoanModal,
  editingMaterial,
  sectores,
  authenticatedFetch,
  executeFilter,
  epiListFilterColor,
  setEpiListFilterColor,
  epiListFilterType,
  setEpiListFilterType,
  epiListFilterSize,
  setEpiListFilterSize,
  epiListFilterStatus,
  setEpiListFilterStatus,
  saveMaterial,
  deleteMaterial,
  epiSubView,
  setEpiSubView
}) => {

  return (
    <motion.div key="epi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Tab Selector */}
      <div className="flex bg-gray-100 p-2 rounded-[20px] mb-8 w-max gap-2 mx-auto md:mx-0">
        <button
          onClick={() => setEpiSubView('GESTAO')}
          className={cn("px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", epiSubView === 'GESTAO' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-200")}
        >
          <Users size={16} className="inline-block mr-2 -mt-1" />
          Gestão de Cautelas
        </button>
        {currentUser?.nivel === 'ADMIN' && (
          <button
            onClick={() => setEpiSubView('CADASTRO')}
            className={cn("px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all", epiSubView === 'CADASTRO' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-200")}
          >
            <Settings size={16} className="inline-block mr-2 -mt-1" />
            Cadastro de EPIs
          </button>
        )}
      </div>

      {epiSubView === 'GESTAO' && (
        <div className="flex flex-col gap-8">
          {epiWarnings.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                 <AlertCircle className="text-orange-500" size={24} />
                 <h3 className="font-black text-orange-700 tracking-tight text-lg">Avisos de Validade EPI</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {epiWarnings.map((w, i) => (
                    <div key={i} className="bg-white/80 p-4 rounded-xl border border-orange-100 flex flex-col gap-1">
                       <div className="flex justify-between items-center">
                         <span className="font-black text-xs text-orange-800">{w.item} {w.numero} ({w.color})</span>
                         <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase", w.days <= 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")}>
                           {w.days < 0 ? `Vencido há ${Math.abs(w.days)} d` : w.days === 0 ? "Vence hoje" : `Em ${w.days} d`}
                         </span>
                       </div>
                       <span className="text-[11px] text-gray-600 font-medium">{w.msg}</span>
                       <button onClick={() => {
                          const m = materiais.find(mat => mat.id === w.id);
                          if (m) {
                            setEditingMaterial(m);
                            setEpiSubView('CADASTRO');
                            setIsEpiCadastroOpen(true);
                            document.getElementById('main-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                       }} className="text-blue-600 text-[10px] font-bold mt-2 self-start hover:underline">Ver Cadastro</button>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {currentUser?.nivel === 'ADMIN' && (
            <div className="w-full">
              <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-sm border border-gray-100 transition-all">
                <button 
                  type="button" 
                  onClick={() => setIsBombeiroCadastroOpen(!isBombeiroCadastroOpen)}
                  className="w-full flex justify-between items-center outline-none"
                >
                  <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2">
                     <Users size={16} className="text-red-600" /> Cadastro de Bombeiros
                  </h3>
                  {isBombeiroCadastroOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                
                <AnimatePresence>
                  {isBombeiroCadastroOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={saveBombeiro} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        <div>
                          <label htmlFor="epi-nome-guerra" className="modal-label">Nome de Guerra</label>
                          <input id="epi-nome-guerra" name="epi-nome-guerra" className="modal-input" required value={editingBombeiro?.nome_guerra || newBombeiro.nome_guerra} onChange={e => editingBombeiro ? setEditingBombeiro({...editingBombeiro, nome_guerra: e.target.value}) : setNewBombeiro({...newBombeiro, nome_guerra: e.target.value})} placeholder="Ex: SGT CUNHA" />
                        </div>
                        <div>
                          <label htmlFor="epi-saram" className="modal-label">SARAM (7 dígitos)</label>
                          <input 
                            id="epi-saram"
                            name="epi-saram"
                            className="modal-input" required maxLength={7} minLength={7} pattern="[0-9]{7}"
                            value={editingBombeiro?.saram || newBombeiro.saram} 
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 7) {
                                editingBombeiro ? setEditingBombeiro({...editingBombeiro, saram: val}) : setNewBombeiro({...newBombeiro, saram: val});
                              }
                            }}
                            placeholder="0000000"
                          />
                        </div>
                        <div>
                          <label htmlFor="bombeiro-tipo" className="modal-label">Tipo de Efetivo</label>
                          <select id="bombeiro-tipo" name="bombeiro-tipo" className="modal-input" value={editingBombeiro?.tipo || newBombeiro.tipo} onChange={e => editingBombeiro ? setEditingBombeiro({...editingBombeiro, tipo: e.target.value as any}) : setNewBombeiro({...newBombeiro, tipo: e.target.value as any})}>
                            <option value="INTERNO">Interno</option>
                            <option value="EXTERNO">Externo</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="bombeiro-funcao" className="modal-label">Função nO SESCINC</label>
                          <select id="bombeiro-funcao" name="bombeiro-funcao" className="modal-input" value={editingBombeiro?.funcao || newBombeiro.funcao} onChange={e => editingBombeiro ? setEditingBombeiro({...editingBombeiro, funcao: e.target.value}) : setNewBombeiro({...newBombeiro, funcao: e.target.value})}>
                            <option value="">Selecione Função...</option>
                            {EPI_FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-4 flex flex-col md:flex-row gap-4 justify-end mt-2">
                          {editingBombeiro && (
                            <button type="button" onClick={() => setEditingBombeiro(null)} className="w-full md:w-auto px-8 bg-gray-100 text-gray-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                              Cancelar Edição
                            </button>
                          )}
                          <button disabled={loading} className="w-full md:w-auto px-10 bg-black text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2">
                            {loading ? <RefreshCw className="animate-spin" size={14} /> : (editingBombeiro?.id ? 'Atualizar Militar' : 'Cadastrar Militar')}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className="space-y-8 w-full">
            <div className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full relative">
                <label htmlFor="bombeiro-search" className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Buscar Bombeiro</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 z-10 pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input 
                    id="bombeiro-search"
                    className="modal-input pl-12 bg-gray-50 border-transparent focus:bg-white text-xs w-full" 
                    style={{ paddingLeft: '48px' }}
                    placeholder="Nome ou SARAM..." 
                    autoComplete="off"
                    value={bombeiroSearch || ''}
                    onChange={e => setBombeiroSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 w-full">
                <label htmlFor="epi-filter-type" className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Filtrar por Equipamento</label>
                <select 
                  id="epi-filter-type"
                  className="modal-input bg-gray-50 border-transparent focus:bg-white"
                  value={epiFilterType}
                  onChange={e => {
                    setEpiFilterType(e.target.value);
                    setEpiFilterSize('');
                  }}
                >
                  <option value="">Todos os Itens...</option>
                  {EPI_COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label htmlFor="epi-filter-size" className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Filtrar por Tamanho</label>
                <select 
                  id="epi-filter-size"
                  className="modal-input bg-gray-50 border-transparent focus:bg-white"
                  value={epiFilterSize}
                  onChange={e => setEpiFilterSize(e.target.value)}
                >
                  <option value="">Todos os Tamanhos...</option>
                  {(() => {
                    const filteredByCat = materiais.filter(m => m.categoria === 'EPI_PRETO' || m.categoria === 'EPI_AMARELO');
                    const filteredByType = epiFilterType 
                      ? filteredByCat.filter(m => m.item_epi === epiFilterType)
                      : filteredByCat;
                    
                    const uniqueSizes = Array.from(new Set(filteredByType.filter(m => m.tamanho).map(m => m.tamanho))).sort();
                    
                    return uniqueSizes.map(s => {
                      const count = filteredByType.filter(m => String(m.tamanho) === String(s)).length;
                      return <option key={s} value={s}>{s} ({count})</option>;
                    });
                  })()}
                </select>
              </div>
              {(epiFilterType || epiFilterSize) && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-6 animate-in zoom-in duration-300">
                  <div>
                    <p className="text-[8px] font-black text-red-400 uppercase tracking-widest">Em Uso</p>
                    <p className="text-xl font-black text-red-600">
                      {epiLoans.filter(l => String(l.status).trim().toUpperCase() === 'EM_USO' && (() => {
                        try {
                          return JSON.parse(l.pecas_json).some((p: any) => 
                            (!epiFilterType || String(p.type).trim().toUpperCase() === String(epiFilterType).trim().toUpperCase()) && 
                            (!epiFilterSize || String(p.size).trim().toUpperCase() === String(epiFilterSize).trim().toUpperCase())
                          );
                        } catch(e) { return false; }
                      })()).length}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-red-200"></div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Estoque</p>
                    <p className="text-xl font-black text-gray-900">
                      {materiais.filter(m => 
                        (!epiFilterType || m.item_epi === epiFilterType) && 
                        (!epiFilterSize || String(m.tamanho) === String(epiFilterSize)) && 
                        !epiLoans.filter(l => String(l.status).trim().toUpperCase() === 'EM_USO').some(l => {
                          try {
                            return JSON.parse(l.pecas_json).some((p: any) => String(p.number).trim().padStart(3, '0') === String(m.epi_numero || m.bmp || '').trim().padStart(3, '0') && String(p.type).trim().toUpperCase() === String(m.item_epi || '').trim().toUpperCase());
                          } catch(e) { return false; }
                        })
                      ).length}
                    </p>
                  </div>
                </div>
              )}
              <button 
                onClick={() => { setEpiFilterType(''); setEpiFilterSize(''); setBombeiroSearch(''); }}
                className="p-4 bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-200 transition-all"
                title="Limpar Filtros"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {['EPI_PRETO', 'EPI_AMARELO'].map(cat => (
                <div key={cat} className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                     <div className={cn("w-2 h-2 rounded-full", cat === 'EPI_PRETO' ? "bg-black" : "bg-yellow-400")} />
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                       {cat === 'EPI_PRETO' ? 'Conjunto EPI Preto' : 'Conjunto EPI Amarelo'}
                     </h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                     {EPI_COMPONENTS.map(piece => {
                       const inUse = epiLoans.filter(l => String(l.status).trim().toUpperCase() === 'EM_USO' && (() => {
                         try {
                           return JSON.parse(l.pecas_json).some((p: any) => String(p.type).trim().toUpperCase() === String(piece).trim().toUpperCase() && (String(p.category).trim().toUpperCase() === String(cat).trim().toUpperCase() || String(p.category).trim().toUpperCase() === 'PERMANENTE') && (!epiFilterSize || String(p.size).trim().toUpperCase() === String(epiFilterSize).trim().toUpperCase()));
                         } catch(e) { return false; }
                       })()).length;
                       const total = materiais.filter(m => m.item_epi === piece && (m.categoria === cat || m.categoria === 'PERMANENTE') && (!epiFilterSize || String(m.tamanho) === String(epiFilterSize))).length;
                       if (total === 0 && inUse === 0) return null;
                       return (
                         <div key={piece} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[8px] font-black uppercase text-gray-400 tracking-tighter mb-1 truncate">{piece}</p>
                            <div className="flex justify-between items-end">
                               <span className="text-xl font-black text-gray-900">{total - inUse}</span>
                               <span className="text-[8px] text-red-600 font-bold">USO: {inUse}</span>
                            </div>
                         </div>
                       );
                     })}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                 <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">
                   Militares {bombeiroSearch ? 'Filtrados' : 'Cadastrados'} ({
                     bombeiros.filter(b => 
                       (b.nome_guerra || '').toLowerCase().includes(bombeiroSearch.toLowerCase()) || 
                       String(b.saram || '').includes(bombeiroSearch)
                     ).length
                   })
                 </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr className="text-left">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Bombeiro</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">SARAM</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Função / Tipo</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">EPIs em Cautela</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bombeiros.filter(b => 
                      (b.nome_guerra || '').toLowerCase().includes(bombeiroSearch.toLowerCase()) || 
                      String(b.saram || '').includes(bombeiroSearch)
                    ).map(b => (
                      <tr key={b.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="p-6">
                          <span className="font-black text-gray-900 uppercase italic tracking-tighter">{b.nome_guerra}</span>
                        </td>
                        <td className="p-6 font-mono text-xs text-gray-500">{b.saram}</td>
                        <td className="p-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase text-gray-900">{b.funcao}</span>
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2 py-0.5 rounded-md w-fit",
                              b.tipo === 'INTERNO' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                            )}>{b.tipo}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          {epiLoans.filter(l => String(l.bombeiro_id) === String(b.id) && String(l.status).trim().toUpperCase() === 'EM_USO').map(loan => {
                            let pecas: any[] = [];
                            try { pecas = JSON.parse(loan.pecas_json); } catch(e) {}
                            return (
                              <div key={loan.id} className="flex flex-col gap-2">
                                <div className="flex flex-wrap gap-1">
                                  {pecas.map((p, idx) => (
                                    <div key={idx} className={cn(
                                      "min-w-[100px] p-2 rounded-xl border flex flex-col gap-0.5 shadow-sm transition-all hover:scale-105",
                                      p.category === 'EPI_PRETO' 
                                      ? "bg-gray-900 border-black text-white" 
                                      : "bg-yellow-50 border-yellow-200 text-yellow-900"
                                    )}>
                                       <div className="flex justify-between items-start">
                                          <span className="text-[7px] font-black uppercase opacity-60 tracking-widest">{p.type}</span>
                                          <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            p.category === 'EPI_PRETO' ? "bg-white" : "bg-yellow-500"
                                          )} />
                                       </div>
                                       <span className="text-[10px] font-black italic tracking-tighter">Nº {p.number}</span>
                                       <div className="mt-1 flex items-center gap-1">
                                          <div className="px-1.5 py-0.5 bg-white/20 rounded text-[8px] font-black">
                                            TAM: {p.size || '??'}
                                          </div>
                                       </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => returnEPI(loan.id)}
                                    className="text-[8px] font-black uppercase text-red-600 hover:bg-red-50 p-1 rounded w-fit flex items-center gap-1 border border-red-100"
                                  >
                                    <RefreshCw size={10} /> Devolver Tudo
                                  </button>
                                  <button 
                                    onClick={() => {
                                      generateEpiLoanReceipt(
                                        b, 
                                        pecas, 
                                        { 
                                          telefone: loan.solicitante_telefone || '-', 
                                          ramal: loan.solicitante_ramal || '-', 
                                          setor: loan.solicitante_setor || '-' 
                                        }, 
                                        loan.executor || 'Admin'
                                      );
                                    }}
                                    className="text-[8px] font-black uppercase text-indigo-600 hover:bg-indigo-50 p-1 rounded w-fit flex items-center gap-1 border border-indigo-100"
                                  >
                                    <Printer size={10} /> Reimprimir
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </td>
                        <td className="p-6">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { 
                              const loan = epiLoans.find(l => String(l.bombeiro_id) === String(b.id) && String(l.status).trim().toUpperCase() === 'EM_USO');
                              if (loan) alert('Militar já possui EPI em cautela. É necessário devolver antes de emprestar novamente.');
                              else { setShowEPILoanModal(true); setEditingBombeiro(b); }
                            }} className="ctrl-btn text-emerald-600 bg-emerald-50" title="Emprestar EPI"><Truck size={16} /></button>
                            
                            {currentUser?.nivel === 'ADMIN' && (
                              <>
                                <button onClick={() => { 
                                  setEditingBombeiro(b);
                                  setIsBombeiroCadastroOpen(true);
                                  document.getElementById('main-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
                                }} className="ctrl-btn text-blue-600 bg-blue-50" title="Editar Militar"><Edit size={16} /></button>
                                <button onClick={() => deleteBombeiro(b.id)} className="ctrl-btn text-red-600 bg-red-50" title="Excluir Militar"><Trash2 size={16} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {epiSubView === 'CADASTRO' && currentUser?.nivel === 'ADMIN' && (
        <div className="flex flex-col gap-12 animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 w-full transition-all">
            <button 
              type="button" 
              onClick={() => setIsEpiCadastroOpen(!isEpiCadastroOpen)}
              className="w-full flex justify-between items-center outline-none"
            >
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2">
                 <Shield size={20} className="text-red-600" /> {editingMaterial?.id ? 'Editar EPI' : 'Cadastrar Novo EPI'}
              </h3>
              {isEpiCadastroOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            <AnimatePresence>
              {isEpiCadastroOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={e => e.preventDefault()} className="space-y-6 mt-8 max-w-2xl mx-auto">
                    <div className="col-span-2">
                      <label className="modal-label mb-3 border-b pb-2 border-gray-100">Selecionar Categoria do EPI</label>
                      <div className="flex gap-4">
                         <button
                           onClick={() => setEditingMaterial({...(editingMaterial || {}), categoria: 'EPI_PRETO'})}
                           className={cn("flex-1 py-4 border-2 rounded-2xl font-black uppercase text-xs transition-all", editingMaterial?.categoria === 'EPI_PRETO' ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400")}
                         >
                           EPI Preto
                         </button>
                         <button
                           onClick={() => setEditingMaterial({...(editingMaterial || {}), categoria: 'EPI_AMARELO'})}
                           className={cn("flex-1 py-4 border-2 rounded-2xl font-black uppercase text-xs transition-all", editingMaterial?.categoria === 'EPI_AMARELO' ? "border-yellow-500 bg-yellow-500 text-yellow-950 shadow-lg shadow-yellow-500/30" : "border-gray-200 text-gray-500 hover:border-yellow-400")}
                         >
                           EPI Amarelo
                         </button>
                      </div>
                    </div>
                    <div className="col-span-2 mt-4">
                      <label htmlFor="epi-item" className="modal-label">Componente do Conjunto</label>
                      <select id="epi-item" name="epi-item" required className="modal-input" value={editingMaterial?.item_epi || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), item_epi: e.target.value})}>
                         <option value="">Selecione...</option>
                         {EPI_COMPONENTS.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="epi-num" className="modal-label">Nº de Controle EPI (001 a 999)</label>
                        <input 
                          id="epi-num"
                          name="epi-num"
                          required 
                          className="modal-input" 
                          maxLength={3}
                          placeholder="Ex: 001"
                          value={editingMaterial?.epi_numero || ''} 
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 3) setEditingMaterial({...(editingMaterial || {}), epi_numero: val});
                          }}
                        />
                      </div>
                      <div>
                        <label htmlFor="epi-tamanho" className="modal-label">Tamanho / Número</label>
                        <input 
                          id="epi-tamanho" 
                          name="epi-tamanho" 
                          required
                          className="modal-input" 
                          value={editingMaterial?.tamanho || ''} 
                          onChange={e => setEditingMaterial({...(editingMaterial || {}), tamanho: e.target.value.toUpperCase()})} 
                          placeholder="Ex: LG, 42" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="epi-validade" className="modal-label">Data de Validade</label>
                        <input 
                          id="epi-validade" 
                          name="epi-validade" 
                          type="date"
                          required
                          className="modal-input" 
                          value={editingMaterial?.validade_epi ? new Date(editingMaterial.validade_epi).toISOString().split('T')[0] : ''} 
                          onChange={e => setEditingMaterial({...(editingMaterial || {}), validade_epi: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label htmlFor="epi-aviso-validade" className="modal-label">Aviso Validade (Antes)</label>
                        <select 
                          id="epi-aviso-validade" 
                          className="modal-input" 
                          value={editingMaterial?.epi_aviso_validade || ''} 
                          onChange={e => setEditingMaterial({...(editingMaterial || {}), epi_aviso_validade: e.target.value})}
                        >
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="epi-status" className="modal-label">Situação Inicial</label>
                        <select id="epi-status" name="epi-status" required className="modal-input" value={editingMaterial?.situacao || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), situacao: e.target.value})}>
                           <option value="">Selecione...</option>
                           {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="epi-setor" className="modal-label">Setor de Guarda</label>
                        <select id="epi-setor" name="epi-setor" required className="modal-input" value={editingMaterial?.setor || ''} onChange={e => setEditingMaterial({...(editingMaterial || {}), setor: e.target.value})}>
                           <option value="">Selecione...</option>
                           {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col justify-end pb-1">
                        <label className="modal-label mb-3">Item Fora de Carga?</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={editingMaterial?.fora_de_carga === true || editingMaterial?.fora_de_carga === 'SIM'} 
                            onChange={e => setEditingMaterial({...(editingMaterial || {} as any), fora_de_carga: e.target.checked ? 'SIM' : 'NÃO'})} 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                          <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            {editingMaterial?.fora_de_carga === 'SIM' ? 'SIM' : 'NÃO'}
                          </span>
                        </label>
                      </div>
                      <div>
                        <label htmlFor="epi-bmp" className="modal-label">
                          Número BMP {editingMaterial?.fora_de_carga === 'NÃO' ? '(Obrigatório)' : '(Opcional)'}
                        </label>
                        <input 
                          id="epi-bmp"
                          name="epi-bmp"
                          required={editingMaterial?.fora_de_carga === 'NÃO'}
                          className="modal-input" 
                          value={editingMaterial?.bmp || ''} 
                          onChange={e => setEditingMaterial({...(editingMaterial || {}), bmp: e.target.value})} 
                          placeholder={editingMaterial?.fora_de_carga === 'NÃO' ? "Obrigatório" : "Ex: 501234"} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="epi-doc" className="modal-label">Documento /SP</label>
                        <input 
                          id="epi-doc"
                          name="epi-doc"
                          className="modal-input" 
                          value={editingMaterial?.documento || ''} 
                          onChange={e => setEditingMaterial({...(editingMaterial || {}), documento: e.target.value})} 
                          placeholder="Ex: SP 1234" 
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="epi-desc" className="modal-label">Descrição</label>
                      <textarea 
                        id="epi-desc"
                        name="epi-desc"
                        rows={2}
                        className="modal-input resize-none" 
                        value={editingMaterial?.descricao || ''} 
                        onChange={e => setEditingMaterial({...(editingMaterial || {}), descricao: e.target.value})} 
                        placeholder="Descrição detalhada do EPI..." 
                      />
                    </div>

                    <div>
                      <label htmlFor="epi-obs" className="modal-label">Observações</label>
                      <textarea 
                        id="epi-obs"
                        name="epi-obs"
                        rows={2}
                        className="modal-input resize-none" 
                        value={editingMaterial?.observacoes || ''} 
                        onChange={e => setEditingMaterial({...(editingMaterial || {}), observacoes: e.target.value})} 
                        placeholder="Detalhes adicionais..." 
                      />
                    </div>

                    <button 
                       type="button"
                       onClick={async () => {
                         if (!editingMaterial?.categoria || !editingMaterial?.item_epi || !editingMaterial?.epi_numero || !editingMaterial?.tamanho || !editingMaterial?.validade_epi || !editingMaterial?.situacao || !editingMaterial?.setor) {
                           return alert('Preencha todos os campos do EPI.');
                         }
                         if (editingMaterial?.fora_de_carga === 'NÃO' && !editingMaterial?.bmp) {
                           return alert('O número BMP é obrigatório quando o EPI está em carga.');
                         }
                         try {
                           const copy: any = { 
                             ...editingMaterial, 
                             bmp: editingMaterial.bmp || '',
                             descricao: `${editingMaterial.item_epi} - ${editingMaterial.categoria.replace('_', ' ')} Nº ${editingMaterial.epi_numero}`,
                           };
                           const resData = await saveMaterial(null, copy);
                           if (!resData || !resData.success) return;

                           setEditingMaterial(null);
                           alert('EPI Salvo com Sucesso!');
                         } catch (err) {
                           if (err instanceof Error && err.message === 'Invalid Session') return;
                           alert('Erro ao salvar EPI');
                         }
                       }}
                       disabled={loading} 
                       className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCw className="animate-spin" size={16} /> : (editingMaterial?.id ? 'Atualizar EPI' : 'Adicionar EPI ao Sistema')}
                    </button>
                    
                    {editingMaterial?.id && (
                      <button type="button" onClick={() => setEditingMaterial(null)} className="w-full text-gray-500 py-3 uppercase font-black text-[10px] tracking-widest">
                        Cancelar Edição
                      </button>
                    )}
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filtros da Lista de EPIs */}
          <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Cor</label>
              <select className="modal-input bg-gray-50 border-transparent focus:bg-white" value={epiListFilterColor} onChange={e => setEpiListFilterColor(e.target.value)}>
                <option value="">Todas</option>
                <option value="EPI_PRETO">Preto</option>
                <option value="EPI_AMARELO">Amarelo</option>
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Tipo de Peça</label>
              <select className="modal-input bg-gray-50 border-transparent focus:bg-white" value={epiListFilterType} onChange={e => { setEpiListFilterType(e.target.value); setEpiListFilterSize(''); }}>
                <option value="">Todos</option>
                {EPI_COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Tamanho</label>
              <select className="modal-input bg-gray-50 border-transparent focus:bg-white" value={epiListFilterSize} onChange={e => setEpiListFilterSize(e.target.value)}>
                <option value="">Todos</option>
                {Array.from(new Set(materiais.filter(m => {
                  const catStr = String(m.categoria || '').toUpperCase().trim();
                  const itemStr = String(m.item_epi || m.descricao || '').toUpperCase().trim();
                  return (catStr === 'EPI_PRETO' || catStr === 'EPI_AMARELO') && (!epiListFilterType || itemStr === epiListFilterType) && m.tamanho;
                }).map(m => m.tamanho))).sort().map(s => (
                  <option key={String(s)} value={String(s)}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Situação</label>
              <select className="modal-input bg-gray-50 border-transparent focus:bg-white" value={epiListFilterStatus} onChange={e => setEpiListFilterStatus(e.target.value)}>
                <option value="">Todas</option>
                <option value="PERFEITO">Perfeito</option>
                <option value="REGULAR">Regular</option>
                <option value="INSERVÍVEL">Inservível</option>
              </select>
            </div>
            <button 
              onClick={() => { setEpiListFilterColor(''); setEpiListFilterType(''); setEpiListFilterSize(''); setEpiListFilterStatus(''); }}
              className="mt-6 md:mt-4 p-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors" title="Limpar Filtros"
            ><FilterX size={16} /></button>
          </div>

          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">
                EPIs Cadastrados no Sistema ({materiais.filter(m => {
                  const cat = String(m.categoria || '').toUpperCase().trim();
                  if (cat !== 'EPI_PRETO' && cat !== 'EPI_AMARELO') return false;
                  if (epiListFilterColor && cat !== epiListFilterColor) return false;
                  if (epiListFilterType && String(m.item_epi || m.descricao || '').toUpperCase().trim() !== epiListFilterType) return false;
                  if (epiListFilterSize && String(m.tamanho) !== String(epiListFilterSize)) return false;
                  if (epiListFilterStatus && String(m.situacao || '').toUpperCase().trim() !== epiListFilterStatus) return false;
                  return true;
                }).length})
              </h3>
            </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr className="text-left">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Componente</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Nº / BMP</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Tamanho</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Validade</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Situação</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {materiais.filter(m => {
                  const cat = String(m.categoria || '').toUpperCase().trim();
                  if (cat !== 'EPI_PRETO' && cat !== 'EPI_AMARELO') return false;
                  if (epiListFilterColor && cat !== epiListFilterColor) return false;
                  if (epiListFilterType && String(m.item_epi || m.descricao || '').toUpperCase().trim() !== epiListFilterType) return false;
                  if (epiListFilterSize && String(m.tamanho) !== String(epiListFilterSize)) return false;
                  if (epiListFilterStatus && String(m.situacao || '').toUpperCase().trim() !== epiListFilterStatus) return false;
                  return true;
                }).map(m => (
                  <tr 
                    key={m.id} 
                    className="group hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", m.categoria === 'EPI_PRETO' ? "bg-black" : "bg-yellow-400")} />
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 uppercase italic tracking-tighter">{m.item_epi}</span>
                          {m.descricao && <span className="text-[10px] text-gray-400 normal-case italic leading-tight">{m.descricao}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black">Nº {m.epi_numero}</span>
                        {m.bmp && <span className="text-[10px] text-gray-400">BMP: {m.bmp}</span>}
                      </div>
                    </td>
                    <td className="p-6 text-xs font-bold text-gray-600 uppercase">{m.tamanho}</td>
                    <td className="p-6">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded-lg",
                        m.validade_epi && new Date(m.validade_epi) < new Date() ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                      )}>
                        {m.validade_epi ? new Date(m.validade_epi).toLocaleDateString('pt-BR') : 'Sem Data'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-gray-500">{m.situacao}</span>
                        {(() => {
                          const loan = epiLoans.find(l => 
                            String(l.status).trim().toUpperCase() === 'EM_USO' && 
                            (() => {
                              try {
                                return JSON.parse(l.pecas_json).some((p: any) => 
                                  String(p.number).trim().padStart(3, '0') === String(m.epi_numero || m.bmp || '').trim().padStart(3, '0') && 
                                  String(p.type).trim().toUpperCase() === String(m.item_epi || '').trim().toUpperCase()
                                );
                              } catch(e) { return false; }
                            })()
                          );
                          if (loan) {
                            const bombeiro = bombeiros.find(b => String(b.id) === String(loan.bombeiro_id));
                            return (
                              <span className="text-[9px] font-bold text-red-600 mt-1 uppercase">
                                {bombeiro ? bombeiro.nome_guerra : `ID ${loan.bombeiro_id}`}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="p-6">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => {
                            setEditingMaterial(m);
                            setIsEpiCadastroOpen(true);
                            document.getElementById('main-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
                          }} className="ctrl-btn text-blue-600 bg-blue-50"><Edit size={16} /></button>
                          <button onClick={() => deleteMaterial(m)} className="ctrl-btn text-red-600 bg-red-50"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
