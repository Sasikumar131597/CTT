import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_YEAR_END,
  CHART_YEAR_START,
  PATENT_SPLIT_YEAR,
} from "./trendsChartConfig";
import styles from "./CountryTrendsChart.module.css";

const CHART_HEIGHT = 380;
const PATENT_AFTER_STROKE = "#94a3b8";

function afterDataKey(countryKey) {
  return `${countryKey}__after`;
}

/** Same pattern as MultiLinePublicationGraph — ranked tooltip per year */
function RankedTooltip({ active, payload, label, countryByKey, isPatentMetric }) {
  if (!active || !payload?.length) return null;

  const year = Number(label);
  const preferAfter =
    isPatentMetric && Number.isFinite(year) && year >= PATENT_SPLIT_YEAR;

  const countryMap = {};
  payload.forEach((item) => {
    if (item.value == null || item.dataKey === "year") return;

    const isAfter = String(item.dataKey).endsWith("__after");
    const key = isAfter
      ? String(item.dataKey).replace("__after", "")
      : item.dataKey;
    const meta = countryByKey[key];
    if (!meta) return;

    if (!countryMap[key]) {
      countryMap[key] = {
        key,
        name: meta.name,
        value: item.value,
        color: meta.color,
        isAfter,
      };
      return;
    }

    if (preferAfter && isAfter) {
      countryMap[key].value = item.value;
      countryMap[key].isAfter = true;
    } else if (!preferAfter && !isAfter) {
      countryMap[key].value = item.value;
      countryMap[key].isAfter = false;
    }
  });

  const items = Object.values(countryMap).sort(
    (a, b) => (b.value || 0) - (a.value || 0)
  );

  return (
    <div className={styles.chartTooltip}>
      <div className={styles.tooltipTitle}>Year: {label}</div>
      <div className={styles.tooltipList}>
        {items.map((item, idx) => (
          <div
            key={item.key}
            className={styles.tooltipRow}
            style={{
              color: preferAfter && item.isAfter ? PATENT_AFTER_STROKE : item.color,
            }}
          >
            <span>
              {idx + 1}. {item.name}
            </span>
            <span className={styles.tooltipValue}>
              {Number(item.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatentXAxisTick({ x, y, payload, isPatentMetric }) {
  const year = Number(payload?.value);
  const isGrey =
    isPatentMetric && Number.isFinite(year) && year >= PATENT_SPLIT_YEAR;

  return (
    <text
      x={x}
      y={y}
      dy={16}
      textAnchor="middle"
      fill={isGrey ? "#94a3b8" : "#64748b"}
      fontSize={10}
      fontWeight={year === PATENT_SPLIT_YEAR && isPatentMetric ? 600 : 400}
    >
      {payload.value}
    </text>
  );
}

function buildPatentMergedRows(chartRows, visibleCountries) {
  const byYear = {};

  chartRows.forEach((row) => {
    const year = row.year;
    if (!byYear[year]) byYear[year] = { year };

    visibleCountries.forEach((country) => {
      const value = row[country.key];
      if (value == null) return;

      if (year <= PATENT_SPLIT_YEAR) {
        byYear[year][country.key] = value;
      }
      if (year >= PATENT_SPLIT_YEAR) {
        byYear[year][afterDataKey(country.key)] = value;
      }
    });
  });

  return Object.values(byYear).sort((a, b) => a.year - b.year);
}

export default function TrendsLineChart({
  data,
  visibleCountries = [],
  selectedYears = [],
  yAxisTicks = [0, 700, 1400, 2100, 2800],
  loading = false,
  isPatentMetric = false,
}) {
  const yMax = yAxisTicks[yAxisTicks.length - 1] || 2800;

  const countryByKey = useMemo(
    () => Object.fromEntries(visibleCountries.map((c) => [c.key, c])),
    [visibleCountries]
  );

  const chartRows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const allowed =
      selectedYears.length > 0
        ? new Set(selectedYears.map((y) => Number(y)))
        : null;

    return data
      .filter((row) => {
        const y = Number(row?.year);
        if (!Number.isFinite(y)) return false;
        if (y < CHART_YEAR_START || y > CHART_YEAR_END) return false;
        if (allowed) return allowed.has(y);
        return true;
      })
      .map((row) => ({ ...row, year: Number(row.year) }))
      .sort((a, b) => a.year - b.year);
  }, [data, selectedYears]);

  const plotRows = useMemo(() => {
    if (!isPatentMetric || !chartRows.length) return chartRows;
    return buildPatentMergedRows(chartRows, visibleCountries);
  }, [chartRows, isPatentMetric, visibleCountries]);

  const showPatentAfter = useMemo(() => {
    if (!isPatentMetric) return false;
    return plotRows.some((row) =>
      visibleCountries.some(
        (c) => row[afterDataKey(c.key)] != null && row.year >= PATENT_SPLIT_YEAR
      )
    );
  }, [isPatentMetric, plotRows, visibleCountries]);

  const xDomain = useMemo(() => {
    if (!plotRows.length) return [CHART_YEAR_START, CHART_YEAR_END];
    const years = plotRows.map((r) => r.year);
    return [Math.min(...years), Math.max(...years)];
  }, [plotRows]);

  if (loading) {
    return (
      <div className={styles.chartLoading} aria-busy="true">
        <span className={styles.loadingSpinner} />
        Loading chart data…
      </div>
    );
  }

  if (!plotRows.length || !visibleCountries.length) {
    return <div className={styles.chartLoading}>No data to display.</div>;
  }

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartPlot} style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={plotRows}
            margin={{ top: 16, right: 12, left: 4, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

            <XAxis
              dataKey="year"
              type="number"
              domain={xDomain}
              allowDecimals={false}
              tick={
                <PatentXAxisTick isPatentMetric={isPatentMetric} />
              }
              tickMargin={8}
            />

            <YAxis
              domain={[0, yMax]}
              ticks={yAxisTicks}
              tick={{ fill: "#64748b", fontSize: 11 }}
              width={48}
            />

            {isPatentMetric ? (
              <ReferenceLine
                x={PATENT_SPLIT_YEAR}
                stroke="#cbd5e1"
                strokeDasharray="6 4"
                strokeWidth={1}
              />
            ) : null}

            <Tooltip
              content={
                <RankedTooltip
                  countryByKey={countryByKey}
                  isPatentMetric={isPatentMetric}
                />
              }
              cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
            />

            {visibleCountries.map((country) => (
              <Line
                key={country.key}
                type="monotone"
                dataKey={country.key}
                name={country.name}
                stroke={country.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 1.5, stroke: "#fff" }}
                connectNulls
                isAnimationActive={false}
              />
            ))}

            {showPatentAfter
              ? visibleCountries.map((country) => (
                  <Line
                    key={afterDataKey(country.key)}
                    type="monotone"
                    dataKey={afterDataKey(country.key)}
                    stroke={PATENT_AFTER_STROKE}
                    strokeWidth={1.5}
                    strokeOpacity={0.65}
                    strokeDasharray="4 3"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 1, stroke: "#fff" }}
                    connectNulls
                    isAnimationActive={false}
                    legendType="none"
                  />
                ))
              : null}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className={styles.legend} aria-label="Chart legend">
        {visibleCountries.map((s) => (
          <li key={s.key} className={styles.legendItem}>
            <span className={styles.legendRank}>{s.rank}</span>
            <span
              className={styles.legendSwatch}
              style={{ backgroundColor: s.color }}
            />
            <span className={styles.legendName} style={{ color: s.color }}>
              {s.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
