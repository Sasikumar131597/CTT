const toCount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Parses get-global-patents-country-rank/{subTechId} response.
 * Expected: [{ country_id, country_name, Patent_granted, Patents_applied, ... }]
 */
export function parsePatentCountryRank(apiData) {
  const rows = Array.isArray(apiData)
    ? apiData
    : apiData?.data ?? apiData?.result ?? [];

  return rows
    .map((row) => {
      const countryId = String(row.country_id ?? row.id ?? "");
      const countryName =
        row.country_name ?? row.country ?? row.name ?? "Unknown";

      return {
        countryId,
        country: countryName,
        granted: toCount(
          row.Patent_granted ??
            row.patent_granted ??
            row.patents_granted ??
            row.granted ??
            row.total_patents_granted
        ),
        applied: toCount(
          row.Patents_applied ??
            row.patents_applied ??
            row.patent_applied ??
            row.applied ??
            row.total_patents_applied
        ),
      };
    })
    .filter((row) => row.country);
}

export function patentActivityTotal(row) {
  return (Number(row.granted) || 0) + (Number(row.applied) || 0);
}

export const TOP_PATENT_COUNTRIES = 10;

/** Highest combined patent activity first (left on chart). */
export function sortCountriesByPatentActivity(rows) {
  return [...rows].sort((a, b) => {
    const diff = patentActivityTotal(b) - patentActivityTotal(a);
    if (diff !== 0) return diff;
    return a.country.localeCompare(b.country);
  });
}

/** Top N countries by granted + applied (default 10). */
export function takeTopCountriesByPatentActivity(
  rows,
  limit = TOP_PATENT_COUNTRIES
) {
  return sortCountriesByPatentActivity(rows).slice(0, limit);
}

/** Sum granted/applied by country from multiline patent API rows. */
export function aggregatePatentsFromMultiline(apiData) {
  const rows = Array.isArray(apiData)
    ? apiData
    : apiData?.data ?? apiData?.result ?? [];

  const byCountry = new Map();

  rows.forEach((row) => {
    const countryId = String(row.country_id ?? row.id ?? "");
    const countryName =
      row.country_name ?? row.country ?? row.name ?? "Unknown";
    if (!countryId && !countryName) return;

    const key = countryId || countryName;
    if (!byCountry.has(key)) {
      byCountry.set(key, {
        country_id: countryId,
        country_name: countryName,
        Patent_granted: 0,
        Patents_applied: 0,
      });
    }

    const acc = byCountry.get(key);
    acc.Patent_granted += toCount(row.Patent_granted ?? row.patent_granted);
    acc.Patents_applied += toCount(row.Patents_applied ?? row.patents_applied);
  });

  return [...byCountry.values()];
}

export function buildPatentYAxisTicks(maxValue) {
  const ceiling = maxValue <= 0 ? 6000 : Math.ceil(maxValue / 1000) * 1000;
  const ticks = [];
  for (let v = 0; v <= ceiling; v += 1000) {
    ticks.push(v);
  }
  return { domain: [0, ceiling], ticks };
}
