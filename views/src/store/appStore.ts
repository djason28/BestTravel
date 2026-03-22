import { create } from "zustand";

type Lang = "en" | "zh";

interface AuthState {
  user: { id: string; name: string; email: string; role?: string } | null;
  setAuth: (user: AuthState["user"]) => void;
  setUser: (user: AuthState["user"]) => void;
  clearAuth: () => void;
}

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
}

interface UIState {
  isLoadingAuth: boolean;
  setLoadingAuth: (b: boolean) => void;
}

type AppState = AuthState & LangState & UIState;

const detectInitialLang = (): Lang => {
  const stored = localStorage.getItem("lang");
  if (stored === "zh") return "zh";
  const nav = navigator.language?.toLowerCase();
  if (nav.startsWith("zh")) return "zh";
  return "en";
};

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  setAuth: (user) => {
    localStorage.setItem("is_logged_in", "true");
    set({ user });
  },
  setUser: (user) => set({ user }),
  clearAuth: () => {
    localStorage.removeItem("is_logged_in");
    set({ user: null });
  },
  // Language
  lang: detectInitialLang(),
  setLang: (l) => {
    localStorage.setItem("lang", l);
    document.cookie = `lang=${l}; path=/; SameSite=Lax`;
    set({ lang: l });
  },
  toggleLang: () => {
    const next: Lang = get().lang === "en" ? "zh" : "en";
    get().setLang(next);
  },
  // UI
  isLoadingAuth: true,
  setLoadingAuth: (b) => set({ isLoadingAuth: b }),
}));

// Hook for localized package fields with fallback
export function useLocalizedPackage<T extends Record<string, any>>(
  pkg: T | null,
) {
  const lang = useAppStore((s) => s.lang);
  if (!pkg) return null;
  if (lang !== "zh") return pkg;
  const mapped: any = { ...pkg };
  const pairs: [string, string][] = [
    ["title", "titleZh"],
    ["description", "descriptionZh"],
    ["shortDescription", "shortDescriptionZh"],
    ["destination", "destinationZh"],
    ["availability", "availabilityZh"],
  ];
  for (const [base, zh] of pairs) {
    if (pkg[zh]) mapped[base] = pkg[zh];
  }
  // Arrays
  const arrPairs: [string, string][] = [
    ["categories", "categoriesZh"],
    ["included", "includedZh"],
    ["excluded", "excludedZh"],
    ["highlights", "highlightsZh"],
  ];
  for (const [base, zh] of arrPairs) {
    if (Array.isArray(pkg[zh]) && pkg[zh].length > 0) mapped[base] = pkg[zh];
  }
  // Itinerary items
  if (Array.isArray(pkg.itinerary)) {
    mapped.itinerary = pkg.itinerary.map((it: any) => {
      const copy = { ...it };
      if (it.titleZh) copy.title = it.titleZh;
      if (it.descriptionZh) copy.description = it.descriptionZh;
      if (Array.isArray(it.activitiesZh) && it.activitiesZh.length > 0)
        copy.activities = it.activitiesZh;
      if (Array.isArray(it.mealsZh) && it.mealsZh.length > 0)
        copy.meals = it.mealsZh;
      if (it.accommodationZh) copy.accommodation = it.accommodationZh;
      return copy;
    });
  }
  return mapped as T;
}
