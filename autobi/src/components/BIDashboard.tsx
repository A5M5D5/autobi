import React from 'react';
import { BIMetrics, Language, UserRole } from '../types';
import { translations } from '../lib/translations';
import { branchLabel } from '../lib/branches';
import { formatExchangeRate, formatIqd, formatUsd } from '../lib/currency';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Warehouse,
  ArrowRight,
  ShieldAlert,
  MessageSquareText,
  Gauge,
  CalendarClock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface BIDashboardProps {
  metrics: BIMetrics | null;
  lang: Language;
  role: UserRole;
  selectedBranch: string;
  onNavigateToAging: () => void;
  onAskCopilot: (query: string) => void;
}

export const BIDashboard: React.FC<BIDashboardProps> = ({
  metrics,
  lang,
  role,
  selectedBranch,
  onNavigateToAging,
  onAskCopilot,
}) => {
  const t = translations[lang];

  if (role === 'Employee') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
        <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <h2 className="text-sm font-semibold text-slate-900">{t.accessDeniedTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">{t.accessDeniedText}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-sm">
        <p className="text-xs">{t.loading}</p>
      </div>
    );
  }

  const BLUE = '#2563EB';
  const SKY = '#0284C7';
  const GREEN = '#059669';
  const GREEN_LIGHT = '#10B981';
  const AMBER = '#D97706';
  const SLATE = '#64748B';

  const currency = (value: number) => formatUsd(value);
  const scopeLabel = selectedBranch === 'all' ? t.allBranches : branchLabel(selectedBranch, lang);

  const totalProfit = metrics.totalFrontEndProfit + metrics.totalBackEndProfit;
  const fniData = [
    {
      name: lang === 'ar' ? 'هامش بيع المركبات' : 'Vehicle Sales Margin',
      value: metrics.totalFrontEndProfit,
      color: BLUE,
    },
    {
      name: lang === 'ar' ? 'هامش التمويل والخدمات' : 'Finance & Services Margin',
      value: metrics.totalBackEndProfit,
      color: GREEN_LIGHT,
    },
  ];

  const pipelineStages = [
    {
      stage: lang === 'ar' ? 'استفسار أولي' : 'Initial Inquiry',
      count: metrics.pipelineCounts.Lead,
      color: SLATE,
    },
    {
      stage: lang === 'ar' ? 'تجربة قيادة' : 'Test Drive',
      count: metrics.pipelineCounts['Test Drive'],
      color: SKY,
    },
    {
      stage: lang === 'ar' ? 'تفاوض' : 'Negotiation',
      count: metrics.pipelineCounts.Negotiation,
      color: AMBER,
    },
    {
      stage: lang === 'ar' ? 'صفقة معتمدة' : 'Approved Deal',
      count: metrics.pipelineCounts.Closed,
      color: GREEN,
    },
  ];

  const maxPipeline = Math.max(1, ...pipelineStages.map((stage) => stage.count));

  const avgVariance = metrics.averageVariancePct ?? 0;
  const formattedVariance = `${avgVariance > 0 ? '+' : ''}${avgVariance}%`;

  const kpiCardClass =
    'bg-white border border-slate-200 rounded-lg p-3 shadow-sm h-full flex flex-col justify-between transition-colors hover:border-slate-300';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.biTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'ar' ? 'دورة رأس المال والهوامش وحركة المخزون.' : 'Capital velocity, margins and inventory movement.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600">
            <Warehouse className="w-3.5 h-3.5 text-blue-600" />
            <strong className="font-semibold text-slate-900">{scopeLabel}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-mono">
            {formatExchangeRate()}
          </span>
          {metrics.generatedAt && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-500">
              <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">
                {new Date(metrics.generatedAt).toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-GB')}
              </span>
            </span>
          )}
        </div>
      </div>

      {metrics.agingAlertsCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">{t.agingAlertBannerTitle}</h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {t.agingAlertBannerText.replace('{count}', metrics.agingAlertsCount.toString())}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              onClick={() =>
                onAskCopilot(
                  lang === 'ar'
                    ? t.q1
                    : 'Which vehicles have been on lot for 45 days or more?'
                )
              }
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <MessageSquareText className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.askAssistantShort}</span>
            </button>
            <button
              onClick={onNavigateToAging}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <span>{t.takeAction}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <div className={kpiCardClass}>
          <div className="flex items-center justify-between text-[10px] text-slate-500 gap-1">
            <span className="truncate">{t.kpiTotalCapital}</span>
            <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 leading-tight">
              {currency(metrics.totalCapitalLocked)}
            </div>
            <div className="text-[10px] font-medium text-slate-500 truncate">
              {formatIqd(metrics.totalCapitalLocked)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            <span className="font-semibold text-slate-600">{metrics.availableCount}</span>{' '}
            {lang === 'ar' ? 'مركبة متاحة' : 'available vehicles'}
          </div>
        </div>

        <div className={kpiCardClass}>
          <div className="flex items-center justify-between text-[10px] text-slate-500 gap-1">
            <span className="truncate">{t.kpiStagnantCapital}</span>
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg font-bold font-mono tabular-nums text-amber-700 leading-tight">
              {currency(metrics.stagnantCapital)}
            </div>
            <div className="text-[10px] font-medium text-amber-700/80 truncate">
              {formatIqd(metrics.stagnantCapital)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            <span className="font-semibold text-amber-700 font-mono">{metrics.stagnantCapitalRatio}%</span>{' '}
            {t.kpiStagnantRatio}
          </div>
        </div>

        <div className={kpiCardClass}>
          <div className="flex items-center justify-between text-[10px] text-slate-500 gap-1">
            <span className="truncate">{t.kpiDailyHoldingCost}</span>
            <TrendingUp className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 leading-tight">
              {currency(metrics.totalDailyHoldingCost)}
            </div>
            <div className="text-[10px] font-medium text-slate-500 truncate">
              {formatIqd(metrics.totalDailyHoldingCost)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {lang === 'ar' ? 'تكلفة الأسطول اليومية' : 'daily fleet cost'}
          </div>
        </div>

        <div className={kpiCardClass}>
          <div className="flex items-center justify-between text-[10px] text-slate-500 gap-1">
            <span className="truncate">{t.kpiFrontEndProfit}</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg font-bold font-mono tabular-nums text-[#059669] leading-tight">
              {currency(totalProfit)}
            </div>
            <div className="text-[10px] font-medium text-emerald-700/80 truncate">
              {formatIqd(totalProfit)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            <span className="font-semibold text-[#059669] font-mono">{metrics.fniRatioPct}%</span>{' '}
            {t.contributionRatio}
          </div>
        </div>

        <div className={kpiCardClass}>
          <div className="flex items-center justify-between text-[10px] text-slate-500 gap-1">
            <span className="truncate">{t.kpiAverageDays}</span>
            <Gauge className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1.5 leading-tight">
            {metrics.averageDaysOnLot ?? 0}
            <span className="text-[11px] font-sans font-medium text-slate-400 ms-1">
              {lang === 'ar' ? 'يوم' : 'days'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {lang === 'ar' ? 'للمركبات المتاحة' : 'available vehicles'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t.chartPriceElasticity}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {lang === 'ar'
                  ? 'متوسط أيام البقاء في المعرض بحسب نطاق نسبة الخصم المطبقة'
                  : 'Average days on lot by applied discount band'}
              </p>
            </div>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
              {lang === 'ar' ? 'تحليل تشغيلي' : 'Operational Analysis'}
            </span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.elasticityBrackets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0)} ${lang === 'ar' ? 'يوم' : 'days'}`,
                    lang === 'ar' ? 'متوسط الأيام' : 'Average days',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#0F172A',
                  }}
                />
                <Bar dataKey="avgDays" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t.chartValuationVariance}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {lang === 'ar'
                  ? 'مقارنة التثمين التقديري بتكلفة الاستحواذ الفعلية'
                  : 'Estimated appraisal value compared with actual acquisition cost'}
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
              {t.averageVariance}: {formattedVariance}
            </span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.valuationVariance} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="model" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value) => [
                    `${currency(Number(value ?? 0))} · ${formatIqd(Number(value ?? 0))}`,
                    '',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#0F172A',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar
                  dataKey="estimatedIntake"
                  fill="#CBD5E1"
                  name={lang === 'ar' ? 'التثمين التقديري' : 'Estimated Appraisal'}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actualIntake"
                  fill={GREEN}
                  name={lang === 'ar' ? 'تكلفة الاستحواذ' : 'Acquisition Cost'}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">{t.chartAcquisitionChannels}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'ar'
                ? 'معدل التحويل من استفسار إلى صفقة معتمدة لكل قناة استقطاب'
                : 'Inquiry-to-approved-deal conversion by acquisition channel'}
            </p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.channelPerformance} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="channel" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#0F172A',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar
                  dataKey="leads"
                  fill={SKY}
                  name={lang === 'ar' ? 'إجمالي الاستفسارات' : 'Total Inquiries'}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="closed"
                  fill={GREEN}
                  name={lang === 'ar' ? 'صفقات معتمدة' : 'Approved Deals'}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-slate-900">{t.chartFniBreakdown}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'ar'
                ? 'توزيع هامش الربح بين بيع المركبات والخدمات المالية'
                : 'Margin composition between vehicle sales and finance services'}
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[180px]">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={fniData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {fniData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `${currency(Number(value ?? 0))} · ${formatIqd(Number(value ?? 0))}`,
                    '',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#0F172A',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">{t.pipelineFunnel}</h3>
        <p className="text-[11px] text-slate-500 mb-3">{t.pipelineFunnelDesc}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {pipelineStages.map((item) => (
            <div key={item.stage} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">{item.stage}</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {item.count}{' '}
                <span className="text-[10px] font-sans font-normal text-slate-400">
                  {t.dealCount}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: item.color,
                    width: `${Math.max(8, (item.count / maxPipeline) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
