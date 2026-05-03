import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { AuditRow, User } from '../../types';

interface AuditViewProps {
  auditLogs: AuditRow[];
  users: User[];
  auditFilter: string;
  setAuditFilter: (filter: string) => void;
}

export const AuditView: React.FC<AuditViewProps> = ({
  auditLogs,
  users,
  auditFilter,
  setAuditFilter,
}) => {
  const filteredLogs = auditLogs.filter(log => {
    if (!log) return false;
    const filter = (auditFilter || '').toLowerCase();
    const foundUser = users.find(u => String(u.login) === String(log.usuario));
    const nomeMilitar = (foundUser?.nome || '').toLowerCase();
    const usuario = String(log.usuario || '').toLowerCase();
    const acao = String(log.acao || '').toLowerCase();
    const detalhes = String(log.detalhes || '').toLowerCase();
    return usuario.includes(filter) || nomeMilitar.includes(filter) || acao.includes(filter) || detalhes.includes(filter);
  }).reverse();

  return (
    <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none text-red-600 uppercase">AUDITORIA</h2>
            <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2">Log de ações e segurança militar</p>
          </div>
          <div className="w-full md:w-80">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                   className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 focus:border-red-600 outline-none transition-all shadow-sm"
                   placeholder="Buscar no Log..."
                   value={auditFilter}
                   onChange={e => setAuditFilter(e.target.value)}
                 />
              </div>
          </div>
       </div>

       <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
               <thead className="bg-gray-50/50">
                  <tr className="text-left">
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Data / Hora</th>
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Militar</th>
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Ação</th>
                     <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Detalhes do Evento</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-6 text-xs font-mono text-gray-500">{log.data}</td>
                      <td className="p-6">
                         <div className="flex flex-col">
                            <span className="font-bold text-gray-900">
                              {users.find(u => String(u.login) === String(log.usuario))?.nome || 'Sistema / Externo'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono italic">SARAM: {log.usuario}</span>
                         </div>
                      </td>
                      <td className="p-6">
                         <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-[9px] font-black uppercase tracking-widest ring-1 ring-red-100">
                            {log.acao}
                         </span>
                      </td>
                      <td className="p-6 text-sm text-gray-600">
                        {typeof log.detalhes === 'object' ? JSON.stringify(log.detalhes) : String(log.detalhes || '')}
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
          {auditLogs.length === 0 && <p className="text-center py-20 text-gray-400 uppercase text-[10px] font-black tracking-widest">Nenhum evento registrado</p>}
       </div>
    </motion.div>
  );
};
