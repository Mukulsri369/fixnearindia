import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ChipPicker({
  options,
  selected,
  onToggle,
  placeholder = "Search…",
  emptyLabel = "No matches",
  max = 400,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  max?: number;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    return list.slice(0, max);
  }, [options, query, max]);

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
          <p className="p-3 text-sm text-muted-foreground">{emptyLabel}</p>
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
