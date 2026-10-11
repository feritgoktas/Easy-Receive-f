import React, { useRef, useState } from 'react';
import {
  Search,
  Trash2,
  Save,
  X,
  RotateCcw,
  AlertTriangle,
  SlidersHorizontal,
  CloudUpload,
  RefreshCw,
  Smartphone,
  Table as TableIcon
} from 'lucide-react';
import { AppSettings, DeliveryItem, DeliveryStatus } from '../types';
import { T } from '../utils/i18n';
import { trDate } from '../utils/helpers';

interface HistoricalViewProps {
  items: DeliveryItem[];
  availableMonths: string[];
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
  settings: AppSettings;
  onSaveEdits: (edits: Record<string, Partial<DeliveryItem>>) => void;
  onDeleteItem: (id: string) => void;
  onSaveToCloud?: () => void;
  isSyncing?: boolean;
}

export const HistoricalView: React.FC<HistoricalViewProps> = ({
  items,
  availableMonths,
  selectedMonth,
  onSelectMonth,
  settings,
  onSaveEdits,
  onDeleteItem,
  onSaveToCloud,
  isSyncing = false
}) => {
  const t = T[settings.language] || T.tr;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'product' | 'supplier' | 'date'>('all');
  const [sliderVal, setSliderVal] = useState(0);
  const [stagedEdits, setStagedEdits] = useState<Record<string, Partial<DeliveryItem>>>({});
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');

  // Filter items
  const q = searchQuery.toLowerCase().trim();
  const filteredList = items.filter((i) => {
    if (!q) return true;
    if (searchField === 'product') return i.productName.toLowerCase().includes(q);
    if (searchField === 'supplier') return i.supplierName.toLowerCase().includes(q);
    if (searchField === 'date') return i.expectedDate.includes(q);
    return (
      i.productName.toLowerCase().includes(q) ||
      i.supplierName.toLowerCase().includes(q) ||
      i.expectedDate.includes(q) ||
      i.poNumber.toLowerCase().includes(q) ||
      (i.department || '').toLowerCase().includes(q) ||
      (i.note || '').toLowerCase().includes(q)
    );
  });

  const getEffectiveValue = <K extends keyof DeliveryItem>(
    item: DeliveryItem,
    field: K
  ): DeliveryItem[K] => {
    const edit = stagedEdits[item.id];
    if (edit && edit[field] !== undefined) {
      return edit[field] as DeliveryItem[K];
    }
    return item[field];
  };

  const handleStageField = (id: string, field: keyof DeliveryItem, value: unknown) => {
    setStagedEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSaveEdits(stagedEdits);
    setStagedEdits({});
  };

  const handleDiscard = () => {
    setStagedEdits({});
  };

  const handleScrollChange = (val: number) => {
    setSliderVal(val);
    if (tableContainerRef.current) {
      const max =
        tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
      tableContainerRef.current.scrollLeft = max * (val / 100);
    }
  };

  const nEdits = Object.keys(stagedEdits).length;

  return (
    <div className="space-y-4 pb-20">
      {/* Top Filter Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">{t.hist_title}</h2>
            <p className="text-xs text-slate-500">{t.hist_desc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-bold text-slate-600 shrink-0">{t.month}:</label>
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:border-purple-600 outline-none"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold shrink-0">
              {filteredList.length} {t.records}
            </span>

            {onSaveToCloud && (
              <button
                type="button"
                onClick={onSaveToCloud}
                disabled={isSyncing}
                title="Tüm verileri Firebase ortak veritabanına manuel kaydet / eşitle"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
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

        {/* Search row */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as typeof searchField)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl outline-none"
          >
            <option value="all">{t.search_all}</option>
            <option value="product">{t.product}</option>
            <option value="supplier">{t.supplier}</option>
            <option value="date">{t.date}</option>
          </select>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search_ph}
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:border-purple-600 outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card / Mobile Cards View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* View mode switcher & Horizontal scroll slider helper */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          {/* Mobile View Toggle (visible on smaller screens) */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={() => setMobileViewMode('cards')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                mobileViewMode === 'cards'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Kompakt Kartlar</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                mobileViewMode === 'table'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tablo</span>
            </button>
          </div>

          {/* Slider for horizontal scrolling when viewing table */}
          <div className={`flex items-center gap-3 flex-1 min-w-[200px] ${mobileViewMode === 'cards' ? 'hidden md:flex' : 'flex'}`}>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider shrink-0">
              {t.hslider}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderVal}
              onChange={(e) => handleScrollChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>
        </div>

        {/* Mobile Cards Layout (for Android / Mobile view) */}
        {mobileViewMode === 'cards' && (
          <div className="md:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-2">
            {filteredList.map((item) => {
              const isEdited = !!stagedEdits[item.id];
              const status = getEffectiveValue(item, 'status');
              const qty = getEffectiveValue(item, 'orderQty');
              const truckCheck = getEffectiveValue(item, 'truckCheck');
              const truckTemp = getEffectiveValue(item, 'truckTemp');
              const labelCheck = getEffectiveValue(item, 'labelCheck');
              const physicalCheck = getEffectiveValue(item, 'physicalCheck');
              const productTemp = getEffectiveValue(item, 'productTemp');
              const expDate = getEffectiveValue(item, 'expDate');

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all space-y-2 ${
                    isEdited
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                      : 'bg-white border-slate-200/90 shadow-2xs'
                  }`}
                >
                  {/* Top: Date & Supplier */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {trDate(item.expectedDate)}
                    </span>
                    <span className="font-extrabold text-slate-900 truncate flex-1 text-right">
                      {item.supplierName}
                    </span>
                  </div>

                  {/* Product & Qty */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">PO: {item.poNumber || '—'}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        value={qty}
                        onChange={(e) => handleStageField(item.id, 'orderQty', e.target.value)}
                        className="w-14 px-1.5 py-0.5 text-xs font-bold text-right border border-slate-300 rounded bg-white"
                      />
                      <span className="text-[10px] uppercase font-bold text-slate-500">{item.uom}</span>
                    </div>
                  </div>

                  {/* Quality & Status Controls Row */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    {/* Quality Badges */}
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStageField(item.id, 'labelCheck', !labelCheck)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          labelCheck
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        🏷️ {labelCheck ? '✓' : '—'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStageField(item.id, 'physicalCheck', !physicalCheck)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          physicalCheck
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        📦 {physicalCheck ? '✓' : '—'}
                      </button>

                      <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 px-1 py-0.5 rounded">
                        <span className="text-[9px] text-slate-500">🌡️</span>
                        <input
                          type="number"
                          value={productTemp}
                          onChange={(e) =>
                            handleStageField(item.id, 'productTemp', Number(e.target.value))
                          }
                          className="w-8 text-center text-[10px] font-bold bg-transparent outline-none"
                        />
                        <span className="text-[9px]">°C</span>
                      </div>
                    </div>

                    {/* Status Dropdown & Delete */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <select
                        value={status}
                        onChange={(e) =>
                          handleStageField(item.id, 'status', e.target.value as DeliveryStatus)
                        }
                        className={`px-2 py-1 text-xs font-black rounded-lg border outline-none ${
                          status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : status === 'conditional'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="pending">{t.pending}</option>
                        <option value="approved">{t.accept}</option>
                        <option value="conditional">{t.cond}</option>
                        <option value="rejected">{t.reject}</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-100"
                        title={t.del}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Interactive Editable Table (Desktop or when Table mode selected on mobile) */}
        <div
          ref={tableContainerRef}
          onScroll={(e) => {
            const target = e.currentTarget;
            const max = target.scrollWidth - target.clientWidth;
            if (max > 0) setSliderVal(Math.round((target.scrollLeft / max) * 100));
          }}
          className={`overflow-x-auto ${mobileViewMode === 'cards' ? 'hidden md:block' : 'block'}`}
        >
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">{t.date}</th>
                <th className="py-2.5 px-3">{t.supplier}</th>
                <th className="py-2.5 px-2">PO</th>
                <th className="py-2.5 px-3 min-w-[200px]">{t.product}</th>
                <th className="py-2.5 px-3">{t.qty}</th>
                <th className="py-2.5 px-2 text-center">{t.truck}</th>
                <th className="py-2.5 px-2 text-center">{t.ttemp}</th>
                <th className="py-2.5 px-2 text-center">{t.label}</th>
                <th className="py-2.5 px-2 text-center">{t.phys}</th>
                <th className="py-2.5 px-2 text-center">{t.ptemp}</th>
                <th className="py-2.5 px-3">{t.exp}</th>
                <th className="py-2.5 px-3">{t.status}</th>
                <th className="py-2.5 px-3">{t.record}</th>
                <th className="py-2.5 px-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => {
                const isEdited = !!stagedEdits[item.id];
                const status = getEffectiveValue(item, 'status');
                const qty = getEffectiveValue(item, 'orderQty');
                const truckCheck = getEffectiveValue(item, 'truckCheck');
                const truckTemp = getEffectiveValue(item, 'truckTemp');
                const labelCheck = getEffectiveValue(item, 'labelCheck');
                const physicalCheck = getEffectiveValue(item, 'physicalCheck');
                const productTemp = getEffectiveValue(item, 'productTemp');
                const expDate = getEffectiveValue(item, 'expDate');

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isEdited
                        ? 'bg-amber-50/70 shadow-[inset_3px_0_0_#f59e0b]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Date */}
                    <td className="py-2 px-3 text-[11px] font-mono text-slate-500">
                      {trDate(item.expectedDate)}
                    </td>

                    {/* Supplier */}
                    <td className="py-2 px-3 font-bold text-slate-900 max-w-[170px] truncate">
                      <div>{item.supplierName}</div>
                      {item.supplierPhone && (
                        <div className="text-[10px] text-emerald-700 font-mono font-medium">
                          {item.supplierPhone}
                        </div>
                      )}
                    </td>

                    {/* PO */}
                    <td className="py-2 px-2">
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-extrabold text-[10px] font-mono">
                        {item.poNumber}
                      </span>
                    </td>

                    {/* Product */}
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      <div>{item.productName}</div>
                      {item.department && (
                        <div className="text-[10px] text-slate-400 font-normal">{item.department}</div>
                      )}
                    </td>

                    {/* Qty & UOM */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) =>
                            handleStageField(item.id, 'orderQty', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 px-1.5 py-0.5 text-xs border border-slate-300 rounded font-bold"
                        />
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                          {item.uom}
                        </span>
                      </div>
                    </td>

                    {/* Truck Check */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={truckCheck}
                        onChange={(e) =>
                          handleStageField(item.id, 'truckCheck', e.target.checked)
                        }
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                    </td>

                    {/* Truck Temp */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        step="1"
                        value={truckTemp}
                        onChange={(e) =>
                          handleStageField(item.id, 'truckTemp', Math.round(parseFloat(e.target.value) || 0))
                        }
                        className="w-14 px-1 py-0.5 text-xs border border-slate-300 rounded text-center font-mono font-bold"
                      />
                    </td>

                    {/* Label */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={labelCheck}
                        onChange={(e) =>
                          handleStageField(item.id, 'labelCheck', e.target.checked)
                        }
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                    </td>

                    {/* Phys */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={physicalCheck}
                        onChange={(e) =>
                          handleStageField(item.id, 'physicalCheck', e.target.checked)
                        }
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                    </td>

                    {/* Product Temp */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        step="1"
                        value={productTemp}
                        onChange={(e) =>
                          handleStageField(item.id, 'productTemp', Math.round(parseFloat(e.target.value) || 0))
                        }
                        className="w-14 px-1 py-0.5 text-xs border border-slate-300 rounded text-center font-mono font-bold"
                      />
                    </td>

                    {/* Exp Date */}
                    <td className="py-2 px-3">
                      <input
                        type="date"
                        value={expDate || ''}
                        onChange={(e) => handleStageField(item.id, 'expDate', e.target.value)}
                        className="px-1.5 py-0.5 text-xs border border-slate-300 rounded font-medium"
                      />
                    </td>

                    {/* Status */}
                    <td className="py-2 px-3">
                      <select
                        value={status}
                        onChange={(e) =>
                          handleStageField(item.id, 'status', e.target.value as DeliveryStatus)
                        }
                        className={`px-2 py-1 text-xs font-bold rounded-lg border outline-none ${
                          status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : status === 'conditional'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="pending">{t.pending}</option>
                        <option value="approved">{t.accept}</option>
                        <option value="conditional">{t.cond}</option>
                        <option value="rejected">{t.reject}</option>
                      </select>
                    </td>

                    {/* Recorded By & User */}
                    <td className="py-2 px-3 text-[10px] text-slate-500 leading-tight">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <span>{item.recordedBy || item.updatedBy || 'Anonim'}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {item.userId ? `ID: ${item.userId.slice(0, 10)}…` : ''}
                      </div>
                      <div className="text-[9px] text-slate-400">{item.recordedAt || item.updatedAt || ''}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                        title={t.del}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Floating save bar */}
        {nEdits > 0 && (
          <div className="sticky bottom-0 z-30 flex items-center justify-between p-3 sm:p-4 bg-amber-50 border-t border-amber-200 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>
                {nEdits} {t.hist_pending}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.cancel}</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t.hist_save}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
