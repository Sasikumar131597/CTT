import { useEffect, useMemo, useState } from "react";

import { api } from "../../../api/client";
import CountryMultiSelect from "../CountryMultiSelect/CountryMultiSelect";
import FilterSelect from "../FilterSelect/FilterSelect";
import TrendsLineChart from "./TrendsLineChart";
import {
  buildDynamicCountries,
  CHART_YEAR_END,
  CHART_YEAR_START,
  METRIC_OPTIONS,
  normaliseCountryKey,
  YEAR_RANGE_OPTIONS,
} from "./trendsChartConfig";
import { sortCountriesByRanking } from "../../../utils/trendsChartUtils";
import styles from "./CountryTrendsChart.module.css";

const DESCRIPTION =
  "A comparative view of scientific output and innovation activity across leading countries, covering total publications, top 10% and 1% highly cited papers, and patent grants and applications from 2003 to 2024.";

/**
 * Converts raw API rows into the chart series format:
 * [{ year: 2010, india: 450, china: 1200, ... }, ...]
 *
 * Handles two possible API shapes:
 *   A) [{ year, country_name, value / count / total_publications / ... }]
 *   B) [{ country_name, data: [{ year, value }, ...] }]
 */
function buildSeriesFromApi(rawData, apiKey) {
  const rows = Array.isArray(rawData)
    ? rawData
    : rawData?.data ?? rawData?.result ?? [];

  if (!rows.length) return { series: [], countryNames: [] };

  const byYear = new Map();
  const countryNamesSet = new Set();

  const toFiniteNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const toYear = (v) => {
    // Accept values like 2003, "2003", "2003-01-01", etc.
    const s = v == null ? "" : String(v);
    const m = s.match(/\d{4}/);
    if (!m) return NaN;
    return Number(m[0]);
  };

  const pickValue = (row) =>
    toFiniteNumber(
      row[apiKey] ??
        row.value ??
        row.count ??
        row.total_publication_count ??
        row.total_publications ??
        row.top_10_publication_count ??
        row.top_1_publication_count ??
        row.Patent_granted ??
        row.Patents_applied ??
        row.total_patents ??
        row.publication_count ??
        row.patent_count ??
        0
    );

  // Shape B — nested data array
  if (rows[0]?.data && Array.isArray(rows[0].data)) {
    rows.forEach((countryRow) => {
      const name =
        countryRow.country_name ?? countryRow.country ?? countryRow.name ?? "";
      if (!name) return;
      countryNamesSet.add(name);
      const key = normaliseCountryKey(name);

      (countryRow.data ?? []).forEach((point) => {
        const year = toYear(point.year ?? point.pub_year ?? point.patent_year);
        if (Number.isNaN(year)) return;
        if (year < CHART_YEAR_START || year > CHART_YEAR_END) return;
        const value = pickValue(point);
        if (!byYear.has(year)) byYear.set(year, { year });
        byYear.get(year)[key] = value;
      });
    });
  } else {
    // Shape A — flat rows
    rows.forEach((row) => {
      const year = toYear(row.year ?? row.pub_year ?? row.patent_year);
      if (Number.isNaN(year)) return;
      if (year < CHART_YEAR_START || year > CHART_YEAR_END) return;

      const name = row.country_name ?? row.country ?? row.name ?? row.country_code ?? "";
      if (!name) return;
      countryNamesSet.add(name);
      const key = normaliseCountryKey(name);
      const value = pickValue(row);

      if (!byYear.has(year)) byYear.set(year, { year });
      byYear.get(year)[key] = value;
    });
  }

  const series = [...byYear.values()]
    .filter((row) => row.year >= CHART_YEAR_START && row.year <= CHART_YEAR_END)
    .sort((a, b) => a.year - b.year);
  return { series, countryNames: [...countryNamesSet].sort() };
}

export default function CountryTrendsChart({ subTechId }) {
  const [activeMetric, setActiveMetric] = useState(METRIC_OPTIONS[0].id);
  const [yearRange, setYearRange] = useState(YEAR_RANGE_OPTIONS[0].value);

  // Raw API responses cached per type
  const [pubRaw, setPubRaw] = useState(null);
  const [patRaw, setPatRaw] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // Derived dynamic countries list (from API data)
  const [dynamicCountries, setDynamicCountries] = useState([]);

  // Selected country keys (multi-select) — empty means "all"
  const [selectedCountryKeys, setSelectedCountryKeys] = useState([]);

  const selectedYearRange = useMemo(
    () =>
      YEAR_RANGE_OPTIONS.find((o) => o.value === yearRange) ??
      YEAR_RANGE_OPTIONS[0],
    [yearRange]
  );

  const activeMetricConfig = useMemo(
    () => METRIC_OPTIONS.find((m) => m.id === activeMetric) ?? METRIC_OPTIONS[0],
    [activeMetric]
  );

  // Fetch both publication and patent trend data when subTechId changes
  useEffect(() => {
    if (!subTechId) {
      setApiLoading(false);
      return;
    }

    let cancelled = false;
    setApiLoading(true);
    setApiError("");
    setPubRaw(null);
    setPatRaw(null);

    Promise.allSettled([
      api.getGlobalPublicationCountryRankMultiline(subTechId),
      api.getGlobalPatentCountryRankMultiline(subTechId),
    ])
      .then(([pubResult, patResult]) => {
        if (cancelled) return;

        const pub =
          pubResult.status === "fulfilled" ? pubResult.value : null;
        const pat =
          patResult.status === "fulfilled" ? patResult.value : null;

        if (!pub && !pat) {
          const pubErr =
            pubResult.status === "rejected" ? pubResult.reason?.message : "";
          const patErr =
            patResult.status === "rejected" ? patResult.reason?.message : "";
          setApiError(
            pubErr || patErr || "Could not load trend data."
          );
          setPubRaw(null);
          setPatRaw(null);
          setDynamicCountries([]);
          setSelectedCountryKeys([]);
          return;
        }

        setApiError("");
        setPubRaw(pub);
        setPatRaw(pat);

        const { countryNames } = buildSeriesFromApi(
          pub ?? pat,
          "total_publication_count"
        );
        const countries = buildDynamicCountries(countryNames);
        setDynamicCountries(countries);
        setSelectedCountryKeys(countries.map((c) => c.key));

        if (countries.length === 0) {
          setApiError(
            "Trend API returned data, but it did not match the expected format (missing/invalid year or country fields)."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setApiLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subTechId]);

  // Build chart data from cached raw responses based on active metric
  const { chartData, yMax } = useMemo(() => {
    const isPatent =
      activeMetricConfig.type === "patent";
    const raw = isPatent ? patRaw : pubRaw;

    const yearFrom = selectedYearRange.from;
    const yearTo = selectedYearRange.to;

    if (!raw) return { chartData: [], yMax: 2800 };

    const { series } = buildSeriesFromApi(raw, activeMetricConfig.apiKey);

    // Compute yMax from data for auto-scaling
    let dataMax = 0;
    series
      .filter((row) => row.year >= yearFrom && row.year <= yearTo)
      .forEach((row) => {
        Object.entries(row).forEach(([k, v]) => {
          if (k !== "year") dataMax = Math.max(dataMax, Number(v) || 0);
        });
      });
    const roundedMax = dataMax <= 0 ? 2800 : Math.ceil(dataMax / 500) * 500;

    return { chartData: series, yMax: roundedMax };
  }, [
    pubRaw,
    patRaw,
    activeMetricConfig,
    selectedYearRange.from,
    selectedYearRange.to,
  ]);

  const rankedCountries = useMemo(
    () =>
      sortCountriesByRanking(
        chartData,
        dynamicCountries,
        selectedYearRange.from,
        selectedYearRange.to
      ),
    [
      chartData,
      dynamicCountries,
      selectedYearRange.from,
      selectedYearRange.to,
    ]
  );

  // Country multi-select options (rank order: #1 highest)
  const countrySelectOptions = useMemo(
    () =>
      rankedCountries.map((c) => ({
        value: c.key,
        label: c.name,
        color: c.color,
        rank: c.rank,
      })),
    [rankedCountries]
  );

  // Visible series + legend in rank order
  const visibleCountries = useMemo(() => {
    if (!selectedCountryKeys.length) return rankedCountries;
    const selected = new Set(selectedCountryKeys);
    return rankedCountries.filter((c) => selected.has(c.key));
  }, [rankedCountries, selectedCountryKeys]);

  // Y-axis ticks derived from yMax
  const yAxisTicks = useMemo(() => {
    const step = yMax / 4;
    return [0, step, step * 2, step * 3, yMax].map((v) => Math.round(v));
  }, [yMax]);

  return (
    <section className={styles.card} aria-labelledby="country-trends-title">
      <header className={styles.header}>
        <h2 id="country-trends-title" className={styles.title}>
          Country-wise Publications and Patent Trends
        </h2>
        <p className={styles.description}>{DESCRIPTION}</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.metricTabs} role="tablist" aria-label="Metric type">
          {METRIC_OPTIONS.map((metric) => {
            const isActive = activeMetric === metric.id;
            return (
              <button
                key={metric.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.metricTab} ${isActive ? styles.metricTabActive : ""}`}
                onClick={() => setActiveMetric(metric.id)}
              >
                {metric.label}
              </button>
            );
          })}
        </div>

        <div className={styles.filters}>
          <div className={styles.filterField}>
            <span className={styles.filterLabel} id="trends-years-label">
              Years
            </span>
            <FilterSelect
              id="trends-year-range"
              label="Years"
              value={yearRange}
              options={YEAR_RANGE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              onChange={setYearRange}
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel} id="trends-countries-label">
              Countries
            </span>
            <CountryMultiSelect
              options={countrySelectOptions}
              selected={selectedCountryKeys}
              onChange={setSelectedCountryKeys}
              disabled={apiLoading}
              placeholder="Search countries…"
            />
          </div>
        </div>
      </div>

      {apiError ? (
        <p className={styles.errorNote}>{apiError}</p>
      ) : null}

      <TrendsLineChart
        data={chartData}
        visibleCountries={visibleCountries}
        yearFrom={selectedYearRange.from}
        yearTo={selectedYearRange.to}
        yAxisTicks={yAxisTicks}
        loading={apiLoading}
      />
    </section>
  );
}
