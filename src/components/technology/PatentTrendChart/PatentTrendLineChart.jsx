import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAllYearTicks,
  getPatentYAxisMax,
  getPatentYTicks,
} from "../../../utils/patentTrendChartUtils";
import { PATENT_TREND_SERIES } from "./patentTrendChartConfig";
import styles from "./PatentTrendChart.module.css";

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.chartTooltip}>
      <div className={styles.tooltipTitle}>Year: {label}</div>
      {payload.map((item) => (
        <div
          key={item.dataKey}
          className={styles.tooltipRow}
          style={{ color: item.color }}
        >
          <span>{item.name}</span>
          <span>{Number(item.value ?? 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function PatentTrendLineChart({ data, loading }) {
  const yearTicks = useMemo(() => getAllYearTicks(data), [data]);
  const yMax = useMemo(() => getPatentYAxisMax(data), [data]);
  const yTicks = useMemo(() => getPatentYTicks(yMax), [yMax]);

  if (loading) {
    return <div className={styles.chartLoading}>Loading chart…</div>;
  }

  if (!data.length) {
    return <div className={styles.chartEmpty}>No trend data for this selection.</div>;
  }

  return (
    <div className={styles.chartPlot}>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="year"
            ticks={yearTicks}
            interval={0}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            domain={[0, yMax]}
            ticks={yTicks}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(value) => value.toLocaleString()}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={{ stroke: "#cbd5e1" }}
          />
          <Tooltip content={<TrendTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={48}
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          />
          {PATENT_TREND_SERIES.map((series) => (
            <Line
              key={series.dataKey}
              type="monotone"
              dataKey={series.dataKey}
              name={series.label}
              stroke={series.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
