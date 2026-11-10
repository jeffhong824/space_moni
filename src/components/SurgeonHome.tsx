import React, { useMemo, useState } from 'react';
import { ClipboardList, FileText } from 'lucide-react';
import type { AstronautProfile, DailyHealthRecord, EnvironmentalMetrics } from '../types';
import { type SelfCheckEntry } from '../domain/healthThresholds';
import {
  CASE_STATE_ORDER,
  deriveClinicalCases,
  mergeCaseMeta,
  type CaseMeta,
  type ClinicalCase,
} from '../domain/clinicalCases';
import { packHealthPayload, buildOfflineTwoLevelAnalysis } from '../domain/healthPacking';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { DetailedHealthAnalysis } from './DetailedHealthAnalysis';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';
import { SimBadge } from './SimBadge';

interface SurgeonHomeProps {
  surgeonName: string;
  astronauts: AstronautProfile[];
  recordsByAstronaut: Record<string, DailyHealthRecord[]>;
  selfChecks: Record<string, SelfCheckEntry | undefined>;
  caseMeta: Record<string, CaseMeta>;
  onUpdateCase: (id: string, patch: Partial<CaseMeta>) => void;
  envMetrics: EnvironmentalMetrics;
  spaceEnvironment: SpaceEnvironmentPayload | null;
  speDemo: boolean;
  onSelectAstronaut: (astro: AstronautProfile) => void;
  onOpenConsole: () => void;
}

export const SurgeonHome: React.FC<SurgeonHomeProps> = ({
  surgeonName,
  astronauts,
  recordsByAstronaut,
  selfChecks,
  caseMeta,
  onUpdateCase,
  envMetrics,
  spaceEnvironment,
  speDemo,
  onSelectAstronaut,
  onOpenConsole,
}) => {
  const { t, lang } = useI18n();
  const cases = useMemo(
    () => mergeCaseMeta(deriveClinicalCases(astronauts, recordsByAstronaut, selfChecks), caseMeta),
    [astronauts, recordsByAstronaut, selfChecks, caseMeta]
  );
  const [openId, setOpenId] = useState<string | null>(cases[0]?.id ?? null);
  const [noteDraft, setNoteDraft] = useState('');
  const selected = cases.find((c) => c.id === openId) ?? null;
  const selectedAstro = selected ? astronauts.find((a) => a.id === selected.astronautId) : null;
  const selectedRecord =
    selectedAstro && recordsByAstronaut[selectedAstro.id]
      ? recordsByAstronaut[selectedAstro.id].find((r) => r.isToday) || recordsByAstronaut[selectedAstro.id][0]
      : null;

  const analysis = useMemo(() => {
    if (!selectedAstro || !selectedRecord) return null;
    const packed = packHealthPayload(
      selectedAstro,
      selectedRecord,
      envMetrics,
      spaceEnvironment,
      selfChecks[selectedAstro.id] ?? null,
      lang
    );
    return buildOfflineTwoLevelAnalysis(t('surg.title'), packed, lang);
  }, [selectedAstro, selectedRecord, envMetrics, spaceEnvironment, selfChecks, lang, t]);

  const advance = (c: ClinicalCase) => {
    const idx = CASE_STATE_ORDER.indexOf(c.state);
    const next = CASE_STATE_ORDER[Math.min(idx + 1, CASE_STATE_ORDER.length - 1)];
    onUpdateCase(c.id, { state: next, physicianNotes: c.physicianNotes });
  };

  const addNote = (c: ClinicalCase) => {
    const text = noteDraft.trim();
    if (!text) return;
    onUpdateCase(c.id, {
      state: c.state,
      physicianNotes: [
        ...c.physicianNotes,
        { at: new Date().toISOString(), author: surgeonName, text },
      ],
    });
    setNoteDraft('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-slate-50/80">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">{t('surg.title')}</h1>
            <SimBadge />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('surg.hint', { name: surgeonName })}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenConsole}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700"
        >
          {t('surg.openConsole')}
        </button>
      </header>

      {speDemo && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          {t('surg.speBanner')}
        </p>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold">{t('surg.cases', { n: cases.length })}</h2>
          </div>
          {cases.length === 0 ? (
            <p className="p-4 text-xs text-slate-500">{t('surg.empty')}</p>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {cases.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    className={`w-full text-left px-4 py-3 ${openId === c.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{c.astronautName}</span>
                      <StatusPill tone={toneFromStatus(c.status)}>{statusLabel(lang, c.status)}</StatusPill>
                      <StatusPill tone="neutral">{t(`case.${c.state}`)}</StatusPill>
                      <StatusPill tone="info">{t(`source.${c.sourceKind}`)}</StatusPill>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">
                      {t(`metric.${c.metricId}`)} {c.valueLabel}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{t('surg.observed', { at: c.observedAt, source: t('badge.simTelemetry') })}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          {!selected && <p className="text-xs text-slate-500">{t('surg.pick')}</p>}
          {selected && selectedAstro && analysis && (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold">{selected.astronautName} · {t(`metric.${selected.metricId}`)}</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selected.valueLabel} · {t(`source.${selected.sourceKind}`)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectAstronaut(selectedAstro);
                    onOpenConsole();
                  }}
                  className="text-[11px] font-semibold text-sky-800"
                >
                  {t('surg.openConsole')}
                </button>
              </div>

              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                {t('surg.offline')}
              </p>
              <DetailedHealthAnalysis
                metrics={analysis.detailedAnalysis.metrics}
                systems={analysis.detailedAnalysis.systems}
                overallStatus={analysis.healthAssessment.status}
                overallSummary={analysis.healthAssessment.summary}
                dataQuality={analysis.dataQuality}
                analysisMode="offline_fallback"
              />

              <div>
                <p className="text-[11px] font-bold text-slate-600 mb-1.5">{t('surg.caseState')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {CASE_STATE_ORDER.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onUpdateCase(selected.id, { state: st, physicianNotes: selected.physicianNotes })}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold border ${
                        selected.state === st ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {t(`case.${st}`)}
                    </button>
                  ))}
                  {selected.state !== 'closed' && (
                    <button
                      type="button"
                      onClick={() => advance(selected)}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-900"
                    >
                      {t('surg.advance', { state: t(`case.${CASE_STATE_ORDER[Math.min(CASE_STATE_ORDER.indexOf(selected.state) + 1, 3)]}`) })}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {t('surg.notes', { name: surgeonName })}
                </p>
                <ul className="space-y-1.5 mb-2">
                  {selected.physicianNotes.map((n, i) => (
                    <li key={`${n.at}-${i}`} className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs">
                      <p className="font-semibold text-slate-800">{n.author}</p>
                      <p className="text-slate-700 mt-0.5">{n.text}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{n.at}</p>
                    </li>
                  ))}
                  {selected.physicianNotes.length === 0 && <li className="text-[11px] text-slate-400">{t('surg.noNotes')}</li>}
                </ul>
                <textarea
                  className="w-full rounded-lg border border-slate-200 text-xs p-2 min-h-[64px]"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder={t('surg.notePlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => addNote(selected)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                >
                  {t('surg.signSave')}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
