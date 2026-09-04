/**
 * Fast, typo-tolerant search over the technician onboarding catalog.
 *
 * Used by the onboarding wizard so a technician can type "split ac", "wm",
 * "ro" or "pcb" and immediately find equipment/skills/services instead of
 * hunting through segment and category tabs.
 */

import { SEGMENTS } from "./technician-catalog";

export type EquipmentEntry = {
  segmentId: string;
  segmentLabel: string;
  category: string;
  equipment: string;
  key: string;
};

/** Flat index of every equipment item in every segment/category. */
export const EQUIPMENT_INDEX: EquipmentEntry[] = SEGMENTS.flatMap((segment) =>
  segment.categories.flatMap((category) =>
    category.equipment.map((equipment) => ({
      segmentId: segment.id,
      segmentLabel: segment.label,
      category: category.name,
      equipment,
      key: `${segment.id}||${category.name}||${equipment}`,
    })),
  ),
);

function words(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+]+/i)
    .filter(Boolean);
}

function initials(value: string): string {
  return words(value)
    .map((w) => w[0])
    .join("");
}

/**
 * Score a single option against one search term.
 * Higher is better; 0 means no match.
 */
function termScore(option: string, term: string): number {
  const lower = option.toLowerCase();
  if (lower === term) return 100;
  if (lower.startsWith(term)) return 85;

  const parts = words(option);
  if (parts.some((w) => w === term)) return 80;
  if (parts.some((w) => w.startsWith(term))) return 70;
  if (term.length >= 2 && initials(option).startsWith(term)) return 65;
  if (lower.includes(term)) return 50;
  return 0;
}

/** All terms must match. Returns 0 when the option does not match the query. */
export function matchScore(option: string, query: string, extraText = ""): number {
  const terms = words(query);
  if (terms.length === 0) return 1;

  let total = 0;
  for (const term of terms) {
    const direct = termScore(option, term);
    const indirect = extraText ? termScore(extraText, term) * 0.4 : 0;
    const best = Math.max(direct, indirect);
    if (best === 0) return 0;
    total += best;
  }
  return total / terms.length;
}

/** Filter + rank a flat list of strings. */
export function rankOptions(options: string[], query: string): string[] {
  const q = query.trim();
  if (!q) return options;
  return options
    .map((option) => ({ option, score: matchScore(option, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.option.localeCompare(b.option))
    .map((r) => r.option);
}

export type EquipmentSearchGroup = {
  segmentId: string;
  segmentLabel: string;
  category: string;
  items: EquipmentEntry[];
};

/**
 * Search equipment across every segment/category, grouped by
 * "Segment - Category" and ranked by best match inside each group.
 */
export function searchEquipment(
  query: string,
  limit = 80,
  allowedSegments?: string[],
): EquipmentSearchGroup[] {
  const q = query.trim();
  if (q.length < 2) return [];

  const segmentOrder = new Map(SEGMENTS.map((s, i) => [s.id, i]));
  const allowed = allowedSegments && allowedSegments.length > 0 ? new Set(allowedSegments) : null;
  const pool = allowed ? EQUIPMENT_INDEX.filter((e) => allowed.has(e.segmentId)) : EQUIPMENT_INDEX;

  const scored = pool.map((entry) => {

    const raw = matchScore(entry.equipment, q, `${entry.category} ${entry.segmentLabel}`);
    return {
      entry,
      raw,
      // Slight preference for shorter, more canonical names inside a group.
      display: raw - entry.equipment.length * 0.15,
    };
  })
    .filter((r) => r.raw > 0)
    .sort(
      (a, b) =>
        b.raw - a.raw ||
        (segmentOrder.get(a.entry.segmentId) ?? 0) - (segmentOrder.get(b.entry.segmentId) ?? 0) ||
        b.display - a.display,
    )
    .slice(0, limit);

  const groups = new Map<string, EquipmentSearchGroup & { best: number; order: number }>();
  for (const { entry, raw } of scored) {
    const key = `${entry.segmentId}||${entry.category}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(entry);
      existing.best = Math.max(existing.best, raw);
    } else {
      groups.set(key, {
        segmentId: entry.segmentId,
        segmentLabel: entry.segmentLabel,
        category: entry.category,
        items: [entry],
        best: raw,
        order: segmentOrder.get(entry.segmentId) ?? 0,
      });
    }
  }

  return Array.from(groups.values())
    .sort((a, b) => b.best - a.best || a.order - b.order)
    .map(({ best: _best, order: _order, ...group }) => group);
}

