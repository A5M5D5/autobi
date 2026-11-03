import React, { useState } from 'react';
import { Language, UserRole } from '../types';
import { translations } from '../lib/translations';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileCheck,
} from 'lucide-react';

interface BulkImportEngineProps {
  lang: Language;
  role: UserRole;
  onRefresh: () => void;
}

export const BulkImportEngine: React.FC<BulkImportEngineProps> = ({
  lang,
  role,
  onRefresh,
}) => {
  const t = translations[lang];

  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'ready' | 'submitting' | 'done'>('idle');
  const [resultSummary, setResultSummary] = useState<{ imported: number; errors: string[] } | null>(null);
  const [importError, setImportError] = useState('');

  if (role !== 'Manager') {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
        <FileCheck className="w-9 h-9 text-slate-400 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-900">{t.importTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">{t.managerOnly}</p>
      </div>
    );
  }

  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === ',' && !quoted) {
        values.push(current.trim());
        current = '';
      } else {
        current += character;
      }
    }
    values.push(current.trim());
    return values;
  };

  const sampleTemplateCsv = `VIN,Make,Model,Trim,Year,Mileage,PurchasePrice,ShippingFees,Customs,Reconditioning,SellingPrice,DaysOnLot,Color
WBA53AY09RE918231,BMW,X5 xDrive40i,M Sport,2024,8400,68000,2100,3400,1200,81000,14,Black Sapphire
WAUZZZF28NA028192,Audi,Q8 55 TFSI,S-Line,2023,19500,59000,1900,2950,1500,71000,22,Glacier White
JTEBU5JR9P5099120,Toyota,Land Cruiser,VXR,2024,4200,89000,2400,4450,1100,102000,9,Silver Metallic`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleTemplateCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'AutoBI_Fleet_Migration_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('parsing');
    setImportError('');
    setResultSummary(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length <= 1) {
        setImportStatus('idle');
        setImportError(t.importFailed);
        return;
      }

      const headers = parseCsvLine(lines[0]).map((header) => header.trim());
      const parsed: any[] = [];

      for (let index = 1; index < lines.length; index += 1) {
        const values = parseCsvLine(lines[index]);
        const row: any = {};
        headers.forEach((header, columnIndex) => {
          row[header] = values[columnIndex] || '';
        });
        parsed.push(row);
      }

      setPreviewRows(parsed.slice(0, 500));
      setImportStatus('ready');
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleCommitImport = async () => {
    if (previewRows.length === 0) return;
    setImportStatus('submitting');
    setImportError('');

    try {
      const res = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: previewRows }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResultSummary({ imported: data.importedCount, errors: data.errors || [] });
        setImportStatus('done');
        onRefresh();
      } else {
        setImportError(t.importFailed);
        setImportStatus('ready');
      }
    } catch (err) {
      console.error(err);
      setImportError(t.importFailed);
      setImportStatus('ready');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title & Template Download Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{t.importTitle}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t.importSubtitle}</p>
          </div>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>{t.downloadTemplate}</span>
        </button>
      </div>

      {/* Upload Drop Area */}
      <div className="bg-white border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center transition-colors">
        <input
          type="file"
          id="csv-file-input"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="csv-file-input"
          className="cursor-pointer flex flex-col items-center justify-center gap-3"
        >
          <div className="p-4 rounded-full bg-slate-100 text-slate-600">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-sm font-bold text-slate-800">
            {t.dropFilesHere}
          </span>
          <span className="text-xs text-slate-400">
            {t.supportedFormat}
          </span>
        </label>
      </div>

      {importError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* Parse Preview Table */}
      {previewRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.importPreview}</h3>
              <p className="text-xs text-slate-500">
                {`${previewRows.length} ${t.importRowsReady}`}
              </p>
            </div>

            <button
              disabled={importStatus === 'submitting' || importStatus === 'done'}
              onClick={handleCommitImport}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
            >
              {importStatus === 'submitting' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.importing}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{t.confirmImport}</span>
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">VIN</th>
                  <th className="px-3 py-2.5">{t.makeAndModel}</th>
                  <th className="px-3 py-2.5">{t.year}</th>
                  <th className="px-3 py-2.5">{t.mileage}</th>
                  <th className="px-3 py-2.5">{t.purchasePrice}</th>
                  <th className="px-3 py-2.5">{t.shippingFees}</th>
                  <th className="px-3 py-2.5">{t.price}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono font-bold text-slate-900">{row.VIN || row.vin}</td>
                    <td className="px-3 py-2 text-slate-800">{row.Make || row.make} {row.Model || row.model}</td>
                    <td className="px-3 py-2 font-mono">{row.Year || row.year}</td>
                    <td className="px-3 py-2 font-mono">{row.Mileage || row.mileage} km</td>
                    <td className="px-3 py-2 font-mono">${parseFloat(row.PurchasePrice || row.purchase_price || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono">${parseFloat(row.ShippingFees || row.shipping_fees || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono font-bold text-emerald-700">${parseFloat(row.SellingPrice || row.selling_price || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Done notification */}
      {resultSummary && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3">
          <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900">
            <h4 className="font-bold text-sm">
              {t.importCompleted}
            </h4>
            <p className="mt-1">
              {lang === 'ar'
                ? `تم تثبيت ${resultSummary.imported} مركبة في قاعدة البيانات.`
                : `${resultSummary.imported} vehicles committed to the database.`}
            </p>
            {resultSummary.errors.length > 0 && (
              <div className="mt-2 text-amber-800 bg-amber-100/60 p-2 rounded">
                <strong>{t.importWarnings}:</strong>
                <ul className="list-disc pl-4 rtl:pl-0 rtl:pr-4 mt-1">
                  {resultSummary.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
