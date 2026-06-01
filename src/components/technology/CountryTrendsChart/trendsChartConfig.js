export const CHART_YEAR_START = 2003;
export const CHART_YEAR_END = 2024;

/** Patent metrics: solid lines through this year; 2023–2024 shown grey/dashed. */
export const PATENT_SPLIT_YEAR = 2023;

export const METRIC_OPTIONS = [
  {
    id: "total-publications",
    label: "Total Publications",
    shortLabel: "Total Publications",
    apiKey: "total_publication_count",
    type: "publication",
  },
  {
    id: "top10-cited",
    label: "Top 10% Highly Cited Publications",
    shortLabel: "Top 10% Highly Cited",
    apiKey: "top_10_publication_count",
    type: "publication",
  },
  {
    id: "top1-cited",
    label: "Top 1% Highly Cited Publications",
    shortLabel: "Top 1% Highly Cited",
    apiKey: "top_1_publication_count",
    type: "publication",
  },
  {
    id: "patent-granted",
    label: "Patent Granted",
    shortLabel: "Patent Granted",
    apiKey: "Patent_granted",
    type: "patent",
  },
  {
    id: "patent-applied",
    label: "Patent Applied",
    shortLabel: "Patent Applied",
    apiKey: "Patents_applied",
    type: "patent",
  },
];

/** Individual years for multi-select (2003 … 2024). */
export function buildYearOptions() {
  const options = [];
  for (let y = CHART_YEAR_START; y <= CHART_YEAR_END; y += 1) {
    options.push({ value: String(y), label: String(y) });
  }
  return options;
}

/** Extended distinct color palette for dynamic country assignment. */
const COLOR_PALETTE = [
  "#2563eb", "#ec4899", "#22c55e", "#f97316", "#a855f7",
  "#14b8a6", "#eab308", "#f43f5e", "#6366f1", "#0ea5e9",
  "#84cc16", "#d946ef", "#fb7185", "#2dd4bf", "#fbbf24",
  "#4ade80", "#c084fc", "#38bdf8", "#fb923c", "#94a3b8",
  "#e11d48", "#0891b2", "#65a30d", "#7c3aed", "#b45309",
  "#0f766e", "#be123c", "#1d4ed8", "#15803d", "#c2410c",
  "#7e22ce", "#0369a1", "#166534", "#9a3412", "#6d28d9",
  "#0e7490", "#4d7c0f", "#92400e", "#5b21b6", "#155e75",
];

/** Well-known country name → key mappings for normalisation. */
const COUNTRY_NAME_TO_KEY = {
  "united states": "usa",
  "united states of america": "usa",
  "usa": "usa",
  "u.s.a.": "usa",
  "china": "china",
  "people's republic of china": "china",
  "germany": "germany",
  "united kingdom": "uk",
  "uk": "uk",
  "great britain": "uk",
  "japan": "japan",
  "canada": "canada",
  "italy": "italy",
  "india": "india",
  "france": "france",
  "australia": "australia",
  "russia": "russia",
  "russian federation": "russia",
  "switzerland": "switzerland",
  "netherlands": "netherlands",
  "south korea": "south_korea",
  "republic of korea": "south_korea",
  "korea": "south_korea",
  "singapore": "singapore",
  "brazil": "brazil",
  "iran": "iran",
  "islamic republic of iran": "iran",
  "taiwan": "taiwan",
  "uae": "uae",
  "united arab emirates": "uae",
  "norway": "norway",
  "sweden": "sweden",
  "denmark": "denmark",
  "finland": "finland",
  "austria": "austria",
  "belgium": "belgium",
  "spain": "spain",
  "portugal": "portugal",
  "poland": "poland",
  "turkey": "turkey",
  "turkiye": "turkey",
  "mexico": "mexico",
  "argentina": "argentina",
  "chile": "chile",
  "colombia": "colombia",
  "south africa": "south_africa",
  "egypt": "egypt",
  "nigeria": "nigeria",
  "kenya": "kenya",
  "israel": "israel",
  "saudi arabia": "saudi_arabia",
  "pakistan": "pakistan",
  "bangladesh": "bangladesh",
  "malaysia": "malaysia",
  "indonesia": "indonesia",
  "thailand": "thailand",
  "vietnam": "vietnam",
  "philippines": "philippines",
  "new zealand": "new_zealand",
  "czech republic": "czechia",
  "czechia": "czechia",
  "hungary": "hungary",
  "greece": "greece",
  "romania": "romania",
  "ukraine": "ukraine",
};

/**
 * Normalises a country name to a consistent camelCase-safe key.
 * Falls back to slug-converting the raw name.
 */
export function normaliseCountryKey(name = "") {
  const lower = name.trim().toLowerCase();
  return (
    COUNTRY_NAME_TO_KEY[lower] ??
    lower.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
  );
}

/**
 * Given a list of country names (strings), returns an array of
 * { key, name, color } objects with a unique color per country.
 */
export function buildDynamicCountries(countryNames = []) {
  return countryNames.map((name, idx) => ({
    key: normaliseCountryKey(name),
    name,
    color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
  }));
}

export const Y_AXIS_TICKS = [0, 700, 1400, 2100, 2800];

// Fixed fallback country set for instantly rendering charts while
// trend APIs are loading (or timing out).
export const CHART_COUNTRIES = [
  { key: "usa", name: "United States", tier: 1 },
  { key: "china", name: "China", tier: 1 },
  { key: "germany", name: "Germany", tier: 1 },
  { key: "uk", name: "United Kingdom", tier: 1 },
  { key: "japan", name: "Japan", tier: 1 },
  { key: "india", name: "India", tier: 1 },

  { key: "france", name: "France", tier: 2 },
  { key: "canada", name: "Canada", tier: 2 },
  { key: "italy", name: "Italy", tier: 2 },
  { key: "south_korea", name: "South Korea", tier: 2 },
  { key: "singapore", name: "Singapore", tier: 2 },
  { key: "brazil", name: "Brazil", tier: 2 },
  { key: "iran", name: "Iran", tier: 2 },
  { key: "australia", name: "Australia", tier: 2 },

  { key: "russia", name: "Russia", tier: 3 },
  { key: "mexico", name: "Mexico", tier: 3 },
];
