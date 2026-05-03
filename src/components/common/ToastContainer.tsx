import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Database, AlertTriangle, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Toast {
  id: number;
  msg: string;
  type?: 'join' | 'info' | 'error' | 'leave';
}

interface ToastContainerProps {
  toasts: Toast[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed top-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md min-w-[280px]",
              toast.type === 'join' ? "bg-emerald-500/90 border-emerald-400 text-white" : 
              toast.type === 'info' ? "bg-indigo-500/90 border-indigo-400 text-white" :
              toast.type === 'error' ? "bg-red-500/90 border-red-400 text-white" :
              "bg-gray-800/90 border-gray-700 text-gray-100"
            )}
          >
            <div className="p-2 bg-white/20 rounded-xl">
               {toast.type === 'join' ? <CheckCircle size={18} /> : 
                toast.type === 'info' ? <Database size={18} /> :
                toast.type === 'error' ? <AlertTriangle size={18} /> :
                <LogOut size={18} />}
            </div>
            <p className="text-xs font-black uppercase tracking-widest">{toast.msg}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
