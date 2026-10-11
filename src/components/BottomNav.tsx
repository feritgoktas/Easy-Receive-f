import React from 'react';
import { ClipboardList, History, BarChart3, TrendingUp, Upload, Plus } from 'lucide-react';
import { TabType } from '../types';
import { T } from '../utils/i18n';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  language: 'tr' | 'en';
  pendingCount: number;
  onQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  language,
  pendingCount,
  onQuickAdd
}) => {
  const t = T[language] || T.tr;

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'receiving',
      label: t.receiving,
      icon: <ClipboardList className="w-5 h-5" />,
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    {
      id: 'historical',
      label: t.historical,
      icon: <History className="w-5 h-5" />
    },
    {
      id: 'reports',
      label: t.reports,
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      id: 'analytics',
      label: t.analytics,
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 'import',
      label: t.importt,
      icon: <Upload className="w-5 h-5" />
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                active ? 'text-purple-700 font-extrabold' : 'text-slate-500 font-medium hover:text-slate-800'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none min-w-[15px] text-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[70px]">{tab.label}</span>
              {active && (
                <div className="w-4 h-1 bg-purple-600 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}

        {/* Quick floating action for mobile receiving */}
        <button
          type="button"
          onClick={onQuickAdd}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-emerald-600 font-bold"
          title={t.quickAdd}
        >
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 -mt-2">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-[9px] mt-0.5 font-bold text-emerald-700">{t.add}</span>
        </button>
      </div>
    </div>
  );
};
