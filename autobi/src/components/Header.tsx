import React from 'react';
import { SessionUser, UserRole, Language } from '../types';
import { translations } from '../lib/translations';
import {
  Shield,
  Globe,
  Bell,
  Plus,
  Building2,
  LogOut,
  UserCheck,
} from 'lucide-react';

interface HeaderProps {
  user: SessionUser;
  role: UserRole;
  lang: Language;
  setLang: (lang: Language) => void;
  agingCount: number;
  onOpenAlerts: () => void;
  onNewVehicle: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  role,
  lang,
  setLang,
  agingCount,
  onOpenAlerts,
  onNewVehicle,
  onLogout,
}) => {
  const t = translations[lang];
  const displayName = lang === 'ar' ? user.nameAr : user.nameEn;
  const roleLabel = role === 'Manager' ? t.manager : role === 'Authorized' ? t.authorized : t.employee;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A] border-b border-[#1E293B] text-white shadow-sm">
      <div className="flex h-[60px] items-center justify-between gap-3 px-3 sm:px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white truncate">
                {t.appName}
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-semibold text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                {t.subtitle}
              </span>
            </div>
            <span className="block text-[11px] text-slate-400 truncate max-w-xs lg:max-w-md">
              {t.tagline}
            </span>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2 text-[11px] bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-lg">
          <UserCheck className="w-4 h-4 text-sky-400" />
          <span className="text-slate-400">{t.currentRole}:</span>
          <span className="font-semibold text-white">{roleLabel}</span>
          {role === 'Employee' && (
            <span className="text-amber-300 border-s border-white/10 ps-2">{t.restrictedCostNote}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {role !== 'Employee' && (
            <button
              onClick={onOpenAlerts}
              title={t.agingAlertTooltip}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
              aria-label={t.agingAlertTooltip}
            >
              <Bell className="w-4 h-4" />
              {agingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full font-mono">
                  {agingCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold text-slate-200 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
          >
            <Globe className="w-4 h-4 text-sky-400" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {role !== 'Employee' && (
            <button
              onClick={onNewVehicle}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addVehicle}</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 ps-2 border-s border-white/10">
            <div className="w-8 h-8 rounded-lg bg-[#1E293B] border border-white/10 flex items-center justify-center text-[11px] font-bold text-sky-300">
              {initials || <Shield className="w-4 h-4" />}
            </div>
            <div className="min-w-0 max-w-[140px]">
              <div className="text-[11px] font-semibold text-white truncate">{displayName}</div>
              <div className="text-[10px] text-slate-400 truncate">{roleLabel}</div>
            </div>
            <button
              onClick={onLogout}
              title={t.signOut}
              aria-label={t.signOut}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>

          <button
            onClick={onLogout}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t.signOut}
          >
            <LogOut className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </header>
  );
};
