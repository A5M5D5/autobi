import type { Language } from '../types';

export interface BranchReference {
  id: string;
  ar: string;
  en: string;
  location: string;
}

export const BRANCHES: BranchReference[] = [
  {
    id: 'b-1',
    ar: 'المعرض الرئيسي - الجادرية / الكرادة',
    en: 'Main Showroom - Jadriya / Karrada',
    location: 'الجادرية / الكرادة - بغداد',
  },
  {
    id: 'b-2',
    ar: 'ساحة مبيعات البياع',
    en: 'Al-Bayaa Sales Lot',
    location: 'البياع - بغداد',
  },
  {
    id: 'b-3',
    ar: 'مركز الفحص والجمارك - الشعلة / أبو غريب',
    en: 'Inspection & Customs Center - Shula / Abu Ghraib',
    location: 'الشعلة / أبو غريب - بغداد',
  },
];

export function branchLabel(id: string, lang: Language): string {
  const branch = BRANCHES.find((item) => item.id === id);
  if (!branch) return id;
  return lang === 'ar' ? branch.ar : branch.en;
}
