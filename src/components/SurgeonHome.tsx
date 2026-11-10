import React, { useMemo, useState } from 'react';
import { ClipboardList, FileText } from 'lucide-react';
import type { AstronautProfile, DailyHealthRecord, EnvironmentalMetrics } from '../types';
import { type SelfCheckEntry } from '../domain/healthThresholds';
import {
  CASE_STATE_ORDER,
  CASE_STATE_ZH,
  deriveClinicalCases,
  mergeCaseMeta,
  sourceKindZh,
  type CaseMeta,
  type ClinicalCase,
} from '../domain/clinicalCases';
import { packHealthPayload, buildOfflineTwoLevelAnalysis } from '../domain/healthPacking';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import { DetailedHealthAnalysis } from './DetailedHealthAnalysis';
import { StatusPill, toneFromStatus } from '../ui/StatusPill';

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
      selfChecks[selectedAstro.id] ?? null
    );
    return buildOfflineTwoLevelAnalysis('飛行外科醫師審閱異常案件', packed);
  }, [selectedAstro, selectedRecord, envMetrics, spaceEnvironment, selfChecks]);

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
          <h1 className="text-lg font-bold text-slate-900">異常佇列</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {surgeonName} · 案件狀態 開啟 → 審閱中 → 已處置 → 結案。生理為示範遙測。
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenConsole}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700"
        >
          開啟作業台
        </button>
      </header>

      {speDemo && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          示範太陽質子事件進行中。S 尺度來自示範疊加，不是 NOAA 即時質子讀數；組員健康數字仍為示範遙測。
        </p>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold">案件（{cases.length}）</h2>
          </div>
          {cases.length === 0 ? (
            <p className="p-4 text-xs text-slate-500">目前沒有達注意或危急門檻的指標。</p>
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
                      <StatusPill tone={toneFromStatus(c.status)}>{c.statusZh}</StatusPill>
                      <StatusPill tone="neutral">{CASE_STATE_ZH[c.state]}</StatusPill>
                      <StatusPill tone="info">{sourceKindZh(c.sourceKind)}</StatusPill>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">
                      {c.metricLabelZh} {c.valueLabel} · {c.thresholdBand}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">觀測 {c.observedAt} · {c.sourceLabelZh}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          {!selected && <p className="text-xs text-slate-500">選擇左側案件以審閱。</p>}
          {selected && selectedAstro && analysis && (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold">{selected.astronautName} · {selected.metricLabelZh}</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selected.valueLabel} · {selected.thresholdBand} · 來源 {sourceKindZh(selected.sourceKind)}
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
                  開啟該組員作業台
                </button>
              </div>

              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                AI 離線，以下為門檻引擎結果
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
                <p className="text-[11px] font-bold text-slate-600 mb-1.5">案件狀態</p>
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
                      {CASE_STATE_ZH[st]}
                    </button>
                  ))}
                  {selected.state !== 'closed' && (
                    <button
                      type="button"
                      onClick={() => advance(selected)}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-900"
                    >
                      推進至{CASE_STATE_ZH[CASE_STATE_ORDER[Math.min(CASE_STATE_ORDER.indexOf(selected.state) + 1, 3)]]}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  醫師註記（以 {surgeonName} 署名，非太空人）
                </p>
                <ul className="space-y-1.5 mb-2">
                  {selected.physicianNotes.map((n, i) => (
                    <li key={`${n.at}-${i}`} className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs">
                      <p className="font-semibold text-slate-800">{n.author}</p>
                      <p className="text-slate-700 mt-0.5">{n.text}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{n.at}</p>
                    </li>
                  ))}
                  {selected.physicianNotes.length === 0 && <li className="text-[11px] text-slate-400">尚無註記</li>}
                </ul>
                <textarea
                  className="w-full rounded-lg border border-slate-200 text-xs p-2 min-h-[64px]"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="以飛行外科醫師身分寫入處置意見…"
                />
                <button
                  type="button"
                  onClick={() => addNote(selected)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                >
                  署名並儲存
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
