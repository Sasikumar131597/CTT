const toCount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Parses get-global-publication-country-rank/{subTechId} response.
 * API: [{ country_id, country_name, total_publication_count, top_10_publication_count, top_1_publication_count }]
 */
export function parsePublicationCountryRank(apiData) {
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
        total: toCount(
          row.total_publication_count ??
            row.total_publications ??
            row.total
        ),
        top10: toCount(
          row.top_10_publication_count ?? row.top10 ?? row.top_10
        ),
        top1: toCount(row.top_1_publication_count ?? row.top1 ?? row.top_1),
      };
    })
    .filter((row) => row.country);
}

/** Sort by total publications, highest first (USA at top of chart). */
export function sortCountriesByTotalPublications(rows) {
  return [...rows].sort((a, b) => {
    const diff = (Number(b.total) || 0) - (Number(a.total) || 0);
    if (diff !== 0) return diff;
    return a.country.localeCompare(b.country);
  });
}

/** Y-axis: highest total at top (USA first). */
export function getCountryAxisOrder(rows) {
  return sortCountriesByTotalPublications(rows).map((row) => row.country);
}

export function buildXAxisTicks(maxValue) {
  const ceiling = maxValue <= 0 ? 26000 : Math.ceil(maxValue / 2000) * 2000;
  const ticks = [];
  for (let v = 0; v <= ceiling; v += 2000) {
    ticks.push(v);
  }
  return { domain: [0, ceiling], ticks };
}
