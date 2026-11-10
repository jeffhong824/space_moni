import React, { useState } from 'react';
import {
  Heart,
  Activity,
  Moon,
  Dumbbell,
  Brain,
  Bone,
  Apple,
  Mic,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  TrendingUp,
  Radio,
  Clock,
  ShieldAlert,
  Lock,
  Shield,
  ShieldX,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { DailyHealthRecord, DailyActivityItem, UserRole, AstronautProfile } from '../types';
import { ConditioningDetailCard } from './ConditioningDetailCard';
import { ConditioningCategory } from '../data/conditioningData';
import {
  BAND_NUMBERS,
  interpretHourlyPoint,
  interpretRecord,
  THRESHOLDS,
  hourlyAbnormal,
} from '../domain/healthThresholds';
import { useI18n } from '../i18n/I18nProvider';
import { localizeKey, statusLabel } from '../i18n/index';

interface DailyRecordsPanelProps {
  records: DailyHealthRecord[];
  onToggleActivity: (date: string, activityId: string) => void;
  onOpenAddActivity: (date: string) => void;
  onOpenAiCall: (initialPrompt?: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  currentUserRole: UserRole;
  currentAstronaut: AstronautProfile;
  isRightPanelCollapsed?: boolean;
  onToggleRightPanel?: () => void;
}

export const DailyRecordsPanel: React.FC<DailyRecordsPanelProps> = ({
  records,
  onToggleActivity,
  onOpenAddActivity,
  onOpenAiCall,
  selectedDate,
  onSelectDate,
  currentUserRole,
  currentAstronaut,
  isRightPanelCollapsed = false,
  onToggleRightPanel,
}) => {
  const { t, lang } = useI18n();
  // If focusedDate is set, other days are hidden and only this day's full 24-hour detail is displayed
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const [showCommanderModal, setShowCommanderModal] = useState<boolean>(false);

  const isCommander = currentUserRole === 'Commander';
  const isNASA = currentUserRole === 'NASA';

  // Expanded cards in multi-day list view
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({
    '2026/11/22': true,
  });

  // Active conditioning inspected in multi-day list view
  const [multiDayConditioning, setMultiDayConditioning] = useState<{
    date: string;
    category: ConditioningCategory;
  } | null>(null);

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const currentRecord = records.find((r) => r.date === focusedDate);

  // Helper to trigger AI with pre-filled question based on abnormal metrics of that day
  const handleDirectAskAi = (record: DailyHealthRecord) => {
    const abnormalHours = record.hourlyTimeline?.filter((p) => hourlyAbnormal(p)) || [];
    const prompt = t('records.askPrompt', {
      date: record.date,
      hr: record.restingHR,
      hrv: record.hrv,
      n: abnormalHours.length,
    });
    onOpenAiCall(prompt);
  };

  // ==========================================
  // SINGLE DAY FOCUSED DETAIL VIEW
  // ==========================================
  if (focusedDate && currentRecord) {
    const abnormalPoints = currentRecord.hourlyTimeline.filter((p) => p.isAbnormal || hourlyAbnormal(p));
    const interp = interpretRecord(currentRecord);
    const hrStatus = interp.metrics.find((m) => m.id === 'restingHR')?.status ?? 'Normal';
    const hrvStatus = interp.metrics.find((m) => m.id === 'hrv')?.status ?? 'Normal';
    const hasCriticalVitals = interp.overall === 'Critical';
    const currentIndex = records.findIndex((r) => r.date === focusedDate);
    const prevRecord = records[currentIndex + 1]; // Older date
    const nextRecord = records[currentIndex - 1]; // Newer date

    return (
      <section className="flex-1 flex flex-col h-full bg-slate-50/70 overflow-hidden relative">
        {/* Top Control Bar with Back button and Quick Direct-Ask AI */}
        <div className="p-4 lg:px-6 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFocusedDate(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>{t('records.backDates')}</span>
            </button>

            <div className="h-5 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-mono text-slate-900">
                {currentRecord.date}
              </span>
              {currentRecord.isToday && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-sky-100 text-sky-800 rounded-md border border-sky-200 font-mono">
                  {t('records.today')}
                </span>
              )}
              {hrStatus !== 'Normal' && (
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-700 rounded-md border border-rose-300 font-mono flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  {statusLabel(lang, hrStatus)} · {THRESHOLDS.restingHR.labelZh}
                </span>
              )}
            </div>
          </div>

          {/* Quick Direct-Ask AI Shortcut Button & Date Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Quick Direct-Ask AI for health suggestions */}
            <button
              onClick={() => handleDirectAskAi(currentRecord)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all active:scale-98 cursor-pointer"
              title="Direct-Ask AI for Health Suggestions on this day's abnormal telemetry"
            >
              <Sparkles className="w-4 h-4 text-sky-200 animate-spin" />
              <span>{t('records.askAi')}</span>
              <Mic className="w-3.5 h-3.5 text-white/90" />
            </button>

            {/* Stepper to adjacent days */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <button
                disabled={!prevRecord}
                onClick={() => prevRecord && setFocusedDate(prevRecord.date)}
                className="p-1.5 hover:bg-white text-slate-600 disabled:opacity-30 transition-colors cursor-pointer"
                title="View previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={!nextRecord}
                onClick={() => nextRecord && setFocusedDate(nextRecord.date)}
                className="p-1.5 hover:bg-white text-slate-600 disabled:opacity-30 transition-colors border-l border-slate-200 cursor-pointer"
                title="View next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle Right Station Objectives Panel */}
            {onToggleRightPanel && (
              <button
                onClick={onToggleRightPanel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                title={isRightPanelCollapsed ? "Show Space Station Objectives panel" : "Hide right panel for maximum viewing of 24h health diagrams"}
              >
                {isRightPanelCollapsed ? (
                  <>
                    <PanelRightOpen className="w-3.5 h-3.5 text-sky-600" />
                    <span>{t('records.showTasks')}</span>
                  </>
                ) : (
                  <>
                    <PanelRightClose className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">{t('records.expandView')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Detailed Dashboard */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 pb-28">
          {/* 1. Red Alert Banner for Abnormal Biometrics (If Present) */}
          {hasCriticalVitals && (
            <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 sm:p-5 text-rose-950 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldAlert className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-rose-900 tracking-tight">
                      {t('records.alert', { reason: interp.reasonZh })}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-200 text-rose-900">
                      {interp.overallZh}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    {t('records.hrHrvLine', {
                      hr: currentRecord.restingHR,
                      hrStatus: statusLabel(lang, hrStatus),
                      hrv: currentRecord.hrv,
                      hrvStatus: statusLabel(lang, hrvStatus),
                    })}
                  </p>
                </div>
              </div>

              {/* Direct ask shortcut inside alert banner */}
              <button
                onClick={() => handleDirectAskAi(currentRecord)}
                className="shrink-0 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{t('records.askSurgeon')}</span>
              </button>
            </div>
          )}

          {/* 2. Primary 24-Hour Metric Cards Grid (Red-Highlighting Abnormal Parts) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Resting HR (RED-HIGHLIGHTED IF >100) */}
            <div
              className={`rounded-2xl p-4 border transition-all ${
                hrStatus !== 'Normal'
                  ? 'bg-rose-50/90 border-2 border-rose-500 text-rose-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={hrStatus !== 'Normal' ? 'text-rose-700 font-bold' : 'text-slate-500'}>
                  {t('records.hr')}
                </span>
                <Heart className={`w-4 h-4 ${hrStatus !== 'Normal' ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-3xl font-extrabold font-mono tabular-nums ${hrStatus !== 'Normal' ? 'text-rose-700' : 'text-slate-900'}`}>
                  {currentRecord.restingHR}
                </span>
                <span className="text-xs font-mono font-medium text-slate-500">bpm</span>
              </div>
              <div className="mt-2 pt-2 border-t border-current/15 flex items-center justify-between text-[11px] font-mono">
                <span className={hrStatus !== 'Normal' ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                  {statusLabel(lang, hrStatus)}
                </span>
                <span className="text-slate-400">{THRESHOLDS.restingHR.normal}</span>
              </div>
            </div>

            {/* HRV (RED-HIGHLIGHTED IF <20) */}
            <div
              className={`rounded-2xl p-4 border transition-all ${
                hrvStatus !== 'Normal'
                  ? 'bg-rose-50/90 border-2 border-rose-500 text-rose-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={hrvStatus !== 'Normal' ? 'text-rose-700 font-bold' : 'text-slate-500'}>
                  {t('records.hrvLabel')}
                </span>
                <Activity className={`w-4 h-4 ${hrvStatus !== 'Normal' ? 'text-rose-600' : 'text-slate-400'}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-3xl font-extrabold font-mono tabular-nums ${hrvStatus !== 'Normal' ? 'text-rose-700' : 'text-slate-900'}`}>
                  {currentRecord.hrv}
                </span>
                <span className="text-xs font-mono font-medium text-slate-500">ms</span>
              </div>
              <div className="mt-2 pt-2 border-t border-current/15 flex items-center justify-between text-[11px] font-mono">
                <span className={hrvStatus !== 'Normal' ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                  {statusLabel(lang, hrvStatus)}
                </span>
                <span className="text-slate-400">{THRESHOLDS.hrv.normal}</span>
              </div>
            </div>

            {/* VO2 Max */}
            <div className="rounded-2xl p-4 border bg-white border-slate-200 text-slate-800">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>VO₂ max</span>
                <TrendingUp className="w-4 h-4 text-sky-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                  {currentRecord.vo2Max.toFixed(1)}
                </span>
                <span className="text-xs font-mono font-medium text-slate-500">mL/kg/min</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="text-emerald-600 font-medium">● {t('records.aerobic')}</span>
                <span className="text-slate-400">Ref: 20.5</span>
              </div>
            </div>

            {/* SpO2 */}
            <div className="rounded-2xl p-4 border bg-white border-slate-200 text-slate-800">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>{t('records.spo2')}</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                  {currentRecord.spo2}
                </span>
                <span className="text-xs font-mono font-medium text-slate-500">%</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="text-emerald-600 font-medium">● {t('records.spo2Stable')}</span>
                <span className="text-slate-400">Min: 94%</span>
              </div>
            </div>
          </div>

          {/* 3. 24-HOUR CONTINUOUS DIAGRAMS (RED-HIGHLIGHTED ABNORMAL AREAS) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>{t('records.chartTitle')}</span>
                  <span className="text-xs font-mono text-slate-400 font-normal">
                    {t('records.streamNote')}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {t('records.chartHint', { bpm: BAND_NUMBERS.restingHR.criticalHigh })}
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-600 inline-block"></span>
                  <span className="font-semibold text-rose-700">{t('records.critBand', { bpm: BAND_NUMBERS.restingHR.criticalHigh })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-sky-400 inline-block"></span>
                  <span className="text-slate-600">{t('records.okBand', { bpm: BAND_NUMBERS.restingHR.criticalHigh })}</span>
                </div>
              </div>
            </div>

            {/* Continuous 24-Hour Heart Rate Waveform Diagram */}
            <div className="space-y-2">
              <div className="relative h-48 w-full bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 flex flex-col justify-between overflow-hidden">
                {/* Horizontal reference line for 100 bpm threshold (RED DASHED LINE) */}
                <div
                  className="absolute left-0 right-0 border-b-2 border-dashed border-rose-400 z-10 pointer-events-none flex items-center justify-end pr-3"
                  style={{ top: '35%' }}
                >
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shadow-2xs">
                    {t('records.critCap', { bpm: BAND_NUMBERS.restingHR.criticalHigh })}
                  </span>
                </div>

                {/* Normal baseline reference line at 60 bpm */}
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-slate-300 z-10 pointer-events-none flex items-center justify-end pr-3"
                  style={{ top: '80%' }}
                >
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-mono px-1.5 py-0.5 rounded">
                    {t('records.baseline')}
                  </span>
                </div>

                {/* 24-hr Bar and Wave visualization */}
                <div className="flex-1 flex items-end gap-2 justify-between z-20 pt-6">
                  {currentRecord.hourlyTimeline.map((pt) => {
                    const heightPct = Math.min(100, Math.max(15, ((pt.hr - 50) / 80) * 100));
                    const spike = hourlyAbnormal(pt);

                    return (
                      <div
                        key={pt.hour}
                        className="flex-1 flex flex-col items-center gap-1.5 group relative cursor-pointer h-full justify-end"
                      >
                        {/* Hover detailed tooltip */}
                        <div className="absolute -top-12 z-30 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[11px] font-mono py-1.5 px-2.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap">
                          <span className="font-bold text-sky-300">{pt.hour} UTC: {pt.hr} bpm</span>
                          <span className="text-[10px] text-slate-300">SpO2: {pt.spo2}% · HRV: {pt.hrv || 20}ms</span>
                          <span className="text-[9px] text-slate-400 mt-0.5 max-w-[140px] truncate">{pt.activityNote}</span>
                        </div>

                        {/* Top tag for abnormal points */}
                        {spike && (
                          <span className="text-[9px] font-mono font-bold text-rose-700 bg-rose-100 px-1 rounded animate-pulse">
                            {pt.hr}
                          </span>
                        )}

                        {/* The Bar: Red-highlighted if abnormal! */}
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            spike
                              ? 'bg-rose-600 ring-2 ring-rose-400 shadow-md shadow-rose-200 animate-pulse'
                              : 'bg-sky-400 hover:bg-sky-500'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />

                        {/* Time label */}
                        <span className={`text-[10px] font-mono ${spike ? 'font-bold text-rose-700' : 'text-slate-500'}`}>
                          {pt.hour.slice(0, 2)}h
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Complete 24-Hour Telemetry Chrono-Table (RED-HIGHLIGHTED ABNORMAL ROWS) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Full 24-Hour Chronological Data Log
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  12 telemetry checkpoint frames
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100/90 text-slate-600 border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">TIME (UTC)</th>
                      <th className="py-2.5 px-3 font-semibold">HEART RATE</th>
                      <th className="py-2.5 px-3 font-semibold">SPO2</th>
                      <th className="py-2.5 px-3 font-semibold">HRV</th>
                      <th className="py-2.5 px-3 font-semibold">STATION ACTIVITY / EVENT</th>
                      <th className="py-2.5 px-3 font-semibold">PHYSIOLOGICAL STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentRecord.hourlyTimeline.map((pt) => {
                      const spike = hourlyAbnormal(pt);
                      return (
                        <tr
                          key={pt.hour}
                          className={`transition-colors ${
                            spike
                              ? 'bg-rose-50/90 text-rose-950 font-medium border-l-4 border-l-rose-600'
                              : 'bg-white hover:bg-slate-50/80 text-slate-700'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold">{pt.hour}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`tabular-nums px-1.5 py-0.5 rounded ${
                                spike ? 'bg-rose-200 text-rose-900 font-bold' : 'text-slate-900'
                              }`}
                            >
                              {pt.hr} bpm
                            </span>
                          </td>
                          <td className="py-2.5 px-3 tabular-nums">{pt.spo2}%</td>
                          <td className="py-2.5 px-3 tabular-nums">{pt.hrv || 22} ms</td>
                          <td className="py-2.5 px-3 font-sans text-xs">{pt.activityNote}</td>
                          <td className="py-2.5 px-3">
                            {spike ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                                <AlertTriangle className="w-3 h-3" />
                                {statusLabel(lang, interpretHourlyPoint(pt))}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {t('records.normal')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 5. Activities List (2nd) & Daily Conditioning with Details (3rd) */}
          <div className="space-y-6">
            {/* 2nd: Daily Experiment & Activity Checklist */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    2. Daily Experiment & Activity Checklist
                  </h3>
                </div>
                <button
                  onClick={() => onOpenAddActivity(currentRecord.date)}
                  className="text-xs text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('records.addActivity')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {currentRecord.dailyActivities.map((act, index) => (
                  <div
                    key={act.id}
                    onClick={() => onToggleActivity(currentRecord.date, act.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-all border ${
                      act.completed
                        ? 'bg-slate-50/80 border-slate-200 text-slate-500'
                        : 'bg-white border-slate-200 text-slate-900 font-medium hover:border-sky-300 hover:shadow-2xs'
                    }`}
                  >
                    <span className="text-xs font-mono text-slate-400 mt-0.5">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs ${act.completed ? 'line-through text-slate-400' : 'text-slate-900 font-semibold'}`}>
                        {act.title}
                      </div>
                      {act.timeSlot && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {act.timeSlot}
                        </div>
                      )}
                    </div>
                    {act.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5 hover:text-sky-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3rd: Daily Conditioning Overview with Clickable Past Data Inspection */}
            <div>
              <ConditioningDetailCard
                currentRecord={currentRecord}
                onAskAi={(prompt) => onOpenAiCall(prompt)}
              />
            </div>
          </div>
        </div>

        {/* Floating Call with AI at bottom */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => handleDirectAskAi(currentRecord)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all border border-sky-300 active:scale-97 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-wide">{t('records.askAiDate', { date: currentRecord.date })}</span>
            <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
          </button>
        </div>
      </section>
    );
  }

  // ==========================================
  // MULTI-DAY STACK VIEW (DEFAULT LIST)
  // ==========================================
  return (
    <section id="main-records" className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden relative">
      {/* Scrollable container for the stack of daily cards */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 pb-24">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {t('records.header')}
              </h1>
              {isNASA && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {t('records.nasaUnlocked')}
                </span>
              )}
              {isCommander && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-700" />
                  {t('records.cmdLog')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {t('records.subject', { name: currentAstronaut.name, role: localizeKey(lang, currentAstronaut.role), module: localizeKey(lang, currentAstronaut.stationModule) })}
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500 flex items-center gap-3">
            <div className="items-center gap-1.5 hidden sm:flex">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{t('records.simStream')}</span>
            </div>

            {onToggleRightPanel && (
              <button
                onClick={onToggleRightPanel}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isRightPanelCollapsed
                    ? 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-300 shadow-2xs font-semibold'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200 shadow-2xs'
                }`}
                title={isRightPanelCollapsed ? "Show Space Station Objectives panel" : "Hide right panel for maximum viewing of health & activities"}
              >
                {isRightPanelCollapsed ? (
                  <>
                    <PanelRightOpen className="w-3.5 h-3.5 text-sky-600" />
                    <span>{t('records.showTasks')}</span>
                  </>
                ) : (
                  <>
                    <PanelRightClose className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">{t('records.expandView')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stack of Daily Records matching the wireframe */}
        {records.map((record) => {
          const isExpanded = expandedDates[record.date] ?? false;
          const isToday = record.date === '2026/11/22';
          const dayInterp = interpretRecord(record);
          const dayHr = dayInterp.metrics.find((m) => m.id === 'restingHR')?.status ?? 'Normal';
          const dayHrv = dayInterp.metrics.find((m) => m.id === 'hrv')?.status ?? 'Normal';
          const hasCriticalVitals = dayInterp.overall === 'Critical';

          return (
            <div
              key={record.date}
              className={`rounded-2xl border transition-all duration-200 shadow-2xs overflow-hidden ${
                isToday
                  ? 'bg-[#f4d4fa]/50 hover:bg-[#f4d4fa]/70 border-[#e5a8f0]'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
              }`}
            >
              {/* Card Header: Date & Detail triggers */}
              <div
                onClick={() => {
                  toggleExpand(record.date);
                  onSelectDate(record.date);
                }}
                className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none border-b border-slate-200/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold font-mono text-slate-900">
                    {record.date}
                  </span>
                  {isToday && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-sky-100 text-sky-800 rounded-md border border-sky-200">
                      {t('records.today')}
                    </span>
                  )}
                  {dayHr !== 'Normal' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-rose-100 text-rose-800 rounded-md border border-rose-300">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      {statusLabel(lang, dayHr)}（{record.restingHR} bpm）
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                  <span className={dayHr !== 'Normal' ? 'text-rose-700 font-bold' : ''}>
                    {t('records.hrToday', { hr: record.restingHR })}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>SpO2: {record.spo2}%</span>

                  {/* Primary Daily Detail Below Button (Role restricted: only for NASA not Commander) */}
                  {isCommander ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCommanderModal(true);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer ml-1"
                      title="24-hour details are restricted to NASA"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('records.nasaOnly')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusedDate(record.date);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold shadow-2xs transition-all active:scale-98 cursor-pointer ml-1"
                      title="Hide other days and inspect full 24h diagrams and abnormal telemetry"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>{t('records.detail24')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCommander) {
                        setShowCommanderModal(true);
                      } else {
                        setFocusedDate(record.date);
                      }
                    }}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
                    title="View full day detail"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Content: Wireframe 3-column layout */}
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1: Daily Health Situation */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300/60 pb-1.5 flex items-center justify-between">
                      <span>{t('records.todayHealth')}</span>
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                    </h3>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/40">
                        <span className="text-slate-600">{t('records.hr')}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold tabular-nums text-sm ${
                              dayHr !== 'Normal' ? 'text-rose-700 bg-rose-100 px-1 rounded font-bold' : 'text-slate-900'
                            }`}
                          >
                            {record.restingHR} bpm
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-200/40">
                        <span className="text-slate-600">HRV:</span>
                        <span
                          className={`font-semibold tabular-nums ${
                            dayHrv !== 'Normal' ? 'text-rose-700 font-bold bg-rose-50 px-1 rounded' : 'text-slate-900'
                          }`}
                        >
                          {record.hrv} ms
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-200/40">
                        <span className="text-slate-600">VO2 Max:</span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {record.vo2Max.toFixed(1)} mL/kg/min
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-200/40">
                        <span className="text-slate-600">SpO2:</span>
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {record.spo2} %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Daily Activity (Activities list at the 2nd) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-300/60 pb-1.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {t('records.activities')}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddActivity(record.date);
                        }}
                        className="text-[11px] font-medium text-sky-700 hover:text-sky-900 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-sky-50 transition-colors"
                        title="Add activity"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t('records.add')}</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {record.dailyActivities.map((act, index) => (
                        <div
                          key={act.id}
                          onClick={() => onToggleActivity(record.date, act.id)}
                          className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                            act.completed
                              ? 'bg-white/80 border border-slate-200/60 text-slate-600'
                              : 'bg-white border border-slate-200 text-slate-900 font-medium'
                          }`}
                        >
                          <span className="text-xs font-mono text-slate-400 mt-0.5">
                            {index + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs ${act.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {act.title}
                            </div>
                            {act.timeSlot && (
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                {act.timeSlot}
                              </div>
                            )}
                          </div>
                          {act.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5 hover:text-sky-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Averages & Systemic Conditioning (Daily conditioning at the 3rd) */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300/60 pb-1.5 flex items-center justify-between">
                      <span>{t('records.averages')}</span>
                      <Activity className="w-3.5 h-3.5 text-sky-600" />
                    </h3>

                    <div className="space-y-1.5 text-xs font-mono">
                      {/* Sleep (Hibernation Pod) */}
                      <button
                        onClick={() =>
                          setMultiDayConditioning((prev) =>
                            prev?.date === record.date && prev?.category === 'sleep'
                              ? null
                              : { date: record.date, category: 'sleep' }
                          )
                        }
                        className={`w-full flex justify-between items-center px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                          multiDayConditioning?.date === record.date && multiDayConditioning?.category === 'sleep'
                            ? 'bg-indigo-50/90 border-indigo-300 text-indigo-950 font-semibold shadow-2xs ring-1 ring-indigo-200'
                            : 'bg-white/60 hover:bg-slate-50 border-slate-200/60 text-slate-700'
                        }`}
                        title="Click to view Hibernation Pod telemetry & past sleep records"
                      >
                        <span className="flex items-center gap-1.5 truncate mr-1">
                          <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{t('records.sleep')}</span>
                          <span className="text-[10px] text-slate-400 font-sans hidden xl:inline">(Pod #04)</span>
                        </span>
                        <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                          {record.avgSleepMinutes} min
                        </span>
                      </button>

                      {/* Exercise (T2 & ARED Equipment) */}
                      <button
                        onClick={() =>
                          setMultiDayConditioning((prev) =>
                            prev?.date === record.date && prev?.category === 'exercise'
                              ? null
                              : { date: record.date, category: 'exercise' }
                          )
                        }
                        className={`w-full flex justify-between items-center px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                          multiDayConditioning?.date === record.date && multiDayConditioning?.category === 'exercise'
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold shadow-2xs ring-1 ring-emerald-200'
                            : 'bg-white/60 hover:bg-slate-50 border-slate-200/60 text-slate-700'
                        }`}
                        title="Click to view T2 Colbert & ARED past exercise equipment records"
                      >
                        <span className="flex items-center gap-1.5 truncate mr-1">
                          <Dumbbell className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{t('records.exercise')}</span>
                          <span className="text-[10px] text-slate-400 font-sans hidden xl:inline">(T2/ARED)</span>
                        </span>
                        <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                          {record.avgExerciseMinutes} min
                        </span>
                      </button>

                      {/* Mental (Station AI Conversations) */}
                      <button
                        onClick={() =>
                          setMultiDayConditioning((prev) =>
                            prev?.date === record.date && prev?.category === 'mental'
                              ? null
                              : { date: record.date, category: 'mental' }
                          )
                        }
                        className={`w-full flex justify-between items-center px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                          multiDayConditioning?.date === record.date && multiDayConditioning?.category === 'mental'
                            ? 'bg-purple-50/90 border-purple-300 text-purple-950 font-semibold shadow-2xs ring-1 ring-purple-200'
                            : 'bg-white/60 hover:bg-slate-50 border-slate-200/60 text-slate-700'
                        }`}
                        title="Click to view Station AI Voice Biometrics & linguistic past logs"
                      >
                        <span className="flex items-center gap-1.5 truncate mr-1">
                          <Brain className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{t('records.mental')}</span>
                          <span className="text-[10px] text-slate-400 font-sans hidden xl:inline">(AURA AI)</span>
                        </span>
                        <span className="font-semibold text-slate-800 shrink-0">
                          {statusLabel(lang, record.mentalStatus)}
                        </span>
                      </button>

                      {/* Musculoskeletal (Equipment Strain Sensors) */}
                      <button
                        onClick={() =>
                          setMultiDayConditioning((prev) =>
                            prev?.date === record.date && prev?.category === 'musculoskeletal'
                              ? null
                              : { date: record.date, category: 'musculoskeletal' }
                          )
                        }
                        className={`w-full flex justify-between items-center px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                          multiDayConditioning?.date === record.date && multiDayConditioning?.category === 'musculoskeletal'
                            ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-semibold shadow-2xs ring-1 ring-amber-200'
                            : 'bg-white/60 hover:bg-slate-50 border-slate-200/60 text-slate-700'
                        }`}
                        title="Click to view ARED strain & bio-impedance past telemetry"
                      >
                        <span className="flex items-center gap-1.5 truncate mr-1">
                          <Bone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{t('records.msk')}</span>
                          <span className="text-[10px] text-slate-400 font-sans hidden xl:inline">(Strain/Bio)</span>
                        </span>
                        <span className="font-semibold text-slate-800 shrink-0">
                          {statusLabel(lang, record.musculoskeletalStatus)}
                        </span>
                      </button>

                      {/* Nutrition (Galley Daily Meal Records) */}
                      <button
                        onClick={() =>
                          setMultiDayConditioning((prev) =>
                            prev?.date === record.date && prev?.category === 'nutrition'
                              ? null
                              : { date: record.date, category: 'nutrition' }
                          )
                        }
                        className={`w-full flex justify-between items-center px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                          multiDayConditioning?.date === record.date && multiDayConditioning?.category === 'nutrition'
                            ? 'bg-rose-50/90 border-rose-300 text-rose-950 font-semibold shadow-2xs ring-1 ring-rose-200'
                            : 'bg-white/60 hover:bg-slate-50 border-slate-200/60 text-slate-700'
                        }`}
                        title="Click to view Galley meal records & caloric past data"
                      >
                        <span className="flex items-center gap-1.5 truncate mr-1">
                          <Apple className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{t('records.nutrition')}</span>
                          <span className="text-[10px] text-slate-400 font-sans hidden xl:inline">(Galley Logs)</span>
                        </span>
                        <span className="font-semibold text-slate-800 shrink-0">
                          {statusLabel(lang, record.nutritionStatus)}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Conditioning Telemetry Details for this card */}
                {multiDayConditioning?.date === record.date && (
                  <div className="mt-4 pt-3 border-t border-slate-200/80 animate-in fade-in duration-200">
                    <ConditioningDetailCard
                      currentRecord={record}
                      initialCategory={multiDayConditioning.category}
                      onAskAi={(prompt) => onOpenAiCall(prompt)}
                    />
                  </div>
                )}

                {/* Footer bar with quick detail-below button */}
                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <span>{t('records.points', { n: record.hourlyTimeline.length })}</span>
                    <span aria-hidden="true">·</span>
                    <span className={hasCriticalVitals ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                      {hasCriticalVitals ? `⚠ ${t('records.spikes')}` : `● ${t('records.pointsOk')}`}
                    </span>
                  </div>

                  {isCommander ? (
                    <button
                      onClick={() => setShowCommanderModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium text-xs border border-amber-300 transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('records.rawNasa')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setFocusedDate(record.date)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-2xs transition-all active:scale-98 cursor-pointer"
                    >
                      <span>{t('records.viewFull24')}</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button at Middle Bottom: "Call with AI" */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={() => onOpenAiCall()}
          className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#c8f0f8] hover:bg-[#b2eaf5] text-sky-950 font-semibold text-sm shadow-md hover:shadow-lg transition-all border border-sky-300/80 active:scale-97 cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wide">{t('records.callAi')}</span>
          <Sparkles className="w-4 h-4 text-sky-600 animate-pulse" />
        </button>
      </div>

      {/* Commander Clearance Restriction Modal */}
      {showCommanderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t('records.lockTitle')}</h3>
                <p className="text-[11px] font-mono text-slate-500">{t('records.lockSub')}</p>
              </div>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                {t('records.lockBody')}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  {t('records.cmdScope')}
                </div>
                <p className="text-amber-800">
                  {t('records.cmdScopeBody')}
                </p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCommanderModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {t('records.ackPolicy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
