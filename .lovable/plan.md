# Make equipment & skills selection fast during technician onboarding

Today a technician must open the right segment, then the right category tab, and hunt through long chip lists (step 4 equipment, step 4/6 skills, services). The catalog is huge, so registration feels heavy. The fix is to let them find things by typing, and to pre-fill common trades in one tap.

## What changes for the technician

1. **One global search box across the whole catalog (step 4)**
   Type "split ac", "washing machine", "PCB" and see matches from every segment and category at once, grouped by `Segment - Category`, each result selectable inline. No tab hopping required. Tabs stay for browsing.

2. **Quick-pick trade presets**
   A row of common trade cards at the top of step 4 (examples: AC & Refrigeration, Washing Machine & Laundry, Home Appliance, Computer / IT, Mobile Devices, CCTV & Security, Electrical, Industrial Automation). One tap selects the typical equipment + skills + services for that trade, which the technician can then trim. This turns a 50-tap flow into ~3 taps.

3. **Smart skill and service suggestions**
   Once equipment is chosen, the skills step shows a "Suggested for your equipment" block first (derived from the selected categories) with a "Select all suggested" action, and the full searchable list below. Same treatment for services: most-used services (Repair, Diagnosis, Installation, Servicing, AMC) surface first.

4. **Better picker ergonomics (all chip pickers)**
   - Match count and "Select all shown" / "Clear" actions.
   - Selected chips pinned at the top of results so nothing gets lost while searching.
   - Fuzzy-ish matching: word-prefix and abbreviation matches ("ac", "wm", "ro") in addition to substring.
   - Selection counts shown on each category tab so progress is visible.

5. **Nothing found path**
   If search returns nothing, offer "Add \"<query>\" as a custom item" which files it through the existing custom catalog request flow instead of dead-ending.

No changes to what gets saved, to the database, or to the approval flow — only how items are found and selected.

## Technical notes

- New `src/lib/catalog-search.ts`: builds a flat index from `SEGMENTS` (segment id/label, category, equipment) plus skills and services, with a scoring matcher (exact > word prefix > substring > abbreviation) and grouped result output. Memoized once at module level.
- New `src/lib/trade-presets.ts`: preset definitions mapping a trade to `{ segments, equipment: EquipmentPick[], skills, services }` drawn from existing catalog constants so values stay valid.
- Extend `src/components/onboarding/ChipPicker.tsx`: optional `groups`, `suggested`, `onSelectAll`, `onClear`, `onCustomAdd` props; pin selected chips; use the new matcher. Existing call sites keep working with the current flat `options` prop.
- `src/routes/register-technician.tsx`: step 4 gains the global search panel + preset row (existing segment/category tabs kept, with counts); skills and services steps gain the suggested block; skill suggestions derive from selected equipment categories using a mapping added alongside the presets file.
- Custom-item requests reuse the existing custom catalog request server function; no new endpoint.
