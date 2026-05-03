import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Loan, EPILoan, Bombeiro, Material } from '../../types';

interface ClearanceViewProps {
  loans: Loan[];
  epiLoans: EPILoan[];
  bombeiros: Bombeiro[];
  rawMateriais: Material[];
  materiais: Material[];
  filters: any;
  setFilters: (f: any) => void;
}

export const ClearanceView: React.FC<ClearanceViewProps> = ({
  loans, epiLoans, bombeiros, rawMateriais, materiais, filters, setFilters
}) => {
  const search = (filters.clearanceSearch || '').toUpperCase();
  
  // Map of active loans by requester
  const activeByPerson: Record<string, { materials: any[], epis: any[] }> = {};

  // 1. General Loans
  loans.filter(l => l.status === 'EMPRESTADO').forEach(l => {
    const person = l.solicitante.toUpperCase().trim();
    if (!activeByPerson[person]) activeByPerson[person] = { materials: [], epis: [] };
    const mats = JSON.parse(l.materiais_json || '[]').map((item: any) => {
      const mid = typeof item === 'object' ? item.id : item;
      const qty = typeof item === 'object' ? item.qty : 1;
      const mat = rawMateriais.find(m => String(m.id) === String(mid)) || materiais.find(m => String(m.id) === String(mid));
      return { desc: mat?.descricao || mat?.bmp || mid, qty };
    });
    activeByPerson[person].materials.push(...mats);
  });

  // 2. EPI Loans
  epiLoans.filter(el => el.status === 'EM_USO').forEach(el => {
    const bombeiro = bombeiros.find(b => b.id === el.bombeiro_id);
    if (!bombeiro) return;
    const person = bombeiro.nome_guerra.toUpperCase().trim();
    if (!activeByPerson[person]) activeByPerson[person] = { materials: [], epis: [] };
    
    const pieces = JSON.parse(el.pecas_json || '[]').map((p: any) => ({
      desc: `${p.type} (Nº ${p.number})`,
      qty: 1
    }));
    activeByPerson[person].epis.push(...pieces);
  });

  const sortedPeople = Object.keys(activeByPerson)
    .filter(p => !search || p.includes(search))
    .sort();

  return (
    <motion.div key="clearance" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Desimpedimento</h2>
          <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mt-2">Militares com cautelas pendentes</p>
        </div>
        <div className="w-full md:w-auto relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="BUSCAR MILITAR..." 
            className="w-full md:w-80 bg-white border border-gray-100 pl-12 pr-6 py-4 rounded-2xl shadow-sm focus:ring-4 focus:ring-red-600/10 focus:border-red-600 transition-all uppercase font-black text-[10px] tracking-widest"
            value={filters.clearanceSearch || ''}
            onChange={e => setFilters({...filters, clearanceSearch: e.target.value})}
          />
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr className="text-left font-black text-[10px] text-gray-400 uppercase tracking-widest">
                <th className="p-8">Militar</th>
                <th className="p-8">Materiais Pendentes</th>
                <th className="p-8">EPIs em Uso</th>
                <th className="p-8 text-right">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 uppercase italic text-[11px]">
              {sortedPeople.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-400 font-black uppercase text-xs">
                    Nenhum militar com pendências localizado
                  </td>
                </tr>
              ) : (
                sortedPeople.map(person => (
                  <tr key={person} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-8 font-black text-gray-900">{person}</td>
                    <td className="p-8">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {activeByPerson[person].materials.length > 0 ? (
                          activeByPerson[person].materials.map((m, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-black">
                              {m.desc} {m.qty > 1 ? `(x${m.qty})` : ''}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] text-gray-300 font-black">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {activeByPerson[person].epis.length > 0 ? (
                          activeByPerson[person].epis.map((e, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black">
                              {e.desc}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] text-gray-300 font-black">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black bg-orange-50 text-orange-700 ring-1 ring-orange-100 uppercase">
                        Pendência Ativa
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
