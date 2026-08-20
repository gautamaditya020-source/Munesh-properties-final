import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";
import { translations, locationLabel as locLabel, Lang } from "@/src/i18n/translations";

const LANG_KEY = "munesh_lang";

type LangState = {
  lang: Lang;
  ready: boolean;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
  loc: (value: string) => string;
};

const LanguageContext = createContext<LangState | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("hi");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<string>(LANG_KEY, "hi");
      if (saved === "en" || saved === "hi") setLangState(saved);
      setReady(true);
    })();
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    storage.setItem(LANG_KEY, l);
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "hi" ? "en" : "hi";
      storage.setItem(LANG_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback((key: string) => translations[lang][key] ?? translations.en[key] ?? key, [lang]);
  const loc = useCallback((value: string) => locLabel(lang, value), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, ready, setLang, toggle, t, loc }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
