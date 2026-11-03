import React, { useCallback, useEffect, useState } from 'react';
import {
  UserRole,
  Language,
  Vehicle,
  BIMetrics,
  Deal,
  Customer,
  Invoice,
  AuditLog,
  SessionUser,
} from './types';
import { translations } from './lib/translations';
import { formatIqd, formatUsd } from './lib/currency';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { BIDashboard } from './components/BIDashboard';
import { InventoryModule } from './components/InventoryModule';
import { SalesPipeline } from './components/SalesPipeline';
import { InvoicingModule } from './components/InvoicingModule';
import { FieldInspectionApp } from './components/FieldInspectionApp';
import { BulkImportEngine } from './components/BulkImportEngine';
import { ShowroomStudio } from './components/ShowroomStudio';
import { AuditLogsModule } from './components/AuditLogsModule';
import { AICopilotWidget } from './components/AICopilotWidget';
import { LoginPage } from './components/LoginPage';
import { AlertTriangle, Building2, Loader2, X, ArrowRight } from 'lucide-react';

const ROLE_TABS: Record<UserRole, ActiveTab[]> = {
  Manager: ['bi', 'inventory', 'crm', 'invoicing', 'field', 'import', 'studio', 'audit'],
  Authorized: ['bi', 'inventory', 'crm', 'invoicing', 'field', 'studio'],
  Employee: ['inventory', 'crm', 'invoicing', 'field', 'studio'],
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [lang, setLang] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [biMetrics, setBiMetrics] = useState<BIMetrics | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [filterAgingOnly, setFilterAgingOnly] = useState(false);
  const [studioPreselectedVehicle, setStudioPreselectedVehicle] = useState<Vehicle | null>(null);
  const [copilotInitialQuery, setCopilotInitialQuery] = useState<string>('');

  const role = currentUser?.role ?? 'Employee';
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (!cancelled) setCurrentUser(null);
          return;
        }
        const payload = await response.json();
        if (!cancelled && payload.success) {
          setCurrentUser(payload.data as SessionUser);
          const allowed = ROLE_TABS[(payload.data as SessionUser).role];
          setActiveTab(allowed[0]);
        }
      } catch {
        if (!cancelled) setCurrentUser(null);
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    };
    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    const userRole = currentUser.role;
    try {
      const vehicleResponse = await fetch(`/api/vehicles?branch=${encodeURIComponent(selectedBranch)}`);
      if (vehicleResponse.status === 401) {
        setCurrentUser(null);
        return;
      }
      const vehicleData = await vehicleResponse.json();
      if (vehicleData.success) setVehicles(vehicleData.data);

      if (userRole === 'Manager' || userRole === 'Authorized') {
        const biResponse = await fetch(`/api/bi/metrics?branch=${encodeURIComponent(selectedBranch)}`);
        if (biResponse.ok) {
          const biData = await biResponse.json();
          if (biData.success) setBiMetrics(biData.data);
        }
      } else {
        setBiMetrics(null);
      }

      const dealsResponse = await fetch('/api/deals');
      const dealsData = await dealsResponse.json();
      if (dealsData.success) {
        setDeals(dealsData.data);
        if (dealsData.customers) setCustomers(dealsData.customers);
      }

      const invoiceResponse = await fetch('/api/invoices');
      const invoiceData = await invoiceResponse.json();
      if (invoiceData.success) setInvoices(invoiceData.data);

      if (userRole === 'Manager') {
        const auditResponse = await fetch('/api/audit-logs');
        const auditData = await auditResponse.json();
        if (auditData.success) setAuditLogs(auditData.data);
      } else {
        setAuditLogs([]);
      }
    } catch (error) {
      console.error('Unable to load operational data:', error);
    }
  }, [currentUser, selectedBranch]);

  useEffect(() => {
    if (currentUser) void fetchData();
  }, [fetchData, currentUser]);

  const handleUserLogin = (user: SessionUser) => {
    setCurrentUser(user);
    const allowed = ROLE_TABS[user.role];
    setActiveTab(allowed[0]);
    setLang('ar');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setCurrentUser(null);
      setVehicles([]);
      setBiMetrics(null);
      setDeals([]);
      setCustomers([]);
      setInvoices([]);
      setAuditLogs([]);
      setSelectedBranch('all');
      setFilterAgingOnly(false);
      setActiveTab('inventory');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-600">
        <div className="w-12 h-12 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shadow-sm">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>{t.authChecking}</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleUserLogin} lang={lang} setLang={setLang} />;
  }

  const allowedTabs = ROLE_TABS[currentUser.role];
  const effectiveTab = allowedTabs.includes(activeTab) ? activeTab : allowedTabs[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <Header
        user={currentUser}
        role={role}
        lang={lang}
        setLang={setLang}
        agingCount={currentUser.role === 'Employee' ? 0 : biMetrics?.agingAlertsCount || 0}
        onOpenAlerts={() => setShowAlertModal(true)}
        onNewVehicle={() => {
          setFilterAgingOnly(false);
          setActiveTab('inventory');
        }}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          activeTab={effectiveTab}
          setActiveTab={(tab) => {
            if (tab !== 'inventory') setFilterAgingOnly(false);
            setActiveTab(tab);
          }}
          lang={lang}
          role={role}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
        />

        <main className="flex-1 p-3 sm:p-4 lg:p-5 max-w-[1680px] w-full mx-auto overflow-y-auto bg-[#F8FAFC]">
          {effectiveTab === 'bi' && (
            <BIDashboard
              metrics={biMetrics}
              lang={lang}
              role={role}
              selectedBranch={selectedBranch}
              onNavigateToAging={() => setShowAlertModal(true)}
              onAskCopilot={(query) => setCopilotInitialQuery(query)}
            />
          )}
          {effectiveTab === 'inventory' && (
            <InventoryModule
              vehicles={vehicles}
              lang={lang}
              role={role}
              selectedBranch={selectedBranch}
              onRefresh={fetchData}
              filterAgingOnly={filterAgingOnly}
              onClearAgingFilter={() => setFilterAgingOnly(false)}
              onOpenStudio={(vehicle) => {
                setStudioPreselectedVehicle(vehicle);
                setActiveTab('studio');
              }}
            />
          )}
          {effectiveTab === 'crm' && (
            <SalesPipeline
              deals={deals}
              customers={customers}
              vehicles={vehicles}
              lang={lang}
              role={role}
              selectedBranch={selectedBranch}
              onRefresh={fetchData}
            />
          )}
          {effectiveTab === 'invoicing' && (
            <InvoicingModule
              invoices={invoices}
              vehicles={vehicles}
              customers={customers}
              lang={lang}
              role={role}
              selectedBranch={selectedBranch}
              onRefresh={fetchData}
            />
          )}
          {effectiveTab === 'field' && (
            <FieldInspectionApp
              lang={lang}
              role={role}
              customers={customers}
              vehicles={vehicles}
              onRefresh={fetchData}
            />
          )}
          {effectiveTab === 'import' && (
            <BulkImportEngine lang={lang} role={role} onRefresh={fetchData} />
          )}
          {effectiveTab === 'studio' && (
            <ShowroomStudio
              vehicles={vehicles}
              lang={lang}
              preselectedVehicle={studioPreselectedVehicle}
            />
          )}
          {effectiveTab === 'audit' && (
            <AuditLogsModule logs={auditLogs} lang={lang} role={role} />
          )}
        </main>
      </div>

      <AICopilotWidget
        lang={lang}
        role={role}
        initialQuery={copilotInitialQuery}
        onClearInitialQuery={() => setCopilotInitialQuery('')}
      />

      {showAlertModal && biMetrics && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2 text-amber-700 font-semibold">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm text-slate-900">{t.agingAlertBannerTitle}</h3>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
              {biMetrics.agingAlertVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  onClick={() => {
                    setShowAlertModal(false);
                    setFilterAgingOnly(true);
                    setActiveTab('inventory');
                  }}
                  className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {vehicle.vin} · {formatUsd(vehicle.selling_price)} · {formatIqd(vehicle.selling_price)}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                    {vehicle.days_on_lot} {lang === 'ar' ? 'يوماً' : 'days'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setShowAlertModal(false);
                  setFilterAgingOnly(true);
                  setActiveTab('inventory');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 transition-colors"
              >
                <span>{t.takeAction}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
