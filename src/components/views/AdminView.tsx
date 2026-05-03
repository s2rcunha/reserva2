import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Edit, RefreshCw, Trash2 } from 'lucide-react';
import { User } from '../../types';
import { cn } from '../../lib/utils';

interface AdminViewProps {
  users: User[];
  newUser: any;
  setNewUser: (user: any) => void;
  saveUser: (e: React.FormEvent) => void;
  deleteUser: (id: number) => void;
  adminResetUserPassword: (u: User) => void;
  setEditingUser: (u: Partial<User> | null) => void;
  setShowUserModal: (show: boolean) => void;
  generateAnalyticReport: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  users, newUser, setNewUser, saveUser, deleteUser,
  adminResetUserPassword, setEditingUser, setShowUserModal,
  generateAnalyticReport
}) => {
  return (
    <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase italic">Gestão de Pessoal</h2>
          <p className="text-gray-400 uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] mt-2 italic">Administração de níveis de acesso militar</p>
        </div>
        <button onClick={generateAnalyticReport} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">
          <FileText size={16} /> Gerar Relatório Analítico
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-[11px]">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100">
            <h3 className="font-black text-[11px] uppercase tracking-widest text-gray-900 mb-6 italic">Novo Registro de Acesso</h3>
            <form onSubmit={saveUser} className="space-y-4">
              <div>
                <label className="filter-label uppercase">Nome de Guerra</label>
                <input className="filter-input uppercase" required value={newUser.nome} onChange={e => setNewUser({...newUser, nome: e.target.value})} placeholder="SGT CUNHA" />
              </div>
              <div>
                <label className="filter-label uppercase">Login SARAM (7 dígitos)</label>
                <input className="filter-input font-mono" required maxLength={7} minLength={7} pattern="\d{7}" value={newUser.login} onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 7) setNewUser({...newUser, login: val});
                }} placeholder="7012345" />
              </div>
              <div>
                <label className="filter-label uppercase">Nível Hierárquico</label>
                <select className="filter-input uppercase" value={newUser.nivel} onChange={e => setNewUser({...newUser, nivel: e.target.value as any})}>
                  <option value="USER">Operacional (Padrão)</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all">
                Autorizar Acesso
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 bg-gray-50/50 border-b border-gray-100">
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 italic">Militares Autorizados ({users.length})</h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/30">
                  <tr className="text-left font-black text-[10px] text-gray-400 uppercase italic">
                    <th className="p-6">Militar</th>
                    <th className="p-6">Login</th>
                    <th className="p-6">Privilégios</th>
                    <th className="p-6 text-right">Controle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 uppercase italic">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-6 font-black text-gray-900">{u.nome}</td>
                      <td className="p-6 font-mono text-[10px] text-gray-500">{u.login}</td>
                      <td className="p-6">
                        <span className={cn(
                          "px-2 py-1 rounded text-[9px] font-black uppercase ring-1",
                          u.nivel === 'ADMIN' ? "bg-red-50 text-red-700 ring-red-100" : "bg-gray-50 text-gray-600 ring-gray-100"
                        )}>{u.nivel}</span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => adminResetUserPassword(u)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                            <RefreshCw size={16} />
                          </button>
                          <button onClick={() => deleteUser(u.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                            <Trash2 size={16} />
                          </button>
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
    </motion.div>
  );
};
