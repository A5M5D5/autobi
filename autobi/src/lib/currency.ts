import type { Language } from '../types';

export const USD_TO_IQD = 1530;

export function formatUsd(amount: number): string {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `$${value.toLocaleString('en-US')}`;
}

export function formatIqd(amountInUsd: number): string {
  const iqd = (Number.isFinite(amountInUsd) ? amountInUsd : 0) * USD_TO_IQD;
  if (Math.abs(iqd) >= 1_000_000) {
    return `${(iqd / 1_000_000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    })} مليون د.ع`;
  }
  if (Math.abs(iqd) >= 1_000) {
    return `${(iqd / 1_000).toLocaleString('en-US', {
      maximumFractionDigits: 0,
    })} ألف د.ع`;
  }
  return `${Math.round(iqd).toLocaleString('en-US')} د.ع`;
}

export function formatDualCurrency(amountInUsd: number, lang: Language = 'ar'): string {
  const iqd = formatIqd(amountInUsd);
  return lang === 'ar'
    ? `${formatUsd(amountInUsd)} · ${iqd}`
    : `${formatUsd(amountInUsd)} · ${iqd}`;
}

export function formatExchangeRate(): string {
  return `1 USD = ${USD_TO_IQD.toLocaleString('en-US')} IQD`;
}
