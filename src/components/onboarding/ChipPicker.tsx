import { useMemo, useState } from "react";
import { Check, Plus, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rankOptions } from "@/lib/catalog-search";

export function ChipPicker({
  options,
  selected,
  onToggle,
  placeholder = "Search…",
  emptyLabel = "No matches",
  max = 400,
  suggested,
  suggestedLabel = "Suggested for you",
  onSelectMany,
  onClear,
  onCustomAdd,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  max?: number;
  /** Options worth showing first (e.g. derived from earlier answers). */
  suggested?: string[];
  suggestedLabel?: string;
  /** Enables "Select all shown" / "Select all suggested". */
  onSelectMany?: (values: string[]) => void;
  /** Enables the "Clear" action. */
  onClear?: () => void;
  /** Enables "Add <query> as a custom item" when nothing matches. */
  onCustomAdd?: (query: string) => void;
}) {
  const [query, setQuery] = useState("");

  const ranked = useMemo(() => rankOptions(options, query), [options, query]);

  const filtered = useMemo(() => {
    // Keep selected items visible at the top so nothing gets lost while searching.
    const selectedShown = ranked.filter((o) => selected.includes(o));
    const rest = ranked.filter((o) => !selected.includes(o));
    return [...selectedShown, ...rest].slice(0, max);
  }, [ranked, selected, max]);

  const pendingSuggested = useMemo(
    () => (suggested ?? []).filter((s) => !selected.includes(s)),
    [suggested, selected],
  );

  const trimmedQuery = query.trim();

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      {pendingSuggested.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {suggestedLabel}
            </p>
            {onSelectMany && (
              <Button type="button" size="sm" variant="outline" onClick={() => onSelectMany(pendingSuggested)}>
                Select all {pendingSuggested.length}
              </Button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pendingSuggested.slice(0, 40).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-background px-3 py-1.5 text-xs transition-colors hover:bg-primary/10"
              >
                <Plus className="h-3 w-3" /> {option}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {selected.length} selected · {ranked.length} {trimmedQuery ? "match" : "option"}
          {ranked.length === 1 ? "" : "es"}
        </span>
        <span className="flex gap-2">
          {onSelectMany && trimmedQuery && ranked.length > 0 && ranked.length <= 40 && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onSelectMany(ranked)}>
              Select all shown
            </Button>
          )}
          {onClear && selected.length > 0 && (
            <Button type="button" size="sm" variant="ghost" onClick={onClear}>
              Clear
            </Button>
          )}
        </span>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <Badge key={s} variant="default" className="cursor-pointer" onClick={() => onToggle(s)}>
              {s} ×
            </Badge>
          ))}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto rounded-xl border border-border p-2">
        {filtered.length === 0 ? (
          <div className="space-y-2 p-3">
            <p className="text-sm text-muted-foreground">{emptyLabel}</p>
            {onCustomAdd && trimmedQuery.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  onCustomAdd(trimmedQuery);
                  setQuery("");
                }}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add “{trimmedQuery}” as a custom item
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {filtered.map((option) => {
              const active = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onToggle(option)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
