import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  Calendar,
  Filter,
  Download,
  Search,
  ArrowUpDown,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { AppSettings, DeliveryItem } from '../types';
import { T } from '../utils/i18n';
import { monthOf, trDate } from '../utils/helpers';

interface AnalyticsViewProps {
  items: DeliveryItem[];
  settings: AppSettings;
}

const STATUS_COLORS = {
  approved: '#10b981', // Emerald 500
  conditional: '#f59e0b', // Amber 500
  rejected: '#ef4444', // Rose 500
  pending: '#94a3b8' // Slate 400
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ items, settings }) => {
  const t = T[settings.language] || T.tr;

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '3m' | '6m' | '12m'>('all');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');
  const [searchSupplier, setSearchSupplier] = useState<string>('');
  const [supplierSortBy, setSupplierSortBy] = useState<'volume' | 'rejected' | 'approved' | 'rate'>('volume');
  const [chartViewMode, setChartViewMode] = useState<'stacked' | 'grouped'>('stacked');
  const [supplierLimit, setSupplierLimit] = useState<number>(10);
  const [drilldownSupplier, setDrilldownSupplier] = useState<string | null>(null);

  // Filter items by period
  const filteredItems = useMemo(() => {
    if (!items.length) return [];

    let result = [...items];

    if (selectedPeriod !== 'all') {
      const now = new Date();
      let monthsAgo = 3;
      if (selectedPeriod === '6m') monthsAgo = 6;
      if (selectedPeriod === '12m') monthsAgo = 12;

      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      const cutoffStr = cutoffDate.toISOString().slice(0, 10);
      result = result.filter((i) => (i.expectedDate || '') >= cutoffStr);
    }

    if (selectedSupplierFilter !== 'ALL') {
      result = result.filter((i) => i.supplierName === selectedSupplierFilter);
    }

    return result;
  }, [items, selectedPeriod, selectedSupplierFilter]);

  // Overall KPIs
  const kpiStats = useMemo(() => {
    const total = filteredItems.length;
    const approved = filteredItems.filter((i) => i.status === 'approved').length;
    const conditional = filteredItems.filter((i) => i.status === 'conditional').length;
    const rejected = filteredItems.filter((i) => i.status === 'rejected').length;
    const pending = filteredItems.filter((i) => i.status === 'pending').length;

    const evaluated = approved + conditional + rejected;
    const approvalRate = evaluated > 0 ? ((approved / evaluated) * 100).toFixed(1) : '0.0';
    const rejectionRate = evaluated > 0 ? ((rejected / evaluated) * 100).toFixed(1) : '0.0';
    const conditionalRate = evaluated > 0 ? ((conditional / evaluated) * 100).toFixed(1) : '0.0';

    return {
      total,
      approved,
      conditional,
      rejected,
      pending,
      evaluated,
      approvalRate,
      rejectionRate,
      conditionalRate
    };
  }, [filteredItems]);

  // 1. Monthly Delivery Volumes Data for Recharts
  const monthlyData = useMemo(() => {
    const map: Record<
      string,
      {
        month: string;
        label: string;
        total: number;
        approved: number;
        conditional: number;
        rejected: number;
        pending: number;
      }
    > = {};

    filteredItems.forEach((item) => {
      const m = monthOf(item.expectedDate || '') || 'Bilinmeyen';
      if (!map[m]) {
        // Format Month label (e.g. 2026-08 -> Ağu 2026)
        let label = m;
        try {
          const [yr, mo] = m.split('-');
          if (yr && mo) {
            const dateObj = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, 1);
            label = dateObj.toLocaleDateString(settings.language === 'en' ? 'en-US' : 'tr-TR', {
              month: 'short',
              year: 'numeric'
            });
          }
        } catch {
          label = m;
        }

        map[m] = {
          month: m,
          label,
          total: 0,
          approved: 0,
          conditional: 0,
          rejected: 0,
          pending: 0
        };
      }

      map[m].total += 1;
      if (item.status === 'approved') map[m].approved += 1;
      else if (item.status === 'conditional') map[m].conditional += 1;
      else if (item.status === 'rejected') map[m].rejected += 1;
      else map[m].pending += 1;
    });

    // Sort chronologically
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredItems, settings.language]);

  // 2. Supplier 'Approved' vs 'Rejected' Distribution Data for Recharts
  const supplierDistributionData = useMemo(() => {
    const map: Record<
      string,
      {
        supplier: string;
        total: number;
        approved: number;
        conditional: number;
        rejected: number;
        pending: number;
        approvalRate: number;
        rejectionRate: number;
      }
    > = {};

    filteredItems.forEach((item) => {
      const sup = item.supplierName || 'Diğer';
      if (!map[sup]) {
        map[sup] = {
          supplier: sup,
          total: 0,
          approved: 0,
          conditional: 0,
          rejected: 0,
          pending: 0,
          approvalRate: 0,
          rejectionRate: 0
        };
      }

      map[sup].total += 1;
      if (item.status === 'approved') map[sup].approved += 1;
      else if (item.status === 'conditional') map[sup].conditional += 1;
      else if (item.status === 'rejected') map[sup].rejected += 1;
      else map[sup].pending += 1;
    });

    const list = Object.values(map).map((s) => {
      const evalCount = s.approved + s.conditional + s.rejected;
      const approvalRate = evalCount > 0 ? (s.approved / evalCount) * 100 : 0;
      const rejectionRate = evalCount > 0 ? (s.rejected / evalCount) * 100 : 0;
      return {
        ...s,
        approvalRate: Math.round(approvalRate * 10) / 10,
        rejectionRate: Math.round(rejectionRate * 10) / 10
      };
    });

    // Apply sorting
    if (supplierSortBy === 'volume') {
      list.sort((a, b) => b.total - a.total);
    } else if (supplierSortBy === 'rejected') {
      list.sort((a, b) => b.rejected - a.rejected || b.rejectionRate - a.rejectionRate);
    } else if (supplierSortBy === 'approved') {
      list.sort((a, b) => b.approved - a.approved);
    } else if (supplierSortBy === 'rate') {
      list.sort((a, b) => b.approvalRate - a.approvalRate);
    }

    return list;
  }, [filteredItems, supplierSortBy]);

  // Top suppliers for chart
  const chartSupplierData = useMemo(() => {
    return supplierDistributionData.slice(0, supplierLimit);
  }, [supplierDistributionData, supplierLimit]);

  // Filtered suppliers for table
  const tableSuppliers = useMemo(() => {
    if (!searchSupplier.trim()) return supplierDistributionData;
    const query = searchSupplier.toLowerCase().trim();
    return supplierDistributionData.filter((s) => s.supplier.toLowerCase().includes(query));
  }, [supplierDistributionData, searchSupplier]);

  // 3. Status Distribution Data for Pie Chart
  const statusPieData = useMemo(() => {
    return [
      { name: settings.language === 'en' ? 'Approved' : 'Kabul Edilen', value: kpiStats.approved, color: STATUS_COLORS.approved },
      { name: settings.language === 'en' ? 'Conditional' : 'Şartlı Kabul', value: kpiStats.conditional, color: STATUS_COLORS.conditional },
      { name: settings.language === 'en' ? 'Rejected' : 'Reddedilen', value: kpiStats.rejected, color: STATUS_COLORS.rejected },
      { name: settings.language === 'en' ? 'Pending' : 'Bekleyen', value: kpiStats.pending, color: STATUS_COLORS.pending }
    ].filter((d) => d.value > 0);
  }, [kpiStats, settings.language]);

  // Supplier Drill-down data
  const drilldownData = useMemo(() => {
    if (!drilldownSupplier) return null;
    const supItems = filteredItems.filter((i) => i.supplierName === drilldownSupplier);
    const byProduct: Record<string, { product: string; approved: number; rejected: number; conditional: number; total: number }> = {};

    supItems.forEach((item) => {
      const p = item.productName || 'Genel Ürün';
      if (!byProduct[p]) {
        byProduct[p] = { product: p, approved: 0, rejected: 0, conditional: 0, total: 0 };
      }
      byProduct[p].total += 1;
      if (item.status === 'approved') byProduct[p].approved += 1;
      else if (item.status === 'rejected') byProduct[p].rejected += 1;
      else if (item.status === 'conditional') byProduct[p].conditional += 1;
    });

    return {
      supplier: drilldownSupplier,
      total: supItems.length,
      items: supItems,
      products: Object.values(byProduct).sort((a, b) => b.total - a.total).slice(0, 10)
    };
  }, [drilldownSupplier, filteredItems]);

  // Export Analytics Summary CSV
  const handleExportCsv = () => {
    const rows = [
      ['Tedarikçi', 'Toplam Kalem', 'Kabul Edilen', 'Şartlı Kabul', 'Reddedilen', 'Bekleyen', 'Kabul Oranı (%)', 'Red Oranı (%)']
    ];

    supplierDistributionData.forEach((s) => {
      rows.push([
        `"${s.supplier.replace(/"/g, '""')}"`,
        String(s.total),
        String(s.approved),
        String(s.conditional),
        String(s.rejected),
        String(s.pending),
        `${s.approvalRate}%`,
        `${s.rejectionRate}%`
      ]);
    });

    const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mal_kabul_analitik_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const allSuppliersList = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.supplierName))).filter(Boolean).sort();
  }, [items]);

  return (
    <div id="analytics-view-container" className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {settings.language === 'en' ? 'Delivery & Quality Analytics' : 'Mal Kabul ve Kalite Analitiği'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {settings.language === 'en'
                  ? 'Interactive visualization of monthly delivery volumes and supplier acceptance vs rejection distribution'
                  : 'Aylık teslimat hacimleri ve tedarikçi bazlı kabul / red dağılımlarının görsel analizi'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Period & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPeriod === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {settings.language === 'en' ? 'All Time' : 'Tümü'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('3m')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPeriod === '3m'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {settings.language === 'en' ? 'Last 3M' : 'Son 3 Ay'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('6m')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPeriod === '6m'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {settings.language === 'en' ? 'Last 6M' : 'Son 6 Ay'}
            </button>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            title="Analitik Raporunu CSV Olarak İndir"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{settings.language === 'en' ? 'Export CSV' : 'CSV İndir'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Deliveries */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {settings.language === 'en' ? 'Total Deliveries' : 'Toplam Teslimat'}
            </span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpiStats.total}</div>
          <div className="text-[10px] text-slate-400 font-medium">
            {allSuppliersList.length} {settings.language === 'en' ? 'suppliers' : 'tedarikçi'}
          </div>
        </div>

        {/* Approved */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {settings.language === 'en' ? 'Approved' : 'Kabul Edilen'}
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{kpiStats.approved}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">
            {kpiStats.approvalRate}% {settings.language === 'en' ? 'of evaluated' : 'oranı'}
          </div>
        </div>

        {/* Conditional */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {settings.language === 'en' ? 'Conditional' : 'Şartlı Kabul'}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{kpiStats.conditional}</div>
          <div className="text-[10px] text-amber-700 font-semibold">
            {kpiStats.conditionalRate}% {settings.language === 'en' ? 'of evaluated' : 'oranı'}
          </div>
        </div>

        {/* Rejected */}
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {settings.language === 'en' ? 'Rejected' : 'Reddedilen'}
            </span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900">{kpiStats.rejected}</div>
          <div className="text-[10px] text-rose-700 font-semibold">
            {kpiStats.rejectionRate}% {settings.language === 'en' ? 'of evaluated' : 'oranı'}
          </div>
        </div>

        {/* Pending */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {settings.language === 'en' ? 'Pending' : 'Bekleyen'}
            </span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{kpiStats.pending}</div>
          <div className="text-[10px] text-slate-500 font-medium">
            {settings.language === 'en' ? 'Awaiting check' : 'Kontrol bekleniyor'}
          </div>
        </div>

        {/* Acceptance Score Progress */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {settings.language === 'en' ? 'Acceptance Rate' : 'Kabul Başarısı'}
            </span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-950">%{kpiStats.approvalRate}</div>
          <div className="w-full bg-indigo-200 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, parseFloat(kpiStats.approvalRate)))}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: Monthly Delivery Volumes (Recharts) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {settings.language === 'en' ? 'Monthly Delivery Volumes' : 'Aylık Teslimat Hacimleri'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {settings.language === 'en'
                  ? 'Delivery quantities broken down month by month and acceptance status'
                  : 'Aylar bazında toplam mal kabul sayısı ve durum dağılımı trendi'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setChartViewMode('stacked')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  chartViewMode === 'stacked'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {settings.language === 'en' ? 'Stacked' : 'Yığılmış'}
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('grouped')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  chartViewMode === 'grouped'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {settings.language === 'en' ? 'Side by Side' : 'Yan Yana'}
              </button>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        {monthlyData.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">
              {settings.language === 'en' ? 'No monthly data available yet.' : 'Gösterilecek aylık teslimat verisi bulunamadı.'}
            </p>
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const evalSum = data.approved + data.conditional + data.rejected;
                      const appRate = evalSum > 0 ? ((data.approved / evalSum) * 100).toFixed(1) : '0.0';
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-800">
                          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex justify-between gap-4">
                            <span>{label} ({data.month})</span>
                            <span className="text-purple-400 font-mono">Toplam: {data.total}</span>
                          </div>
                          <div className="space-y-1 pt-0.5">
                            <div className="flex items-center justify-between gap-4 text-emerald-400">
                              <span>✓ Kabul:</span>
                              <span className="font-bold">{data.approved}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-amber-400">
                              <span>⚠ Şartlı Kabul:</span>
                              <span className="font-bold">{data.conditional}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-rose-400">
                              <span>✕ Red:</span>
                              <span className="font-bold">{data.rejected}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-slate-400">
                              <span>⏳ Bekleyen:</span>
                              <span className="font-bold">{data.pending}</span>
                            </div>
                          </div>
                          <div className="border-t border-slate-800 pt-1 text-[11px] text-indigo-300 font-semibold">
                            Kabul Başarısı: %{appRate}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                />
                <Bar
                  dataKey="approved"
                  name={settings.language === 'en' ? 'Approved' : 'Kabul Edilen'}
                  fill={STATUS_COLORS.approved}
                  stackId={chartViewMode === 'stacked' ? 'a' : undefined}
                  radius={chartViewMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar
                  dataKey="conditional"
                  name={settings.language === 'en' ? 'Conditional' : 'Şartlı Kabul'}
                  fill={STATUS_COLORS.conditional}
                  stackId={chartViewMode === 'stacked' ? 'a' : undefined}
                  radius={chartViewMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar
                  dataKey="rejected"
                  name={settings.language === 'en' ? 'Rejected' : 'Reddedilen'}
                  fill={STATUS_COLORS.rejected}
                  stackId={chartViewMode === 'stacked' ? 'a' : undefined}
                  radius={chartViewMode === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                />
                <Bar
                  dataKey="pending"
                  name={settings.language === 'en' ? 'Pending' : 'Bekleyen'}
                  fill={STATUS_COLORS.pending}
                  stackId={chartViewMode === 'stacked' ? 'a' : undefined}
                  radius={chartViewMode === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SECTION 2: Supplier 'Approved' vs 'Rejected' Status Distribution & Overall Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Supplier Approved vs Rejected Comparison Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {settings.language === 'en'
                  ? 'Supplier Status Distribution: Approved vs Rejected'
                  : 'Tedarikçi Kabul / Red Dağılımı'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {settings.language === 'en'
                  ? 'Compare supplier delivery quantities, approvals, and quality rejection counts'
                  : 'Tedarikçilerin kabul edilen ve reddedilen ürün adetlerinin karşılaştırması'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Limit Selector */}
              <select
                value={supplierLimit}
                onChange={(e) => setSupplierLimit(Number(e.target.value))}
                className="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={20}>Top 20</option>
              </select>

              {/* Sort selector */}
              <select
                value={supplierSortBy}
                onChange={(e) => setSupplierSortBy(e.target.value as any)}
                className="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none"
              >
                <option value="volume">Hacme Göre</option>
                <option value="rejected">En Çok Reddedilen</option>
                <option value="approved">En Çok Kabul</option>
                <option value="rate">Kabul Başarısı (%)</option>
              </select>
            </div>
          </div>

          {chartSupplierData.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-xs font-semibold">Tedarikçi dağılım verisi bulunamadı.</p>
            </div>
          ) : (
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartSupplierData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="supplier"
                    stroke="#475569"
                    fontSize={11}
                    fontWeight={700}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    tickFormatter={(val) => (val.length > 14 ? `${val.slice(0, 13)}…` : val)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-800">
                            <div className="font-bold text-slate-100 border-b border-slate-800 pb-1">
                              {data.supplier}
                            </div>
                            <div className="space-y-1 pt-0.5">
                              <div className="flex items-center justify-between gap-4 text-emerald-400 font-medium">
                                <span>✓ Kabul Edilen:</span>
                                <span className="font-bold">{data.approved}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-rose-400 font-medium">
                                <span>✕ Reddedilen:</span>
                                <span className="font-bold">{data.rejected} ({data.rejectionRate}%)</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-amber-400 font-medium">
                                <span>⚠ Şartlı:</span>
                                <span className="font-bold">{data.conditional}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-slate-300 font-bold border-t border-slate-800 pt-1">
                                <span>Toplam Teslimat:</span>
                                <span>{data.total}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="approved"
                    name={settings.language === 'en' ? 'Approved' : 'Kabul Edilen'}
                    fill={STATUS_COLORS.approved}
                    stackId="sup"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="conditional"
                    name={settings.language === 'en' ? 'Conditional' : 'Şartlı Kabul'}
                    fill={STATUS_COLORS.conditional}
                    stackId="sup"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="rejected"
                    name={settings.language === 'en' ? 'Rejected' : 'Reddedilen'}
                    fill={STATUS_COLORS.rejected}
                    stackId="sup"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right 1 Col: Overall Status Pie / Donut Chart */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {settings.language === 'en' ? 'Overall Status Distribution' : 'Genel Durum Oranları'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {settings.language === 'en' ? 'Proportion of all delivery outcomes' : 'Tüm teslimatların durum yüzdeleri'}
                </p>
              </div>
            </div>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      const total = kpiStats.total || 1;
                      const pct = (((data.value as number) / total) * 100).toFixed(1);
                      return (
                        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-lg border border-slate-800">
                          <div className="font-bold flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
                            <span>{data.name}:</span>
                            <span className="font-mono">{data.value} adet (%{pct})</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400 font-bold uppercase">Toplam</span>
              <span className="text-xl font-black text-slate-900">{kpiStats.total}</span>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-slate-800">Kabul</div>
                <div className="text-[10px] text-slate-500 font-medium">%{kpiStats.approvalRate}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-slate-800">Red</div>
                <div className="text-[10px] text-slate-500 font-medium">%{kpiStats.rejectionRate}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-slate-800">Şartlı</div>
                <div className="text-[10px] text-slate-500 font-medium">%{kpiStats.conditionalRate}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
              <div className="truncate">
                <div className="font-bold text-slate-800">Bekleyen</div>
                <div className="text-[10px] text-slate-500 font-medium">{kpiStats.pending} adet</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Detailed Supplier Performance & Quality Scorecard Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {settings.language === 'en' ? 'Supplier Quality Scorecard' : 'Tedarikçi Kalite ve Başarı Karnesi'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {settings.language === 'en'
                ? 'Comprehensive breakdown of all suppliers with acceptance rates, rejection counts, and drilldown details'
                : 'Tüm tedarikçilerin detaylı kabul/red oranları ve detaylı ürün incelemesi'}
            </p>
          </div>

          {/* Table Search */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchSupplier}
              onChange={(e) => setSearchSupplier(e.target.value)}
              placeholder="Tedarikçi ara..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-600 outline-none font-medium"
            />
          </div>
        </div>

        {/* Scorecard Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Tedarikçi</th>
                <th className="py-2.5 px-3 text-center">Toplam Kalem</th>
                <th className="py-2.5 px-3 text-center">Kabul</th>
                <th className="py-2.5 px-3 text-center">Şartlı</th>
                <th className="py-2.5 px-3 text-center">Red</th>
                <th className="py-2.5 px-3 text-center">Bekleyen</th>
                <th className="py-2.5 px-3 text-center">Kabul Başarısı</th>
                <th className="py-2.5 px-3 text-center">İncele</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tableSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Arama kriterine uygun tedarikçi bulunamadı.
                  </td>
                </tr>
              ) : (
                tableSuppliers.map((s) => {
                  const hasHighRejection = s.rejectionRate > 10 && s.rejected > 0;
                  const isPerfect = s.approvalRate === 100 && s.total >= 3;
                  return (
                    <tr
                      key={s.supplier}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{s.supplier}</span>
                          {hasHighRejection && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              Yüksek Red
                            </span>
                          )}
                          {isPerfect && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              %100 Başarı
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">{s.total}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{s.approved}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-600">{s.conditional}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-600">{s.rejected}</td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-400">{s.pending}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-black font-mono text-[11px] ${
                              s.approvalRate >= 90
                                ? 'text-emerald-700'
                                : s.approvalRate >= 75
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            %{s.approvalRate}
                          </span>
                          <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                s.approvalRate >= 90
                                  ? 'bg-emerald-500'
                                  : s.approvalRate >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${s.approvalRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setDrilldownSupplier(s.supplier === drilldownSupplier ? null : s.supplier)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            drilldownSupplier === s.supplier
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {drilldownSupplier === s.supplier ? 'Kapat' : 'Detay'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Drill-down Modal/Drawer for Selected Supplier */}
        {drilldownData && (
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-700" />
                <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                  {drilldownData.supplier} – Ürün Bazlı Kabul & Red Dağılımı
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setDrilldownSupplier(null)}
                className="text-xs text-purple-700 font-bold hover:underline"
              >
                Kapat
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {drilldownData.products.map((p) => (
                <div
                  key={p.product}
                  className="p-2.5 rounded-xl bg-white border border-purple-100 shadow-2xs space-y-1"
                >
                  <div className="text-xs font-bold text-slate-900 truncate" title={p.product}>
                    {p.product}
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <span className="text-emerald-600 font-bold">Kabul: {p.approved}</span>
                    <span className="text-rose-600 font-bold">Red: {p.rejected}</span>
                    <span className="text-slate-500">Toplam: {p.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
