import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { translateTexts } from "@/lib/translate.functions";

type Language = "en" | "hi";

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isTranslating: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "fixnear-language";
const CACHE_KEY = "fixnear-hi-cache";
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"]);
const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;

type Unit =
  | { kind: "text"; node: Text; original: string }
  | { kind: "attr"; node: Element; attr: string; original: string };

function isTranslatable(value: string) {
  const text = value.trim();
  if (text.length < 2 || text.length > 600) return false;
  return /[A-Za-z]{2}/.test(text);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isTranslating, setIsTranslating] = useState(false);

  const cacheRef = useRef<Map<string, string>>(new Map());
  const translatedValues = useRef<Set<string>>(new Set());
  const languageRef = useRef<Language>("en");
  const runningRef = useRef(false);
  const pendingRef = useRef(false);
  const failedRef = useRef<Set<string>>(new Set());

  // Load stored preference + cached translations.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        cacheRef.current = new Map(Object.entries(parsed));
        for (const value of cacheRef.current.values()) translatedValues.current.add(value.trim());
      }
    } catch {
      /* ignore */
    }
    try {
      if (localStorage.getItem(STORAGE_KEY) === "hi") {
        languageRef.current = "hi";
        setLanguageState("hi");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persistCache = useCallback(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(cacheRef.current)));
    } catch {
      /* ignore */
    }
  }, []);

  const collectUnits = useCallback(() => {
    const units: Unit[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
          if (!element) return NodeFilter.FILTER_REJECT;
          if (SKIP_TAGS.has(element.tagName)) return NodeFilter.FILTER_REJECT;
          if (element.hasAttribute?.("data-no-translate")) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    let current: Node | null = walker.nextNode();
    while (current) {
      if (current.nodeType === Node.TEXT_NODE) {
        const value = current.nodeValue ?? "";
        const key = value.trim();
        if (isTranslatable(value) && !translatedValues.current.has(key)) {
          units.push({ kind: "text", node: current as Text, original: value });
        }
      } else {
        const element = current as Element;
        for (const attr of ATTRS) {
          const value = element.getAttribute(attr);
          if (!value || !isTranslatable(value)) continue;
          if (translatedValues.current.has(value.trim())) continue;
          units.push({ kind: "attr", node: element, attr, original: value });
        }
      }
      current = walker.nextNode();
    }
    return units;
  }, []);

  const apply = useCallback((unit: Unit, translated: string) => {
    const next = unit.original.replace(unit.original.trim(), translated);
    if (unit.kind === "text") unit.node.nodeValue = next;
    else unit.node.setAttribute(unit.attr, next);
  }, []);

  const translateDocument = useCallback(async () => {
    if (languageRef.current !== "hi" || typeof document === "undefined") return;
    if (runningRef.current) {
      pendingRef.current = true;
      return;
    }
    runningRef.current = true;

    try {
      const units = collectUnits();
      if (units.length === 0) return;

      const missing: string[] = [];
      for (const unit of units) {
        const key = unit.original.trim();
        const cached = cacheRef.current.get(key);
        if (cached) apply(unit, cached);
        else if (!failedRef.current.has(key) && !missing.includes(key)) missing.push(key);
      }

      if (missing.length === 0) return;

      setIsTranslating(true);
      for (let i = 0; i < missing.length; i += 50) {
        const batch = missing.slice(i, i + 50);
        try {
          const result = await translateTexts({ data: { texts: batch, target: "hi" } });
          batch.forEach((source, index) => {
            const value = result.translations[index];
            if (value && value !== source) {
              cacheRef.current.set(source, value);
              translatedValues.current.add(value.trim());
            } else {
              failedRef.current.add(source);
            }
          });
        } catch (error) {
          console.error("Hindi translation failed", error);
          batch.forEach((source) => failedRef.current.add(source));
        }
      }
      persistCache();

      if (languageRef.current !== "hi") return;
      for (const unit of collectUnits()) {
        const cached = cacheRef.current.get(unit.original.trim());
        if (cached) apply(unit, cached);
      }
    } finally {
      setIsTranslating(false);
      runningRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        void translateDocument();
      }
    }
  }, [apply, collectUnits, persistCache]);

  const setLanguage = useCallback(
    (lang: Language) => {
      languageRef.current = lang;
      setLanguageState(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* ignore */
      }
      if (lang === "en") window.location.reload();
      else void translateDocument();
    },
    [translateDocument],
  );

  // Keep the DOM translated as React re-renders / routes change.
  useEffect(() => {
    if (language !== "hi") return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void translateDocument(), 120);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });
    const interval = setInterval(schedule, 2000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      if (timer) clearTimeout(timer);
    };
  }, [language, translateDocument]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage: () => setLanguage(language === "hi" ? "en" : "hi"),
        isTranslating,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
