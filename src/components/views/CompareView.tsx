import React from 'react';
import { Database, RefreshCw, Trash2, AlertTriangle, CheckCircle, MessageCircle, FileText, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompareViewProps {
  compareInput: string;
  setCompareInput: (input: string) => void;
  compareBmps: () => void;
  clearCompareForm: () => void;
  loading: boolean;
  comparisonResult: { missingInSystem: string[], missingInList: string[] } | null;
  showMissingInListUI: boolean;
  setShowMissingInListUI: (show: boolean) => void;
  generateComparisonPDF: (result: any) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  compareInput,
  setCompareInput,
  compareBmps,
  clearCompareForm,
  loading,
  comparisonResult,
  showMissingInListUI,
  setShowMissingInListUI,
  generateComparisonPDF
}) => {
  return (
    <div key="compare-view">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none text-indigo-600 uppercase">COMPARADOR BMP</h2>
            <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">Cruze dados do Relatório Analítico com o sistema</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 block">Cole a coluna de BMPs do Relatório</label>
            <textarea 
              className="w-full h-[400px] p-6 bg-gray-50 border border-gray-200 rounded-[30px] font-mono text-sm focus:border-indigo-500 outline-none transition-all resize-none"
              placeholder="Exemplo:
501234
501235
501236"
              value={compareInput}
              onChange={(e) => setCompareInput(e.target.value)}
            />
            <div className="flex gap-4 mt-6">
              <button 
                onClick={compareBmps}
                disabled={!compareInput.trim() || loading}
                className="flex-1 py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-3xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 text-xs"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Comparar
              </button>
              <button 
                onClick={clearCompareForm}
                className="px-8 py-5 bg-gray-100 text-gray-500 font-black uppercase tracking-widest rounded-3xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 active:scale-95 text-xs"
              >
                <Trash2 size={18} />
                Limpar
              </button>
            </div>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[80vh] pr-2 text-[11px]">
            {!comparisonResult ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 border-4 border-dashed border-gray-100 rounded-[40px] bg-gray-50/50">
                <Database size={64} className="text-gray-200 mb-6" />
                <h3 className="text-gray-300 font-black uppercase text-sm tracking-[0.3em]">Aguardando Dados</h3>
                <p className="text-gray-300 text-[10px] uppercase font-bold mt-2">Os resultados aparecerão aqui após a análise</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8">
                   <div className="flex items-center justify-between mb-6 border-b border-red-50 pb-4">
                      <h3 className="text-sm font-black text-red-600 uppercase tracking-widest flex items-center gap-3">
                        <AlertTriangle size={20} /> Faltando no Sistema ({comparisonResult.missingInSystem.length})
                      </h3>
                      <div className="flex gap-2">
                        {!showMissingInListUI && comparisonResult.missingInList.length > 0 && (
                          <button
                            onClick={() => setShowMissingInListUI(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                          >
                            Ver no Sistema ({comparisonResult.missingInList.length})
                          </button>
                        )}
                        {comparisonResult.missingInSystem.length > 0 && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const text = `*RELATÓRIO DE BMPs FALTANTES NO SISTEMA*\n\nEstes BMPs constam no registro mas não foram encontrados no sistema:\n\n${comparisonResult.missingInSystem.map(bmp => `• ${bmp}`).join('\n')}`;
                                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                            >
                              <MessageCircle size={14} />
                            </button>
                            <button
                              onClick={() => generateComparisonPDF(comparisonResult)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95"
                              title="Exportar PDF"
                            >
                              <FileText size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                   </div>
                   <div className="max-h-[300px] overflow-y-auto pr-4 space-y-2">
                      {comparisonResult.missingInSystem.length === 0 ? (
                        <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-2xl font-bold text-xs uppercase">
                          <CheckCircle size={18} /> Todos os BMPs da lista já estão cadastrados!
                        </div>
                      ) : (
                        comparisonResult.missingInSystem.map(bmp => (
                          <div key={bmp} className="flex items-center justify-between px-5 py-3 bg-red-50 text-red-700 rounded-2xl text-[11px] font-mono font-black border border-red-100">
                            <span>#{bmp}</span>
                            <span className="text-[9px] font-black uppercase opacity-60">Não Encontrado</span>
                          </div>
                        ))
                      )}
                   </div>
                </div>

                {showMissingInListUI && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8"
                  >
                     <div className="flex items-center justify-between mb-6 border-b border-indigo-50 pb-4">
                        <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-3">
                          <Search size={20} /> Estão no sistema mas não estão mais no REGSITRO ({comparisonResult.missingInList.length})
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowMissingInListUI(false)}
                            className="px-4 py-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-all"
                          >
                            Ocultar
                          </button>
                          {comparisonResult.missingInList.length > 0 && (
                            <button
                              onClick={() => {
                                const text = `*RELATÓRIO DE BMPs FALTANTES NO REGISTRO*\n\nEstes BMPs constam no sistema mas não foram informados na sua lista:\n\n${comparisonResult.missingInList.map(bmp => `• ${bmp}`).join('\n')}`;
                                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                            >
                              Compartilhar
                            </button>
                          )}
                        </div>
                     </div>
                     <div className="max-h-[300px] overflow-y-auto pr-4 space-y-2">
                        {comparisonResult.missingInList.length === 0 ? (
                          <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-2xl font-bold text-xs uppercase">
                            <CheckCircle size={18} /> Todos os BMPs do sistema foram informados na lista!
                          </div>
                        ) : (
                          comparisonResult.missingInList.map(bmp => (
                            <div key={bmp} className="flex items-center justify-between px-5 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-[11px] font-mono font-black border border-indigo-100">
                              <span>#{bmp}</span>
                              <span className="text-[9px] font-black uppercase opacity-60">Apenas no Sistema</span>
                            </div>
                          ))
                        )}
                     </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
       </div>
    </div>
  );
};
