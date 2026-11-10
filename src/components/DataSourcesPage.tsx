import React from 'react';
import { ExternalLink } from 'lucide-react';
import { THRESHOLDS } from '../domain/healthThresholds';

interface Citation {
  titleZh: string;
  usedForZh: string;
  url: string | null;
  noteZh: string;
}

const CITATIONS: Citation[] = [
  {
    titleZh: 'NOAA Space Weather Scales',
    usedForZh: 'G／R／S 尺度對照（Kp、GOES X 射線峰值、≥10 MeV 質子）',
    url: 'https://www.swpc.noaa.gov/noaa-scales-explanation',
    noteZh: '已核對公開 URL。R 尺度：M1=R1、M5=R2、X1=R3、X10=R4、X20=R5；C 級為 R0。',
  },
  {
    titleZh: 'GOES X-Ray Flux (SWPC)',
    usedForZh: '即時長波 X 射線通量與 GOES class',
    url: 'https://www.swpc.noaa.gov/products/goes-x-ray-flux',
    noteZh: '已核對公開 URL。空值與逾時維持空值／逾時，不內插。',
  },
  {
    titleZh: 'GOES Proton Flux (SWPC)',
    usedForZh: '≥10 MeV 積分質子通量 → S 尺度',
    url: 'https://www.swpc.noaa.gov/products/goes-proton-flux',
    noteZh: '已核對公開 URL。示範 SPE 情境會另外標示，不覆寫為官方數字。',
  },
  {
    titleZh: 'NASA DONKI',
    usedForZh: '閃焰／地磁暴／CME 事件目錄',
    url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
    noteZh: '已核對公開 URL。逾時與空窗分開標示：逾時≠確認無事件。',
  },
  {
    titleZh: 'NASA Open Science Data Repository (OSDR)',
    usedForZh: '太空人健康與生命科學公開資料入口',
    url: 'https://osdr.nasa.gov/bio/',
    noteZh: '已核對公開 URL。本示範門檻尚未綁定單一 OSDR 研究 DOI。',
  },
  {
    titleZh: 'NASA Technical Reports Server (NTRS)',
    usedForZh: '微重力心血管／運動對策文獻入口',
    url: 'https://ntrs.nasa.gov/',
    noteZh: '已核對公開 URL。未引用未核對的報告編號或標題。',
  },
];

export const DataSourcesPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-slate-50/80">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">資料來源</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            官方饋送只連到已核對的公開 URL。生理門檻為示範政策，未編造文獻。
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white"
        >
          返回角色首頁
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold">官方與公開入口</h2>
        <ul className="mt-3 space-y-3">
          {CITATIONS.map((c) => (
            <li key={c.titleZh} className="rounded-xl border border-slate-200 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{c.titleZh}</p>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-sky-700 shrink-0"
                  >
                    開啟 <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">無 URL</span>
                )}
              </div>
              <p className="text-xs text-slate-700 mt-1">{c.usedForZh}</p>
              <p className="text-[11px] text-slate-500 mt-1">{c.noteZh}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold">健康門檻（示範政策，待文獻）</h2>
        <p className="text-[11px] text-slate-500 mt-1">
          下列區間是產品內建示範臨床政策，供 AURA 與角色首頁一致解讀。不是 NASA 認證協議，也尚未綁定已核對的 OSDR／NTRS 單篇文獻。
        </p>
        <table className="mt-3 w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-1.5 pr-2">指標</th>
              <th className="py-1.5 pr-2">正常</th>
              <th className="py-1.5 pr-2">注意</th>
              <th className="py-1.5">危急</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(THRESHOLDS).map((t) => (
              <tr key={t.id} className="border-b border-slate-100">
                <td className="py-1.5 pr-2 font-medium">
                  {t.labelZh}
                  <span className="block text-[10px] font-mono text-slate-400">{t.unit}</span>
                </td>
                <td className="py-1.5 pr-2 font-mono">{t.normal}</td>
                <td className="py-1.5 pr-2 font-mono">{t.attention}</td>
                <td className="py-1.5 font-mono">{t.critical}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
