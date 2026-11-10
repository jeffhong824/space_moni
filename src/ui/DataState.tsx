import React from 'react';
import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-2 py-8 text-slate-500"
    >
      <LoaderCircle className="w-5 h-5 animate-spin text-sky-600" aria-hidden />
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

export function EmptyBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-5 text-center">
      <Inbox className="w-5 h-5 text-slate-400 mx-auto mb-1.5" aria-hidden />
      <p className="text-xs font-semibold text-slate-700">{title}</p>
      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{detail}</p>
    </div>
  );
}

export function ErrorBlock({
  title,
  detail,
  onRetry,
  retryLabel,
}: {
  title: string;
  detail: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-rose-900">{title}</p>
          <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">{detail}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-900 hover:underline focus-visible:outline-2 focus-visible:outline-rose-600 rounded"
            >
              <RefreshCw className="w-3 h-3" aria-hidden />
              {retryLabel ?? t('common.retry')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
