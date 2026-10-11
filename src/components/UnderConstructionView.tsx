import React from 'react';
import { motion } from 'motion/react';
import { HardHat, ShieldAlert, KeyRound, ArrowRight, Building2 } from 'lucide-react';
import { AppSettings } from '../types';

interface UnderConstructionViewProps {
  settings: AppSettings;
  onRetryPin: () => void;
}

export const UnderConstructionView: React.FC<UnderConstructionViewProps> = ({ settings, onRetryPin }) => {
  return (
    <div
      id="under-construction-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="relative z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-10 text-center space-y-6"
      >
        {/* Animated Construction / Security Badge */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
          <div className="w-full h-full rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-xl shadow-rose-950/50 flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-amber-400">
              <HardHat className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-slate-900">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        {/* Brand Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <span>Yetkisiz Erişim / Kilitli Alan</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Under Construction
          </h1>
          <p className="text-sm font-semibold text-slate-400">
            Sayfa Yapım Aşamasında & Yetki Korumalıdır
          </p>
        </div>

        {/* Notice Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{settings.company || 'Four Seasons Mal Kabul Sistemi'}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bu bölüm yalnızca yetkili gıda güvenliği ve mal kabul personeli erişimine açıktır. Güvenlik PIN kodu doğrulanmadığı için sayfa içeriği ve veriler kilitlenmiştir.
          </p>
        </div>

        {/* Retry Button */}
        <div className="pt-2 space-y-3">
          <button
            id="btn-retry-pin-entry"
            type="button"
            onClick={onRetryPin}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Güvenlik PIN Kodunu Gir</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-slate-500 font-medium">
            Receiving Easy v1.1 • Güvenlik Sistemi
          </p>
        </div>
      </motion.div>
    </div>
  );
};
