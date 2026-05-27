import {
  CHART_COUNTRIES,
  CHART_YEAR_END,
  CHART_YEAR_START,
} from "./trendsChartConfig";

const METRIC_SCALE = {
  "total-publications": 1,
  "top10-cited": 0.42,
  "top1-cited": 0.12,
  "patent-granted": 0.28,
  "patent-applied": 0.35,
};

const TIER_BASE = { 1: 1, 2: 0.38, 3: 0.14 };

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function growthCurve(year, countryKey, metricId) {
  const t = (year - CHART_YEAR_START) / (CHART_YEAR_END - CHART_YEAR_START);
  const seed = hashSeed(`${countryKey}-${metricId}`) % 1000;
  const noise = ((seed % 40) - 20) / 100;
  const accel = year >= 2016 ? (year - 2015) * 0.06 : 0;
  return 0.15 + t * 0.55 + t * t * 0.35 + accel + noise * 0.08;
}

/**
 * Placeholder time-series until trend APIs are connected.
 * Shape: [{ year: 2003, usa: 120, china: 95, ... }, ...]
 */
export function generateMockTrendSeries(metricId, yearFrom, yearTo) {
  const scale = METRIC_SCALE[metricId] ?? 1;
  const maxY = 2800;

  const years = [];
  for (let y = yearFrom; y <= yearTo; y += 1) years.push(y);

  return years.map((year) => {
    const point = { year };
    CHART_COUNTRIES.forEach((country) => {
      const tierMul = TIER_BASE[country.tier] ?? 0.1;
      const curve = growthCurve(year, country.key, metricId);
      const raw = maxY * tierMul * curve * scale;
      point[country.key] = Math.max(0, Math.round(raw));
    });
    return point;
  });
}
