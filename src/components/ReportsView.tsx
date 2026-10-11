import React, { useState } from 'react';
import {
  FileCheck,
  FileSpreadsheet,
  Printer,
  Mail,
  Copy,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Building2,
  Layers
} from 'lucide-react';
import { AppSettings, DeliveryItem } from '../types';
import { T } from '../utils/i18n';
import { docFooter, docHeader, printDoc } from '../utils/exportUtils';
import { esc, fmtDate, getTodayStr, nowStamp, parseDate, trDate } from '../utils/helpers';

interface ReportsViewProps {
  items: DeliveryItem[];
  settings: AppSettings;
  onOpenChecklistModal: () => void;
  onOpenShortChecklistModal: () => void;
  onOpenReportMailModal: (from: string, to: string) => void;
  onCopied: () => void;
}

type PeriodType = '1d' | '1w' | '1m' | '3m' | '1y' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({
  items,
  settings,
  onOpenChecklistModal,
  onOpenShortChecklistModal,
  onOpenReportMailModal,
  onCopied
}) => {
  const t = T[settings.language] || T.tr;
  const today = getTodayStr();

  const [period, setPeriod] = useState<PeriodType>('1d');
  const [customFrom, setCustomFrom] = useState(() => {
    const d = parseDate(today);
    d.setDate(d.getDate() - 7);
    return fmtDate(d);
  });
  const [customTo, setCustomTo] = useState(today);

  // Compute From and To dates
  const getPeriodRange = (): { from: string; to: string } => {
    if (period === 'custom') return { from: customFrom || today, to: customTo || today };
    const d = parseDate(today);
    if (period === '1w') d.setDate(d.getDate() - 6);
    else if (period === '1m') d.setMonth(d.getMonth() - 1);
    else if (period === '3m') d.setMonth(d.getMonth() - 3);
    else if (period === '1y') d.setFullYear(d.getFullYear() - 1);
    return { from: fmtDate(d), to: today };
  };

  const { from, to } = getPeriodRange();

  // Filter items in range
  const rangeItems = items.filter((i) => i.expectedDate >= from && i.expectedDate <= to);

  // Compute KPIs
  const stats = {
    total: rangeItems.length,
    approved: rangeItems.filter((i) => i.status === 'approved').length,
    conditional: rangeItems.filter((i) => i.status === 'conditional').length,
    rejected: rangeItems.filter((i) => i.status === 'rejected').length,
    pending: rangeItems.filter((i) => i.status === 'pending').length
  };
  const completion = stats.total
    ? Math.round(((stats.total - stats.pending) / stats.total) * 100)
    : 0;

  // Supplier breakdown
  const supStatsMap: Record<
    string,
    { name: string; total: number; approved: number; conditional: number; rejected: number; pending: number }
  > = {};

  rangeItems.forEach((i) => {
    supStatsMap[i.supplierName] = supStatsMap[i.supplierName] || {
      name: i.supplierName,
      total: 0,
      approved: 0,
      conditional: 0,
      rejected: 0,
      pending: 0
    };
    supStatsMap[i.supplierName].total++;
    if (supStatsMap[i.supplierName][i.status] !== undefined) {
      supStatsMap[i.supplierName][i.status]++;
    }
  });

  const supplierStats = Object.values(supStatsMap).sort((a, b) => b.total - a.total);

  // Trend / Activity buckets
  const bucketMap: Record<string, { b: string; total: number; approved: number; pending: number }> = {};
  rangeItems.forEach((i) => {
    const key = period === '3m' || period === '1y' ? i.expectedDate.slice(0, 7) : i.expectedDate;
    bucketMap[key] = bucketMap[key] || { b: key, total: 0, approved: 0, pending: 0 };
    bucketMap[key].total++;
    if (i.status === 'approved') bucketMap[key].approved++;
    if (i.status === 'pending') bucketMap[key].pending++;
  });
  const bucketList = Object.values(bucketMap).sort((a, b) => a.b.localeCompare(b.b));
  const maxBucket = Math.max(...bucketList.map((x) => x.total), 1);

  // Full Report PDF markup
  const handlePrintFullReport = () => {
    const head = docHeader(
      'Mal Kabul Raporu / Receiving Report',
      `${trDate(from)} – ${trDate(to)} (${period.toUpperCase()})`,
      [`Hazırlayan: ${settings.username}`, settings.company, `Tarih: ${nowStamp()}`]
    );

    const kpiSection = `<div class="kpi-row">
      <div class="kpi"><b style="color:#0f172a">${stats.total}</b><span>${esc(t.k_total)}</span></div>
      <div class="kpi"><b style="color:#059669">${stats.approved}</b><span>${esc(t.k_ok)}</span></div>
      <div class="kpi"><b style="color:#d97706">${stats.conditional}</b><span>${esc(t.k_cond)}</span></div>
      <div class="kpi"><b style="color:#e11d48">${stats.rejected}</b><span>${esc(t.k_rej)}</span></div>
      <div class="kpi"><b style="color:#64748b">${stats.pending}</b><span>${esc(t.k_pend)}</span></div>
    </div>
    <div class="track">
      <i style="width:${(stats.approved / (stats.total || 1)) * 100}%;background:#059669"></i>
      <i style="width:${(stats.conditional / (stats.total || 1)) * 100}%;background:#f59e0b"></i>
      <i style="width:${(stats.rejected / (stats.total || 1)) * 100}%;background:#e11d48"></i>
      <i style="width:${(stats.pending / (stats.total || 1)) * 100}%;background:#e2e8f0"></i>
    </div>
    <div class="legend">${esc(t.completion)}: %${completion}</div>`;

    const supSection = `<h2 class="sec">${esc(t.by_supplier)}</h2>
    <table><thead><tr>
      <th>${esc(t.supplier)}</th>
      <th class="c">${esc(t.lines)}</th>
      <th class="c">${esc(t.k_ok)}</th>
      <th class="c">${esc(t.k_cond)}</th>
      <th class="c">${esc(t.k_rej)}</th>
      <th class="c">${esc(t.k_pend)}</th>
      <th class="c">%</th>
    </tr></thead><tbody>
    ${supplierStats
      .map(
        (s) =>
          `<tr>
        <td style="font-weight:700">${esc(s.name)}</td>
        <td class="c font-bold">${s.total}</td>
        <td class="c" style="color:#059669">${s.approved}</td>
        <td class="c" style="color:#d97706">${s.conditional}</td>
        <td class="c" style="color:#e11d48">${s.rejected}</td>
        <td class="c" style="color:#64748b">${s.pending}</td>
        <td class="c font-bold">${Math.round(((s.total - s.pending) / (s.total || 1)) * 100)}%</td>
      </tr>`
      )
      .join('')}
    </tbody></table>`;

    const detailSection =
      rangeItems.length <= 150
        ? `<h2 class="sec">Detaylı Kalem Listesi / Detailed Log</h2>
      <table><thead><tr>
        <th>Tarih</th>
        <th>${esc(t.supplier)}</th>
        <th>PO</th>
        <th>${esc(t.product)}</th>
        <th class="c">${esc(t.qty)}</th>
        <th class="c">A.°C</th>
        <th class="c">Ü.°C</th>
        <th class="c">SKT</th>
        <th class="c">${esc(t.status)}</th>
      </tr></thead><tbody>
      ${rangeItems
        .slice()
        .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate))
        .map(
          (i) =>
            `<tr>
          <td>${esc(i.expectedDate)}</td>
          <td>${esc(i.supplierName)}</td>
          <td>${esc(i.poNumber)}</td>
          <td style="font-weight:600">${esc(i.productName)}</td>
          <td class="c">${esc(i.orderQty)} ${esc(i.uom)}</td>
          <td class="c">${esc(i.truckTemp)}</td>
          <td class="c">${esc(i.productTemp)}</td>
          <td class="c">${esc(i.expDate || '—')}</td>
          <td class="c font-bold">${i.status.toUpperCase()}</td>
        </tr>`
        )
        .join('')}
      </tbody></table>`
        : '';

    const sign = `<div class="sign">
      <div>Hazırlayan / Prepared by: ${esc(settings.username)}</div>
      <div>Satınalma Müdürü / Purchasing Manager</div>
    </div>`;

    const fullHtml = head + kpiSection + supSection + detailSection + sign + docFooter(settings);
    printDoc('Mal Kabul Raporu', fullHtml);
  };

  const handleExportRaw = (type: 'all' | 'received' | 'pending' | 'json') => {
    let dataset = rangeItems;
    if (type === 'received') dataset = dataset.filter((i) => i.status !== 'pending');
    if (type === 'pending') dataset = dataset.filter((i) => i.status === 'pending');

    if (type === 'json') {
      const json = JSON.stringify(
        {
          schemaVersion: 4,
          app: 'RECEIVING EASY',
          exportedAt: new Date().toISOString(),
          range: { period, from, to },
          count: dataset.length,
          deliveries: dataset
        },
        null,
        2
      );
      navigator.clipboard.writeText(json);
      onCopied();
      return;
    }

    const headers = [
      'Date',
      'Supplier',
      'PO Number',
      'Subject',
      'Department',
      'Product',
      'Note',
      'Qty',
      'UOM',
      'Truck Check',
      'Truck Temp',
      'Label Check',
      'Physical Check',
      'Product Temp',
      'Exp Date',
      'Status',
      'Recorded By',
      'Recorded At'
    ];

    const rows = dataset.map((i) =>
      [
        i.expectedDate,
        i.supplierName,
        i.poNumber,
        i.subject,
        i.department || '',
        i.productName,
        i.note || '',
        i.orderQty,
        i.uom,
        i.truckCheck ? 'OK' : 'FAIL',
        i.truckTemp,
        i.labelCheck ? 'OK' : 'FAIL',
        i.physicalCheck ? 'OK' : 'FAIL',
        i.productTemp,
        i.expDate || '',
        i.status,
        i.recordedBy || '',
        i.recordedAt || ''
      ].join('\t')
    );

    const text = headers.join('\t') + '\n' + rows.join('\n');
    navigator.clipboard.writeText(text);
    onCopied();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Action Hero Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Daily Food Entrance Checklist Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950 text-white shadow-md flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-400" />
              <h3 className="font-extrabold text-sm sm:text-base">
                {t.checklist_btn.split('→')[0]}
              </h3>
            </div>
            <p className="text-xs text-purple-200/80 mt-1 max-w-sm">{t.checklist_desc}</p>
          </div>
          <button
            type="button"
            onClick={onOpenChecklistModal}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow-xs shrink-0 transition-transform active:scale-95"
          >
            PDF Form
          </button>
        </div>

        {/* Short Daily Check List Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white shadow-md flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-sm sm:text-base">{t.short_title}</h3>
            </div>
            <p className="text-xs text-teal-200/80 mt-1 max-w-sm">{t.short_desc}</p>
          </div>
          <button
            type="button"
            onClick={onOpenShortChecklistModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs shrink-0 transition-transform active:scale-95"
          >
            PDF / XLSX
          </button>
        </div>
      </div>

      {/* Period Selection Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">{t.period}</h3>
            <span className="text-xs font-semibold text-purple-700">
              {trDate(from)} → {trDate(to)}
            </span>
          </div>

          {/* Period Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['1d', t.p1d],
                ['1w', t.p1w],
                ['1m', t.p1m],
                ['3m', t.p3m],
                ['1y', t.p1y],
                ['custom', t.custom]
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setPeriod(val)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  period === val
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range picker if custom selected */}
        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.from}</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.to}</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
            {t.k_total}
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">
            {stats.total}
          </span>
        </div>

        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 shadow-xs">
          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
            {t.k_ok}
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 block mt-1">
            {stats.approved}
          </span>
        </div>

        <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 shadow-xs">
          <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
            {t.k_cond}
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-700 block mt-1">
            {stats.conditional}
          </span>
        </div>

        <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200/80 shadow-xs">
          <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">
            {t.k_rej}
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-700 block mt-1">
            {stats.rejected}
          </span>
        </div>

        <div className="p-3.5 bg-slate-100/70 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
            {t.k_pend}
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-700 block mt-1">
            {stats.pending}
          </span>
        </div>
      </div>

      {/* Completion Rate Progress */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700 uppercase tracking-wider text-[11px]">
            {t.completion}
          </span>
          <span className="text-purple-700 text-sm font-black">%{completion}</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${(stats.approved / (stats.total || 1)) * 100}%` }}
            className="bg-emerald-500 h-full transition-all"
          />
          <div
            style={{ width: `${(stats.conditional / (stats.total || 1)) * 100}%` }}
            className="bg-amber-400 h-full transition-all"
          />
          <div
            style={{ width: `${(stats.rejected / (stats.total || 1)) * 100}%` }}
            className="bg-rose-500 h-full transition-all"
          />
        </div>
      </div>

      {/* Activity Bar Chart */}
      {bucketList.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>{t.by_date}</span>
            </h4>
          </div>

          <div className="flex items-end gap-1.5 h-28 overflow-x-auto pt-2 pb-1 scrollbar-none">
            {bucketList.map((bk) => {
              const heightPct = Math.max(8, (bk.total / maxBucket) * 100);
              return (
                <div
                  key={bk.b}
                  title={`${bk.b}: ${bk.total} kalem`}
                  className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group"
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-purple-500 hover:bg-purple-600 rounded-t-md transition-all relative"
                  />
                  <span className="text-[9px] font-bold text-slate-400 mt-1 whitespace-nowrap">
                    {bk.b.length > 7 ? bk.b.slice(5) : bk.b.slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supplier Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-purple-600" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
            {t.by_supplier}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-100/60 text-slate-500 font-extrabold text-[10px] uppercase">
                <th className="py-2.5 px-4">{t.supplier}</th>
                <th className="py-2.5 px-3 text-center">{t.lines}</th>
                <th className="py-2.5 px-3 text-center text-emerald-600">{t.k_ok}</th>
                <th className="py-2.5 px-3 text-center text-amber-600">{t.k_cond}</th>
                <th className="py-2.5 px-3 text-center text-rose-600">{t.k_rej}</th>
                <th className="py-2.5 px-3 text-center text-slate-500">{t.k_pend}</th>
                <th className="py-2.5 px-4 text-center">% Oran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {supplierStats.map((sup) => {
                const supRate = Math.round(
                  ((sup.total - sup.pending) / (sup.total || 1)) * 100
                );
                return (
                  <tr key={sup.name} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{sup.name}</td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-slate-800">
                      {sup.total}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                      {sup.approved}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-600">
                      {sup.conditional}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                      {sup.rejected}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                      {sup.pending}
                    </td>
                    <td className="py-2.5 px-4 text-center font-black text-purple-700">
                      %{supRate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Deliveries Detailed Log Table for Selected Period */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Seçili Dönem Teslimat Kayıtları ({rangeItems.length} Kalem)
            </h4>
          </div>
          <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
            {trDate(from)} – {trDate(to)}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          {rangeItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              Bu tarih aralığında kayıt bulunamadı.
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-100 z-10">
                <tr className="text-slate-600 font-extrabold text-[10px] uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">Tarih</th>
                  <th className="py-2.5 px-3">{t.supplier}</th>
                  <th className="py-2.5 px-3">PO</th>
                  <th className="py-2.5 px-3">{t.product}</th>
                  <th className="py-2.5 px-2 text-center">{t.qty}</th>
                  <th className="py-2.5 px-2 text-center">A.°C</th>
                  <th className="py-2.5 px-2 text-center">Ü.°C</th>
                  <th className="py-2.5 px-3">SKT</th>
                  <th className="py-2.5 px-3 text-center">{t.status}</th>
                  <th className="py-2.5 px-3">Not / Şartlı Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {rangeItems
                  .slice()
                  .sort((a, b) => b.expectedDate.localeCompare(a.expectedDate))
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                        {trDate(item.expectedDate)}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">{item.supplierName}</td>
                      <td className="py-2 px-3 font-mono text-purple-700 text-[11px] font-bold">
                        {item.poNumber}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800 max-w-[200px] truncate">
                        {item.productName}
                      </td>
                      <td className="py-2 px-2 text-center font-bold">
                        {item.orderQty} <span className="text-[10px] text-slate-400">{item.uom}</span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold">
                        {item.truckTemp !== undefined ? `${Math.round(Number(item.truckTemp) || 0)}°C` : '—'}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold">
                        {item.productTemp !== undefined ? `${Math.round(Number(item.productTemp) || 0)}°C` : '—'}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-600 font-mono">
                        {item.expDate ? trDate(item.expDate) : '—'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            item.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'conditional'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.status === 'approved'
                            ? t.accept
                            : item.status === 'conditional'
                            ? t.cond
                            : item.status === 'rejected'
                            ? t.reject
                            : t.pending}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {item.note ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold max-w-[220px] truncate">
                            ✎ {item.note}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Export & Actions Section */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
          {t.exports}
        </h4>

        {/* Big Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handlePrintFullReport}
            className="flex items-center justify-center gap-2 p-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{t.pdf_report}</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenReportMailModal(from, to)}
            className="flex items-center justify-center gap-2 p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>{t.mail_report}</span>
          </button>
        </div>

        {/* Raw Export Buttons */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            {t.raw_exports}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleExportRaw('all')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              {t.export_all}
            </button>
            <button
              type="button"
              onClick={() => handleExportRaw('received')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              {t.export_rec}
            </button>
            <button
              type="button"
              onClick={() => handleExportRaw('pending')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              {t.export_pend}
            </button>
            <button
              type="button"
              onClick={() => handleExportRaw('json')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
