import React, { useState } from 'react';
import { AuditLog, Language, UserRole } from '../types';
import { translations } from '../lib/translations';
import { ShieldCheck, Search, Filter, Clock, User, AlertCircle } from 'lucide-react';

interface AuditLogsModuleProps {
  logs: AuditLog[];
  lang: Language;
  role: UserRole;
}

export const AuditLogsModule: React.FC<AuditLogsModuleProps> = ({
  logs,
  lang,
  role,
}) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  if (role !== 'Manager') {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
        <AlertCircle className="w-9 h-9 text-amber-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-900">{t.auditTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">{t.auditRestricted}</p>
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && !log.action_type.toLowerCase().includes(actionFilter.toLowerCase())) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        log.details.toLowerCase().includes(q) ||
        log.user_name.toLowerCase().includes(q) ||
        log.action_type.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t.auditTitle}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.auditSubtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchLogs}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 w-48 sm:w-64"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
          >
            <option value="all">{t.allActions}</option>
            <option value="PRICE">{t.priceEdits}</option>
            <option value="INVOICE">{t.invoiceActions}</option>
            <option value="VEHICLE">{t.vehicleActions}</option>
            <option value="IMPORT">{t.importActions}</option>
            <option value="TRADE">{t.tradeInActions}</option>
            <option value="TRANSFER">{t.transferActions}</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">{t.timestamp}</th>
                <th className="px-4 py-3">{t.performedBy}</th>
                <th className="px-4 py-3">{t.actionType}</th>
                <th className="px-4 py-3">{t.actionDetails}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{log.user_name}</div>
                    <span className="text-[10px] text-slate-400 font-mono">[{log.user_role}]</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-sans">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="p-10 text-center text-xs text-slate-500">{t.noRecords}</div>
        )}
      </div>
    </div>
  );
};
