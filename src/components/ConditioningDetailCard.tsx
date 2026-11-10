import React, { useState } from 'react';
import {
  Moon,
  Dumbbell,
  Brain,
  Bone,
  Apple,
  Activity,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
  Radio,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Info,
} from 'lucide-react';
import { DailyHealthRecord } from '../types';
import { useI18n } from '../i18n/I18nProvider';
import { statusI18nKey, statusLabel } from '../i18n/index';
import {
  ConditioningCategory,
  CONDITIONING_DETAILS,
  ConditioningDetail,
} from '../data/conditioningData';

interface ConditioningDetailCardProps {
  currentRecord: DailyHealthRecord;
  initialCategory?: ConditioningCategory | null;
  onAskAi?: (prompt: string) => void;
}

export const ConditioningDetailCard: React.FC<ConditioningDetailCardProps> = ({
  currentRecord,
  initialCategory,
  onAskAi,
}) => {
  const { t, lang } = useI18n();
  // Currently active selected conditioning category for detailed inspection below
  const [selectedCategory, setSelectedCategory] = useState<ConditioningCategory | null>(
    initialCategory !== undefined ? initialCategory : 'sleep'
  );

  React.useEffect(() => {
    if (initialCategory !== undefined) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const activeDetail: ConditioningDetail | null = selectedCategory
    ? CONDITIONING_DETAILS[selectedCategory]
    : null;

  const handleSelect = (category: ConditioningCategory) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  const getCategoryIcon = (category: ConditioningCategory) => {
    switch (category) {
      case 'sleep':
        return <Moon className="w-4 h-4 text-indigo-500" />;
      case 'exercise':
        return <Dumbbell className="w-4 h-4 text-emerald-600" />;
      case 'mental':
        return <Brain className="w-4 h-4 text-purple-600" />;
      case 'musculoskeletal':
        return <Bone className="w-4 h-4 text-amber-600" />;
      case 'nutrition':
        return <Apple className="w-4 h-4 text-rose-500" />;
    }
  };

  const getCategoryCurrentValue = (category: ConditioningCategory) => {
    switch (category) {
      case 'sleep':
        return `${currentRecord.avgSleepMinutes} min (~${(currentRecord.avgSleepMinutes / 60).toFixed(1)}h)`;
      case 'exercise':
        return `${currentRecord.avgExerciseMinutes} min`;
      case 'mental':
        return currentRecord.mentalStatus;
      case 'musculoskeletal':
        return currentRecord.musculoskeletalStatus;
      case 'nutrition':
        return currentRecord.nutritionStatus;
    }
  };

  const categories: { id: ConditioningCategory; label: string; systemTag: string }[] = [
    { id: 'sleep', label: t('cond.sleep'), systemTag: t('cond.sleepTag') },
    { id: 'exercise', label: t('cond.exercise'), systemTag: t('cond.exTag') },
    { id: 'mental', label: t('cond.mental'), systemTag: t('cond.mentalTag') },
    { id: 'musculoskeletal', label: t('cond.msk'), systemTag: t('cond.mskTag') },
    { id: 'nutrition', label: t('cond.nutrition'), systemTag: t('cond.nutTag') },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
      {/* Header with Title and Hint */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('cond.title')}
            </h3>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
            {t('cond.hint')}
          </p>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 bg-sky-50 text-sky-700 font-semibold rounded border border-sky-200">
          {t('cond.systems')}
        </span>
      </div>

      {/* 5 Conditioning Clickable Items Grid / List */}
      <div className="space-y-2">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const val = getCategoryCurrentValue(cat.id);

          return (
            <div
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-sky-50/90 border-sky-400 ring-1 ring-sky-300 shadow-2xs'
                  : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white shadow-2xs' : 'bg-white/80'
                    }`}
                  >
                    {getCategoryIcon(cat.id)}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                      <span>{cat.label}</span>
                      <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
                        [{cat.systemTag}]
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Click to view past telemetry & sensor origin
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold font-mono text-slate-900 text-xs tabular-nums bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {val}
                  </span>
                  <div className={`text-slate-400 transition-transform ${isSelected ? 'rotate-180 text-sky-600' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* DETAILS OF PAST DATA & CONNECTED SYSTEMS BELOW           */}
      {/* ======================================================== */}
      {activeDetail && (
        <div className="pt-2 animate-in fade-in duration-200">
          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
            {/* System Source Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 font-mono">
                      {activeDetail.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {activeDetail.statusBadge}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-sky-800 mt-0.5">
                    Source: <strong className="text-slate-900">{activeDetail.hardwareSource}</strong>
                  </p>
                </div>
              </div>

              {onAskAi && (
                <button
                  onClick={() =>
                    onAskAi(
                      `AURA, please analyze my past conditioning records for ${activeDetail.shortLabel}. Telemetry source: ${activeDetail.hardwareSource}. Current value is ${getCategoryCurrentValue(activeDetail.id)}. What adjustments do you recommend?`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-2xs transition-all active:scale-98 cursor-pointer shrink-0"
                  title="Ask AURA Flight Surgeon about this conditioning data"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                  <span>Ask AI About {activeDetail.shortLabel}</span>
                </button>
              )}
            </div>

            {/* Context Narrative on How Data is Monitored */}
            <div className="text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed font-sans">
              <span className="font-bold text-slate-800">Operational Telemetry Pipeline: </span>
              {activeDetail.sourceDescription}
            </div>

            {/* Past 5-Day Historical Data Table & Trend */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                    Past 5-Day Telemetry Logs
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Daily Chronological History
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Recorded Value</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 hidden sm:table-cell">Station Log Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {activeDetail.pastDaysData.map((day, idx) => (
                      <tr
                        key={day.date}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          idx === 0 ? 'bg-sky-50/40 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-800 tabular-nums">
                          {day.displayDate}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 tabular-nums">
                          {day.formattedValue}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              statusI18nKey(day.status) === 'status.normal'
                                ? 'bg-emerald-100 text-emerald-800'
                                : statusI18nKey(day.status) === 'status.caution'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {statusLabel(lang, day.status)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 hidden sm:table-cell font-sans text-xs">
                          {day.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hardware Sensor Arrays & Detailed Physiological Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              {/* Connected Sensors Grid */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block border-b border-slate-100 pb-1">
                  Connected Station Sensors
                </span>
                <div className="space-y-1.5 text-[11px]">
                  {activeDetail.hardwareSensors.map((sensor) => (
                    <div key={sensor.label} className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 truncate mr-2">{sensor.label}:</span>
                      <span className="font-semibold text-slate-900 shrink-0">{sensor.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-Metric Parameters */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block border-b border-slate-100 pb-1">
                  {activeDetail.detailedBreakdown.category}
                </span>
                <div className="space-y-1.5 text-[11px]">
                  {activeDetail.detailedBreakdown.items.map((item) => (
                    <div key={item.name} className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 truncate mr-2">{item.name}:</span>
                      <span className="font-semibold text-slate-900 shrink-0">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Flight Surgeon AI Diagnostic Advice Note */}
            <div className="flex items-start gap-2.5 p-3 bg-sky-100/70 border border-sky-200 rounded-xl text-sky-950 text-xs">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">AURA Diagnostic Advisory: </strong>
                <span>{activeDetail.aiInsight}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
