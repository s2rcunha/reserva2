import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import { User } from '../../types';

interface UserModalProps {
  showUserModal: boolean;
  setShowUserModal: (show: boolean) => void;
  editingUser: Partial<User> | null;
  setEditingUser: (u: Partial<User> | null) => void;
  saveUser: (e: React.FormEvent) => void;
  newUser: Partial<User>;
  setNewUser: (u: any) => void;
  users: User[];
  loading: boolean;
}

export const UserModal: React.FC<UserModalProps> = ({
  showUserModal, setShowUserModal, editingUser, setEditingUser,
  saveUser, newUser, setNewUser, users, loading
}) => {
  return (
    <AnimatePresence>
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUserModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Cadastro de Pessoal</h3>
                 <button onClick={() => setShowUserModal(false)} className="p-3 hover:bg-gray-100 rounded-full"><X size={24}/></button>
              </div>
              
              <form onSubmit={saveUser} className="space-y-4 mb-10">
                 <div>
                    <label htmlFor="modal-user-nome" className="modal-label">Nome Completo</label>
                    <input id="modal-user-nome" name="modal-user-nome" required className="modal-input" value={editingUser?.nome || ''} onChange={e => setEditingUser({ ...(editingUser || {login: '', nome: '', nivel: 'USER'}), nome: e.target.value})} placeholder="Ex: 2S Fulano" />
                 </div>
                 <div>
                   <label htmlFor="modal-user-login" className="modal-label">Usuário (SARAM - 7 dígitos)</label>
                   <input 
                     id="modal-user-login" 
                     name="modal-user-login" 
                     required 
                     className="modal-input" 
                     maxLength={7} 
                     minLength={7}
                     pattern="\d{7}"
                     title="O SARAM deve conter exatamente 7 dígitos numéricos"
                     value={editingUser?.login || ''} 
                     onChange={e => {
                       const val = e.target.value.replace(/\D/g, '');
                       if (val.length <= 7) {
                         setEditingUser({ ...(editingUser || {login: '', nome: '', nivel: 'USER'}), login: val});
                       }
                     }} 
                     placeholder="0000000"
                   />
                 </div>
                 <div>
                    <label htmlFor="modal-user-level" className="modal-label">Nível de Acesso</label>
                    <select 
                      id="modal-user-level" 
                      name="modal-user-level" 
                      required 
                      className="modal-input"
                      value={editingUser?.id ? (editingUser?.nivel || '') : (newUser.nivel || '')} 
                      onChange={e => {
                        const val = e.target.value as 'ADMIN' | 'USER';
                        if (editingUser?.id) {
                          setEditingUser({ ...editingUser, nivel: val });
                        } else {
                          setNewUser({ ...newUser, nivel: val });
                        }
                      }}
                    >
                       <option value="">Selecione...</option>
                       <option value="USER">Usuário Comum</option>
                       <option value="ADMIN">Administrador</option>
                    </select>
                 </div>
                 <button disabled={loading} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl">
                    {loading ? <RefreshCw className="animate-spin" /> : 'Salvar Militar'}
                 </button>
              </form>

              <div className="space-y-3">
                 <p className="text-[10px] font-black uppercase text-gray-400 pl-2">Militares Cadastrados</p>
                 {users.map(user => (
                   <div key={user.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                      <div>
                         <p className="font-bold text-sm">{user.nome}</p>
                         <p className="text-[10px] text-gray-400 font-mono italic">{user.login} • {user.nivel}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
