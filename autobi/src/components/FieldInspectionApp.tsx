import React, { useEffect, useState } from 'react';
import { Customer, Language, UserRole, Vehicle } from '../types';
import { translations } from '../lib/translations';
import { formatIqd, formatUsd } from '../lib/currency';
import {
  Tablet,
  CheckCircle2,
  Car,
  AlertCircle,
  Calculator,
  ShieldCheck,
} from 'lucide-react';

interface FieldInspectionAppProps {
  lang: Language;
  role: UserRole;
  customers: Customer[];
  vehicles: Vehicle[];
  onRefresh: () => void;
}

export const FieldInspectionApp: React.FC<FieldInspectionAppProps> = ({
  lang,
  role,
  customers,
  vehicles,
  onRefresh,
}) => {
  const t = translations[lang];

  const [form, setForm] = useState({
    customer_id: customers[0]?.id || '',
    vehicle_id: vehicles[0]?.id || '',
    tradeInVehicle: '',
    vin: '',
    mileage: 0,
    bodyCondition: '',
    engineCondition: '',
    interiorCondition: '',
    tiresCondition: '',
    baseMarketValue: 0,
    reconditioningDeduction: 0,
    supervisorNotes: '',
  });

  const [isApproved, setIsApproved] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      customer_id: prev.customer_id || customers[0]?.id || '',
      vehicle_id: prev.vehicle_id || vehicles[0]?.id || '',
    }));
  }, [customers, vehicles]);

  const recommendedOffer = Math.max(0, form.baseMarketValue - form.reconditioningDeduction);

  const handleApproveTradeIn = async () => {
    if (role === 'Employee') {
      setIsError(true);
      setSubmissionFeedback(t.tradeInPermission);
      return;
    }
    if (!form.customer_id || !form.vehicle_id || recommendedOffer <= 0) {
      setIsError(true);
      setSubmissionFeedback(t.customerAndVehicleRequired);
      return;
    }

    try {
      const res = await fetch('/api/trade-ins/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: form.customer_id,
          vehicle_id: form.vehicle_id,
          trade_in_vehicle: form.tradeInVehicle,
          vin: form.vin,
          mileage: form.mileage,
          body_condition: form.bodyCondition,
          engine_condition: form.engineCondition,
          interior_condition: form.interiorCondition,
          tires_condition: form.tiresCondition,
          base_market_value: form.baseMarketValue,
          reconditioning_deduction: form.reconditioningDeduction,
          recommended_offer: recommendedOffer,
          notes: form.supervisorNotes,
        }),
      });
      const payload = await res.json();

      if (res.ok && payload.success) {
        setIsError(false);
        setIsApproved(true);
        setSubmissionFeedback(t.tradeInApproved);
        onRefresh();
      } else {
        setIsError(true);
        setSubmissionFeedback(payload.error || t.updateFailed);
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
      setSubmissionFeedback(t.updateFailed);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Tablet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.fieldTitle}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t.fieldSubtitle}</p>
          </div>
        </div>
      </div>

      {submissionFeedback && (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 text-xs font-semibold border ${
            isError
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{submissionFeedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-500" />
              <span>{lang === 'ar' ? 'بيانات سيارة الاستبدال' : 'Trade-In Vehicle Details'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">{t.customerName}</label>
                <select
                  value={form.customer_id}
                  onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                >
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name} · {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">{t.selectVehicle}</label>
                <select
                  value={form.vehicle_id}
                  onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.vin}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  {lang === 'ar' ? 'السيارة المراد استبدالها' : 'Trade-In Model'}
                </label>
                <input
                  type="text"
                  value={form.tradeInVehicle}
                  onChange={(e) => {
                    setIsApproved(false);
                    setForm({ ...form, tradeInVehicle: e.target.value });
                  }}
                  placeholder={lang === 'ar' ? 'مثال: رينج روفر سبورت 2021' : 'e.g. Range Rover Sport 2021'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">{t.vinNumber}</label>
                  <input
                    type="text"
                    value={form.vin}
                    onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">{t.mileage}</label>
                  <input
                    type="number"
                    min={0}
                    value={form.mileage}
                    onChange={(e) => setForm({ ...form, mileage: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900">{t.vehicleCondition}</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">{t.bodyCondition}</label>
                <input
                  type="text"
                  value={form.bodyCondition}
                  onChange={(e) => setForm({ ...form, bodyCondition: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">{t.engineCondition}</label>
                <input
                  type="text"
                  value={form.engineCondition}
                  onChange={(e) => setForm({ ...form, engineCondition: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">{t.interiorCondition}</label>
                <input
                  type="text"
                  value={form.interiorCondition}
                  onChange={(e) => setForm({ ...form, interiorCondition: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">{t.tiresCondition}</label>
                <input
                  type="text"
                  value={form.tiresCondition}
                  onChange={(e) => setForm({ ...form, tiresCondition: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">{t.conditionNotes}</label>
                <textarea
                  rows={2}
                  value={form.supervisorNotes}
                  onChange={(e) => setForm({ ...form, supervisorNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-3">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'حاسبة التثمين اللحظية' : 'Live Valuation Calculator'}</span>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">{t.marketValueEstimate} ($)</label>
              <input
                type="number"
                min={0}
                value={form.baseMarketValue}
                onChange={(e) => {
                  setIsApproved(false);
                  setForm({ ...form, baseMarketValue: parseFloat(e.target.value) || 0 });
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
              />
              <div className="mt-1 text-[10px] font-mono text-slate-500">
                {formatIqd(form.baseMarketValue || 0)}
              </div>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">{t.deductionsRequired} ($)</label>
              <input
                type="number"
                min={0}
                value={form.reconditioningDeduction}
                onChange={(e) => {
                  setIsApproved(false);
                  setForm({ ...form, reconditioningDeduction: parseFloat(e.target.value) || 0 });
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-rose-600"
              />
              <div className="mt-1 text-[10px] font-mono text-slate-500">
                {formatIqd(form.reconditioningDeduction || 0)}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 mt-4">
              <div className="text-[11px] text-emerald-800 font-semibold mb-1">{t.recommendedTradeInOffer}</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#059669]">
                {formatUsd(recommendedOffer)}
              </div>
              <div className="text-xs font-mono text-emerald-700 mt-0.5">
                {formatIqd(recommendedOffer)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">{t.targetMarginNote}</div>
            </div>

            <div className="pt-2">
              <button
                disabled={isApproved || role === 'Employee' || recommendedOffer <= 0}
                onClick={handleApproveTradeIn}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed'
                    : 'bg-[#059669] hover:bg-emerald-700 text-white disabled:opacity-50 shadow-sm'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isApproved ? (lang === 'ar' ? 'تم الاعتماد' : 'Approved') : t.approveTradeIn}</span>
              </button>

              {role === 'Employee' && (
                <p className="text-[10px] text-amber-600 text-center mt-2">
                  *{t.tradeInPermission}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
