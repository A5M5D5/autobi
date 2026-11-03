import React, { useEffect, useState } from 'react';
import { Invoice, Vehicle, Customer, Language, UserRole } from '../types';
import { translations } from '../lib/translations';
import { USD_TO_IQD, formatIqd, formatUsd } from '../lib/currency';
import {
  Plus,
  Printer,
  ShieldAlert,
  AlertCircle,
  X,
  FileCheck2,
} from 'lucide-react';

interface InvoicingModuleProps {
  invoices: Invoice[];
  vehicles: Vehicle[];
  customers: Customer[];
  lang: Language;
  role: UserRole;
  selectedBranch?: string;
  onRefresh: () => void;
}

export const InvoicingModule: React.FC<InvoicingModuleProps> = ({
  invoices,
  vehicles,
  customers,
  lang,
  role,
  selectedBranch = 'all',
  onRefresh,
}) => {
  const t = translations[lang];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const exchangeRates: Record<'USD' | 'SAR' | 'AED' | 'IQD', number> = {
    USD: 1.0,
    SAR: 3.75,
    AED: 3.67,
    IQD: USD_TO_IQD,
  };

  const [formState, setFormState] = useState({
    vehicle_id: vehicles.find((v) => v.status === 'Available')?.id || vehicles[0]?.id || '',
    customer_id: customers[0]?.id || '',
    final_sale_price: vehicles.find((v) => v.status === 'Available')?.selling_price || 65000,
    currency: 'USD' as 'USD' | 'SAR' | 'AED' | 'IQD',
    back_end_profit: 2500,
    fni_notes: '',
  });

  useEffect(() => {
    const invoicedIds = new Set(invoices.map((inv) => inv.vehicle_id));
    const availableVeh =
      vehicles.find((v) => v.status === 'Available' && !invoicedIds.has(v.id)) ||
      vehicles.find((v) => !invoicedIds.has(v.id)) ||
      vehicles[0];
    setFormState((prev) => ({
      ...prev,
      vehicle_id:
        prev.vehicle_id && !invoicedIds.has(prev.vehicle_id)
          ? prev.vehicle_id
          : availableVeh?.id || '',
      customer_id: prev.customer_id || customers[0]?.id || '',
      final_sale_price:
        prev.vehicle_id && !invoicedIds.has(prev.vehicle_id)
          ? prev.final_sale_price
          : availableVeh?.selling_price || 65000,
    }));
  }, [vehicles, customers, invoices]);

  const isEmployee = role === 'Employee';

  const visibleVehicleIds = new Set(vehicles.map((v) => v.id));
  const filteredInvoices =
    selectedBranch === 'all'
      ? invoices
      : invoices.filter((inv) => visibleVehicleIds.has(inv.vehicle_id));

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (invoices.some((invoice) => invoice.vehicle_id === formState.vehicle_id)) {
      setErrorMessage(t.preventDuplicateSale);
      return;
    }

    try {
      const rate = exchangeRates[formState.currency];
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          exchange_rate: rate,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        setErrorMessage('');
        onRefresh();
      } else {
        setErrorMessage(res.status === 409 ? t.preventDuplicateSale : data.error || t.invoiceFailed);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(t.invoiceFailed);
    }
  };

  const selectedVehicleForForm = vehicles.find((v) => v.id === formState.vehicle_id);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t.invoicesTitle}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.preventDuplicateSale}</p>
        </div>

        {isEmployee ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-slate-500 bg-slate-100 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5" />
            {t.readonlyRole}
          </span>
        ) : (
          <button
            onClick={() => {
              setErrorMessage('');
              setShowCreateModal(true);
            }}
            disabled={!vehicles.length || !customers.length}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.createInvoice}</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-3">{t.invoiceNumber}</th>
                <th className="px-4 py-3">{lang === 'ar' ? 'المركبة المباعة' : 'Vehicle & VIN'}</th>
                <th className="px-4 py-3">{t.customerName}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{t.finalSalePrice}</th>
                <th className="px-4 py-3">{t.selectCurrency}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{t.frontEndProfitEarned}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{t.backEndProfitEarned}</th>
                <th className="px-4 py-3">{t.dateIssued}</th>
                <th className="px-4 py-3 text-center">{lang === 'ar' ? 'الإجراء' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const vehicle = vehicles.find((v) => v.id === inv.vehicle_id);
                const customer = customers.find((c) => c.id === inv.customer_id);

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{inv.id}</td>
                    <td className="px-4 py-3">
                      {vehicle ? (
                        <div>
                          <div className="font-semibold text-slate-800">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{vehicle.vin}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">{inv.vehicle_id}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {customer ? customer.full_name : 'Valued Client'}
                    </td>
                    <td className="px-4 py-3 text-right rtl:text-left">
                      <span className="block font-mono font-bold text-slate-900">
                        {formatUsd(inv.final_sale_price)}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-500">
                        {formatIqd(inv.final_sale_price)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                        {inv.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right rtl:text-left font-mono tabular-nums">
                      {isEmployee ? (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      ) : (
                        <>
                          <span className="text-blue-600 font-semibold block">
                            +{formatUsd(inv.front_end_profit)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {formatIqd(inv.front_end_profit)}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right rtl:text-left font-mono tabular-nums">
                      {isEmployee ? (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      ) : (
                        <>
                          <span className="text-emerald-600 font-semibold block">
                            +{formatUsd(inv.back_end_profit)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {formatIqd(inv.back_end_profit)}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title={t.printInvoice}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredInvoices.length === 0 && (
          <div className="p-10 text-center text-xs text-slate-500">{t.noRecords}</div>
        )}
      </div>

      {/* ISSUE NEW SALES INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.createInvoice}</h3>
                <p className="text-xs text-slate-500">{t.preventDuplicateSale}</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t.selectVehicle} *</label>
                <select
                  value={formState.vehicle_id}
                  onChange={(e) => {
                    const v = vehicles.find((item) => item.id === e.target.value);
                    setFormState({
                      ...formState,
                      vehicle_id: e.target.value,
                      final_sale_price: v ? v.selling_price : 60000,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                >
                  {vehicles.map((v) => {
                    const isSoldAlready =
                      v.status === 'Sold' || invoices.some((inv) => inv.vehicle_id === v.id);
                    return (
                      <option
                        key={v.id}
                        value={v.id}
                        disabled={isSoldAlready}
                        className={isSoldAlready ? 'text-red-400 bg-slate-100' : ''}
                      >
                        {v.year} {v.make} {v.model} ({formatUsd(v.selling_price)} · {formatIqd(v.selling_price)}){' '}
                        {isSoldAlready
                          ? `[${lang === 'ar' ? 'مباعة مسبقاً - محجوب' : 'Already Invoiced - Blocked'}]`
                          : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t.customerName} *</label>
                <select
                  value={formState.customer_id}
                  onChange={(e) => setFormState({ ...formState, customer_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.selectCurrency}</label>
                  <select
                    value={formState.currency}
                    onChange={(e) => setFormState({ ...formState, currency: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  >
                    <option value="USD">USD — Base Currency</option>
                    <option value="SAR">SAR — Rate 3.75</option>
                    <option value="AED">AED — Rate 3.67</option>
                    <option value="IQD">IQD — Rate 1,530</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.finalSalePrice} ($ USD)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formState.final_sale_price}
                    onChange={(e) =>
                      setFormState({ ...formState, final_sale_price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold"
                  />
                  <div className="text-[10px] text-slate-500 font-mono mt-1 space-y-0.5">
                    <div>{formatIqd(formState.final_sale_price)}</div>
                    {formState.currency !== 'USD' && (
                      <div>
                        ≈ {(formState.final_sale_price * exchangeRates[formState.currency]).toLocaleString()}{' '}
                        {formState.currency}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!isEmployee && (
                <div className="pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">{t.fniPackagesNotes}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-600 mb-1">{t.backEndProfitEarned} ($ USD)</label>
                      <input
                        type="number"
                        min={0}
                        value={formState.back_end_profit}
                        onChange={(e) =>
                          setFormState({ ...formState, back_end_profit: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                      />
                      <div className="mt-1 text-[10px] font-mono text-slate-500">
                        {formatIqd(formState.back_end_profit || 0)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">{t.fniPackagesNotes}</label>
                      <input
                        type="text"
                        value={formState.fni_notes}
                        onChange={(e) => setFormState({ ...formState, fni_notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isEmployee && selectedVehicleForForm && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500">{t.frontEndProfitEarned}</span>
                    <div className="font-mono font-bold text-blue-600">
                      +{formatUsd(formState.final_sale_price - selectedVehicleForForm.costs.total_cost)}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      {formatIqd(formState.final_sale_price - selectedVehicleForForm.costs.total_cost)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">{t.backEndProfitEarned}</span>
                    <div className="font-mono font-bold text-emerald-600">
                      +{formatUsd(formState.back_end_profit)}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      {formatIqd(formState.back_end_profit)}
                    </div>
                  </div>
                  <div className="text-right rtl:text-left">
                    <span className="text-[11px] text-slate-500 font-semibold">{t.netMargin}</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      +{formatUsd(
                        formState.final_sale_price -
                          selectedVehicleForForm.costs.total_cost +
                          formState.back_end_profit
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      {formatIqd(
                        formState.final_sale_price -
                          selectedVehicleForForm.costs.total_cost +
                          formState.back_end_profit
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {t.createInvoice}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE BILL / CONTRACT SLIP MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            id="printable-invoice"
            className="bg-white rounded-xl max-w-lg w-full p-8 shadow-xl border border-slate-200 relative"
          >
            <button
              onClick={() => setSelectedInvoice(null)}
              className="no-print absolute top-4 right-4 rtl:right-auto rtl:left-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">AutoBI Sales Invoice</h3>
                  <div className="text-xs text-slate-500 font-mono">{selectedInvoice.id}</div>
                </div>
                <div className="text-right rtl:text-left text-xs text-slate-400 font-mono">
                  {new Date(selectedInvoice.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{t.customerName}:</span>
                <span className="font-semibold text-slate-900">
                  {customers.find((c) => c.id === selectedInvoice.customer_id)?.full_name || 'Valued Client'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{lang === 'ar' ? 'المركبة' : 'Vehicle'}:</span>
                <span className="font-semibold text-slate-900">
                  {(() => {
                    const v = vehicles.find((item) => item.id === selectedInvoice.vehicle_id);
                    return v ? `${v.year} ${v.make} ${v.model} (${v.vin})` : selectedInvoice.vehicle_id;
                  })()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{t.finalSalePrice}:</span>
                <span className="text-end">
                  <span className="block font-mono font-bold text-slate-900">
                    {formatUsd(selectedInvoice.final_sale_price)} USD
                  </span>
                  <span className="block font-mono text-[10px] text-slate-500">
                    {formatIqd(selectedInvoice.final_sale_price)}
                  </span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{t.selectCurrency}:</span>
                <span className="font-mono text-slate-900">
                  {selectedInvoice.currency} (Rate: {selectedInvoice.exchange_rate})
                </span>
              </div>
              {selectedInvoice.currency !== 'USD' && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t.localCurrencyEquivalent}:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {(selectedInvoice.final_sale_price * selectedInvoice.exchange_rate).toLocaleString()}{' '}
                    {selectedInvoice.currency}
                  </span>
                </div>
              )}
              {selectedInvoice.fni_notes && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-700 mb-1">{t.fniPackagesNotes}:</div>
                  <div className="text-slate-600">{selectedInvoice.fni_notes}</div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <FileCheck2 className="w-4 h-4" />
                <span>{t.recognizedInvoice}</span>
              </div>
              <button
                onClick={() => window.print()}
                className="no-print flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.printInvoice}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
