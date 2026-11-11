import React, { useMemo, useState } from 'react';
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
import { useI18n } from '../i18n/I18nProvider';
import { statusLabel } from '../i18n/index';
import { BodyMapDashboard } from './BodyMapDashboard';
import { CREW } from '../world/catalog';
import { AvatarBubble, Segmented, Sheet, StatusDot, toneFromRank } from '../ui/chrome';
import { StatusPill } from '../ui/StatusPill';

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
  onOpenAiCall: (prompt?: string) => void;
  tNow: number;
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
  onOpenAiCall,
  tNow,
}) => {
  const { t, lang } = useI18n();
  const cases = useMemo(
    () => mergeCaseMeta(deriveClinicalCases(astronauts, recordsByAstronaut, selfChecks), caseMeta),
    [astronauts, recordsByAstronaut, selfChecks, caseMeta]
  );
  const [openId, setOpenId] = useState<string | null>(cases[0]?.id ?? null);
  const [noteDraft, setNoteDraft] = useState('');
  const [filter, setFilter] = useState<'open' | 'reviewing' | 'done'>('open');
  const [metricsOpen, setMetricsOpen] = useState(false);
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

  const visible = cases.filter((c) => {
    if (filter === 'open') return c.state === 'open';
    if (filter === 'reviewing') return c.state === 'reviewing' || c.state === 'acted';
    return c.state === 'closed';
  });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 pt-3 sm-page-pad sm-orb-gutter">
      <h1 className="font-display text-4xl sm:text-5xl">{t('ui.casesHeadline')}</h1>
      <p className="text-sm text-stone-400 mt-1">{t('surg.hint', { name: surgeonName })}</p>

      <div className="mt-4">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'open', label: t('ui.filterOpen') },
            { id: 'reviewing', label: t('ui.filterReviewing') },
            { id: 'done', label: t('ui.filterDone') },
          ]}
        />
      </div>

      <div className="mt-5 grid lg:grid-cols-[minmax(0,22rem)_1fr] gap-6">
        <ul className="space-y-2">
          {visible.length === 0 && <li className="text-xs text-stone-400">{t('surg.empty')}</li>}
          {visible.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setOpenId(c.id)}
                className={`w-full text-left px-4 py-3 rounded-[28px] flex items-center gap-3 ${
                  openId === c.id ? 'bg-white shadow-[var(--sm-shadow)]' : 'bg-white/70'
                }`}
              >
                <AvatarBubble
                  name={c.astronautName}
                  seed={astronauts.find((a) => a.id === c.astronautId)?.avatarSeed}
                  id={c.astronautId}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{c.astronautName}</p>
                  <p className="text-[11px] text-stone-400">
                    {t(`metric.${c.metricId}`)} {c.valueLabel}
                  </p>
                </div>
                <StatusDot tone={toneFromRank(c.status)} />
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          {selected && selectedAstro && analysis ? (
            <CaseInspector
              selected={selected}
              selectedAstro={selectedAstro}
              analysis={analysis}
              surgeonName={surgeonName}
              noteDraft={noteDraft}
              setNoteDraft={setNoteDraft}
              metricsOpen={metricsOpen}
              setMetricsOpen={setMetricsOpen}
              tNow={tNow}
              spaceEnvironment={spaceEnvironment}
              onOpenAiCall={onOpenAiCall}
              onSelectAstronaut={onSelectAstronaut}
              onOpenConsole={onOpenConsole}
              onUpdateCase={onUpdateCase}
              advance={advance}
              addNote={addNote}
            />
          ) : (
            <p className="text-sm text-stone-400">{t('surg.pick')}</p>
          )}
        </div>
      </div>

      <Sheet
        open={!!selected && typeof window !== 'undefined' && window.innerWidth < 1024}
        onClose={() => setOpenId(null)}
        wide
        title={selected ? <p className="font-display text-2xl">{selected.astronautName}</p> : null}
      >
        {selected && selectedAstro && analysis && (
          <CaseInspector
            selected={selected}
            selectedAstro={selectedAstro}
            analysis={analysis}
            surgeonName={surgeonName}
            noteDraft={noteDraft}
            setNoteDraft={setNoteDraft}
            metricsOpen={metricsOpen}
            setMetricsOpen={setMetricsOpen}
            tNow={tNow}
            spaceEnvironment={spaceEnvironment}
            onOpenAiCall={onOpenAiCall}
            onSelectAstronaut={onSelectAstronaut}
            onOpenConsole={onOpenConsole}
            onUpdateCase={onUpdateCase}
            advance={advance}
            addNote={addNote}
          />
        )}
      </Sheet>
      {speDemo && <p className="sr-only">{t('surg.speBanner')}</p>}
    </div>
  );
};

function CaseInspector({
  selected,
  selectedAstro,
  analysis,
  surgeonName,
  noteDraft,
  setNoteDraft,
  metricsOpen,
  setMetricsOpen,
  tNow,
  spaceEnvironment,
  onOpenAiCall,
  onSelectAstronaut,
  onOpenConsole,
  onUpdateCase,
  advance,
  addNote,
}: {
  selected: ClinicalCase;
  selectedAstro: AstronautProfile;
  analysis: ReturnType<typeof buildOfflineTwoLevelAnalysis>;
  surgeonName: string;
  noteDraft: string;
  setNoteDraft: (v: string) => void;
  metricsOpen: boolean;
  setMetricsOpen: (v: boolean) => void;
  tNow: number;
  spaceEnvironment: SpaceEnvironmentPayload | null;
  onOpenAiCall: (prompt?: string) => void;
  onSelectAstronaut: (astro: AstronautProfile) => void;
  onOpenConsole: () => void;
  onUpdateCase: (id: string, patch: Partial<CaseMeta>) => void;
  advance: (c: ClinicalCase) => void;
  addNote: (c: ClinicalCase) => void;
}) {
  const { t, lang } = useI18n();
  const idx = CASE_STATE_ORDER.indexOf(selected.state);
  const crew = CREW.find((c) => c.id === selectedAstro.id);
  return (
    <div className="rounded-[32px] bg-white/90 p-5 pb-40 shadow-[var(--sm-shadow-soft)] space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl">
            {selected.astronautName} — {t(`metric.${selected.metricId}`)}
          </h2>
          <p className="text-[12px] text-stone-400 mt-0.5">
            {selected.valueLabel} · {t(`source.${selected.sourceKind}`)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelectAstronaut(selectedAstro);
            onOpenConsole();
          }}
          className="text-[12px] font-semibold text-[var(--sm-cobalt)]"
        >
          {t('surg.openConsole')}
        </button>
      </div>

      <ol className="flex items-center gap-2">
        {CASE_STATE_ORDER.map((st, i) => (
          <li key={st} className="flex-1 flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateCase(selected.id, { state: st, physicianNotes: selected.physicianNotes })}
              className="w-3.5 h-3.5 rounded-full"
              style={{ background: i <= idx ? '#2b3bff' : '#d6d3cd' }}
              aria-label={t(`case.${st}`)}
            />
            <span className={`text-[10px] ${i === idx ? 'text-[var(--sm-cobalt)] font-semibold' : 'text-stone-400'}`}>
              {t(`case.${st}`)}
            </span>
          </li>
        ))}
      </ol>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-stone-400 text-[11px]">{t('ui.problem')}</dt>
          <dd>{t(`metric.${selected.metricId}`)} {selected.valueLabel}</dd>
        </div>
        <div>
          <dt className="text-stone-400 text-[11px]">{t('ui.likelyCause')}</dt>
          <dd>{analysis.healthAssessment.summary}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-stone-400 text-[11px]">{t('ui.nextStep')}</dt>
          <dd>{t('surg.offline')}</dd>
        </div>
      </dl>

      {crew && (
        <BodyMapDashboard crew={crew} tNow={tNow} wx={spaceEnvironment} onOpenAiCall={onOpenAiCall} figureOnly />
      )}

      <button
        type="button"
        onClick={() => setMetricsOpen(!metricsOpen)}
        className="h-10 px-4 rounded-full bg-stone-50 text-xs font-semibold"
      >
        {t('ui.allMetrics')} +
      </button>
      {metricsOpen && (
        <DetailedHealthAnalysis
          metrics={analysis.detailedAnalysis.metrics}
          systems={analysis.detailedAnalysis.systems}
          overallStatus={analysis.healthAssessment.status}
          overallSummary={analysis.healthAssessment.summary}
          dataQuality={analysis.dataQuality}
          analysisMode="offline_fallback"
        />
      )}

      {selected.state !== 'closed' && (
        <button
          type="button"
          onClick={() => advance(selected)}
          className="h-10 px-4 rounded-full bg-white text-xs font-semibold"
        >
          {t('surg.advance', { state: t(`case.${CASE_STATE_ORDER[Math.min(CASE_STATE_ORDER.indexOf(selected.state) + 1, 3)]}`) })}
        </button>
      )}

      <div>
        <p className="text-[11px] font-semibold text-stone-500 mb-1.5">{t('surg.notes', { name: surgeonName })}</p>
        <ul className="space-y-1.5 mb-2">
          {selected.physicianNotes.map((n, i) => (
            <li key={`${n.at}-${i}`} className="rounded-[18px] bg-stone-50 px-3 py-2 text-xs">
              <p className="font-semibold">{n.author}</p>
              <p>{n.text}</p>
              <p className="text-[10px] font-mono text-stone-400">{n.at}</p>
            </li>
          ))}
          {selected.physicianNotes.length === 0 && <li className="text-[11px] text-stone-400">{t('surg.noNotes')}</li>}
        </ul>
        <textarea
          className="w-full rounded-[22px] bg-stone-50 text-xs p-3 min-h-[64px]"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder={t('surg.notePlaceholder')}
        />
        <button
          type="button"
          onClick={() => addNote(selected)}
          className="mt-2 h-11 w-full rounded-full bg-[var(--sm-cobalt)] text-white text-sm font-semibold"
        >
          {t('surg.signSave')}
        </button>
      </div>
      <StatusPill tone={toneFromRank(selected.status)}>{statusLabel(lang, selected.status)}</StatusPill>
    </div>
  );
}

