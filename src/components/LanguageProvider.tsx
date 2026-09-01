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
  if (!/[A-Za-z]{2}/.test(text)) return false;
  return true;
}

function collectUnits(root: Node, seenText: WeakMap<Text, string>, seenAttr: WeakMap<Element, Set<string>>) {
  const units: Unit[] = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const consider = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const value = textNode.nodeValue ?? "";
      if (isTranslatable(value) && !seenText.has(textNode)) {
        units.push({ kind: "text", node: textNode, original: value });
      }
      return;
    }
    const element = node as Element;
    for (const attr of ATTRS) {
      const value = element.getAttribute(attr);
      if (!value || !isTranslatable(value)) continue;
      const done = seenAttr.get(element);
      if (done?.has(attr)) continue;
      units.push({ kind: "attr", node: element, attr, original: value });
    }
  };

  if (root.nodeType === Node.TEXT_NODE || root.nodeType === Node.ELEMENT_NODE) consider(root);
  let current = walker.nextNode();
  while (current) {
    consider(current);
    current = walker.nextNode();
  }

  return units;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isTranslating, setIsTranslating] = useState(false);

  const cacheRef = useRef<Map<string, string>>(new Map());
  const textOriginals = useRef(new WeakMap<Text, string>());
  const attrOriginals = useRef(new WeakMap<Element, Map<string, string>>());
  const doneText = useRef(new WeakMap<Text, string>());
  const doneAttr = useRef(new WeakMap<Element, Set<string>>());
  const languageRef = useRef<Language>("en");
  const runningRef = useRef(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) cacheRef.current = new Map(Object.entries(JSON.parse(stored) as Record<string, string>));
    } catch {
      /* ignore */
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "hi") {
      languageRef.current = "hi";
      setLanguageState("hi");
    }
  }, []);

  const persistCache = useCallback(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(cacheRef.current)));
    } catch {
      /* ignore */
    }
  }, []);

  const apply = useCallback((unit: Unit, translated: string) => {
    if (unit.kind === "text") {
      textOriginals.current.set(unit.node, unit.original);
      unit.node.nodeValue = translated;
      doneText.current.set(unit.node, translated);
      return;
    }
    const map = attrOriginals.current.get(unit.node) ?? new Map<string, string>();
    map.set(unit.attr, unit.original);
    attrOriginals.current.set(unit.node, map);
    unit.node.setAttribute(unit.attr, translated);
    const set = doneAttr.current.get(unit.node) ?? new Set<string>();
    set.add(unit.attr);
    doneAttr.current.set(unit.node, set);
  }, []);

  const translateDocument = useCallback(async () => {
    if (languageRef.current !== "hi") return;
    if (runningRef.current) {
      pendingRef.current = true;
      return;
    }
    runningRef.current = true;

    try {
      const units = collectUnits(document.body, doneText.current, doneAttr.current);
      if (units.length === 0) return;

      const missing: string[] = [];
      for (const unit of units) {
        const key = unit.original.trim();
        const cached = cacheRef.current.get(key);
        if (cached) {
          apply(unit, unit.original.replace(key, cached));
        } else if (!missing.includes(key)) {
          missing.push(key);
        }
      }

      if (missing.length === 0) return;

      setIsTranslating(true);
      for (let i = 0; i < missing.length; i += 60) {
        const batch = missing.slice(i, i + 60);
        try {
          const result = await translateTexts({ data: { texts: batch, target: "hi" } });
          batch.forEach((source, index) => {
            const value = result.translations[index];
            if (value) cacheRef.current.set(source, value);
          });
        } catch (error) {
          console.error("Hindi translation batch failed", error);
        }
      }
      persistCache();

      if (languageRef.current !== "hi") return;
      const remaining = collectUnits(document.body, doneText.current, doneAttr.current);
      for (const unit of remaining) {
        const key = unit.original.trim();
        const cached = cacheRef.current.get(key);
        if (cached) apply(unit, unit.original.replace(key, cached));
      }
    } finally {
      setIsTranslating(false);
      runningRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        void translateDocument();
      }
    }
  }, [apply, persistCache]);

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

  useEffect(() => {
    if (language !== "hi") return;
    void translateDocument();

    const observer = new MutationObserver(() => {
      void translateDocument();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });
    return () => observer.disconnect();
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
