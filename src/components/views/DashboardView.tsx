import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Boxes, Database, Shield, ShieldAlert, Filter, X, Search, RefreshCw, Plus, ArrowRightLeft, Download, FileText, Edit, Trash2, MessageCircle, Siren } from 'lucide-react';
import { exportToExcel, generatePDFReport } from '../../lib/exportUtils';
import { Stats, Sector, Material } from '../../types';
import { cn } from '../../lib/utils';
import { CATEGORIES, EPI_COMPONENTS, SITUACOES } from '../../constants';
import { StatusPieChart } from '../DashboardCharts';

interface DashboardViewProps {
  dashboardView: 'STATS' | 'WORKSPACE';
  setDashboardView: (v: 'STATS' | 'WORKSPACE') => void;
  stats: Stats | null;
  barChartOption: 'ALL' | 'NO_DISCH';
  setBarChartOption: (v: 'ALL' | 'NO_DISCH') => void;
  barChartMeasure: 'QTY' | 'UNITS';
  setBarChartMeasure: (v: 'QTY' | 'UNITS') => void;
  dashboardChartOption: 'ALL' | 'NO_DISCH';
  setDashboardChartOption: (v: 'ALL' | 'NO_DISCH') => void;
  filters: any;
  setFilters: (f: any) => void;
  executeFilter: (v: string, f?: any) => void;
  sectores: Sector[];
  materiais: Material[];
  loading?: boolean;
  currentUser?: any;
  setEditingMaterial?: (m: any) => void;
  setShowMaterialModal?: (show: boolean) => void;
  hasSearched?: boolean;
  selectedForLoan?: number[];
  setSelectedForLoan?: (ids: number[]) => void;
  setShowLoanModal?: (show: boolean) => void;
  deleteMaterial?: (m: any) => void;
  setView?: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dashboardView, setDashboardView, stats,
  barChartOption, setBarChartOption,
  barChartMeasure, setBarChartMeasure,
  dashboardChartOption, setDashboardChartOption,
  filters, setFilters, executeFilter, sectores, materiais,
  loading, currentUser, setEditingMaterial, setShowMaterialModal,
  hasSearched = false, selectedForLoan = [], setSelectedForLoan = () => {},
  setShowLoanModal = () => {}, deleteMaterial = () => {}, setView = () => {}
}) => {
  React.useEffect(() => {
    if (filters.bmp) setFilters({ ...filters, bmp: '' });
  }, []);

  return (
    <div key="dash-view-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase italic">
            {dashboardView === 'STATS' ? 'DASHBOARD ESTATÍSTICO' : 'ÁREA DE TRABALHO'}
          </h2>
          <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2 italic">DASHBOARD de Inventário - SESCINC-CO</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto overflow-hidden shadow-inner">
           <button onClick={() => setDashboardView('STATS')} className={cn("flex-1 md:flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2", dashboardView === 'STATS' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:bg-gray-200/50")}>
             <BarChart3 size={16} /> Estatísticas
           </button>
           <button onClick={() => setDashboardView('WORKSPACE')} className={cn("flex-1 md:flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2", dashboardView === 'WORKSPACE' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-200/50")}>
             <Boxes size={16} /> Área de Trabalho
           </button>
        </div>
      </div>

      {dashboardView === 'STATS' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 text-[11px]">
             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-red-200 transition-colors">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 italic">Total de BMPs Ativos</p>
                <div className="flex items-end justify-between">
                   <h4 className="text-3xl font-black text-gray-900">{stats?.totalAtivos || 0}</h4>
                   <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform"><Boxes size={24} /></div>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-blue-200 transition-colors">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 italic">Histórico BMP (Total)</p>
                <div className="flex items-end justify-between">
                   <h4 className="text-3xl font-black text-gray-900">{stats?.totalHistorico || 0}</h4>
                   <div className="p-3 bg-gray-50 text-gray-600 rounded-2xl group-hover:scale-110 transition-transform"><Database size={24} /></div>
                </div>
             </div>
             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-between group hover:border-green-200 transition-colors">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 italic">Média de Prontidão</p>
                <div className="flex items-end justify-between">
                   <h4 className="text-3xl font-black text-green-600">
                      {stats && stats.totalAtivos > 0 ? ((stats.byStatus['PERFEITO'] || 0) / stats.totalAtivos * 100).toFixed(1) : 0}%
                   </h4>
                   <div className="p-3 bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform"><Shield size={24} /></div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 text-[11px]">
             {/* Left Chart: Categories */}
             <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm flex flex-col italic">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                   <div className="flex items-center gap-3">
                      <BarChart3 className="text-red-600" size={24} />
                           <h3 className="font-black text-xs uppercase tracking-widest text-gray-900">Distribuição por Categoria</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                        <button onClick={() => setBarChartOption('NO_DISCH')} className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", barChartOption === 'NO_DISCH' ? "bg-white shadow-sm text-red-600" : "text-gray-400")}>Sem Desc.</button>
                        <button onClick={() => setBarChartOption('ALL')} className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", barChartOption === 'ALL' ? "bg-white shadow-sm text-red-600" : "text-gray-400")}>Com Desc.</button>
                      </div>
                          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner"> {/* Botões de Qtde/Unid */}
                            <button onClick={() => setBarChartMeasure('QTY')} className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", barChartMeasure === 'QTY' ? "bg-white shadow-sm text-indigo-600" : "text-gray-400")}>Qtde</button>
                            <button onClick={() => setBarChartMeasure('UNITS')} className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", barChartMeasure === 'UNITS' ? "bg-white shadow-sm text-indigo-600" : "text-gray-400")}>Unid</button>
                      </div>
                    </div>
                 </div>
                 <div className="space-y-4 flex-1">
                   {(() => {
                      // Correção da inversão: UNITS usa dados de unidades, QTY usa contagem de registros
                      const baseData = barChartMeasure === 'UNITS' ? (barChartOption === 'ALL' ? stats?.byCategoryUnits : stats?.byCategoryFilteredUnits) : (barChartOption === 'ALL' ? stats?.byCategory : stats?.byCategoryFiltered);
                      // Restaurando o filtro original: exibe apenas as categorias de acervo técnico
                      const entries = Object.entries(baseData || {}).filter(([catId]) => ['PERMANENTE', 'CONSUMO', 'EXTINTORES'].includes(catId));
                      if (entries.length === 0) return <p className="text-center text-gray-400 uppercase font-black py-20">Sem dados</p>;
                      const sorted = entries.sort((a,b) => (b[1] as number) - (a[1] as number));
                      const total = sorted.reduce((acc, [_, count]) => acc + (count as number), 0);
                      return sorted.map(([catId, count]) => {
                         const catDef = CATEGORIES.find(c => c.id === catId);
                         const perc = total > 0 ? ((count as number) / total * 100) : 0;
                         return (
                           <div key={catId} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-black uppercase italic">
                                 <span>{catDef?.label || catId}</span>
                                 <span>{count as number} ({perc.toFixed(1)}%)</span>
                              </div>
                              <div className="h-2 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                                 <motion.div initial={{ width: 0 }} animate={{ width: `${perc}%` }} transition={{ duration: 1 }} className="h-full bg-red-600" />
                              </div>
                           </div>
                         );
                      });
                   })()}
                 </div>
             </div>

             {/* Right Chart: Status Pie */}
             <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm italic">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                   <div className="flex items-center gap-3">
                      <ShieldAlert className="text-red-600" size={24} />
                      <h3 className="font-black text-xs uppercase tracking-widest text-gray-900">Saúde do Inventário</h3>
                   </div>
                   <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                    <button onClick={() => setDashboardChartOption('NO_DISCH')} className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", dashboardChartOption === 'NO_DISCH' ? "bg-white shadow-sm text-red-600" : "text-gray-400")}>Sem Desc.</button>
                      <button onClick={() => setDashboardChartOption('ALL')} className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", dashboardChartOption === 'ALL' ? "bg-white shadow-sm text-red-600" : "text-gray-400")}>Com Desc.</button>   
                   </div>
                </div>
                <StatusPieChart 
                   data={(() => {
                      const rawStats = stats?.byStatus || {};
                      const grouped: Record<string, number> = {
                        'EM USO': Number(rawStats['EM_USO'] || rawStats['EM USO'] || 0),
                        'AVARIADO': Number(rawStats['AVARIADO'] || 0),
                        'CONDENADO': Number(rawStats['CONDENADO'] || 0),
                        'PROCES. DESCARG.': Number(rawStats['PROCES. DESCARG.'] || 0),
                        'EM TRANSF.': Number(rawStats['EM TRANSF.'] || 0),
                        'Ñ ENCONTRADO': Number(rawStats['Ñ ENCONTRADO'] || 0),
                        'SAÍDA': Number(rawStats['DESCARREGADO'] || 0) + Number(rawStats['TRANSFERIDO'] || 0),
                        'PERFEITO': Number(rawStats['PERFEITO'] || 0),
                      };
                      return Object.entries(grouped)
                        .filter(([name, v]) => {
                          if (v <= 0) return false;
                          // Se a opção for 'Sem Desc.', removemos a categoria 'SAÍDA' do gráfico de pizza
                          if (dashboardChartOption === 'NO_DISCH' && name === 'SAÍDA') return false;
                          return true;
                        })
                        .map(([name, value]) => ({ name, value }));
                   })()}
                />
             </div>
          </div>

          {/* Detailed Status Grid */}
          <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm mb-10 text-[11px] italic">
             <div className="flex items-center gap-3 mb-8">
                <ShieldAlert className="text-red-600" size={24} />
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 italic underline">Estatísticas de Prontidão Detalhadas</h3>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(stats?.byStatus || {}).sort((a,b) => (b[1] as number) - (a[1] as number)).map(([sit, count]) => {
                   const perc = stats && stats.totalHistorico > 0 ? ((count as number) / stats.totalHistorico * 100) : 0;
                   return (
                     <div key={sit} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:scale-105 transition-transform duration-300 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter truncate w-2/3">{sit}</p>
                           <span className="text-[8px] font-black text-red-600 bg-red-50 px-1.5 rounded-full">{perc.toFixed(1)}%</span>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{count as number}</p>
                     </div>
                   );
                })}
             </div>
          </div>
        </motion.div>
      )}

      {dashboardView === 'WORKSPACE' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          {/* Workspace Filter Panel (Already simplified, just refactor layout) */}
          <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 mb-8 ring-1 ring-black/5 italic">
            <div className="flex items-center gap-3 mb-6 not-italic">
               <div className="p-2 bg-red-50 text-red-600 rounded-xl"><Filter size={20} /></div>
               <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Filtros de Inventário Especializado</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 text-[11px]">
              <div className="space-y-2">
                <label className="filter-label">Palavra-Chave</label>
                <input 
                  className="filter-input uppercase" 
                  value={filters.keyword} 
                  onChange={e => setFilters({...filters, keyword: e.target.value})} 
                  onKeyDown={e => e.key === 'Enter' && executeFilter('DASHBOARD', { ...filters, keyword: e.currentTarget.value })}
                  placeholder="BUSCAR..." 
                />
              </div>
              <div className="space-y-2">
                <label className="filter-label">Setor / Localização</label>
                <select className="filter-input uppercase" value={filters.setor} onChange={e => {
                  const nf = {...filters, setor: e.target.value};
                  setFilters(nf);
                  executeFilter('DASHBOARD', nf);
                }}>
                   <option value="">Todos os Setores</option>
                   {sectores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="filter-label">Situação</label>
                <select className="filter-input uppercase" value={filters.situacao} onChange={e => {
                  const nf = {...filters, situacao: e.target.value};
                  setFilters(nf);
                  executeFilter('DASHBOARD', nf);
                }}>
                   <option value="">Todas</option>
                   {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="filter-label">Categoria</label>
                <select className="filter-input uppercase" value={filters.categoria} onChange={e => {
                  const nf = {...filters, categoria: e.target.value, item_epi: '', extintor_tipo: '', extintor_peso: ''};
                  setFilters(nf);
                  executeFilter('DASHBOARD', nf);
                }}>
                   <option value="">Todas</option>
                   {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              {filters.categoria === 'EXTINTORES' && (
                <>
                  <div className="space-y-2">
                    <label className="filter-label">Tipo de Extintor</label>
                    <select className="filter-input uppercase" value={filters.extintor_tipo} onChange={e => {
                      const nf = {...filters, extintor_tipo: e.target.value};
                      setFilters(nf);
                      executeFilter('DASHBOARD', nf);
                    }}>
                      <option value="">Todos os Tipos</option>
                      {Array.from(new Set(materiais.filter(m => m.categoria === 'EXTINTORES' && m.extintor_tipo).map(m => m.extintor_tipo))).sort().map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="filter-label">Peso / Capacidade</label>
                    <select className="filter-input uppercase" value={filters.extintor_peso} onChange={e => {
                      const nf = {...filters, extintor_peso: e.target.value};
                      setFilters(nf);
                      executeFilter('DASHBOARD', nf);
                    }}>
                      <option value="">Todas Capacidades</option>
                      {Array.from(new Set(materiais.filter(m => m.categoria === 'EXTINTORES' && m.extintor_peso).map(m => m.extintor_peso))).sort().map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label className="filter-label">Documento</label>
                <input 
                  className="filter-input uppercase" 
                  value={filters.documento || ''} 
                  onChange={e => setFilters({...filters, documento: e.target.value})} 
                  onKeyDown={e => e.key === 'Enter' && executeFilter('DASHBOARD', { ...filters, documento: e.currentTarget.value })}
                  placeholder="SP, OC, OBS..." 
                />
              </div>
            </div>
            
            {/* Quick Filters Toggles */}
            <div className="mt-8 pt-8 border-t border-gray-50 flex flex-wrap gap-4 items-center uppercase font-black text-[9px] italic">
               {[
                 { id: 'ti', label: 'TI (Tec)', field: 'ti' },
                 { id: 'hi', label: 'Hidráulicos', field: 'hi' },
                 { id: 'aph', label: 'APH / Resgate', field: 'aph' },
                 { id: 'instr', label: 'Instrução', field: 'instr' },                 
                 { id: 'altura', label: 'Altura (NR35)', field: 'altura' },
                 { id: 'ext', label: 'Ocultar Extintores', field: 'exibir_extintores', inverted: true },
                 { id: 'fc', label: 'Fora de Carga', field: 'fora_de_carga' }
               ].map(toggle => (
                 <label key={toggle.id} className="flex items-center gap-3 bg-gray-50 hover:bg-red-50 p-3 rounded-2xl cursor-pointer transition-colors border border-transparent has-[:checked]:border-red-100 has-[:checked]:bg-red-50/50">
                    <input type="checkbox" className="sr-only peer" checked={toggle.inverted ? !filters[toggle.field] : filters[toggle.field]} onChange={e => {
                      const nf = {...filters, [toggle.field]: toggle.inverted ? !e.target.checked : e.target.checked};
                      setFilters(nf);
                      executeFilter('DASHBOARD', nf);
                    }} />
                    <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:bg-red-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 peer-checked:after:translate-x-4 relative" />
                    <span className="peer-checked:text-red-700 transition-colors uppercase">{toggle.label}</span>
                 </label>
               ))}

               <div className="ml-auto flex items-center gap-2 not-italic">
                 <button
                  onClick={() => {
                    const cleared = {
                      keyword: '', bmp: '', documento: '', setor: '', situacao: '', categoria: '',
                      ti: false, hi: false, aph: false, instr: false, altura: false,
                      fora_de_carga: false, exibir_extintores: true, exibir_descarregados: false,
                      extintor_tipo: '', extintor_peso: '', clearanceSearch: ''
                    };
                    setFilters(cleared);
                    executeFilter('DASHBOARD', cleared);
                  }}
                  disabled={loading}
                  title="Limpar Filtros"
                  className="p-5 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                 >
                   <X size={18} />
                 </button>
                 <button
                  onClick={() => executeFilter('DASHBOARD')} disabled={loading}
                  title="Atualizar Consulta"
                  className="bg-black text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-all flex items-center gap-2 shadow-xl shadow-black/10 hidden md:flex"
                 >
                   {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                   Pesquisar
                 </button>
                 {currentUser?.nivel === 'ADMIN' && (
                   <button onClick={() => { setEditingMaterial?.({}); setShowMaterialModal?.(true); }} className="bg-red-600 text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/30 flex items-center gap-2">
                      <Plus size={16} /> Cadastrar
                   </button>
                 )}
               </div>
            </div>
          </section>

          {/* Loader de Carregamento Independente */}
          {loading && <div className="flex justify-center py-10 opacity-50"><RefreshCw className="animate-spin" /></div>}

          {/* Results Container */}
          {hasSearched ? (
            materiais.length > 0 ? (
              <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/30 gap-4">
                   <div className="flex items-center gap-4">
                      <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest">Materiais Identificados ({materiais.length})</h4>
                      {selectedForLoan.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setShowLoanModal?.(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                          >
                            <ArrowRightLeft size={14} /> Emprestar ({selectedForLoan.length})
                          </button>
                          <button 
                            onClick={() => setSelectedForLoan?.([])}
                            className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                          >
                            Limpar
                          </button>
                        </div>
                      )}
                   </div>
                   <div className="flex gap-2 w-full md:w-auto">
                     <button onClick={() => exportToExcel(materiais, 'relatorio_sescinc')} className="export-btn flex-1 justify-center bg-green-50 text-green-700">
                       <Download size={16} /> Excel
                     </button>
                     <button onClick={() => generatePDFReport(materiais, 'Relatório Geral de Carga')} className="export-btn flex-1 justify-center bg-red-50 text-red-700">
                       <FileText size={16} /> PDF
                     </button>
                   </div>
                </div>

                {/* Resumo por Situação (Filtrado) */}
                <div className="px-6 md:px-8 py-4 bg-white border-b border-gray-50 flex flex-wrap gap-3">
                   {Object.entries(
                     materiais.reduce((acc, current) => {
                       const sit = current.situacao || 'Indefinido';
                       const q = Number(current.quantidade) || 1;
                       acc[sit] = (acc[sit] || 0) + q;
                       return acc;
                     }, {} as Record<string, number>)
                   ).map(([situacao, count]) => (
                     <div key={situacao} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{situacao}</span>
                       <span className="bg-white text-slate-700 px-2 py-0.5 rounded-lg text-xs font-black shadow-sm border border-slate-100">{count}</span>
                     </div>
                   ))}
                   <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 ml-auto shadow-lg shadow-black/5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Itens</span>
                      <span className="bg-red-600 text-white px-2 py-0.5 rounded-lg text-xs font-black">
                        {materiais.reduce((sum, current) => sum + (Number(current.quantidade) || 1), 0)}
                      </span>
                   </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                       <tr className="text-left">
                          <th className="table-header w-10">
                             <input 
                               type="checkbox" 
                               className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer"
                     checked={materiais.length > 0 && materiais.every(m => selectedForLoan.includes(m.id))}
                               onChange={(e) => {
                       if (e.target.checked) {
                         const newIds = materiais.map(m => m.id).filter(id => !selectedForLoan.includes(id));
                         setSelectedForLoan([...selectedForLoan, ...newIds]);
                       } else {
                         const visibleIds = materiais.map(m => m.id);
                         setSelectedForLoan(selectedForLoan.filter(id => !visibleIds.includes(id)));
                       }
                               }}
                             />
                          </th>
                <th className="table-header">BMP</th>
                <th className="table-header text-center">Qtde</th>
                <th className="table-header">Descrição Técnica</th>
                <th className="table-header">Estado atual</th>
                <th className="table-header">Setor / Posição</th>
                          <th className="table-header text-right">Ações</th>
                       </tr>
                    </thead>
          <tbody className="divide-y divide-gray-50">
             {materiais.filter(item => item && item.id).map(item => {
               const isConsumo = item.categoria === 'CONSUMO';
               const isTruthy = (val: any) => val === true || val === 'SIM' || val === 'TRUE' || val === 1 || val === '1';
               
               return (
               <tr 
                 key={item.id} 
                 className={cn("hover:bg-red-50/20 group transition-colors", selectedForLoan.includes(item.id) && "bg-red-50/40")}
                 title={[
                   item.documento ? `Documento: ${item.documento}` : '',
                   item.observacoes ? `Observações: ${item.observacoes}` : ''
                 ].filter(Boolean).join('\n') || undefined}
               >
                  <td className="p-6 w-10 text-center">
                               <input 
                                 type="checkbox" 
                                 className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer"
                       checked={selectedForLoan.includes(item.id)}
                                 onChange={(e) => {
                         if (e.target.checked) setSelectedForLoan([...selectedForLoan, item.id]);
                         else setSelectedForLoan(selectedForLoan.filter(id => id !== item.id));
                                 }}
                               />
                            </td>
                  <td className="p-6">
                     <span className="font-mono font-bold text-red-600 text-sm">#{item.bmp}</span>
                  </td>
                  <td className="p-6 text-center">
                     <span className="font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">
                       {item.quantidade || 1}
                     </span>
                  </td>
                  <td className="p-6">
                     <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">
                           {item.item_epi && <span className="text-red-600 font-black mr-1">[{item.item_epi}]</span>}
                           {item.descricao}
                           {item.observacoes && (
                             <button 
                               title={item.observacoes}
                               onClick={() => alert(`Observações do Item #${item.bmp}:\n\n${item.observacoes}`)}
                               className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all"
                             >
                               <MessageCircle size={10} />
                             </button>
                           )}
                        </span>
                         <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] uppercase font-black text-gray-400">{item.categoria}</span>
                            {item.conta && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded uppercase tracking-tighter">Conta: {item.conta}</span>}
                            {item.classe && <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 rounded uppercase tracking-tighter">Classe: {item.classe}</span>}
                         </div>
                         <div className="flex gap-2 mt-1 flex-wrap">
                                          {item.classificacao && <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded uppercase font-black">{item.classificacao}</span>}
                            {isTruthy(item.ti) && <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded uppercase font-black">TI</span>}
                            {isTruthy(item.hi) && <span className="text-[8px] bg-cyan-100 text-cyan-700 px-1 py-0.5 rounded uppercase font-black">HIDR</span>}
                            {isTruthy(item.aph) && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded uppercase font-black">APH</span>}
                            {isTruthy(item.instr) && <span className="text-[8px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded uppercase font-black">INSTR</span>}
                            {isTruthy(item.altura) && <span className="text-[8px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded uppercase font-black">ALTURA</span>}
                            {item.categoria === 'EXTINTORES' && item.extintor_tipo && (
                              <span className="text-[8px] bg-red-600 text-white px-1 py-0.5 rounded uppercase font-black">
                                {item.extintor_tipo} {item.extintor_peso ? `- ${item.extintor_peso}` : ''}
                              </span>
                            )}
                         </div>
                     </div>
                  </td>
                  <td className="p-6">
                     <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ring-1",
                        item.situacao === 'PERFEITO' ? "bg-green-50 text-green-700 ring-green-100" : "bg-red-50 text-red-700 ring-red-100"
                     )}>
                        {item.situacao}
                     </span>
                  </td>
                  <td className="p-6 text-xs text-gray-500 font-medium uppercase">{item.setor}</td>
                  <td className="p-6 text-right">
                     <div className={cn("flex justify-end gap-2 transition-opacity", selectedForLoan.includes(item.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                        {selectedForLoan.includes(item.id) && (
                          <>
                            <button onClick={() => setShowLoanModal(true)} className="ctrl-btn text-emerald-600 bg-emerald-50 px-3 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Emprestar</button>
                            {isConsumo && (
                              <button onClick={() => setView('STOCK')} className="ctrl-btn text-indigo-600 bg-indigo-50 px-3 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">Pagar</button>
                            )}
                          </>
                        )}
                        <button onClick={() => { setEditingMaterial?.(item); setShowMaterialModal?.(true); }} className="ctrl-btn text-blue-600 bg-blue-50"><Edit size={16} /></button>
                        {currentUser?.nivel === 'ADMIN' && (
                          <button onClick={() => deleteMaterial(item)} className="ctrl-btn text-red-600 bg-red-50"><Trash2 size={16} /></button>
                        )}
                     </div>
                  </td>
               </tr>
               );
             })}
                    </tbody>
                  </table>
                </div>

               
                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-gray-100 italic">
                    {materiais.filter(item => item && item.id).map(item => (
                        <div 
                          key={item.id} 
                          className="p-5 flex flex-col gap-4"
                          title={[
                            item.documento ? `Documento: ${item.documento}` : '',
                            item.observacoes ? `Observações: ${item.observacoes}` : ''
                          ].filter(Boolean).join('\n') || undefined}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                   <span className="font-mono font-black text-red-600 text-xs">BMP #{item.bmp}</span>
                                   {item.quantidade && (
                                     <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold w-fit">
                                       Qtd: {item.quantidade}
                                     </span>
                                   )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedForLoan.includes(item.id as number) && (
                                    <div className="flex flex-col gap-1 mr-2">
                                      <button onClick={(e) => { e.stopPropagation(); setShowLoanModal?.(true); }} className="flex-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest">Empréstimo</button>
                                      {item.categoria === 'CONSUMO' && (
                                        <button onClick={(e) => { e.stopPropagation(); setView?.('STOCK'); }} className="flex-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest">Pagar</button>
                                      )}
                                    </div>
                                  )}
                                   <input 
                                     type="checkbox" 
                                     className="w-5 h-5 rounded border-gray-300 text-red-600"
                                     checked={selectedForLoan.includes(item.id as number)}
                                     onChange={(e) => {
                                       if (e.target.checked) setSelectedForLoan?.([...selectedForLoan, item.id as number]);
                                       else setSelectedForLoan?.(selectedForLoan.filter(id => id !== item.id));
                                     }}
                                   />
                                   <span className={cn(
                                      "px-2 py-1 rounded-lg text-[8px] font-black uppercase ring-1",
                                      item.situacao === 'PERFEITO' ? "bg-green-50 text-green-700 ring-green-100" : "bg-red-50 text-red-700 ring-red-100"
                                   )}>{item.situacao}</span>
                                </div>
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-gray-900 leading-tight">
                                   {item.item_epi && <span className="text-red-600 font-black mr-1">[{item.item_epi}]</span>}
                                   {item.descricao}
                                   {item.observacoes && (
                                      <button 
                                        onClick={() => alert(`Observações do Item #${item.bmp}:\n\n${item.observacoes}`)}
                                        className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-blue-50 text-blue-600 rounded-full"
                                      >
                                        <MessageCircle size={10} />
                                      </button>
                                   )}
                                </h5>
                                <div className="flex flex-wrap gap-2 mt-2">
                                     <span className="text-[8px] font-black uppercase text-slate-400">{item.categoria}</span>
                                         {item.classificacao && <span className="text-[8px] font-bold uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{item.classificacao}</span>}
                                     {item.conta && <span className="text-[8px] font-bold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">C: {item.conta}</span>}
                                     {item.classe && <span className="text-[8px] font-bold uppercase text-purple-600 bg-purple-50 px-1.5 rounded">Cl: {item.classe}</span>}
                                    <span className="text-[8px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{item.setor}</span>
                                    {item.categoria === 'EXTINTORES' && item.extintor_tipo && (
                                      <span className="text-[8px] font-black uppercase text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                                        {item.extintor_tipo} {item.extintor_peso ? `- ${item.extintor_peso}` : ''}
                                      </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-slate-50 pt-3 mt-1">
                                <button onClick={() => { setEditingMaterial?.(item); setShowMaterialModal?.(true); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Edit size={16}/></button>
                                {currentUser?.nivel === 'ADMIN' && (
                                  <button onClick={() => deleteMaterial?.(item)} className="p-3 bg-red-50 text-red-600 rounded-xl"><Trash2 size={16}/></button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-20 rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest text-center">Nenhum material identificado com os filtros atuais.<br/><span className="text-[9px] mt-2 block opacity-50">Tente ajustar seus parâmetros de busca.</span></p>
              </div>
            )
          ) : (
            <div className="h-64 md:h-80 flex flex-col items-center justify-center text-center p-10 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[30px] md:rounded-[40px]">
               <div className="bg-white p-5 rounded-3xl shadow-sm mb-4 text-red-600/30">
                  <Siren size={32} />
               </div>
               <h3 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-widest">Painel Operacional Ativo</h3>
               <p className="text-gray-400 text-[10px] max-w-xs">Configure os filtros técnicos acima e clique em "Filtrar Registro" para carregar os dados de inventário.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
