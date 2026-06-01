import { useEffect, useMemo, useState } from "react";

import { api } from "../../../api/client";
import {
  parsePatentTrendline,
  toPatentTrendChartRows,
} from "../../../utils/patentTrendChartUtils";
import PatentTrendLineChart from "./PatentTrendLineChart";
import styles from "./PatentTrendChart.module.css";

const DESCRIPTION =
  "Yearly patent applications and grants for the selected country, from 2003 to 2024.";

export default function PatentTrendChart({
  subTechId,
  countryId,
  countryLabel = "India",
}) {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!subTechId || !countryId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setRaw(null);

    api
      .getPatentTrendlineCountry(subTechId, countryId)
      .then((data) => {
        if (cancelled) return;
        setRaw(data);
        const rows = parsePatentTrendline(data);
        if (!rows.length) {
          setError("No patent trend data returned for this country.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Could not load patent trend data.");
          setRaw(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subTechId, countryId]);

  const chartData = useMemo(() => {
    const parsed = parsePatentTrendline(raw);
    return toPatentTrendChartRows(parsed);
  }, [raw]);

  const title = `Patent Trend by Granted Vs Applied${
    countryLabel ? ` · ${countryLabel}` : ""
  }`;

  return (
    <section className={styles.card} aria-labelledby="patent-trend-title">
      <header className={styles.header}>
        <h2 id="patent-trend-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.description}>{DESCRIPTION}</p>
      </header>

      {error ? <p className={styles.errorNote}>{error}</p> : null}

      <PatentTrendLineChart data={chartData} loading={loading} />
    </section>
  );
}
