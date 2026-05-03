import React from 'react';
import { AlertCircle, RefreshCw, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TERMS_TEXT } from '../../constants';

interface LoginViewProps {
  loginData: { login: string; senha: string };
  setLoginData: (data: any) => void;
  handleLogin: (e: React.FormEvent) => void;
  loading: boolean;
  loginError: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ 
  loginData, setLoginData, handleLogin, loading, loginError 
}) => {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-[#0F172A] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-2 bg-white rounded-3xl shadow-2xl shadow-red-600/20 mb-6 group hover:scale-110 transition-transform duration-500 overflow-hidden w-24 h-24">
            <img src="/icon-512.png" alt="Logo Unidade" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">SESCINC-CO</h1>
          <p className="text-[13px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-3 bg-white/5 py-1.5 rounded-full border border-white/5 inline-block px-4">Gerenciamento de Material Carga</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest pl-2">Identificação Militar</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={loginData.login}
                  onChange={e => setLoginData({...loginData, login: e.target.value.toUpperCase()})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all placeholder:text-slate-600 font-bold"
                  placeholder="EX: SGT R.CUNHA"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest pl-2">Senha Operacional</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={loginData.senha}
                  onChange={e => setLoginData({...loginData, senha: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all placeholder:text-slate-600 font-bold"
                  placeholder="••••••••"
                  required
                />
                <Key className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              </div>
            </div>

            <AnimatePresence>
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl text-xs font-bold uppercase tracking-wider"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  {loginError}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-600/20 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Acessar Sistema'}
            </button>

            <div className="pt-4 text-center">
              <p className="text-[9px] text-slate-500 uppercase font-black leading-relaxed">
                Ao entrar você concorda com os <br/>
                <button type="button" onClick={() => alert(TERMS_TEXT)} className="text-red-500 hover:underline">Termos de Uso Institucional</button>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center mt-10 text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">
          Versão 4.0 Pro — SESCINC-CO — © 2026
        </p>
      </motion.div>
    </div>
  );
};
