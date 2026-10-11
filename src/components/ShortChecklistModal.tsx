import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Printer, FileSpreadsheet, FileText } from 'lucide-react';
import { AppSettings, DeliveryItem } from '../types';
import { T } from '../utils/i18n';
import { getTodayStr, trDate } from '../utils/helpers';
import {
  exportShortChecklistXLSX,
  generateShortChecklistHTML,
  printDoc
} from '../utils/exportUtils';

interface ShortChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DeliveryItem[];
  settings: AppSettings;
  onDownloaded: (msg: string) => void;
}

export const ShortChecklistModal: React.FC<ShortChecklistModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onDownloaded
}) => {
  const t = T[settings.language] || T.tr;
  const [date, setDate] = useState(getTodayStr());

  if (!isOpen) return null;

  const dayItems = items.filter((i) => i.expectedDate === date);

  const handlePdf = () => {
    const html = generateShortChecklistHTML(dayItems, date, settings);
    printDoc(`Short Daily Check List – ${trDate(date)}`, html, true);
    onClose();
  };

  const handleXlsx = () => {
    const ok = exportShortChecklistXLSX(dayItems, date);
    if (ok) onDownloaded(t.xlsx_ready);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">{t.short_title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t.cl_date}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none font-semibold"
            />
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed font-medium">
            {t.short_desc}
            <div className="mt-2 font-bold text-purple-700">
              Bu tarih için {dayItems.length} kalem ürün bulunuyor.
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            {t.cancel}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleXlsx}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handlePdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
