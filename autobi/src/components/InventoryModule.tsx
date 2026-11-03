import React, { useEffect, useState } from 'react';
import { Vehicle, Language, UserRole } from '../types';
import { translations } from '../lib/translations';
import { BRANCHES, branchLabel } from '../lib/branches';
import { formatIqd, formatUsd } from '../lib/currency';
import {
  Search,
  Plus,
  Camera,
  Gauge,
  ShieldAlert,
  Clock,
  CheckCircle,
  X,
  Loader2,
  ArrowLeftRight,
  Building2,
  Sparkles,
  Edit3,
  Trash2,
  AlertTriangle,
  Wrench,
} from 'lucide-react';

interface InventoryModuleProps {
  vehicles: Vehicle[];
  lang: Language;
  role: UserRole;
  selectedBranch: string;
  onRefresh: () => void;
  onOpenStudio: (vehicle: Vehicle) => void;
  filterAgingOnly?: boolean;
  onClearAgingFilter?: () => void;
}

type PassportTab = 'overview' | 'costs' | 'history' | 'maintenance';

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  vehicles,
  lang,
  role,
  selectedBranch,
  onRefresh,
  onOpenStudio,
  filterAgingOnly = false,
  onClearAgingFilter,
}) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<PassportTab>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [formError, setFormError] = useState('');
  const [transferBranch, setTransferBranch] = useState('b-2');
  const [transferFeedback, setTransferFeedback] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editForm, setEditForm] = useState({
    selling_price: 0,
    target_discount: 0,
    mileage: 0,
    status: 'Available' as Vehicle['status'],
    purchase_price: 0,
    shipping_fees: 0,
    customs: 0,
    reconditioning_cost: 0,
    accidents_record: '',
  });

  const [newMaint, setNewMaint] = useState({
    service: '',
    cost: 0,
  });

  const [newVehicleForm, setNewVehicleForm] = useState({
    vin: '',
    make: '',
    model: '',
    trim: 'Standard',
    year: 2024,
    mileage: 0,
    transmission: 'Automatic',
    fuel_type: 'Gasoline',
    color: 'White',
    selling_price: 65000,
    target_discount: 2000,
    branch_id: 'b-1',
    days_on_lot: 0,
    purchase_price: 0,
    shipping_fees: 0,
    customs: 0,
    reconditioning_cost: 0,
    accidents_record: 'No accident history recorded.',
  });

  const isEmployee = role === 'Employee';

  useEffect(() => {
    if (selectedVehicle) {
      const updated = vehicles.find((v) => v.id === selectedVehicle.id);
      if (updated) setSelectedVehicle(updated);
    }
  }, [vehicles]);

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (selectedBranch !== 'all' && vehicle.branch_id !== selectedBranch) return false;
    if (statusFilter !== 'all' && vehicle.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (filterAgingOnly && vehicle.days_on_lot < 45) return false;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      return (
        vehicle.vin.toLowerCase().includes(query) ||
        vehicle.make.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        vehicle.color.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const openPassport = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setActiveTab('overview');
    setIsEditingVehicle(false);
    setTransferFeedback('');
    setTransferBranch(vehicle.branch_id === 'b-1' ? 'b-2' : 'b-1');
    setEditForm({
      selling_price: vehicle.selling_price,
      target_discount: vehicle.target_discount,
      mileage: vehicle.mileage,
      status: vehicle.status,
      purchase_price: vehicle.costs.purchase_price,
      shipping_fees: vehicle.costs.shipping_fees,
      customs: vehicle.costs.customs,
      reconditioning_cost: vehicle.costs.reconditioning_cost,
      accidents_record: vehicle.history.accidents_record,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanningOCR(true);
    setOcrSuccessMsg('');
    setOcrError('');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch('/api/gemini/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: reader.result as string,
            mimeType: file.type || 'image/jpeg',
          }),
        });
        const payload = await response.json();
        if (response.ok && payload.success && payload.data) {
          const extracted = payload.data;
          setNewVehicleForm((previous) => ({
            ...previous,
            vin: extracted.vin || previous.vin,
            make: extracted.make || previous.make,
            model: extracted.model || previous.model,
            year: extracted.year || previous.year,
            trim: extracted.trim || previous.trim,
            mileage: extracted.mileage ?? previous.mileage,
            color: extracted.color || previous.color,
            fuel_type: extracted.fuel_type || previous.fuel_type,
            transmission: extracted.transmission || previous.transmission,
          }));
          setOcrSuccessMsg(`${t.documentExtracted} (VIN: ${extracted.vin})`);
        } else {
          setOcrError(payload.error || t.documentExtractionFailed);
        }
      } catch (error) {
        console.error(error);
        setOcrError(t.documentExtractionFailed);
      } finally {
        setIsScanningOCR(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNewVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicleForm),
      });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setShowAddModal(false);
        setOcrSuccessMsg('');
        setFormError('');
        onRefresh();
      } else {
        setFormError(payload.error || t.registrationFailed);
      }
    } catch (error) {
      console.error(error);
      setFormError(t.registrationFailed);
    }
  };

  const handleSaveEditVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedVehicle || isEmployee) return;
    setIsSavingEdit(true);
    setTransferFeedback('');
    try {
      const response = await fetch(`/api/vehicles/${selectedVehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: {
            selling_price: editForm.selling_price,
            target_discount: editForm.target_discount,
            mileage: editForm.mileage,
            status: editForm.status,
            costs: {
              purchase_price: editForm.purchase_price,
              shipping_fees: editForm.shipping_fees,
              customs: editForm.customs,
              reconditioning_cost: editForm.reconditioning_cost,
            },
            history: {
              ...selectedVehicle.history,
              accidents_record: editForm.accidents_record,
            },
          },
        }),
      });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setSelectedVehicle(payload.data);
        setIsEditingVehicle(false);
        setTransferFeedback(t.vehicleUpdated);
        onRefresh();
      } else {
        setTransferFeedback(payload.error || t.updateFailed);
      }
    } catch {
      setTransferFeedback(t.updateFailed);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddMaintenance = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedVehicle || isEmployee || !newMaint.service.trim()) return;
    setIsSavingEdit(true);
    try {
      const nextMaintenance = [
        ...selectedVehicle.history.maintenance_history,
        {
          date: new Date().toISOString().slice(0, 10),
          service: newMaint.service.trim(),
          service_ar: newMaint.service.trim(),
          cost: Math.max(0, newMaint.cost),
        },
      ];
      const response = await fetch(`/api/vehicles/${selectedVehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: {
            costs: {
              ...selectedVehicle.costs,
              reconditioning_cost:
                selectedVehicle.costs.reconditioning_cost + Math.max(0, newMaint.cost),
            },
            history: {
              ...selectedVehicle.history,
              maintenance_history: nextMaintenance,
            },
          },
        }),
      });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setSelectedVehicle(payload.data);
        setNewMaint({ service: '', cost: 0 });
        onRefresh();
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle || role !== 'Manager') return;
    setIsSavingEdit(true);
    setTransferFeedback('');
    try {
      const response = await fetch(`/api/vehicles/${selectedVehicle.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setSelectedVehicle(null);
        onRefresh();
      } else {
        setTransferFeedback(payload.error || t.updateFailed);
      }
    } catch {
      setTransferFeedback(t.updateFailed);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedVehicle || isEmployee) return;
    setIsTransferring(true);
    setTransferFeedback('');
    try {
      const response = await fetch(`/api/vehicles/${selectedVehicle.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch_id: transferBranch }),
      });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setSelectedVehicle({ ...selectedVehicle, branch_id: transferBranch });
        setTransferFeedback(lang === 'ar' ? 'تم اعتماد النقل بين الفروع.' : 'Branch transfer approved.');
        onRefresh();
      } else {
        setTransferFeedback(payload.error || t.updateFailed);
      }
    } catch {
      setTransferFeedback(t.updateFailed);
    } finally {
      setIsTransferring(false);
    }
  };

  const statusTabs = [
    { id: 'all', label: t.allStatuses },
    { id: 'available', label: t.statusAvailable },
    { id: 'reserved', label: t.statusReserved },
    { id: 'sold', label: t.statusSold },
  ];

  const tabClass = (tab: PassportTab) =>
    `py-3 px-4 border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-[#2563EB] text-blue-700 font-semibold'
        : 'border-transparent text-slate-500 hover:text-slate-800'
    }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.inventoryTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'ar'
              ? 'سجل موحد للمركبات وبطاقات القيد الفني.'
              : 'Unified vehicle register and technical passports.'}
          </p>
        </div>
        {!isEmployee && (
          <button
            onClick={() => {
              setFormError('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addVehicle}</span>
          </button>
        )}
      </div>

      {filterAgingOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t.agingFilterActive}</span>
          </div>
          {onClearAgingFilter && (
            <button
              onClick={onClearAgingFilter}
              className="px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100 transition-colors"
            >
              {t.clearAgingFilter}
            </button>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === tab.id
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredVehicles.map((vehicle) => {
          const isStagnant = vehicle.days_on_lot > 60;
          const isWarning = vehicle.days_on_lot >= 45 && vehicle.days_on_lot <= 60;
          return (
            <div
              key={vehicle.id}
              onClick={() => openPassport(vehicle)}
              className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col group"
            >
              <div className="relative bg-slate-100 overflow-hidden">
                <img
                  src={vehicle.image_url}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="w-full h-28 object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    (event.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div
                  className={`absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center gap-1 shadow-sm ${
                    isStagnant
                      ? 'bg-red-600 text-white'
                      : isWarning
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>{vehicle.days_on_lot}d</span>
                </div>
                <div className="absolute bottom-2 left-2 rtl:left-auto rtl:right-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                      vehicle.status === 'Available'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : vehicle.status === 'Sold'
                        ? 'bg-slate-800 text-slate-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {vehicle.status === 'Available'
                      ? t.statusAvailable
                      : vehicle.status === 'Sold'
                      ? t.statusSold
                      : vehicle.status === 'In-Transit'
                      ? t.statusInTransit
                      : t.statusReserved}
                  </span>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[9px] font-mono text-slate-400 tracking-wide truncate">{vehicle.vin}</div>
                  <h3 className="text-xs font-semibold text-slate-900 mt-0.5 truncate">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <div className="text-[10px] text-slate-500 truncate">
                    {vehicle.trim} · {vehicle.color}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mt-2.5 pt-2.5 border-t border-slate-100">
                    <Gauge className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-mono tabular-nums">{vehicle.mileage.toLocaleString()} km</span>
                    <span className="text-slate-300">·</span>
                    <span className="truncate">{vehicle.fuel_type}</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-end justify-between gap-1">
                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-400">{t.price}</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                      {formatUsd(vehicle.selling_price)}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 truncate">
                      {formatIqd(vehicle.selling_price)}
                    </div>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenStudio(vehicle);
                    }}
                    title={t.studioTitle}
                    className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
          <p className="text-xs">{t.noRecords}</p>
        </div>
      )}

      {selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50 rounded-t-xl gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    VIN: {selectedVehicle.vin}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t.daysOnLot}: <strong className="font-mono">{selectedVehicle.days_on_lot}d</strong>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t.branch}: <strong>{branchLabel(selectedVehicle.branch_id, lang)}</strong>
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1.5">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.trim})
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">{t.vehiclePassport}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!isEmployee && (
                  <button
                    onClick={() => setIsEditingVehicle((prev) => !prev)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t.edit}</span>
                  </button>
                )}
                {role === 'Manager' && selectedVehicle.status !== 'Sold' && (
                  <button
                    onClick={handleDeleteVehicle}
                    disabled={isSavingEdit}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                    title={t.deleteVehicle}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                  aria-label={t.close}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isEditingVehicle && (
              <div className="flex flex-wrap border-b border-slate-200 px-5 bg-white text-xs font-medium">
                <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
                  {t.generalPassport}
                </button>
                <button onClick={() => setActiveTab('costs')} className={tabClass('costs')}>
                  {t.costsTab}
                </button>
                <button onClick={() => setActiveTab('history')} className={tabClass('history')}>
                  {t.historyTab}
                </button>
                <button onClick={() => setActiveTab('maintenance')} className={tabClass('maintenance')}>
                  {t.maintenanceTab}
                </button>
              </div>
            )}

            <div className="p-6">
              {transferFeedback && (
                <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium">
                  {transferFeedback}
                </div>
              )}

              {isEditingVehicle ? (
                <form onSubmit={handleSaveEditVehicle} className="space-y-4 text-xs">
                  <h3 className="font-bold text-slate-900">{t.editVehicle}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">{t.price} (USD)</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.selling_price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, selling_price: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">{t.targetDiscount} (USD)</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.target_discount}
                        onChange={(e) =>
                          setEditForm({ ...editForm, target_discount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">{t.mileage}</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.mileage}
                        onChange={(e) =>
                          setEditForm({ ...editForm, mileage: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: e.target.value as Vehicle['status'] })
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                      >
                        <option value="Available">{t.statusAvailable}</option>
                        <option value="Reserved">{t.statusReserved}</option>
                        <option value="In-Transit">{t.statusInTransit}</option>
                        <option value="Sold">{t.statusSold}</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-2">{t.costsTab}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1">{t.purchasePrice}</label>
                        <input
                          type="number"
                          min={0}
                          value={editForm.purchase_price}
                          onChange={(e) =>
                            setEditForm({ ...editForm, purchase_price: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">{t.shippingFees}</label>
                        <input
                          type="number"
                          min={0}
                          value={editForm.shipping_fees}
                          onChange={(e) =>
                            setEditForm({ ...editForm, shipping_fees: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">{t.customsFees}</label>
                        <input
                          type="number"
                          min={0}
                          value={editForm.customs}
                          onChange={(e) =>
                            setEditForm({ ...editForm, customs: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">{t.reconditioningCost}</label>
                        <input
                          type="number"
                          min={0}
                          value={editForm.reconditioning_cost}
                          onChange={(e) =>
                            setEditForm({ ...editForm, reconditioning_cost: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">{t.accidentsRecord}</label>
                    <textarea
                      rows={2}
                      value={editForm.accidents_record}
                      onChange={(e) => setEditForm({ ...editForm, accidents_record: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditingVehicle(false)}
                      className="px-4 py-2 text-slate-600"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="px-4 py-2 font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg"
                    >
                      {t.save}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {activeTab === 'overview' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        {[
                          { label: t.year, value: selectedVehicle.year },
                          {
                            label: t.mileage,
                            value: `${selectedVehicle.mileage.toLocaleString()} km`,
                            mono: true,
                          },
                          { label: t.fuelType, value: selectedVehicle.fuel_type },
                          { label: t.transmission, value: selectedVehicle.transmission },
                          { label: t.exteriorColor, value: selectedVehicle.color },
                          {
                            label: t.price,
                            value: `${formatUsd(selectedVehicle.selling_price)} · ${formatIqd(
                              selectedVehicle.selling_price
                            )}`,
                            mono: true,
                          },
                        ].map((item) => (
                          <div key={item.label} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-slate-400 block">{item.label}</span>
                            <span className={`font-semibold text-slate-800 ${item.mono ? 'font-mono' : ''}`}>
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="text-xs font-semibold text-slate-700 mb-1.5">
                          {t.inspectionCertification}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {selectedVehicle.history.accidents_record}
                        </p>
                      </div>

                      {!isEmployee && (
                        <div className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <h4 className="text-xs font-semibold text-slate-800">{t.transferBranch}</h4>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <select
                              value={transferBranch}
                              onChange={(event) => setTransferBranch(event.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                            >
                              {['b-1', 'b-2', 'b-3']
                                .filter((branch) => branch !== selectedVehicle.branch_id)
                                .map((branch) => (
                                  <option key={branch} value={branch}>
                                    {branchLabel(branch, lang)}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={handleTransfer}
                              disabled={isTransferring || transferBranch === selectedVehicle.branch_id}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                            >
                              {isTransferring ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              )}
                              <span>{t.transferAction}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'costs' && (
                    <div>
                      {isEmployee ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
                          <ShieldAlert className="w-9 h-9 text-amber-500 mx-auto mb-2.5" />
                          <h4 className="text-sm font-semibold text-amber-900">{t.costRestricted}</h4>
                          <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">{t.restrictedCostNote}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200">
                            {[
                              { label: t.purchasePrice, value: selectedVehicle.costs.purchase_price },
                              { label: t.shippingFees, value: selectedVehicle.costs.shipping_fees },
                              { label: t.customsFees, value: selectedVehicle.costs.customs },
                              { label: t.reconditioningCost, value: selectedVehicle.costs.reconditioning_cost },
                            ].map((item) => (
                              <div key={item.label} className="flex justify-between items-center p-3 text-xs">
                                <span className="text-slate-600">{item.label}</span>
                                <span className="text-end">
                                  <span className="font-mono font-semibold text-slate-900 block">
                                    {formatUsd(item.value)}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-500">
                                    {formatIqd(item.value)}
                                  </span>
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center p-3 text-xs bg-slate-50 font-semibold">
                              <span className="text-slate-900">{t.totalCumulativeCost}</span>
                              <span className="text-end">
                                <span className="font-mono text-slate-900 block">
                                  {formatUsd(selectedVehicle.costs.total_cost)}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 font-normal">
                                  {formatIqd(selectedVehicle.costs.total_cost)}
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-3">
                            <div>
                              <span className="text-xs text-emerald-800 font-semibold">{t.estimatedMargin}</span>
                              <div className="text-[11px] text-emerald-700 mt-0.5">
                                {lang === 'ar'
                                  ? 'الفرق بين سعر العرض والتكلفة التراكمية'
                                  : 'Spread between listing price and cumulative cost'}
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="text-base font-bold font-mono tabular-nums text-[#059669]">
                                +{formatUsd(selectedVehicle.selling_price - selectedVehicle.costs.total_cost)}
                              </div>
                              <div className="text-[10px] font-mono text-emerald-700">
                                {formatIqd(selectedVehicle.selling_price - selectedVehicle.costs.total_cost)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      <div className="border border-slate-200 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-slate-800 mb-2">{t.accidentsRecord}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {selectedVehicle.history.accidents_record}
                        </p>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-slate-800 mb-3">{t.odometerTab}</h4>
                        <div className="space-y-1">
                          {selectedVehicle.history.odometer_readings.map((record, index) => (
                            <div
                              key={`${record.date}-${index}`}
                              className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-0"
                            >
                              <span className="text-slate-500 font-mono">{record.date}</span>
                              <span className="font-mono font-semibold text-slate-800">
                                {record.reading.toLocaleString()} km
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'maintenance' && (
                    <div className="space-y-4">
                      {!isEmployee && (
                        <form
                          onSubmit={handleAddMaintenance}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-end gap-2 text-xs"
                        >
                          <div className="flex-1">
                            <label className="block text-slate-600 font-semibold mb-1">
                              {t.maintenanceService}
                            </label>
                            <input
                              type="text"
                              required
                              value={newMaint.service}
                              onChange={(e) => setNewMaint({ ...newMaint, service: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2"
                            />
                          </div>
                          <div className="w-full sm:w-36">
                            <label className="block text-slate-600 font-semibold mb-1">
                              {t.maintenanceCost}
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={newMaint.cost}
                              onChange={(e) =>
                                setNewMaint({ ...newMaint, cost: parseFloat(e.target.value) || 0 })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSavingEdit || !newMaint.service.trim()}
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shrink-0"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>{t.addMaintenance}</span>
                          </button>
                        </form>
                      )}

                      {selectedVehicle.history.maintenance_history.length === 0 ? (
                        <div className="text-center p-6 text-slate-400 text-xs">{t.noMaintenance}</div>
                      ) : (
                        <div className="space-y-2.5">
                          {selectedVehicle.history.maintenance_history.map((item, index) => (
                            <div
                              key={`${item.date}-${index}`}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-semibold text-slate-800">
                                  {lang === 'ar' ? item.service_ar || item.service : item.service}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.date}</div>
                              </div>
                              {!isEmployee && (
                                <div className="text-end">
                                  <div className="font-mono font-semibold text-slate-700">
                                    {formatUsd(item.cost)}
                                  </div>
                                  <div className="font-mono text-[10px] text-slate-400">
                                    {formatIqd(item.cost)}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.addVehicle}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t.registerVehicleHint}</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewVehicle} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {formError}
                </div>
              )}

              <div className="border border-dashed border-blue-300 bg-blue-50/50 rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="ocr-file-input"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="ocr-file-input" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  {isScanningOCR ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t.scanningDocument}</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-full bg-blue-100 text-blue-700">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-blue-900">{t.scanVIN}</span>
                      <span className="text-[11px] text-slate-500 max-w-sm">{t.scanDocumentHint}</span>
                    </>
                  )}
                </label>
                {ocrSuccessMsg && (
                  <div className="mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 py-1 px-2 rounded inline-flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{ocrSuccessMsg}</span>
                  </div>
                )}
                {ocrError && (
                  <div className="mt-2 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 py-1 px-2 rounded inline-block">
                    {ocrError}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.vinNumber} *</label>
                  <input
                    type="text"
                    required
                    value={newVehicleForm.vin}
                    onChange={(event) =>
                      setNewVehicleForm({ ...newVehicleForm, vin: event.target.value.toUpperCase() })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.makeAndModel} *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={newVehicleForm.make}
                      onChange={(event) => setNewVehicleForm({ ...newVehicleForm, make: event.target.value })}
                      placeholder="Make"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      required
                      value={newVehicleForm.model}
                      onChange={(event) => setNewVehicleForm({ ...newVehicleForm, model: event.target.value })}
                      placeholder="Model"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.year}</label>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    value={newVehicleForm.year}
                    onChange={(event) =>
                      setNewVehicleForm({ ...newVehicleForm, year: parseInt(event.target.value, 10) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.mileage}</label>
                  <input
                    type="number"
                    min={0}
                    value={newVehicleForm.mileage}
                    onChange={(event) =>
                      setNewVehicleForm({ ...newVehicleForm, mileage: parseInt(event.target.value, 10) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.price} (USD)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newVehicleForm.selling_price}
                    onChange={(event) =>
                      setNewVehicleForm({
                        ...newVehicleForm,
                        selling_price: parseFloat(event.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                  <div className="mt-1 text-[10px] font-mono text-slate-500 truncate">
                    {formatIqd(newVehicleForm.selling_price)}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.branch}</label>
                  <select
                    value={newVehicleForm.branch_id}
                    onChange={(event) => setNewVehicleForm({ ...newVehicleForm, branch_id: event.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    {BRANCHES.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branchLabel(branch.id, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!isEmployee && (
                <div className="pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-900 mb-3">{t.costsTab}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {[
                      { key: 'purchase_price' as const, label: t.purchasePrice },
                      { key: 'shipping_fees' as const, label: t.shippingFees },
                      { key: 'customs' as const, label: t.customsFees },
                      { key: 'reconditioning_cost' as const, label: t.reconditioningCost },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-slate-600 mb-1">{field.label}</label>
                        <input
                          type="number"
                          min={0}
                          value={newVehicleForm[field.key]}
                          onChange={(event) =>
                            setNewVehicleForm({
                              ...newVehicleForm,
                              [field.key]: parseFloat(event.target.value) || 0,
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200">
                <p className="text-[10px] text-slate-400">
                  {isEmployee ? t.restrictedCostNote : t.dataGovernance}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
