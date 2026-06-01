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
 * Parses get-patent-trendline-country/{subTechId}/{countryId} response.
 */
export function parsePatentTrendline(apiData) {
  return toRows(apiData)
    .map((row) => {
      const year = Number(row.year ?? row.patent_year);
      if (!Number.isFinite(year)) return null;

      return {
        year,
        granted: toCount(
          row.Patent_granted ??
            row.patent_granted ??
            row.patents_granted ??
            row.granted
        ),
        applied: toCount(
          row.Patents_applied ??
            row.patents_applied ??
            row.patent_applied ??
            row.applied
        ),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.year - b.year);
}

export function toPatentTrendChartRows(parsed) {
  return parsed.map((row) => ({
    year: row.year,
    "Patent Granted": row.granted,
    "Patents Applied": row.applied,
  }));
}

export function getAllYearTicks(data) {
  if (!data?.length) return [];
  return data.map((d) => d.year);
}

const PATENT_Y_STEP = 650;

export function getPatentYAxisMax(data) {
  if (!data?.length) return 2600;
  let max = 0;
  data.forEach((row) => {
    max = Math.max(
      max,
      row["Patent Granted"] ?? 0,
      row["Patents Applied"] ?? 0
    );
  });
  if (max <= 0) return 2600;
  return Math.max(PATENT_Y_STEP, Math.ceil(max / PATENT_Y_STEP) * PATENT_Y_STEP);
}

export function getPatentYTicks(yMax) {
  const ticks = [];
  for (let v = 0; v <= yMax; v += PATENT_Y_STEP) {
    ticks.push(v);
  }
  return ticks;
}
