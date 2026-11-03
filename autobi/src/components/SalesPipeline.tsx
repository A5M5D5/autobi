import React, { useEffect, useState } from 'react';
import { Deal, Customer, Vehicle, Language, UserRole } from '../types';
import { translations } from '../lib/translations';
import { formatIqd, formatUsd } from '../lib/currency';
import {
  Plus,
  Phone,
  Car,
  ChevronRight,
  ChevronLeft,
  X,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';

interface SalesPipelineProps {
  deals: Deal[];
  customers: Customer[];
  vehicles: Vehicle[];
  lang: Language;
  role: UserRole;
  selectedBranch?: string;
  onRefresh: () => void;
}

const CHANNELS = [
  'معارض الحبيبية / البياع',
  'سوق مريدي / فيسبوك',
  'توصيات وزبائن دائميين',
  'إعلانات إنستغرام',
];

export const SalesPipeline: React.FC<SalesPipelineProps> = ({
  deals,
  customers,
  vehicles,
  lang,
  role,
  selectedBranch = 'all',
  onRefresh,
}) => {
  const t = translations[lang];

  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [newDealForm, setNewDealForm] = useState({
    customer_id: customers[0]?.id || '',
    vehicle_id: vehicles[0]?.id || '',
    pipeline_stage: 'Lead' as 'Lead' | 'Test Drive' | 'Negotiation' | 'Closed',
    deal_value: vehicles[0]?.selling_price || 50000,
    notes: '',
  });

  const [newCustomerForm, setNewCustomerForm] = useState({
    full_name: '',
    phone: '+964 ',
    email: '',
    acquisition_channel: CHANNELS[0],
  });

  useEffect(() => {
    setNewDealForm((prev) => {
      const defaultVeh = vehicles.find((v) => v.status === 'Available') || vehicles[0];
      return {
        ...prev,
        customer_id: prev.customer_id || customers[0]?.id || '',
        vehicle_id: prev.vehicle_id || defaultVeh?.id || '',
        deal_value: prev.vehicle_id ? prev.deal_value : defaultVeh?.selling_price || 50000,
      };
    });
  }, [customers, vehicles]);

  const stages: Array<'Lead' | 'Test Drive' | 'Negotiation' | 'Closed'> = [
    'Lead',
    'Test Drive',
    'Negotiation',
    'Closed',
  ];

  const stageTitles: Record<string, string> = {
    Lead: t.stageLead,
    'Test Drive': t.stageTestDrive,
    Negotiation: t.stageNegotiation,
    Closed: t.stageClosed,
  };

  const visibleVehicleIds = new Set(vehicles.map((v) => v.id));
  const filteredDeals =
    selectedBranch === 'all'
      ? deals
      : deals.filter((d) => visibleVehicleIds.has(d.vehicle_id));

  const handleStageChange = async (dealId: string, newStage: 'Lead' | 'Test Drive' | 'Negotiation' | 'Closed') => {
    if (newStage === 'Closed' && role === 'Employee') {
      setFeedback(t.closeRequiresSupervisor);
      return;
    }
    setFeedback('');
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_stage: newStage }),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        onRefresh();
      } else {
        setFeedback(payload.error || t.updateFailed);
      }
    } catch (err) {
      console.error(err);
      setFeedback(t.updateFailed);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback('');
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDealForm),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        setShowAddDeal(false);
        setFeedback(t.opportunityCreated);
        onRefresh();
      } else {
        setFeedback(payload.error || t.updateFailed);
      }
    } catch (err) {
      console.error(err);
      setFeedback(t.updateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.full_name.trim()) return;
    setIsSaving(true);
    setFeedback('');
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerForm),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        setShowAddCustomer(false);
        setNewCustomerForm({
          full_name: '',
          phone: '+964 ',
          email: '',
          acquisition_channel: CHANNELS[0],
        });
        setFeedback(t.customerAdded);
        onRefresh();
        if (payload.data?.id) {
          setNewDealForm((prev) => ({ ...prev, customer_id: payload.data.id }));
        }
      } else {
        setFeedback(payload.error || t.updateFailed);
      }
    } catch (err) {
      console.error(err);
      setFeedback(t.updateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t.pipelineTitle}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'ar'
              ? 'متابعة فرص البيع والمراحل التفاوضية حتى اعتماد الصفقة'
              : 'Track active sales opportunities through negotiation to approval'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCustomer(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.addCustomer}</span>
          </button>

          <button
            onClick={() => setShowAddDeal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.createDeal}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-2.5 text-xs font-medium flex items-center justify-between gap-3">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-blue-500 hover:text-blue-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const stageDeals = filteredDeals.filter((d) => d.pipeline_stage === stage);
          const stageTotalValue = stageDeals.reduce((sum, d) => sum + d.deal_value, 0);

          return (
            <div
              key={stage}
              className="bg-slate-100/80 border border-slate-200/90 rounded-xl p-3 flex flex-col min-h-[500px]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      stage === 'Closed'
                        ? 'bg-emerald-500'
                        : stage === 'Negotiation'
                        ? 'bg-amber-500'
                        : stage === 'Test Drive'
                        ? 'bg-blue-500'
                        : 'bg-slate-500'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-900">{stageTitles[stage]}</span>
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-slate-700 shadow-2xs">
                  {stageDeals.length}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 mb-3 px-1">
                {lang === 'ar' ? 'إجمالي المرحلة' : 'Stage Volume'}:{' '}
                <strong className="text-slate-900 font-mono">{formatUsd(stageTotalValue)}</strong>
                <span className="block font-mono text-[10px] text-slate-400">
                  {formatIqd(stageTotalValue)}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageDeals.map((deal) => {
                  const customer = customers.find((c) => c.id === deal.customer_id);
                  const vehicle = vehicles.find((v) => v.id === deal.vehicle_id);

                  const stageIndex = stages.indexOf(stage);
                  const prevStage = stageIndex > 0 ? stages[stageIndex - 1] : null;
                  const nextStage = stageIndex < stages.length - 1 ? stages[stageIndex + 1] : null;

                  return (
                    <div
                      key={deal.id}
                      className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs gap-1">
                          <span className="font-bold text-slate-900 truncate">
                            {customer ? customer.full_name : 'Valued Client'}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
                            {customer?.acquisition_channel || (lang === 'ar' ? 'قناة غير محددة' : 'Unspecified')}
                          </span>
                        </div>

                        {customer?.phone && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}

                        {vehicle && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium mt-2 pt-2 border-t border-slate-100">
                            <Car className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </span>
                          </div>
                        )}

                        <div className="mt-3 flex items-start justify-between gap-2">
                          <span className="text-[11px] text-slate-400">{t.dealValue}:</span>
                          <span className="text-end">
                            <span className="block text-sm font-bold font-mono tabular-nums text-slate-900">
                              {formatUsd(deal.deal_value)}
                            </span>
                            <span className="block text-[10px] font-mono text-slate-500">
                              {formatIqd(deal.deal_value)}
                            </span>
                          </span>
                        </div>

                        {deal.notes && (
                          <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-2 bg-slate-50 p-1.5 rounded">
                            "{deal.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                        {prevStage ? (
                          <button
                            onClick={() => handleStageChange(deal.id, prevStage)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title={`Move back to ${stageTitles[prevStage]}`}
                          >
                            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                          </button>
                        ) : (
                          <div />
                        )}

                        {nextStage ? (
                          <button
                            onClick={() => handleStageChange(deal.id, nextStage)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                          >
                            <span>{stageTitles[nextStage]}</span>
                            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'مكتملة' : 'Closed'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD CUSTOMER MODAL */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">{t.addCustomer}</h3>
              <button onClick={() => setShowAddCustomer(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t.customerName} *</label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.full_name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, full_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t.contactNumber}</label>
                <input
                  type="text"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t.emailAddress}</label>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t.acquisitionChannel}</label>
                <select
                  value={newCustomerForm.acquisition_channel}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, acquisition_channel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newCustomerForm.full_name.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DEAL MODAL */}
      {showAddDeal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900">{t.createDeal}</h3>
              <button onClick={() => setShowAddDeal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t.customerName}</label>
                <select
                  value={newDealForm.customer_id}
                  onChange={(e) => setNewDealForm({ ...newDealForm, customer_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone}) - {c.acquisition_channel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t.selectVehicle}</label>
                <select
                  value={newDealForm.vehicle_id}
                  onChange={(e) => {
                    const veh = vehicles.find((v) => v.id === e.target.value);
                    setNewDealForm({
                      ...newDealForm,
                      vehicle_id: e.target.value,
                      deal_value: veh ? veh.selling_price : 50000,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({formatUsd(v.selling_price)} · {formatIqd(v.selling_price)}) - {v.vin}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.dealValue} ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={newDealForm.deal_value}
                    onChange={(e) => setNewDealForm({ ...newDealForm, deal_value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                  <div className="mt-1 text-[10px] font-mono text-slate-500 truncate">
                    {formatIqd(newDealForm.deal_value || 0)}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.initialStage}</label>
                  <select
                    value={newDealForm.pipeline_stage}
                    onChange={(e) => setNewDealForm({ ...newDealForm, pipeline_stage: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    <option value="Lead">{t.stageLead}</option>
                    <option value="Test Drive">{t.stageTestDrive}</option>
                    <option value="Negotiation">{t.stageNegotiation}</option>
                    {role !== 'Employee' && <option value="Closed">{t.stageClosed}</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t.negotiationNotes}</label>
                <textarea
                  rows={2}
                  value={newDealForm.notes}
                  onChange={(e) => setNewDealForm({ ...newDealForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddDeal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newDealForm.customer_id || !newDealForm.vehicle_id}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
