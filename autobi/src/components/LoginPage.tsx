import React, { useState } from 'react';
import { SessionUser, Language } from '../types';
import { translations } from '../lib/translations';
import {
  Shield,
  Lock,
  User,
  AlertCircle,
  Building2,
  Globe,
  Loader2,
  ChevronRight,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: SessionUser) => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

interface QuickAccount {
  username: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
}

const QUICK_ACCOUNTS: QuickAccount[] = [
  {
    username: 'admin',
    nameAr: 'أحمد محمد',
    nameEn: 'Ahmed Mohammed',
    roleAr: 'مدير عام',
    roleEn: 'General Manager',
  },
  {
    username: 'super',
    nameAr: 'أحمد التميمي',
    nameEn: 'Ahmed Al-Tamimi',
    roleAr: 'مشرف صالة',
    roleEn: 'Showroom Supervisor',
  },
  {
    username: 'emp',
    nameAr: 'كرار علي',
    nameEn: 'Karrar Ali',
    roleAr: 'موظف مبيعات',
    roleEn: 'Sales Representative',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, lang, setLang }) => {
  const t = translations[lang];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAccount, setPendingAccount] = useState('');

  const isDev = import.meta.env.DEV;

  const authenticate = async (loginName: string, loginPassword: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginName.trim(), password: loginPassword }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        setError(payload.error || t.invalidCredentials);
        return;
      }
      onLogin(payload.data as SessionUser);
    } catch {
      setError(t.loginError);
    } finally {
      setIsSubmitting(false);
      setPendingAccount('');
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await authenticate(username, password);
  };

  const signInAsDemo = async (account: QuickAccount) => {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    setPendingAccount(account.username);
    try {
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: account.username }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        setUsername(account.username);
        setError(payload.error || t.invalidCredentials);
        return;
      }
      onLogin(payload.data as SessionUser);
    } catch {
      setError(t.loginError);
    } finally {
      setIsSubmitting(false);
      setPendingAccount('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold tracking-tight text-slate-900 truncate">
                    {t.appName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{t.subtitle}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shrink-0"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
              </button>
            </div>
            <h1 className="mt-4 text-base font-bold text-slate-900">{t.loginTitle}</h1>
            <p className="mt-1 text-xs text-slate-500">{t.loginSubtitle}</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-[11px] text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
              <div>
                <label htmlFor="username" className="block text-slate-600 font-semibold mb-1">
                  {t.username}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-slate-600 font-semibold mb-1">
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && !pendingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.signingIn}</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>{t.signIn}</span>
                  </>
                )}
              </button>
            </form>

            {isDev && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[11px] font-bold text-slate-700">{t.demoCredentials}</h2>
                  <span className="text-[10px] text-slate-400">{t.secureSessionNote}</span>
                </div>
                <div className="space-y-1.5">
                  {QUICK_ACCOUNTS.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => signInAsDemo(account)}
                      className="w-full text-start px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 disabled:opacity-60 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-800 truncate">
                          {lang === 'ar' ? account.nameAr : account.nameEn}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {lang === 'ar' ? account.roleAr : account.roleEn}
                          <span className="font-mono text-slate-400 ms-1.5">({account.username})</span>
                        </div>
                      </div>
                      {pendingAccount === account.username ? (
                        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
