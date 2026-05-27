/**
 * Maps API trend responses to chart series format.
 * Expected future shape (example):
 * [{ year: 2010, country_id: "12", country_name: "India", value: 450 }, ...]
 */
export function mapApiTrendToSeries(apiData, countryKeyField = "country_name") {
  const rows = Array.isArray(apiData)
    ? apiData
    : apiData?.data ?? apiData?.result ?? [];

  if (!rows.length) return [];

  const byYear = new Map();

  rows.forEach((row) => {
    const year = Number(row.year ?? row.pub_year ?? row.patent_year);
    if (Number.isNaN(year)) return;

    const countryKey = String(
      row.country_key ??
        row.country_code ??
        (row[countryKeyField] || "")
          .toLowerCase()
          .replace(/\s+/g, "_")
    );

    const value = Number(
      row.value ??
        row.count ??
        row.total_publications ??
        row.total_patents ??
        row.publication_count ??
        row.patent_count ??
        0
    );

    if (!byYear.has(year)) byYear.set(year, { year });
    byYear.get(year)[countryKey] = value;
  });

  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

/**
 * Sort countries by rank for the active metric (highest value first).
 * Uses the latest year in the selected range; falls back to sum in range.
 */
export function sortCountriesByRanking(
  chartData,
  countries,
  yearFrom,
  yearTo
) {
  if (!countries?.length) return [];

  const rowsInRange = (chartData ?? []).filter((row) => {
    const y = Number(row?.year);
    return Number.isFinite(y) && y >= yearFrom && y <= yearTo;
  });

  const latestRow = rowsInRange.reduce((best, row) => {
    if (!best) return row;
    return Number(row.year) > Number(best.year) ? row : best;
  }, null);

  const scored = countries.map((country) => {
    let rankValue = 0;
    if (latestRow) {
      rankValue = Number(latestRow[country.key]) || 0;
    }
    if (rankValue === 0 && rowsInRange.length) {
      rankValue = rowsInRange.reduce(
        (sum, row) => sum + (Number(row[country.key]) || 0),
        0
      );
    }
    return { ...country, rankValue };
  });

  scored.sort(
    (a, b) =>
      b.rankValue - a.rankValue || a.name.localeCompare(b.name)
  );

  return scored.map((country, index) => ({
    ...country,
    rank: index + 1,
  }));
}
