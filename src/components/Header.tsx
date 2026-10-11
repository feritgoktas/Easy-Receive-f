import React from 'react';
import {
  Check,
  ClipboardList,
  History,
  BarChart3,
  Upload,
  Settings,
  Plus,
  UserCheck,
  CloudUpload,
  RefreshCw,
  Building2,
  TrendingUp
} from 'lucide-react';
import { AppSettings, HotelConfig, TabType } from '../types';
import { T } from '../utils/i18n';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  settings: AppSettings;
  activeHotelId: string;
  onSelectHotel: (hotelId: string) => void;
  hotels?: HotelConfig[];
  cloudConnected?: boolean;
  isSyncing?: boolean;
  onSaveToCloud?: () => void;
  onOpenSettings: () => void;
  onQuickAdd: () => void;
  onSwitchUser?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  activeHotelId,
  onSelectHotel,
  hotels = [],
  cloudConnected = true,
  isSyncing = false,
  onSaveToCloud,
  onOpenSettings,
  onQuickAdd,
  onSwitchUser
}) => {
  const t = T[settings.language] || T.tr;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'receiving', label: t.receiving, icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'historical', label: t.historical, icon: <History className="w-4 h-4" /> },
    { id: 'reports', label: t.reports, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'analytics', label: t.analytics, icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'import', label: t.importt, icon: <Upload className="w-4 h-4" /> }
  ];

  return (
    <header id="main-app-header" className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand & Hotel Switcher & Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink-0">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-500 flex items-center justify-center text-white shadow-inner font-extrabold text-sm shrink-0">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div className="hidden lg:block">
              <span className="font-black text-sm tracking-wider uppercase text-slate-100 block leading-tight">
                Receiving Easy
              </span>
              <span className="text-[10px] text-purple-300 font-semibold tracking-tight block">
                {t.appSub}
              </span>
            </div>
          </div>

          {/* TWO-HOTEL SEGMENTED PILL SWITCHER */}
          <div className="flex items-center shrink-0">
            <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-[#090e1a] rounded-xl sm:rounded-2xl border border-slate-800/80 shadow-inner shrink-0">
              {[
                { id: 'hotel_1', name: 'Bosphorus' },
                { id: 'hotel_2', name: 'Istanbul' }
              ].map((h) => {
                const isActive = h.id === activeHotelId;
                return (
                  <button
                    key={h.id}
                    id={`btn-hotel-switch-${h.id}`}
                    type="button"
                    onClick={() => onSelectHotel(h.id)}
                    title={`${h.name} (${t.hotel_isolated_hint})`}
                    className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[#009b68] text-white shadow-md shadow-emerald-950/40 font-extrabold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/40 font-semibold'
                    }`}
                  >
                    <Building2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="tracking-tight whitespace-nowrap">{h.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 pl-3 border-l border-slate-800">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/50'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Cloud Save & Sync Button */}
          {onSaveToCloud && (
            <button
              id="btn-header-sync-cloud"
              type="button"
              onClick={onSaveToCloud}
              disabled={isSyncing}
              title="Tüm verileri Firebase ortak bulut veritabanına kaydet ve eşitle"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isSyncing ? 'Kaydediliyor...' : 'Buluta Kaydet'}</span>
            </button>
          )}

          {/* Quick Add button (Hidden on mobile header as it's present in BottomNav & main view) */}
          <button
            id="btn-header-quick-add"
            type="button"
            onClick={onQuickAdd}
            title={t.quickAdd}
            className="hidden sm:flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">{t.quickAdd}</span>
          </button>

          {/* User Badge & Switch Person button */}
          <button
            id="btn-header-switch-user"
            type="button"
            onClick={onSwitchUser || onOpenSettings}
            title={`Aktif Personel: ${settings.username} • Değiştirmek / Çıkış için tıklayın`}
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-purple-500/40 text-xs font-semibold text-purple-200 transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="hidden md:inline max-w-[110px] truncate">{settings.username || 'Operatör'}</span>
          </button>

          {/* Settings button */}
          <button
            id="btn-header-open-settings"
            type="button"
            onClick={onOpenSettings}
            title={t.settings}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer shrink-0"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
