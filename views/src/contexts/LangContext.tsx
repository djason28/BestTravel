import React, { createContext, useContext, useState, useCallback } from "react";
import { toggleLang, currentLang } from "../i18n";

type Lang = "en" | "zh";

type LangContextType = {
  lang: Lang;
  switchLang: () => void;
};

const LangContext = createContext<LangContextType>({
  lang: "en",
  switchLang: () => {},
});

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLang] = useState<Lang>(currentLang());

  const switchLang = useCallback(() => {
    const next = toggleLang();
    setLang(next);
  }, []);

  return (
    <LangContext.Provider value={{ lang, switchLang }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
