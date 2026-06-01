function toRows(apiData) {
  if (apiData == null) return [];
  if (Array.isArray(apiData)) return apiData;
  if (Array.isArray(apiData.data)) return apiData.data;
  if (Array.isArray(apiData.result)) return apiData.result;
  return [];
}

function toCount(value) {
  if (value === undefined || value === null || value === "") return 0;
  const num = Number(String(value).replace(/,/g, ""));
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Parses get-publication-trendline-country/{subTechId}/{countryId} response.
 * Expected rows: { year, total_publications, top_10_publication_count, top_1_publication_count }
 */
export function parsePublicationTrendline(apiData) {
  return toRows(apiData)
    .map((row) => {
      const year = Number(row.year ?? row.pub_year);
      if (!Number.isFinite(year)) return null;

      return {
        year,
        total: toCount(
          row.total_publications ??
            row.total_publication_count ??
            row.total
        ),
        top10: toCount(
          row.top_10_publication_count ??
            row.top_10_publications ??
            row.top10
        ),
        top1: toCount(
          row.top_1_publication_count ??
            row.top_1_publications ??
            row.top1
        ),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.year - b.year);
}

/** Recharts rows with display keys matching the design legend. */
export function toPublicationTrendChartRows(parsed) {
  return parsed.map((row) => ({
    year: row.year,
    "Total Publications": row.total,
    "Top 10% Highly Cited Publications": row.top10,
    "Top 1% Highly Cited Publications": row.top1,
  }));
}

/** X-axis ticks every `gap` years (e.g. 2003, 2006, …, 2024). */
export function getYearTicksWithGap(data, gap = 3) {
  if (!data?.length) return [];
  const years = data.map((d) => Number(d.year)).filter((y) => !Number.isNaN(y));
  if (!years.length) return [];

  const startYear = Math.min(...years);
  const endYear = Math.max(...years);
  const ticks = [];

  for (let y = startYear; y <= endYear; y += gap) {
    ticks.push(y);
  }
  if (!ticks.includes(endYear)) ticks.push(endYear);
  return ticks;
}

export function getYAxisMax(data) {
  if (!data?.length) return 12000;
  let max = 0;
  data.forEach((row) => {
    max = Math.max(
      max,
      row["Total Publications"] ?? 0,
      row["Top 10% Highly Cited Publications"] ?? 0,
      row["Top 1% Highly Cited Publications"] ?? 0
    );
  });
  if (max <= 0) return 12000;
  const step = max <= 3000 ? 1000 : max <= 9000 ? 3000 : 4000;
  return Math.ceil(max / step) * step;
}
