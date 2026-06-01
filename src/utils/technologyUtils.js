export function flattenSubTechnologies(technologies) {
  const list = Array.isArray(technologies) ? technologies : technologies?.data ?? [];
  return list.flatMap((tech) =>
    (tech.sub_techs ?? []).map((sub) => ({
      ...sub,
      tech_id: tech.tech_id,
      technology_name: tech.technology_name,
    }))
  );
}

export function findSubTechnology(technologies, subTechId) {
  const id = String(subTechId);
  return flattenSubTechnologies(technologies).find(
    (sub) => String(sub.sub_tech_id) === id
  );
}

export function buildTechnologyOptions(technologies) {
  return flattenSubTechnologies(technologies).map((sub) => ({
    value: String(sub.sub_tech_id),
    label: sub.sub_tech_name.trim(),
  }));
}

export function findParentTechnology(technologies, subTechId) {
  const id = String(subTechId);
  const list = Array.isArray(technologies) ? technologies : technologies?.data ?? [];
  return list.find((tech) =>
    (tech.sub_techs ?? []).some((sub) => String(sub.sub_tech_id) === id)
  );
}

export function filterTechnologies(technologies, search) {
  const list = Array.isArray(technologies) ? technologies : technologies?.data ?? [];
  if (!search.trim()) return list;

  const kw = search.toLowerCase();
  return list
    .map((tech) => ({
      ...tech,
      sub_techs: (tech.sub_techs ?? []).filter((sub) =>
        sub.sub_tech_name.toLowerCase().includes(kw)
      ),
    }))
    .filter(
      (tech) =>
        tech.technology_name.toLowerCase().includes(kw) || tech.sub_techs.length > 0
    );
}

function toRows(apiData) {
  if (apiData == null) return [];
  if (Array.isArray(apiData)) return apiData;
  if (Array.isArray(apiData.data)) return apiData.data;
  if (Array.isArray(apiData.result)) return apiData.result;
  if (typeof apiData === "object") return [apiData];
  return [];
}

function toCount(value) {
  if (value === undefined || value === null || value === "") return 0;
  const normalized = String(value).replace(/,/g, "");
  const num = Number(normalized);
  return Number.isNaN(num) ? 0 : num;
}

function pickRow(rows, subTechId) {
  if (!rows.length) return null;
  if (subTechId == null) return rows[0];
  return (
    rows.find((row) => String(row.sub_tech_id) === String(subTechId)) ?? rows[0]
  );
}

function normalizeCountry(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

const COUNTRY_ALIASES = {
  global: ["global", "world", "all", ""],
  india: ["india", "in"],
  usa: ["usa", "united states", "us", "u.s.", "u.s.a."],
  china: ["china", "cn", "prc"],
};

function rowMatchesCountry(row, countryKey, countryLabel = "") {
  if (countryKey === "global") {
    const name = normalizeCountry(row.country_name ?? row.country ?? row.name);
    return !name;
  }

  if (
    row.country_id != null &&
    String(row.country_id) === String(countryKey)
  ) {
    return true;
  }
  if (row.id != null && String(row.id) === String(countryKey)) {
    return true;
  }

  const name = normalizeCountry(
    row.country_name ?? row.country ?? row.country_code ?? row.name
  );
  const label = normalizeCountry(countryLabel);
  if (label && name && (name === label || name.includes(label) || label.includes(name))) {
    return true;
  }

  const aliases = COUNTRY_ALIASES[countryKey] ?? [];
  if (aliases.length) {
    return aliases.some((alias) => alias && (name === alias || name.includes(alias)));
  }

  return normalizeCountry(countryKey) === name;
}

/** Build country dropdown options — Global first, India second, then others A–Z */
export function buildCountryOptions(apiCountries) {
  const list = Array.isArray(apiCountries)
    ? apiCountries
    : apiCountries?.data ?? [];

  const india = list.find(
    (c) => normalizeCountry(c.country_name) === "india"
  );
  const others = list
    .filter((c) => normalizeCountry(c.country_name) !== "india")
    .sort((a, b) =>
      String(a.country_name ?? "").localeCompare(String(b.country_name ?? ""))
    );

  const options = [{ value: "global", label: "Global" }];

  if (india) {
    options.push({
      value: String(india.id),
      label: india.country_name,
    });
  }

  others.forEach((country) => {
    options.push({
      value: String(country.id),
      label: country.country_name,
    });
  });

  return options;
}

export function getDefaultCountryValue(countryOptions) {
  const india = countryOptions.find(
    (opt) => normalizeCountry(opt.label) === "india"
  );
  return india?.value ?? countryOptions[0]?.value ?? "global";
}

/** Country id for country-scoped trend APIs (defaults to India when Global is selected). */
export function getTrendChartCountryId(selectedCountry, countryOptions) {
  if (selectedCountry && selectedCountry !== "global") {
    return selectedCountry;
  }
  const india = countryOptions.find(
    (opt) => normalizeCountry(opt.label) === "india"
  );
  return india?.value ?? "12";
}

/** @deprecated Use getTrendChartCountryId */
export const getPublicationTrendCountryId = getTrendChartCountryId;

/**
 * Parses get_global_publication_count/{subTechId} response.
 * Real API: [{ "sub_tech_id": "44", "total_publications": "103461" }]
 */
export function parseGlobalPublicationCount(apiData, subTechId) {
  const rows = toRows(apiData);
  const row = pickRow(rows, subTechId);
  if (!row) return { globalPublications: 0, countryPublications: 0, patents: 0 };

  const globalPublications = toCount(
    row.total_publications ??
      row.global_publication_count ??
      row.publication_count ??
      row.publications ??
      row.count
  );

  const countryRow = rows.find(
    (r) => r !== row && normalizeCountry(r.country_name ?? r.country)
  );
  const countryFromRow = countryRow
    ? toCount(
        countryRow.total_publications ??
          countryRow.publication_count ??
          countryRow.publications
      )
    : 0;

  const patents = toCount(
    row.total_patents ?? row.patent_count ?? row.patents ?? row.patent_records
  );

  return {
    globalPublications,
    countryPublications: countryFromRow,
    patents,
    growthPercent: toCount(
      row.growth_percent ?? row.growth_rate ?? row.percent_change ?? row.percentage
    ),
  };
}

/** Maps get_global_publication_count/{subTechId} response to stat cards */
export function mapPublicationCountToCards(
  apiData,
  countryKey = "global",
  countryLabel = "Global",
  subTechId = null
) {
  const rows = toRows(apiData);
  const globalRow = pickRow(rows, subTechId);

  let globalPublications = 0;
  let globalPatents = 0;
  let globalGrowth = 0;

  if (globalRow) {
    globalPublications = toCount(
      globalRow.total_publications ??
        globalRow.global_publication_count ??
        globalRow.publication_count
    );
    globalPatents = toCount(
      globalRow.total_patents ?? globalRow.patent_count ?? globalRow.patents
    );
    globalGrowth = toCount(
      globalRow.growth_percent ??
        globalRow.growth_rate ??
        globalRow.percent_change
    );
  }

  const countryRow = rows.find((row) =>
    rowMatchesCountry(row, countryKey, countryLabel)
  );
  let countryPublications = 0;
  let countryPatents = 0;
  let countryGrowth = 0;

  if (countryRow && countryRow !== globalRow) {
    countryPublications = toCount(
      countryRow.total_publications ?? countryRow.publication_count
    );
    countryPatents = toCount(countryRow.total_patents ?? countryRow.patent_count);
    countryGrowth = toCount(
      countryRow.growth_percent ?? countryRow.growth_rate ?? countryRow.percent_change
    );
  } else if (countryKey === "global") {
    countryPublications = globalPublications;
    countryPatents = globalPatents;
    countryGrowth = globalGrowth;
  }

  return [
    {
      id: "global-publications",
      accentColor: "#2563eb",
      label: "TOTAL PUBLICATIONS",
      value: globalPublications,
      footerText: "Global →",
      changePercent: Math.abs(globalGrowth),
      trend: globalGrowth < 0 ? "down" : "up",
      detailView: "publication",
    },
    {
      id: "global-patents",
      accentColor: "#8b5cf6",
      label: "PATENT RECORDS",
      value: globalPatents,
      footerText: "Global →",
      changePercent: 0,
      trend: "up",
      detailView: "patent",
    },
    {
      id: "country-publications",
      accentColor: "#10b981",
      label: "TOTAL PUBLICATIONS",
      value: countryPublications,
      footerText: countryLabel,
      changePercent: Math.abs(countryGrowth),
      trend: countryGrowth < 0 ? "down" : "up",
      detailView: "publication",
    },
    {
      id: "country-patents",
      accentColor: "#f59e0b",
      label: "PATENT RECORDS",
      value: countryPatents,
      footerText: countryLabel,
      changePercent: 0,
      trend: "up",
      detailView: "patent",
    },
  ];
}

/**
 * Parses get-country-publication-count/{subTechId}/{countryId} response.
 * Real API: [{ "sub_tech_id": "44", "country_id": "12", "country_name": "India", "total_publications": "4060" }]
 */
export function parseCountryPublicationCount(apiData, subTechId = null) {
  const rows = toRows(apiData);
  const row = pickRow(rows, subTechId);
  if (!row) return 0;

  return toCount(
    row.total_publications ??
      row.country_publication_count ??
      row.publication_count ??
      row.publications ??
      row.count
  );
}

/**
 * Parses get-country-patent-count/{subTechId}/{countryId} response.
 * Real API: [{ "sub_tech_id": "44", "country_id": "12", "country_name": "India", "total_patents": "594" }]
 */
export function parseCountryPatentCount(apiData, subTechId = null) {
  const rows = toRows(apiData);
  const row = pickRow(rows, subTechId);
  if (!row) return 0;

  return toCount(
    row.total_patents ??
      row.country_patent_count ??
      row.patent_count ??
      row.patent_records ??
      row.patents ??
      row.count
  );
}

/**
 * Parses get_global_patent_count/{subTechId} response and returns count.
 * Supports array/object payloads with common patent keys.
 */
export function parseGlobalPatentCount(apiData, subTechId = null) {
  const rows = toRows(apiData);
  const row = pickRow(rows, subTechId);
  if (!row) return 0;

  return toCount(
    row.total_patents ??
      row.global_patent_count ??
      row.patent_count ??
      row.patent_records ??
      row.patents ??
      row.count
  );
}
