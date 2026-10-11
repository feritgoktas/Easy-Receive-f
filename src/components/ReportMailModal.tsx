import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Printer, Send } from 'lucide-react';
import { AppSettings, DeliveryItem } from '../types';
import { T } from '../utils/i18n';
import { trDate } from '../utils/helpers';

interface ReportMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DeliveryItem[];
  from: string;
  to: string;
  settings: AppSettings;
  onPrintPdf: () => void;
}

export const ReportMailModal: React.FC<ReportMailModalProps> = ({
  isOpen,
  onClose,
  items,
  from,
  to,
  settings,
  onPrintPdf
}) => {
  const t = T[settings.language] || T.tr;
  const emails = settings.emails;

  const [selectedRecipients, setSelectedRecipients] = useState<{ [key: string]: boolean }>({
    manager: !!emails.manager,
    foodSafety: !!emails.foodSafety,
    ehcAuditor: false,
    user: false
  });

  if (!isOpen) return null;

  const stats = {
    total: items.length,
    approved: items.filter((i) => i.status === 'approved').length,
    conditional: items.filter((i) => i.status === 'conditional').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
    pending: items.filter((i) => i.status === 'pending').length
  };
  const completion = stats.total
    ? Math.round(((stats.total - stats.pending) / stats.total) * 100)
    : 0;

  const recipientList: string[] = [];
  if (selectedRecipients.manager && emails.manager) recipientList.push(emails.manager);
  if (selectedRecipients.foodSafety && emails.foodSafety) recipientList.push(emails.foodSafety);
  if (selectedRecipients.ehcAuditor && emails.ehcAuditor) recipientList.push(emails.ehcAuditor);
  if (selectedRecipients.user && emails.user) recipientList.push(emails.user);

  const subject = `Mal Kabul Raporu / Receiving Report – ${trDate(from)} – ${trDate(to)}`;
  const bodyText = `Merhaba,

${trDate(from)} – ${trDate(to)} dönemine ait mal kabul ve gıda giriş kontrol raporu ektedir.

ÖZET DURUM:
- Toplam Kalem: ${stats.total}
- Kabul Edilen: ${stats.approved}
- Şartlı Kabul: ${stats.conditional}
- Reddedilen: ${stats.rejected}
- Bekleyen Kalemler: ${stats.pending}
- Tamamlanma Oranı: %${completion}

İyi çalışmalar,
${settings.username}
${settings.company}

(Detaylı PDF rapor dosyası ekte yer almaktadır / Detailed report is attached.)`;

  const mailtoUrl = `mailto:${encodeURIComponent(recipientList.join(','))}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(bodyText)}`;

  const recipientOptions = [
    { key: 'manager', label: t.e_manager, email: emails.manager },
    { key: 'foodSafety', label: t.e_food, email: emails.foodSafety },
    { key: 'ehcAuditor', label: t.e_ehc, email: emails.ehcAuditor },
    { key: 'user', label: t.e_user, email: emails.user }
  ];

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
            <Mail className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm sm:text-base">{t.rep_mail_title}</h3>
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t.rep_mail_to}
            </label>
            <div className="space-y-2">
              {recipientOptions.map((opt) => (
                <label
                  key={opt.key}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer ${
                    opt.email ? 'bg-slate-50 border-slate-200 hover:bg-purple-50/30' : 'bg-slate-50/50 border-slate-200/50 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={!opt.email}
                    checked={!!selectedRecipients[opt.key] && !!opt.email}
                    onChange={(e) =>
                      setSelectedRecipients({
                        ...selectedRecipients,
                        [opt.key]: e.target.checked
                      })
                    }
                    className="mt-0.5 w-4 h-4 text-purple-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{opt.label}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {opt.email || t.no_mail}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed font-medium">
            {t.rep_mail_note}
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
              onClick={onPrintPdf}
              className="flex items-center gap-1 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{t.rep_pdf}</span>
            </button>
            <a
              href={recipientList.length ? mailtoUrl : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs ${
                !recipientList.length ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{t.rep_open_mail}</span>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
