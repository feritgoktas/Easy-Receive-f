import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info' }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white text-sm font-semibold rounded-xl shadow-2xl backdrop-blur border border-slate-800 pointer-events-none max-w-[90vw]"
        >
          {type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {type === 'info' && <Info className="w-4 h-4 text-purple-400 shrink-0" />}
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
