import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { applyHtmlLang, persistLang, readStoredLang, translate, type Vars } from './index';
import { DEFAULT_LANG, isLangId } from './registry';

interface I18nCtx {
  lang: string;
  setLang: (id: string) => void;
  t: (key: string, vars?: Vars) => string;
}

const Ctx = createContext<I18nCtx>({
  lang: DEFAULT_LANG,
  setLang: () => undefined,
  t: (key, vars) => translate(DEFAULT_LANG, key, vars),
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    const initial = typeof window === 'undefined' ? DEFAULT_LANG : readStoredLang();
    applyHtmlLang(initial);
    return initial;
  });

  const setLang = useCallback((id: string) => {
    const next = isLangId(id) ? id : DEFAULT_LANG;
    persistLang(next);
    applyHtmlLang(next);
    setLangState(next);
  }, []);

  const value = useMemo<I18nCtx>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useI18n() {
  return useContext(Ctx);
}
