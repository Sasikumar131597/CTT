import { useEffect, useMemo, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import {
  CHART_YEAR_END,
  CHART_YEAR_START,
} from "./trendsChartConfig";
import styles from "./CountryTrendsChart.module.css";

const CHART_HEIGHT = 380;

function formatCount(value) {
  const n = Number(value) || 0;
  return n.toLocaleString();
}

function buildTooltipHtml(year, row, countries) {
  const entries = countries
    .map((c) => ({
      name: c.name,
      color: c.color,
      value: Number(row[c.key]) || 0,
    }))
    .sort((a, b) => b.value - a.value);

  const rows = entries
    .map(
      (e, i) =>
        `<tr>
          <td style="color:${e.color};padding:1px 16px 1px 0;white-space:nowrap;font-size:11px;">
            ${i + 1}. ${e.name}
          </td>
          <td style="color:${e.color};text-align:right;padding:1px 0;white-space:nowrap;font-size:11px;font-weight:600;">
            ${formatCount(e.value)}
          </td>
        </tr>`
    )
    .join("");

  return `<div style="font-weight:700;font-size:12px;color:#0f172a;margin-bottom:6px;">Year: ${year}</div>
    <table style="border-collapse:collapse;">${rows}</table>`;
}

function clampYear(y) {
  return Math.min(CHART_YEAR_END, Math.max(CHART_YEAR_START, y));
}

export default function TrendsLineChart({
  data,
  visibleCountries = [],
  yearFrom,
  yearTo,
  yAxisTicks = [0, 700, 1400, 2100, 2800],
  loading = false,
}) {
  const chartDivRef = useRef(null);
  const rootRef = useRef(null);

  const yMax = yAxisTicks[yAxisTicks.length - 1] || 1;

  const fromYear = clampYear(yearFrom);
  const toYear = clampYear(yearTo);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data
      .filter((d) => {
        const y = Number(d?.year);
        return (
          Number.isFinite(y) &&
          y >= fromYear &&
          y <= toYear &&
          y >= CHART_YEAR_START &&
          y <= CHART_YEAR_END
        );
      })
      .sort((a, b) => Number(a.year) - Number(b.year))
      .map((d) => ({ ...d, year: String(d.year) }));
  }, [data, fromYear, toYear]);

  useEffect(() => {
    if (!chartDivRef.current) return;

    if (rootRef.current) {
      rootRef.current.dispose();
      rootRef.current = null;
    }

    if (loading) return;
    if (!filteredData.length || !visibleCountries.length) return;

    const root = am5.Root.new(chartDivRef.current);
    rootRef.current = root;
    root.setThemes([am5themes_Animated.new(root)]);

    if (root._logo) {
      root._logo.dispose();
    }

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "none",
        wheelY: "none",
        paddingLeft: 8,
        paddingRight: 8,
      })
    );

    const xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 28,
      cellStartLocation: 0,
      cellEndLocation: 1,
    });

    xRenderer.grid.template.setAll({
      stroke: am5.color(0xe2e8f0),
      strokeOpacity: 0.9,
      strokeDasharray: [3, 3],
    });

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "year",
        startLocation: 0,
        endLocation: 1,
        renderer: xRenderer,
      })
    );

    xAxis.get("renderer").labels.template.setAll({
      fill: am5.color(0x64748b),
      fontSize: 10,
    });

    xAxis.data.setAll(filteredData);

    const yRenderer = am5xy.AxisRendererY.new(root, {});
    yRenderer.grid.template.setAll({
      stroke: am5.color(0xe2e8f0),
      strokeOpacity: 0.9,
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        max: yMax > 0 ? yMax : undefined,
        strictMinMax: yMax > 0,
        renderer: yRenderer,
      })
    );

    yAxis.get("renderer").labels.template.setAll({
      fill: am5.color(0x64748b),
      fontSize: 11,
    });

    const yearTooltip = am5.Tooltip.new(root, {
      pointerOrientation: "horizontal",
      getFillFromSprite: false,
      autoTextColor: false,
    });

    yearTooltip.get("background").setAll({
      fill: am5.color(0xffffff),
      fillOpacity: 0.98,
      stroke: am5.color(0xe2e8f0),
      strokeWidth: 1,
      cornerRadius: 6,
    });

    yearTooltip.label.setAll({
      interactive: true,
      fill: am5.color(0x334155),
    });

    const updateBulletsForYear = (year) => {
      chart.series.each((series) => {
        series.dataItems.each((dataItem) => {
          const bullet = dataItem.bullets?.[0];
          if (!bullet) return;
          const sprite = bullet.get("sprite");
          const match = String(dataItem.get("categoryX")) === String(year);
          sprite.set("opacity", match ? 1 : 0);
        });
      });
    };

    const hideAllBullets = () => {
      chart.series.each((series) => {
        series.dataItems.each((dataItem) => {
          const bullet = dataItem.bullets?.[0];
          bullet?.get("sprite")?.set("opacity", 0);
        });
      });
    };

    const showYearTooltip = (year) => {
      const row = filteredData.find((d) => String(d.year) === String(year));
      if (!row) return;

      yearTooltip.label.set("html", buildTooltipHtml(year, row, visibleCountries));
      updateBulletsForYear(year);
      yearTooltip.show();

      const coord = xAxis.categoryToPosition(year);
      const point = xRenderer.positionToCoordinate(coord);
      yearTooltip.pointTo({ x: point, y: 0 }, xAxis);
    };

    const hideYearTooltip = () => {
      yearTooltip.hide(0);
      hideAllBullets();
    };

    const seriesList = [];

    visibleCountries.forEach((country) => {
      const series = chart.series.push(
        am5xy.SmoothedXLineSeries.new(root, {
          name: country.name,
          xAxis,
          yAxis,
          valueYField: country.key,
          categoryXField: "year",
          stroke: am5.color(country.color),
          fill: am5.color(country.color),
          tension: 0.35,
        })
      );

      series.strokes.template.setAll({ strokeWidth: 2 });
      series.fills.template.setAll({ visible: false });
      series.set("tooltip", undefined);

      series.bullets.push((root, series) => {
        const circle = am5.Circle.new(root, {
          radius: 5,
          fill: series.get("stroke"),
          stroke: am5.color(0xffffff),
          strokeWidth: 1.5,
          opacity: 0,
        });
        return am5.Bullet.new(root, {
          locationX: 0.5,
          sprite: circle,
        });
      });

      series.data.setAll(filteredData);
      seriesList.push(series);
    });

    const cursor = am5xy.XYCursor.new(root, {
      xAxis,
      snapToSeries: seriesList,
      behavior: "none",
    });

    cursor.lineY.set("visible", false);
    cursor.lineX.setAll({
      visible: true,
      stroke: am5.color(0xcbd5e1),
      strokeDasharray: [3, 3],
    });

    chart.set("cursor", cursor);
    cursor.set("tooltip", yearTooltip);

    cursor.events.on("cursormoved", () => {
      const posX = cursor.getPrivate("positionX");
      if (posX == null) {
        hideYearTooltip();
        return;
      }

      const category = xAxis.positionToCategory(xAxis.toAxisPosition(posX));
      if (!category) {
        hideYearTooltip();
        return;
      }

      showYearTooltip(category);
    });

    chart.plotContainer.events.on("pointerout", () => {
      hideYearTooltip();
    });

    chart.appear(600, 100);
    seriesList.forEach((s) => s.appear(600));

    return () => {
      root.dispose();
      rootRef.current = null;
    };
  }, [filteredData, visibleCountries, yMax, loading]);

  if (loading) {
    return (
      <div className={styles.chartLoading} aria-busy="true">
        <span className={styles.loadingSpinner} />
        Loading chart data…
      </div>
    );
  }

  if (!filteredData.length || !visibleCountries.length) {
    return <div className={styles.chartLoading}>No data to display.</div>;
  }

  return (
    <div className={styles.chartWrap}>
      <div
        ref={chartDivRef}
        className={styles.chartSvg}
        style={{ height: CHART_HEIGHT }}
        role="img"
        aria-label="Country-wise trends line chart"
      />

      <ul className={styles.legend} aria-label="Chart legend">
        {visibleCountries.map((s) => (
          <li key={s.key} className={styles.legendItem}>
            <span className={styles.legendRank}>{s.rank}</span>
            <span
              className={styles.legendSwatch}
              style={{ backgroundColor: s.color }}
            />
            <span className={styles.legendName}>{s.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
