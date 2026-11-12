import React, { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { SimBadge } from './SimBadge';
import { useI18n } from '../i18n/I18nProvider';
import { ackVisible, loadMessages, visibleToCrew } from '../world/comms';

export const CrewCommsInbox: React.FC<{ shipId: string }> = ({ shipId }) => {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const now = Date.now();
  const messages = loadMessages().filter((m) => m.shipId === shipId && m.from === 'hq' && visibleToCrew(m, now));
  void tick;

  return (
    <section className="rounded-[24px] bg-white/90 p-3.5 shadow-[var(--sm-shadow-soft)]">
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-emerald-700" />
        <h2 className="text-sm font-bold">{t('inbox.title')}</h2>
        <SimBadge />
      </div>
      <ul className="mt-2 space-y-1.5 max-h-36 overflow-y-auto">
        {messages.length === 0 && <li className="text-xs text-slate-500">{t('inbox.empty')}</li>}
        {messages.map((m) => (
          <li key={m.id} className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs">
            <p className="text-[10px] font-mono text-slate-400">{t('inbox.fromHq')}</p>
            <p className="text-slate-800 mt-0.5">{m.text}</p>
            {ackVisible(m, now) && m.ackKey && (
              <p className="text-[11px] text-slate-600 mt-1">
                {t('inbox.ack')}: {t(m.ackKey)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
