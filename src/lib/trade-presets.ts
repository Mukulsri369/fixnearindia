/**
 * Quick-pick trade presets for technician onboarding.
 *
 * A technician taps their trade once and gets the typical equipment, skills
 * and services pre-selected, then trims what does not apply. Every value is
 * validated against the master catalog at module load so a rename in the
 * catalog can never produce an invalid selection.
 */

import { SEGMENTS, SKILL_GROUPS, SERVICES } from "./technician-catalog";

export type PresetEquipment = { segment: string; category: string; equipment: string };

type RawPreset = {
  id: string;
  label: string;
  description: string;
  segments: string[];
  /** [segmentId, categoryName, equipment names] */
  equipment: [string, string, string[]][];
  skillGroups: string[];
  services: string[];
};

const COMMON_SERVICES = ["Repair", "Diagnosis / Inspection", "Cleaning / Servicing", "Spare Parts Replacement"];

const RAW_PRESETS: RawPreset[] = [
  {
    id: "ac-refrigeration",
    label: "AC & Refrigeration",
    description: "Split/window AC, fridge, cooler, deep freezer",
    segments: ["home"],
    equipment: [
      [
        "home",
        "AC / Cooling",
        ["Split AC", "Inverter AC", "Window AC", "Cassette AC", "Ductable AC", "Air Cooler", "Ceiling Fan"],
      ],
      [
        "home",
        "Refrigeration",
        [
          "Single-Door Refrigerator",
          "Double-Door Refrigerator",
          "Side-by-Side Refrigerator",
          "Inverter Refrigerator",
          "Deep Freezer",
          "Water Cooler",
        ],
      ],
    ],
    skillGroups: ["HVAC / Refrigeration", "Electrical", "Electronics / PCB"],
    services: [...COMMON_SERVICES, "Installation", "Gas Charging", "Leak Detection", "Preventive Maintenance", "AMC"],
  },
  {
    id: "washing-laundry",
    label: "Washing Machine & Laundry",
    description: "Top-load, front-load, dryers, irons",
    segments: ["home"],
    equipment: [
      [
        "home",
        "Washing / Laundry",
        [
          "Semi-Automatic Washing Machine",
          "Fully Automatic Top-Load Washing Machine",
          "Fully Automatic Front-Load Washing Machine",
          "Washer-Dryer",
          "Clothes Dryer",
        ],
      ],
    ],
    skillGroups: ["Mechanical / Electromechanical", "Electrical", "Electronics / PCB"],
    services: [...COMMON_SERVICES, "Installation", "Component Replacement", "AMC"],
  },
  {
    id: "home-appliance",
    label: "Home Appliances",
    description: "Kitchen appliances, geyser, RO, TV",
    segments: ["home"],
    equipment: [
      [
        "home",
        "Kitchen",
        ["Mixer Grinder", "Microwave Oven", "OTG", "Induction Cooktop", "Chimney", "Gas Stove", "Dishwasher"],
      ],
      ["home", "Geyser / Water Heating", ["Electric Geyser", "Instant Geyser", "Storage Geyser", "Solar Water Heater"]],
      ["home", "Water Purification", ["Domestic RO", "RO + UV Purifier", "UV Water Purifier", "Water Dispenser"]],
      ["home", "TV / Entertainment", ["LED TV", "Smart TV", "Home Theatre", "Soundbar"]],
    ],
    skillGroups: ["Electrical", "Electronics / PCB", "Mechanical / Electromechanical", "Water Treatment"],
    services: [...COMMON_SERVICES, "Installation", "Troubleshooting", "AMC"],
  },
  {
    id: "ro-water",
    label: "RO & Water Purifier",
    description: "RO, UV, UF, softeners, dispensers",
    segments: ["home"],
    equipment: [
      [
        "home",
        "Water Purification",
        [
          "Domestic RO",
          "RO + UV Purifier",
          "UV Water Purifier",
          "UF Water Purifier",
          "Alkaline Water Purifier",
          "Water Dispenser",
          "Water Softener",
          "RO Pump",
          "RO SMPS",
        ],
      ],
    ],
    skillGroups: ["Water Treatment", "Electrical"],
    services: [...COMMON_SERVICES, "Installation", "Preventive Maintenance", "AMC"],
  },
  {
    id: "computer-it",
    label: "Computer & IT",
    description: "Laptops, desktops, printers, networking",
    segments: ["home", "commercial"],
    equipment: [
      [
        "home",
        "Computer / IT",
        [
          "Laptop",
          "Desktop PC",
          "All-in-One PC",
          "Computer Monitor",
          "Printer",
          "Laser Printer",
          "Inkjet Printer",
          "Wi-Fi Router",
        ],
      ],
      ["commercial", "Office IT", ["Desktop Computer", "Laptop", "Server", "Network Switch", "Wi-Fi Access Point", "Printer"]],
    ],
    skillGroups: ["IT / Software", "Electronics / PCB", "Electrical"],
    services: [...COMMON_SERVICES, "Installation", "Configuration", "Troubleshooting", "AMC"],
  },
  {
    id: "mobile-devices",
    label: "Mobile & Smart Devices",
    description: "Phones, tablets, watches, earbuds",
    segments: ["home"],
    equipment: [
      [
        "home",
        "Mobile / Smart Devices",
        ["Smartphone", "Tablet", "Smartwatch", "Bluetooth Earbuds", "Bluetooth Headphones", "Power Bank"],
      ],
    ],
    skillGroups: ["Electronics / PCB", "IT / Software"],
    services: [...COMMON_SERVICES, "Component Replacement", "PCB Repair", "Troubleshooting"],
  },
  {
    id: "cctv-security",
    label: "CCTV & Security",
    description: "Cameras, DVR/NVR, door locks, alarms",
    segments: ["home", "commercial"],
    equipment: [
      [
        "home",
        "Cctv / Security",
        ["CCTV Camera", "IP Camera", "Wi-Fi Camera", "DVR", "NVR", "Video Door Phone", "Biometric Lock", "Home Alarm System"],
      ],
    ],
    skillGroups: ["Electrical", "Electronics / PCB", "IT / Software"],
    services: [...COMMON_SERVICES, "Installation", "Configuration", "Commissioning", "AMC"],
  },
  {
    id: "electrical",
    label: "Electrical & Lighting",
    description: "Wiring, lighting, inverters, stabilizers",
    segments: ["home"],
    equipment: [
      ["home", "Electrical / Lighting", ["LED Bulb", "LED Panel", "Floodlight", "MCB", "RCCB", "Distribution Board", "Switchboard"]],
      ["home", "Power Backup", ["Home Inverter", "Inverter Battery", "Home UPS", "Stabilizer", "Solar Inverter"]],
    ],
    skillGroups: ["Electrical", "Electronics / PCB"],
    services: [...COMMON_SERVICES, "Installation", "Electrical Repair", "Troubleshooting", "AMC"],
  },
  {
    id: "commercial-kitchen",
    label: "Commercial Kitchen & Cooling",
    description: "Hotel/restaurant kitchen and cold storage",
    segments: ["commercial"],
    equipment: [
      [
        "commercial",
        "Commercial Refrigeration",
        ["Commercial Refrigerator", "Display Cooler", "Deep Freezer", "Ice Machine", "Cold Room", "Refrigeration Compressor"],
      ],
      [
        "commercial",
        "Commercial Kitchen",
        ["Commercial Oven", "Bakery Oven", "Commercial Fryer", "Commercial Induction", "Dough Mixer", "Dishwasher"],
      ],
    ],
    skillGroups: ["HVAC / Refrigeration", "Electrical", "Mechanical / Electromechanical"],
    services: [...COMMON_SERVICES, "Installation", "Gas Charging", "Preventive Maintenance", "Emergency Repair", "AMC"],
  },
  {
    id: "industrial-automation",
    label: "Industrial Automation",
    description: "PLC, HMI, VFD, motors, panels",
    segments: ["industrial"],
    equipment: [
      ["industrial", "PLC / Automation", ["PLC", "HMI", "SCADA", "Motion Controller", "Industrial PC"]],
      ["industrial", "Motors & Drives", ["Three-Phase Motor", "Induction Motor", "Servo Motor", "Gearbox", "VFD"]],
      ["industrial", "Industrial Electrical", ["Industrial UPS", "SMPS", "Transformer", "Servo Stabilizer"]],
    ],
    skillGroups: ["Automation", "Electrical", "Electronics / PCB", "Mechanical / Electromechanical"],
    services: [...COMMON_SERVICES, "Programming", "Configuration", "Commissioning", "Calibration", "Emergency Repair", "AMC"],
  },
];

/* ------------------------------------------------------------------ */
/* Validation against the master catalog                               */
/* ------------------------------------------------------------------ */

const catalogIndex = new Map<string, Set<string>>();
for (const segment of SEGMENTS) {
  for (const category of segment.categories) {
    catalogIndex.set(`${segment.id}||${category.name}`, new Set(category.equipment));
  }
}

const skillGroupIndex = new Map(SKILL_GROUPS.map((g) => [g.name, g.skills]));
const serviceSet = new Set(SERVICES);

export type TradePreset = {
  id: string;
  label: string;
  description: string;
  segments: string[];
  equipment: PresetEquipment[];
  skills: string[];
  services: string[];
};

export const TRADE_PRESETS: TradePreset[] = RAW_PRESETS.map((preset) => {
  const equipment: PresetEquipment[] = [];
  for (const [segment, category, items] of preset.equipment) {
    const valid = catalogIndex.get(`${segment}||${category}`);
    if (!valid) continue;
    for (const item of items) {
      if (valid.has(item)) equipment.push({ segment, category, equipment: item });
    }
  }

  // Keep the pre-selection tight — the technician can add more from the full list.
  const skills = Array.from(new Set(preset.skillGroups.flatMap((name) => (skillGroupIndex.get(name) ?? []).slice(0, 8))));
  const services = preset.services.filter((s) => serviceSet.has(s));

  return { ...preset, equipment, skills, services };
}).filter((preset) => preset.equipment.length > 0);

/* ------------------------------------------------------------------ */
/* Suggested skills for the equipment a technician already picked      */
/* ------------------------------------------------------------------ */

/** Equipment category -> relevant skill group names. */
const CATEGORY_SKILL_GROUPS: Record<string, string[]> = {
  "AC / Cooling": ["HVAC / Refrigeration", "Electrical", "Electronics / PCB"],
  Refrigeration: ["HVAC / Refrigeration", "Electrical", "Electronics / PCB"],
  "Washing / Laundry": ["Mechanical / Electromechanical", "Electrical", "Electronics / PCB"],
  Kitchen: ["Electrical", "Electronics / PCB", "Mechanical / Electromechanical"],
  "Water Purification": ["Water Treatment", "Electrical"],
  "Geyser / Water Heating": ["Electrical", "Mechanical / Electromechanical"],
  "Power Backup": ["Electrical", "Electronics / PCB"],
  "TV / Entertainment": ["Electronics / PCB", "Electrical"],
  "Computer / IT": ["IT / Software", "Electronics / PCB"],
  "Mobile / Smart Devices": ["Electronics / PCB", "IT / Software"],
  "Cctv / Security": ["Electrical", "Electronics / PCB", "IT / Software"],
  "Home Automation": ["IT / Software", "Electrical", "Electronics / PCB"],
  "Electrical / Lighting": ["Electrical"],
  "Personal Electronics": ["Electronics / PCB"],
  Fitness: ["Mechanical / Electromechanical", "Electronics / PCB"],
  "Commercial Refrigeration": ["HVAC / Refrigeration", "Electrical", "Mechanical / Electromechanical"],
  "Commercial Kitchen": ["Electrical", "Mechanical / Electromechanical", "HVAC / Refrigeration"],
  "Restaurant / Food Service": ["Electrical", "Mechanical / Electromechanical"],
  "Commercial Laundry": ["Mechanical / Electromechanical", "Electrical"],
  "Office IT": ["IT / Software", "Electronics / PCB"],
  "Commercial Power": ["Electrical", "Electronics / PCB"],
  "Commercial HVAC": ["HVAC / Refrigeration", "Electrical", "Automation"],
  "Commercial Security": ["Electrical", "Electronics / PCB", "IT / Software"],
  "Building Equipment": ["Mechanical / Electromechanical", "Electrical", "Automation"],
  "Commercial Water Systems": ["Water Treatment", "Mechanical / Electromechanical"],
  Retail: ["IT / Software", "Electronics / PCB"],
  Salon: ["Electrical", "Electronics / PCB"],
  "Commercial Gym": ["Mechanical / Electromechanical", "Electronics / PCB"],
  Hotel: ["Electrical", "Mechanical / Electromechanical"],
  "Industrial Electrical": ["Electrical", "Electronics / PCB"],
  "Motors & Drives": ["Electrical", "Mechanical / Electromechanical", "Automation"],
  "PLC / Automation": ["Automation", "Electrical"],
  Instrumentation: ["Automation", "Electronics / PCB"],
  "CNC / Machine Tools": ["CNC", "Automation", "Mechanical / Electromechanical"],
  Robotics: ["Robotics", "Automation"],
  "Production Machinery": ["Mechanical / Electromechanical", "Automation", "Electrical"],
  Packaging: ["Mechanical / Electromechanical", "Automation"],
  "Plastic Machinery": ["Mechanical / Electromechanical", "Automation"],
  Textile: ["Mechanical / Electromechanical", "Electrical"],
  "Food Processing": ["Mechanical / Electromechanical", "Automation"],
  Pharmaceutical: ["Automation", "Mechanical / Electromechanical"],
  Pumps: ["Mechanical / Electromechanical", "Electrical"],
  "Compressors / Pneumatics": ["Mechanical / Electromechanical", "Electrical"],
  "Industrial HVAC / Refrigeration": ["HVAC / Refrigeration", "Electrical"],
  "Welding / Cutting": ["Electrical", "Mechanical / Electromechanical"],
  "Material Handling": ["Mechanical / Electromechanical", "Electrical"],
  "Construction / Mining": ["Mechanical / Electromechanical", "Electrical"],
  "Water / Wastewater": ["Water Treatment", "Electrical", "Automation"],
  "Printing / Paper": ["Mechanical / Electromechanical", "Automation"],
  "Power Generation / Renewable": ["Electrical", "Electronics / PCB"],
  "Fire / Industrial Safety": ["Electrical", "Electronics / PCB"],
  "Laboratory / Testing": ["Electronics / PCB", "Automation"],
  "Agriculture / Agro-Processing": ["Mechanical / Electromechanical", "Electrical"],
};

/** Skills worth suggesting for the equipment categories already selected. */
export function suggestedSkillsForCategories(categories: string[]): string[] {
  const groups = new Set<string>();
  for (const category of categories) {
    for (const group of CATEGORY_SKILL_GROUPS[category] ?? []) groups.add(group);
  }
  return Array.from(new Set(Array.from(groups).flatMap((name) => skillGroupIndex.get(name) ?? [])));
}

/** Services most technicians offer — surfaced first on the services step. */
export const POPULAR_SERVICES: string[] = [
  "Repair",
  "Diagnosis / Inspection",
  "Installation",
  "Cleaning / Servicing",
  "Preventive Maintenance",
  "Spare Parts Replacement",
  "Troubleshooting",
  "AMC",
].filter((s) => serviceSet.has(s));

/* ------------------------------------------------------------------ */
/* Per-category quick starts, generated from the master catalog        */
/* ------------------------------------------------------------------ */

const CATEGORY_PRESET_SERVICES = [...COMMON_SERVICES, "Installation", "Troubleshooting", "Preventive Maintenance", "AMC"].filter(
  (s) => serviceSet.has(s),
);

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** One quick-start card per equipment category, so every segment has suggestions. */
export const CATEGORY_PRESETS: TradePreset[] = SEGMENTS.flatMap((segment) =>
  segment.categories.map((category) => {
    const items = category.equipment.slice(0, 12);
    const skillGroups = CATEGORY_SKILL_GROUPS[category.name] ?? ["Electrical", "Mechanical / Electromechanical"];
    return {
      id: `cat-${segment.id}-${slug(category.name)}`,
      label: category.name,
      description: items.slice(0, 4).join(", ") + (category.equipment.length > 4 ? " & more" : ""),
      segments: [segment.id],
      equipment: items.map((equipment) => ({ segment: segment.id, category: category.name, equipment })),
      skills: Array.from(new Set(skillGroups.flatMap((name) => (skillGroupIndex.get(name) ?? []).slice(0, 8)))),
      services: CATEGORY_PRESET_SERVICES,
    } satisfies TradePreset;
  }),
);

/**
 * Quick starts relevant to the segments the technician selected: the curated
 * trade bundles first, then a card for every category inside those segments.
 */
export function presetsForSegments(selected: string[]): TradePreset[] {
  const active = selected.length ? selected : SEGMENTS.map((s) => s.id);
  const curated = TRADE_PRESETS.filter((p) => p.segments.some((s) => active.includes(s))).map((p) => ({
    ...p,
    segments: p.segments.filter((s) => active.includes(s)),
    equipment: p.equipment.filter((e) => active.includes(e.segment)),
  }));
  const byCategory = CATEGORY_PRESETS.filter((p) => active.includes(p.segments[0]!));
  return [...curated.filter((p) => p.equipment.length > 0), ...byCategory];
}
