import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildXAxisTicks,
  getCountryAxisOrder,
  sortCountriesByTotalPublications,
} from "../../../utils/publicationRankChartUtils";
import { getBarFill, SERIES } from "./publicationRankChartConfig";
import styles from "./PublicationCountryRankChart.module.css";

const ALL_SERIES_KEYS = SERIES.map((s) => s.key);
const CHART_MIN_HEIGHT = 520;
const ROW_BASE = 22;
const ROW_PER_BAR = 11;

const AXIS_TICK = { fill: "#334155", fontSize: 13, fontWeight: 500 };
const X_AXIS_TICK = { fill: "#64748b", fontSize: 12, fontWeight: 500 };

function formatValue(value) {
  return Number(value).toLocaleString();
}

function BarValueLabel(props) {
  const { x, y, width, height, value } = props;
  if (value == null || Number(value) === 0) return null;

  return (
    <text
      x={x + width + 8}
      y={y + height / 2}
      dy="0.35em"
      fill="#475569"
      fontSize={11}
      fontWeight={500}
    >
      {formatValue(value)}
    </text>
  );
}

function ChartTooltip({ active, payload, label, visibleKeys }) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.chartTooltip}>
      <div className={styles.tooltipTitle}>{label}</div>
      <div className={styles.tooltipList}>
        {SERIES.filter((s) => visibleKeys.has(s.key)).map((series) => {
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

export default function GroupedRankBarChart({ data = [], loading = false }) {
  const [visibleKeys, setVisibleKeys] = useState(
    () => new Set(ALL_SERIES_KEYS)
  );

  const visibleSeries = useMemo(
    () => SERIES.filter((s) => visibleKeys.has(s.key)),
    [visibleKeys]
  );

  const sortedData = useMemo(
    () => sortCountriesByTotalPublications(data),
    [data]
  );

  const countryAxisOrder = useMemo(
    () => getCountryAxisOrder(sortedData),
    [sortedData]
  );

  const handleLegendClick = useCallback((key) => {
    setVisibleKeys((prev) => {
      if (prev.size === 1 && prev.has(key)) {
        return new Set(ALL_SERIES_KEYS);
      }
      return new Set([key]);
    });
  }, []);

  const { xDomain, xTicks, chartHeight, barSize } = useMemo(() => {
    let maxVal = 0;
    const keys = visibleSeries.map((s) => s.key);
    sortedData.forEach((row) => {
      keys.forEach((k) => {
        maxVal = Math.max(maxVal, Number(row[k]) || 0);
      });
    });
    const { domain, ticks } = buildXAxisTicks(maxVal);
    const barCount = Math.max(visibleSeries.length, 1);
    const rowHeight = ROW_BASE + barCount * ROW_PER_BAR;
    const height = Math.max(
      CHART_MIN_HEIGHT,
      sortedData.length * rowHeight + 72
    );
    const size = barCount === 1 ? 10 : barCount === 2 ? 8 : 7;
    return { xDomain: domain, xTicks: ticks, chartHeight: height, barSize: size };
  }, [sortedData, visibleSeries]);

  if (loading) {
    return (
      <div className={styles.chartLoading} aria-busy="true">
        <span className={styles.loadingSpinner} />
        Loading chart data…
      </div>
    );
  }

  if (!sortedData.length) {
    return <div className={styles.chartLoading}>No data to display.</div>;
  }

  const isFiltered = visibleKeys.size < ALL_SERIES_KEYS.length;

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartPlot} style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 12, right: 72, left: 8, bottom: 12 }}
            barCategoryGap="14%"
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={xDomain}
              ticks={xTicks}
              tick={X_AXIS_TICK}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              type="category"
              dataKey="country"
              width={108}
              domain={countryAxisOrder}
              ticks={countryAxisOrder}
              interval={0}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip visibleKeys={visibleKeys} />}
              cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
            />
            {visibleSeries.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.label}
                barSize={barSize}
                radius={[0, 3, 3, 0]}
                isAnimationActive={false}
              >
                {sortedData.map((row) => (
                  <Cell
                    key={`${row.countryId}-${series.key}`}
                    fill={getBarFill(row.isHighlighted, series.colorKey)}
                  />
                ))}
                <LabelList content={<BarValueLabel />} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className={styles.metricLegend} aria-label="Chart legend">
        {SERIES.map((series) => {
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
                    backgroundColor: getBarFill(false, series.colorKey),
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
