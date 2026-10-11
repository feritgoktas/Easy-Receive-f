import React, { useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  RotateCcw,
  Mail,
  MessageSquare,
  Truck,
  Thermometer,
  Calendar,
  AlertCircle,
  PackageCheck,
  Plus,
  Search,
  X,
  Phone,
  ChevronLeft,
  ChevronRight,
  Edit3,
  AlertTriangle,
  Save,
  CloudUpload,
  RefreshCw,
  User,
  Tag,
  Box
} from 'lucide-react';
import { AppSettings, DeliveryItem, DeliveryStatus } from '../types';
import { T } from '../utils/i18n';
import { getTodayStr, parseDate, trDate } from '../utils/helpers';

interface ReceivingViewProps {
  items: DeliveryItem[];
  settings: AppSettings;
  hideDone: boolean;
  setHideDone: (v: boolean) => void;
  showPrev: boolean;
  setShowPrev: (v: boolean) => void;
  selectedSupplier: string;
  setSelectedSupplier: (sup: string) => void;
  onUpdateItem: (id: string, patch: Partial<DeliveryItem>) => void;
  onSetStatus: (id: string, status: DeliveryStatus, note?: string) => void;
  onApproveAll: (supplier: string, po: string) => void;
  onSupplierTruckChange: (supplier: string, truckCheck: boolean, truckTemp?: number) => void;
  onPullPrevExp: (id: string) => void;
  onOpenMailModal: (supplier: string) => void;
  onQuickAdd: () => void;
  onSaveToCloud?: () => void;
  isSyncing?: boolean;
}

export const ReceivingView: React.FC<ReceivingViewProps> = ({
  items,
  settings,
  hideDone,
  setHideDone,
  showPrev,
  setShowPrev,
  selectedSupplier,
  setSelectedSupplier,
  onUpdateItem,
  onSetStatus,
  onApproveAll,
  onSupplierTruckChange,
  onPullPrevExp,
  onOpenMailModal,
  onQuickAdd,
  onSaveToCloud,
  isSyncing = false
}) => {
  const t = T[settings.language] || T.tr;
  const today = getTodayStr();
  const [searchQuery, setSearchQuery] = useState('');
  const supplierScrollRef = useRef<HTMLDivElement>(null);

  // State for Conditional Note Modal / Dialog
  const [conditionalNoteItem, setConditionalNoteItem] = useState<{
    id: string;
    productName: string;
    supplierName: string;
    currentNote: string;
    mode: 'setStatus' | 'editNote';
  } | null>(null);
  const [noteInputText, setNoteInputText] = useState('');

  const q = searchQuery.toLowerCase().trim();

  // Filter items for receiving tab in real-time
  const activeItems = items.filter((i) => {
    if (i.expectedDate > today) return false;
    if (!showPrev && i.expectedDate < today) return false;
    if (hideDone && i.status !== 'pending') return false;
    if (selectedSupplier !== 'ALL' && i.supplierName !== selectedSupplier) return false;
    if (
      q &&
      !i.productName.toLowerCase().includes(q) &&
      !i.poNumber.toLowerCase().includes(q) &&
      !(i.subject || '').toLowerCase().includes(q) &&
      !(i.department || '').toLowerCase().includes(q) &&
      !(i.note || '').toLowerCase().includes(q) &&
      !(i.supplierName || '').toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });

  // Get unique supplier names from today's / eligible items
  const eligibleSuppliers: string[] = Array.from(
    new Set<string>(
      items
        .filter((i) => i.expectedDate <= today && (showPrev || i.expectedDate === today))
        .map((i) => i.supplierName)
    )
  ).sort((a: string, b: string) => a.localeCompare(b, 'tr'));

  // Group by Supplier -> PO
  const groupedSuppliers = eligibleSuppliers
    .map((name) => {
      const supItems = activeItems.filter((i) => i.supplierName === name);
      if (!supItems.length) return null;

      // Group POs under this supplier by PO Number & Subject
      const poMap: Record<string, DeliveryItem[]> = {};
      supItems.forEach((i) => {
        const k = (i.poNumber || 'PO') + '||' + (i.subject || '');
        poMap[k] = poMap[k] || [];
        poMap[k].push(i);
      });

      const groups = Object.keys(poMap).map((k) => {
        const [po, subject] = k.split('||');
        const itemsInPo = poMap[k].sort((a, b) => a.productName.localeCompare(b.productName, 'tr'));
        const depts = Array.from(
          new Set(itemsInPo.map((it) => it.department).filter(Boolean))
        ) as string[];

        return {
          id: `${name}||${k}`,
          po,
          subject,
          dept: depts.join(' / '),
          items: itemsInPo
        };
      });

      return {
        name,
        groups,
        allItems: supItems
      };
    })
    .filter(Boolean) as {
    name: string;
    groups: { id: string; po: string; subject: string; dept: string; items: DeliveryItem[] }[];
    allItems: DeliveryItem[];
  }[];

  const checkSupplierNeedsTemp = (name: string) => {
    if (settings.supplierRules[name]?.temp) return true;
    return items.some(
      (i) =>
        i.supplierName === name &&
        settings.extraCheckProducts.some((k) => i.productName.toLowerCase().includes(k))
    );
  };

  const checkItemNeedsTemp = (item: DeliveryItem) => {
    if (settings.supplierRules[item.supplierName]?.temp) return true;
    return settings.extraCheckProducts.some((k) => item.productName.toLowerCase().includes(k));
  };

  const checkItemNeedsExp = (item: DeliveryItem) => {
    if (settings.supplierRules[item.supplierName]?.exp) return true;
    return settings.extraCheckProducts.some((k) => item.productName.toLowerCase().includes(k));
  };

  const handleScrollSuppliers = (direction: 'left' | 'right') => {
    if (supplierScrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      supplierScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleOpenConditionalModal = (item: DeliveryItem, mode: 'setStatus' | 'editNote' = 'setStatus') => {
    setConditionalNoteItem({
      id: item.id,
      productName: item.productName,
      supplierName: item.supplierName,
      currentNote: item.note || '',
      mode
    });
    setNoteInputText(item.note || '');
  };

  const handleSaveConditionalNote = () => {
    if (!conditionalNoteItem) return;
    const finalNote = noteInputText.trim();
    if (conditionalNoteItem.mode === 'setStatus') {
      onSetStatus(conditionalNoteItem.id, 'conditional', finalNote);
    } else {
      onUpdateItem(conditionalNoteItem.id, { note: finalNote });
    }
    setConditionalNoteItem(null);
    setNoteInputText('');
  };

  const quickNoteSuggestions = [
    'Ambalaj hasarlı / ezik',
    'Sıcaklık sınır değerde',
    'Son kullanma tarihi kısa',
    'Kalite kontrol numunesi alındı',
    'Eksik miktar ile kabul edildi',
    'Parti / etiket bilgisi uyuşmazlığı'
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Filter Bar with Real-time Search Input */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Row 1: Search Input & Toggles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-search-receiving"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search_ph}
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none font-medium bg-slate-50/60 hover:bg-white focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 text-xs transition-colors"
                title={t.cancel}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggles & Cloud Save */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-semibold text-slate-700 shrink-0 justify-between sm:justify-start pt-1 sm:pt-0">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideDone}
                onChange={(e) => setHideDone(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
              />
              <span>{t.hide_done}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPrev}
                onChange={(e) => setShowPrev(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
              />
              <span>{t.show_prev}</span>
            </label>

            {onSaveToCloud && (
              <button
                type="button"
                onClick={onSaveToCloud}
                disabled={isSyncing}
                title="Tüm verileri Firebase ortak koleksiyonuna manuel kaydet / eşitle"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5" />
                )}
                <span>{isSyncing ? 'Kaydediliyor...' : 'Buluta Kaydet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Supplier Horizontal Filter Scroller with Left/Right Buttons and Scrollbar */}
        <div className="relative pt-2 border-t border-slate-100 flex items-center gap-1.5">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => handleScrollSuppliers('left')}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 shadow-2xs transition-colors"
            title={t.scroll_left}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Supplier Track */}
          <div
            ref={supplierScrollRef}
            className="flex items-center gap-1.5 overflow-x-auto w-full py-1 scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
          >
            <button
              type="button"
              onClick={() => setSelectedSupplier('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedSupplier === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.all}
            </button>
            {eligibleSuppliers.map((s) => {
              const active = selectedSupplier === s;
              const shortName = s.length > 22 ? s.slice(0, 22) + '…' : s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSupplier(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {shortName}
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => handleScrollSuppliers('right')}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 shadow-2xs transition-colors"
            title={t.scroll_right}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {searchQuery && (
            <span className="ml-auto text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap hidden sm:inline-block">
              {activeItems.length} {t.records}
            </span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {groupedSuppliers.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PackageCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {searchQuery
              ? `"${searchQuery}" ile eşleşen teslimat bulunamadı`
              : hideDone
              ? 'Görüntülenecek Bekleyen Teslimat Yok'
              : t.no_data}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            {searchQuery
              ? 'Arama kriterini değiştirebilir veya aramayı temizleyebilirsiniz.'
              : hideDone
              ? 'Tüm teslimatlar kabul edilmiş olabilir. "Gelenleri gizle" filtresini kaldırabilir veya yeni teslimat aktarabilirsiniz.'
              : t.import_desc}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Aramayı Temizle
              </button>
            ) : (
              <button
                type="button"
                onClick={onQuickAdd}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t.quickAdd}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Supplier Groups */}
      {groupedSuppliers.map((sup) => {
        const supMail = (settings.supplierEmails[sup.name] || '').trim();
        const supPhone = (
          settings.supplierPhones?.[sup.name] ||
          sup.allItems.find((i) => i.supplierPhone)?.supplierPhone ||
          ''
        ).trim();
        const pendingLines = sup.allItems.filter((i) => i.status === 'pending').length;
        const totalLines = sup.allItems.length;
        const firstItem = sup.allItems[0];
        const needsTemp = checkSupplierNeedsTemp(sup.name);

        return (
          <div
            key={sup.name}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
          >
            {/* Supplier Header */}
            <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black tracking-wide">{sup.name}</h3>
                  {supPhone && (
                    <span className="flex items-center gap-1 text-[11px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md font-mono border border-emerald-800/80">
                      <Phone className="w-3 h-3" />
                      {supPhone}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  {sup.groups.length} PO • {totalLines} {t.lines.toLowerCase()} • {pendingLines}{' '}
                  {t.pending.toLowerCase()}
                </div>
              </div>

              {/* Top controls: Truck check, Truck Temp, Bulk Status, WhatsApp, Mail */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Truck Hygiene */}
                <label
                  title={t.truck_all}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] uppercase text-slate-400">{t.truck}</span>
                  <input
                    type="checkbox"
                    checked={firstItem.truckCheck}
                    onChange={(e) => onSupplierTruckChange(sup.name, e.target.checked)}
                    className="w-4 h-4 text-purple-500 rounded cursor-pointer ml-0.5"
                  />
                </label>

                {/* Truck Temperature */}
                {needsTemp && (
                  <div className="flex items-center gap-1 bg-slate-800 border border-slate-700/80 rounded-lg px-2 py-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] uppercase text-slate-400 mr-1">{t.ttemp}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onSupplierTruckChange(
                          sup.name,
                          firstItem.truckCheck,
                          Math.max(-25, (Number(firstItem.truckTemp) || 0) - 1)
                        )
                      }
                      className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 text-white font-black text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-xs px-1 text-slate-100">
                      {Number(firstItem.truckTemp) || 0}°C
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onSupplierTruckChange(
                          sup.name,
                          firstItem.truckCheck,
                          Math.min(30, (Number(firstItem.truckTemp) || 0) + 1)
                        )
                      }
                      className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 text-white font-black text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* WhatsApp button */}
                <button
                  type="button"
                  onClick={() => onOpenMailModal(sup.name)}
                  title={supPhone ? `WhatsApp: ${supPhone}` : t.whatsapp}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {/* Mail button */}
                <button
                  type="button"
                  onClick={() => onOpenMailModal(sup.name)}
                  disabled={!supMail && !supPhone}
                  title={supMail ? supMail : t.no_mail}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    supMail
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t.mail}</span>
                </button>
              </div>
            </div>

            {/* PO Sub-Groups */}
            {sup.groups.map((group) => (
              <div key={group.id} className="border-t border-slate-200">
                {/* PO Header Bar */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-extrabold text-[11px] tracking-wide font-mono">
                      {group.po}
                    </span>
                    {group.dept && (
                      <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 font-bold text-[11px]">
                        {group.dept}
                      </span>
                    )}
                    <span className="text-xs text-slate-600 font-medium">{group.subject}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onApproveAll(sup.name, group.po)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{t.approve_all}</span>
                    </button>
                  </div>
                </div>

                {/* Items List (Responsive: Desktop Table + Mobile Cards) */}
                {/* Desktop View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-4 w-[28%]">{t.product}</th>
                        <th className="py-2.5 px-3 w-[10%]">{t.qty}</th>
                        <th className="py-2.5 px-2 text-center w-[7%]">{t.label}</th>
                        <th className="py-2.5 px-2 text-center w-[7%]">{t.phys}</th>
                        <th className="py-2.5 px-3 text-center w-[12%]">{t.ptemp}</th>
                        <th className="py-2.5 px-3 w-[18%]">{t.exp}</th>
                        <th className="py-2.5 px-4 text-center w-[18%]">{t.status}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((item) => {
                        const isLate = item.expectedDate < today;
                        const isDone = item.status !== 'pending';
                        const needsItemTemp = checkItemNeedsTemp(item);
                        const needsItemExp = checkItemNeedsExp(item);

                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors ${
                              isDone ? 'bg-slate-50/50' : 'hover:bg-purple-50/20'
                            }`}
                          >
                            {/* Product Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {isLate && !isDone && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-black">
                                    {trDate(item.expectedDate).slice(0, 5)}
                                  </span>
                                )}
                                <div>
                                  <span
                                    className={`font-bold text-slate-900 block ${
                                      isDone ? 'line-through text-slate-400' : ''
                                    }`}
                                  >
                                    {item.productName}
                                  </span>
                                  {item.note ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenConditionalModal(item, 'editNote')}
                                      className="group text-[11px] text-amber-800 font-medium italic inline-flex items-center gap-1 mt-0.5 hover:underline bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                                      title={t.edit_note}
                                    >
                                      <span>✎ {item.note}</span>
                                      <Edit3 className="w-3 h-3 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                  ) : item.status === 'conditional' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenConditionalModal(item, 'editNote')}
                                      className="text-[10px] text-amber-700 font-bold inline-flex items-center gap-1 mt-0.5 hover:underline"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                      <span>{t.cond_note_add}</span>
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </td>

                            {/* Qty & UOM */}
                            <td className="py-3 px-3">
                              <span className="font-extrabold text-slate-900">{item.orderQty}</span>{' '}
                              <span className="text-[10px] font-bold text-slate-500 uppercase">
                                {item.uom}
                              </span>
                            </td>

                            {/* Label check */}
                            <td className="py-3 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.labelCheck}
                                onChange={(e) =>
                                  onUpdateItem(item.id, { labelCheck: e.target.checked })
                                }
                                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                              />
                            </td>

                            {/* Physical check */}
                            <td className="py-3 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.physicalCheck}
                                onChange={(e) =>
                                  onUpdateItem(item.id, { physicalCheck: e.target.checked })
                                }
                                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                              />
                            </td>

                            {/* Product Temp */}
                            <td className="py-3 px-3 text-center">
                              {needsItemTemp ? (
                                <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateItem(item.id, {
                                        productTemp: Math.round(Math.max(-25, (Number(item.productTemp) || 0) - 1))
                                      })
                                    }
                                    className="w-6 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center"
                                  >
                                    -
                                  </button>
                                  <span className="w-12 text-center font-mono font-bold text-xs text-slate-800">
                                    {Math.round(Number(item.productTemp) || 0)}°C
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateItem(item.id, {
                                        productTemp: Math.round(Math.min(30, (Number(item.productTemp) || 0) + 1))
                                      })
                                    }
                                    className="w-6 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-bold">—</span>
                              )}
                            </td>

                            {/* Exp Date */}
                            <td className="py-3 px-3">
                              {needsItemExp ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="date"
                                    value={item.expDate || ''}
                                    onChange={(e) => onUpdateItem(item.id, { expDate: e.target.value })}
                                    className="px-2 py-1 text-xs border border-slate-300 rounded-lg outline-none font-medium w-32 focus:border-purple-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => onPullPrevExp(item.id)}
                                    title={t.prev_exp}
                                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-bold">—</span>
                              )}
                            </td>

                            {/* Status Buttons */}
                            <td className="py-3 px-4 text-center">
                              {isDone ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => onSetStatus(item.id, 'pending')}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-transform active:scale-95 shadow-2xs ${
                                      item.status === 'approved'
                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                        : item.status === 'conditional'
                                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                    }`}
                                  >
                                    <span>
                                      {item.status === 'approved'
                                        ? t.accept
                                        : item.status === 'conditional'
                                        ? t.cond
                                        : t.reject}
                                    </span>
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                  {item.status === 'conditional' && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenConditionalModal(item, 'editNote')}
                                      className="p-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800"
                                      title={t.edit_note}
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="inline-flex rounded-lg overflow-hidden border border-slate-300 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => onSetStatus(item.id, 'approved')}
                                    className="px-2.5 py-1 bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white font-extrabold text-xs transition-colors"
                                  >
                                    {t.accept}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenConditionalModal(item, 'setStatus')}
                                    className="px-2.5 py-1 bg-white hover:bg-amber-600 text-amber-700 hover:text-white font-extrabold text-xs border-l border-slate-300 transition-colors"
                                  >
                                    {t.cond}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onSetStatus(item.id, 'rejected')}
                                    className="px-2.5 py-1 bg-white hover:bg-rose-600 text-rose-700 hover:text-white font-extrabold text-xs border-l border-slate-300 transition-colors"
                                  >
                                    {t.reject}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Touch Responsive Cards View */}
                <div className="lg:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-2.5">
                  {group.items.map((item) => {
                    const isLate = item.expectedDate < today;
                    const isDone = item.status !== 'pending';
                    const needsItemTemp = checkItemNeedsTemp(item);
                    const needsItemExp = checkItemNeedsExp(item);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-slate-50/80 border-slate-200 opacity-90'
                            : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        {/* Row 1: Product Name & Quantity */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {isLate && !isDone && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-black shrink-0">
                                {trDate(item.expectedDate).slice(0, 5)}
                              </span>
                            )}
                            <span
                              className={`text-xs font-bold text-slate-900 truncate ${
                                isDone ? 'line-through text-slate-400 font-medium' : ''
                              }`}
                              title={item.productName}
                            >
                              {item.productName}
                            </span>
                            {item.note ? (
                              <button
                                type="button"
                                onClick={() => handleOpenConditionalModal(item, 'editNote')}
                                className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 font-semibold truncate max-w-[120px] shrink-0 inline-flex items-center gap-0.5 hover:bg-amber-100"
                                title={item.note}
                              >
                                <span>✎ {item.note}</span>
                              </button>
                            ) : item.status === 'conditional' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenConditionalModal(item, 'editNote')}
                                className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 hover:bg-amber-100"
                              >
                                + Not
                              </button>
                            ) : null}
                          </div>
                          <div className="shrink-0">
                            <span className="text-xs font-black text-purple-950 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-lg">
                              {item.orderQty} <span className="text-[10px] text-purple-700 uppercase font-bold">{item.uom}</span>
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Quality Checks & Controls */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          {/* Quality Check Chips */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Label check toggle button */}
                            <button
                              type="button"
                              onClick={() => onUpdateItem(item.id, { labelCheck: !item.labelCheck })}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                item.labelCheck
                                  ? 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Etiket Kontrolü"
                            >
                              <span>🏷️</span>
                              <span>{t.label}:</span>
                              <span>{item.labelCheck ? '✓' : '—'}</span>
                            </button>

                            {/* Physical check toggle button */}
                            <button
                              type="button"
                              onClick={() => onUpdateItem(item.id, { physicalCheck: !item.physicalCheck })}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                item.physicalCheck
                                  ? 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Fiziksel Kontrol"
                            >
                              <span>📦</span>
                              <span>{t.phys}:</span>
                              <span>{item.physicalCheck ? '✓' : '—'}</span>
                            </button>

                            {/* Temperature Stepper */}
                            {needsItemTemp && (
                              <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateItem(item.id, {
                                      productTemp: Math.round(Math.max(-25, (Number(item.productTemp) || 0) - 1))
                                    })
                                  }
                                  className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="px-1.5 text-center font-mono font-bold text-[11px] text-slate-900">
                                  {Math.round(Number(item.productTemp) || 0)}°C
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateItem(item.id, {
                                      productTemp: Math.round(Math.min(30, (Number(item.productTemp) || 0) + 1))
                                    })
                                  }
                                  className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            )}

                            {/* Expiry Date */}
                            {needsItemExp && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="date"
                                  value={item.expDate || ''}
                                  onChange={(e) => onUpdateItem(item.id, { expDate: e.target.value })}
                                  className="px-1.5 py-0.5 text-[10px] border border-slate-300 rounded-lg outline-none font-medium w-26 bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => onPullPrevExp(item.id)}
                                  title={t.prev_exp}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Status Actions */}
                          <div className="flex items-center gap-1 ml-auto">
                            {isDone ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onSetStatus(item.id, 'pending')}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-2xs ${
                                    item.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : item.status === 'conditional'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                                  }`}
                                >
                                  <span>
                                    {item.status === 'approved'
                                      ? `✓ ${t.accept}`
                                      : item.status === 'conditional'
                                      ? `⚠️ ${t.cond}`
                                      : `✕ ${t.reject}`}
                                  </span>
                                  <RotateCcw className="w-2.5 h-2.5 opacity-70" />
                                </button>
                                {item.status === 'conditional' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenConditionalModal(item, 'editNote')}
                                    className="p-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                                    title="Şartlı Kabul Notunu Düzenle"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="inline-flex rounded-lg overflow-hidden border border-slate-300 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => onSetStatus(item.id, 'approved')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs transition-colors"
                                >
                                  {t.accept}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenConditionalModal(item, 'setStatus')}
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold text-xs border-l border-amber-600 transition-colors"
                                >
                                  {t.cond}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onSetStatus(item.id, 'rejected')}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs border-l border-rose-700 transition-colors"
                                >
                                  {t.reject}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Conditional Acceptance Note Modal */}
      {conditionalNoteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-amber-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-100" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {conditionalNoteItem.mode === 'setStatus'
                      ? t.cond_modal_title
                      : t.cond_note_edit_title}
                  </h3>
                  <p className="text-xs text-amber-100 font-medium">
                    {conditionalNoteItem.productName} ({conditionalNoteItem.supplierName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConditionalNoteItem(null)}
                className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-amber-700/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.cond_note_label}
                </label>
                <textarea
                  value={noteInputText}
                  onChange={(e) => setNoteInputText(e.target.value)}
                  placeholder={t.cond_note_ph}
                  rows={3}
                  autoFocus
                  className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none font-medium leading-relaxed"
                />
              </div>

              {/* Quick Reason Suggestions */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t.quick_reasons}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickNoteSuggestions.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() =>
                        setNoteInputText((prev) =>
                          prev ? `${prev}, ${reason}` : reason
                        )
                      }
                      className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition-colors font-medium text-left"
                    >
                      + {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setConditionalNoteItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={handleSaveConditionalNote}
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{t.cond_note_save}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
