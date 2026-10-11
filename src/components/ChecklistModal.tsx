import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Printer, FileCheck } from 'lucide-react';
import { AppSettings, DeliveryItem } from '../types';
import { T } from '../utils/i18n';
import { getTodayStr, trDate } from '../utils/helpers';
import { generateDailyChecklistHTML, printDoc } from '../utils/exportUtils';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DeliveryItem[];
  settings: AppSettings;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
  isOpen,
  onClose,
  items,
  settings
}) => {
  const t = T[settings.language] || T.tr;
  const [date, setDate] = useState(getTodayStr());
  const [withData, setWithData] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    const dayItems = items.filter((i) => i.expectedDate === date);
    const html = generateDailyChecklistHTML(dayItems, date, withData, settings);
    printDoc(`Günlük Gıda Giriş Kontrol Listesi – ${trDate(date)}`, html, true);
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
            <FileCheck className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm sm:text-base">{t.cl_title}</h3>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t.cl_fill}
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setWithData(false)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  !withData
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="clfill"
                  checked={!withData}
                  onChange={() => setWithData(false)}
                  className="mt-0.5 w-4 h-4 text-purple-600"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">{t.cl_fill_no}</span>
                  <span className="text-[11px] text-slate-500">
                    Kabul alanında elle kontrol ve imza atmak için boş kutucuklar bırakılır.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setWithData(true)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  withData
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="clfill"
                  checked={withData}
                  onChange={() => setWithData(true)}
                  className="mt-0.5 w-4 h-4 text-purple-600"
                />
                <div>
                  <span className="font-bold text-xs text-slate-900 block">{t.cl_fill_yes}</span>
                  <span className="text-[11px] text-slate-500">
                    Sistemde girilmiş sıcaklık, SKT ve kabul onayları yazdırılır.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{t.cl_go}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
