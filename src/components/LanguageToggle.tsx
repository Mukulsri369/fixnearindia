import { Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "./LanguageProvider";

export function LanguageToggle() {
  const { language, toggleLanguage, isTranslating } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      disabled={isTranslating}
      data-no-translate
      aria-label={language === "hi" ? "Switch to English" : "Switch to Hindi"}
      title={language === "hi" ? "Switch to English" : "हिंदी में देखें"}
      className="gap-1.5 font-medium"
    >
      {isTranslating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Languages className="h-4 w-4" />
      )}
      <span className="text-xs">{language === "hi" ? "EN" : "हिं"}</span>
    </Button>
  );
}
