import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildPatentYAxisTicks,
  takeTopCountriesByPatentActivity,
} from "../../../utils/patentRankChartUtils";
import {
  getPatentBarFill,
  PATENT_SERIES,
} from "./patentRankChartConfig";
import styles from "./PatentCountryRankChart.module.css";

const ALL_SERIES_KEYS = PATENT_SERIES.map((s) => s.key);
const CHART_HEIGHT = 400;
const AXIS_TICK = { fill: "#334155", fontSize: 12, fontWeight: 500 };
const Y_AXIS_TICK = { fill: "#64748b", fontSize: 12, fontWeight: 500 };

function formatValue(value) {
  return Number(value).toLocaleString();
}

function PatentTooltip({ active, payload, label, visibleKeys }) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.chartTooltip}>
      <div className={styles.tooltipTitle}>{label}</div>
      <div className={styles.tooltipList}>
        {PATENT_SERIES.filter((s) => visibleKeys.has(s.key)).map((series) => {
          const item = payload.find((p) => p.dataKey === series.key);
          if (!item) return null;
          return (
            <div key={series.key} className={styles.tooltipRow}>
              <span style={{ color: item.fill }}>{series.label}</span>
              <span className={styles.tooltipValue}>
                {formatValue(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GroupedPatentBarChart({ data = [], loading = false }) {
  const [visibleKeys, setVisibleKeys] = useState(
    () => new Set(ALL_SERIES_KEYS)
  );

  const visibleSeries = useMemo(
    () => PATENT_SERIES.filter((s) => visibleKeys.has(s.key)),
    [visibleKeys]
  );

  const chartData = useMemo(
    () => takeTopCountriesByPatentActivity(data),
    [data]
  );

  const handleLegendClick = useCallback((key) => {
    setVisibleKeys((prev) => {
      if (prev.size === 1 && prev.has(key)) {
        return new Set(ALL_SERIES_KEYS);
      }
      return new Set([key]);
    });
  }, []);

  const { yDomain, yTicks } = useMemo(() => {
    let maxVal = 0;
    const keys = visibleSeries.map((s) => s.key);
    chartData.forEach((row) => {
      keys.forEach((k) => {
        maxVal = Math.max(maxVal, Number(row[k]) || 0);
      });
    });
    return buildPatentYAxisTicks(maxVal);
  }, [chartData, visibleSeries]);

  if (loading) {
    return (
      <div className={styles.chartLoading} aria-busy="true">
        <span className={styles.loadingSpinner} />
        Loading chart data…
      </div>
    );
  }

  if (!chartData.length) {
    return <div className={styles.chartLoading}>No data to display.</div>;
  }

  const isFiltered = visibleKeys.size < ALL_SERIES_KEYS.length;

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartPlot} style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
            barCategoryGap="22%"
            barGap={0}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="country"
              tick={AXIS_TICK}
              interval={0}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              domain={yDomain}
              ticks={yTicks}
              tick={Y_AXIS_TICK}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={{ stroke: "#e2e8f0" }}
              width={48}
            />
            <Tooltip
              content={<PatentTooltip visibleKeys={visibleKeys} />}
              cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
            />
            {visibleSeries.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.label}
                barSize={visibleSeries.length === 1 ? 36 : 28}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                {chartData.map((row) => (
                  <Cell
                    key={`${row.countryId}-${series.key}`}
                    fill={getPatentBarFill(
                      row.isHighlighted,
                      series.colorKey
                    )}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className={styles.metricLegend} aria-label="Chart legend">
        {PATENT_SERIES.map((series) => {
          const isActive = visibleKeys.has(series.key);
          const isOnly =
            isFiltered && visibleKeys.size === 1 && isActive;

          return (
            <li key={series.key}>
              <button
                type="button"
                className={`${styles.metricLegendItem} ${
                  isOnly ? styles.metricLegendItemActive : ""
                } ${isFiltered && !isActive ? styles.metricLegendItemMuted : ""}`}
                onClick={() => handleLegendClick(series.key)}
                aria-pressed={isActive}
              >
                <span
                  className={styles.metricLegendSwatch}
                  style={{
                    backgroundColor: getPatentBarFill(false, series.colorKey),
                  }}
                />
                <span>{series.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
