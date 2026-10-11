import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, MessageSquare, Copy, Send, Check, Phone, ExternalLink } from 'lucide-react';
import { AppSettings, DeliveryItem } from '../types';
import { T } from '../utils/i18n';
import { getTodayStr, trDate } from '../utils/helpers';

interface MailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierName: string;
  items: DeliveryItem[];
  settings: AppSettings;
  onCopied: () => void;
  initialMode?: 'mail' | 'whatsapp';
}

export const MailModal: React.FC<MailModalProps> = ({
  isOpen,
  onClose,
  supplierName,
  items,
  settings,
  onCopied,
  initialMode = 'whatsapp'
}) => {
  const t = T[settings.language] || T.tr;
  const supplierEmail = (settings.supplierEmails?.[supplierName] || '').trim();
  const supplierPhone = (
    settings.supplierPhones?.[supplierName] ||
    items.find((i) => i.supplierPhone)?.supplierPhone ||
    ''
  ).trim();

  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'mail'>(
    initialMode === 'whatsapp' && supplierPhone ? 'whatsapp' : supplierEmail ? 'mail' : 'whatsapp'
  );
  const [lang, setLang] = useState<'tr' | 'en'>(settings.language);
  const [pickedItemIds, setPickedItemIds] = useState<Set<string>>(new Set(items.map((i) => i.id)));
  const [pickedMsgIdxs, setPickedMsgIdxs] = useState<Set<number>>(new Set([0]));
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const tpl = settings.templates[lang] || settings.templates.tr;
  const today = getTodayStr();

  const fill = (str: string) =>
    str
      .replace(/{supplier}/g, supplierName)
      .replace(/{date}/g, trDate(today))
      .replace(/{user}/g, settings.username)
      .replace(/{company}/g, settings.company);

  const subject = fill(tpl.subject);

  const selectedItems = items.filter((i) => pickedItemIds.has(i.id));

  // WhatsApp optimized format
  const waItemsText = selectedItems
    .map((i) => `📦 *${i.productName}* (${i.orderQty} ${i.uom})\n   ↳ PO: ${i.poNumber} | ${i.subject || 'Mal Kabul'}`)
    .join('\n');

  const waMsgsText = tpl.msgs
    .filter((_, idx) => pickedMsgIdxs.has(idx))
    .map((m) => `⚠️ ${fill(m)}`)
    .join('\n');

  const whatsappMessage = `*${fill(tpl.greeting)}*

${fill(tpl.intro)}

*Eksik / Bekleyen Ürünler:*
${waItemsText || '- (Ürün seçilmedi / No items selected)'}

*Taleplerimiz:*
${waMsgsText}

${fill(tpl.closing)}

_${settings.username} • ${settings.company}_`;

  // Standard Email Body Text
  const emailItemsText = selectedItems
    .map((i) => `• ${i.poNumber} | ${i.productName} | ${i.orderQty} ${i.uom}`)
    .join('\n');

  const emailMsgsText = tpl.msgs
    .filter((_, idx) => pickedMsgIdxs.has(idx))
    .map((m) => `- ${fill(m)}`)
    .join('\n');

  const emailBodyText = `${fill(tpl.greeting)}

${fill(tpl.intro)}

${emailItemsText || '- (Ürün seçilmedi / No items selected)'}

${emailMsgsText}

${fill(tpl.closing)}

${settings.username}
${settings.company}`;

  const currentText = activeChannel === 'whatsapp' ? whatsappMessage : emailBodyText;

  // Clean phone number for WhatsApp API (e.g. +905321112233 -> 905321112233)
  const cleanPhone = supplierPhone.replace(/[^0-9]/g, '');
  const whatsappUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  const mailtoUrl = `mailto:${encodeURIComponent(supplierEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(
    emailBodyText.length > 1800 ? emailBodyText.slice(0, 1800) + '\n...' : emailBodyText
  )}`;

  const handleCopy = () => {
    let full = '';
    if (activeChannel === 'whatsapp') {
      full = (supplierPhone ? `Alıcı / Tel: ${supplierPhone}\n\n` : '') + whatsappMessage;
    } else {
      full = `Kime / To: ${supplierEmail}\nKonu / Subject: ${subject}\n\n${emailBodyText}`;
    }
    navigator.clipboard.writeText(full);
    setCopied(true);
    onCopied();
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleItem = (id: string) => {
    const s = new Set(pickedItemIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setPickedItemIds(s);
  };

  const toggleMsg = (idx: number) => {
    const s = new Set(pickedMsgIdxs);
    if (s.has(idx)) s.delete(idx);
    else s.add(idx);
    setPickedMsgIdxs(s);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            {activeChannel === 'whatsapp' ? (
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            ) : (
              <Mail className="w-5 h-5 text-purple-400" />
            )}
            <h3 className="font-bold text-sm sm:text-base">
              {activeChannel === 'whatsapp' ? t.whatsapp : t.mail_title} • {supplierName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Switcher (WhatsApp vs Email) */}
        <div className="flex bg-slate-100 p-1.5 border-b border-slate-200 shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveChannel('whatsapp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeChannel === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-200" />
            <span>WhatsApp Bildirimi</span>
            {supplierPhone && (
              <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.5 rounded text-white font-mono">
                {supplierPhone}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('mail')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeChannel === 'mail'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-800'
            }`}
          >
            <Mail className="w-4 h-4 text-purple-200" />
            <span>E-posta Bildirimi</span>
            {supplierEmail && (
              <span className="text-[10px] bg-purple-700/80 px-1.5 py-0.5 rounded text-white font-mono truncate max-w-[120px]">
                {supplierEmail}
              </span>
            )}
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Target Recipient & Language Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-xs flex items-center gap-2 min-w-0">
              {activeChannel === 'whatsapp' ? (
                <>
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-500">WhatsApp / Tel: </span>
                  <span className="font-bold text-slate-800 font-mono truncate">
                    {supplierPhone || (
                      <span className="text-amber-600 italic font-sans">{t.no_phone}</span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="font-semibold text-slate-500">Alıcı: </span>
                  <span className="font-bold text-slate-800 font-mono truncate">
                    {supplierEmail || (
                      <span className="text-amber-600 italic font-sans">{t.no_mail}</span>
                    )}
                  </span>
                </>
              )}
            </div>

            <div className="flex gap-1 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setLang('tr')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  lang === 'tr' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Türkçe
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  lang === 'en' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Missing items selection list */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t.mail_items}
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {items.map((i) => (
                <label
                  key={i.id}
                  className="flex items-start gap-2.5 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-purple-50/40 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={pickedItemIds.has(i.id)}
                    onChange={() => toggleItem(i.id)}
                    className="mt-0.5 w-4 h-4 text-purple-600 rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900">{i.productName}</span> —{' '}
                    <span className="font-bold text-purple-700">
                      {i.orderQty} {i.uom}
                    </span>
                    <div className="text-[11px] text-slate-500">
                      {i.poNumber} • {i.subject} • {trDate(i.expectedDate)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action messages */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t.mail_msgs}
            </label>
            <div className="space-y-1.5">
              {tpl.msgs.map((msg, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 text-xs font-medium text-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={pickedMsgIdxs.has(idx)}
                    onChange={() => toggleMsg(idx)}
                    className="mt-0.5 w-4 h-4 text-purple-600 rounded"
                  />
                  <span>{fill(msg)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {activeChannel === 'whatsapp' ? t.whatsapp_prev : t.mail_prev}
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                {activeChannel === 'whatsapp' ? 'WhatsApp formatında kalın ve ikonlu' : 'E-posta formatında'}
              </span>
            </div>
            <textarea
              readOnly
              value={currentText}
              rows={7}
              className={`w-full p-3 text-xs font-mono rounded-xl border leading-relaxed outline-none ${
                activeChannel === 'whatsapp'
                  ? 'bg-slate-900 text-emerald-200 border-slate-800'
                  : 'bg-slate-900 text-slate-100 border-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            {t.close}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.copied : t.mail_copy}</span>
            </button>

            {activeChannel === 'whatsapp' ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t.whatsapp_send}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ) : (
              <a
                href={mailtoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{t.mail_send}</span>
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
