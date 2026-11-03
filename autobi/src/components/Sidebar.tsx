import React, { useEffect, useState } from 'react';
import { Language, UserRole } from '../types';
import { translations } from '../lib/translations';
import { BRANCHES, branchLabel } from '../lib/branches';
import {
  BarChart3,
  Car,
  Kanban,
  Receipt,
  Tablet,
  FileSpreadsheet,
  Camera,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type ActiveTab =
  | 'bi'
  | 'inventory'
  | 'crm'
  | 'invoicing'
  | 'field'
  | 'import'
  | 'studio'
  | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  role: UserRole;
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
  group: 'operations' | 'governance';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  role,
  selectedBranch,
  setSelectedBranch,
}) => {
  const t = translations[lang];
  const [databaseState, setDatabaseState] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let active = true;
    fetch('/api/health')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload) => {
        if (active) setDatabaseState(payload.success ? 'online' : 'offline');
      })
      .catch(() => {
        if (active) setDatabaseState('offline');
      });
    return () => {
      active = false;
    };
  }, []);

  const navItems: NavItem[] = [
    {
      id: 'bi',
      label: t.navBI,
      icon: <BarChart3 className="w-4 h-4" />,
      roles: ['Manager', 'Authorized'],
      group: 'governance',
    },
    {
      id: 'inventory',
      label: t.navInventory,
      icon: <Car className="w-4 h-4" />,
      roles: ['Manager', 'Authorized', 'Employee'],
      group: 'operations',
    },
    {
      id: 'crm',
      label: t.navCRM,
      icon: <Kanban className="w-4 h-4" />,
      roles: ['Manager', 'Authorized', 'Employee'],
      group: 'operations',
    },
    {
      id: 'invoicing',
      label: t.navInvoicing,
      icon: <Receipt className="w-4 h-4" />,
      roles: ['Manager', 'Authorized', 'Employee'],
      group: 'operations',
    },
    {
      id: 'field',
      label: t.navField,
      icon: <Tablet className="w-4 h-4" />,
      roles: ['Manager', 'Authorized', 'Employee'],
      group: 'operations',
    },
    {
      id: 'studio',
      label: t.navStudio,
      icon: <Camera className="w-4 h-4" />,
      roles: ['Manager', 'Authorized', 'Employee'],
      group: 'operations',
    },
    {
      id: 'import',
      label: t.navImport,
      icon: <FileSpreadsheet className="w-4 h-4" />,
      roles: ['Manager'],
      group: 'governance',
    },
    {
      id: 'audit',
      label: t.navAudit,
      icon: <ShieldCheck className="w-4 h-4" />,
      roles: ['Manager'],
      group: 'governance',
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));
  const operations = visibleItems.filter((item) => item.group === 'operations');
  const governance = visibleItems.filter((item) => item.group === 'governance');

  const renderItem = (item: NavItem) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
          isActive
            ? 'bg-[#2563EB] text-white shadow-sm font-semibold'
            : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
          <span className="truncate">{item.label}</span>
        </div>
        {isActive ? (
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        ) : (
          <span className="text-slate-600">
            {lang === 'ar' ? (
              <ChevronLeft className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-full md:w-64 bg-[#0F172A] border-e border-[#1E293B] text-slate-200 flex flex-col shrink-0 md:min-h-[calc(100vh-60px)] z-20">
      <div className="p-3 border-b border-[#1E293B]">
        <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 mb-1.5">
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span>{lang === 'ar' ? 'الفرع التشغيلي' : 'Operating Branch'}</span>
        </label>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="w-full bg-[#1E293B] text-[11px] text-white border border-white/10 rounded-lg px-2.5 py-2 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all cursor-pointer font-medium"
        >
          <option value="all">{t.allBranches}</option>
          {BRANCHES.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branchLabel(branch.id, lang)}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {operations.length > 0 && (
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              {t.operationsGroup}
            </div>
            <div className="space-y-1">{operations.map(renderItem)}</div>
          </div>
        )}

        {governance.length > 0 && (
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              {t.governanceGroup}
            </div>
            <div className="space-y-1">{governance.map(renderItem)}</div>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-[#1E293B] text-[10px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span>{lang === 'ar' ? 'محرك قاعدة البيانات' : 'Database Engine'}</span>
          <span className="font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            XAMPP MySQL
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>{lang === 'ar' ? 'حالة الاتصال' : 'Connection Status'}</span>
          <span className="flex items-center gap-1.5 text-sky-300 font-medium">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                databaseState === 'online'
                  ? 'bg-emerald-500'
                  : databaseState === 'offline'
                  ? 'bg-red-500'
                  : 'bg-amber-400'
              }`}
            />
            {databaseState === 'online'
              ? lang === 'ar'
                ? 'متصل'
                : 'Connected'
              : databaseState === 'offline'
              ? lang === 'ar'
                ? 'غير متصل'
                : 'Unavailable'
              : lang === 'ar'
              ? 'جارٍ التحقق'
              : 'Checking'}
          </span>
        </div>
      </div>
    </aside>
  );
};
