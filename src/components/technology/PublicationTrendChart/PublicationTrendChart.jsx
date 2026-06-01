import { useEffect, useMemo, useState } from "react";

import { api } from "../../../api/client";
import {
  parsePublicationTrendline,
  toPublicationTrendChartRows,
} from "../../../utils/publicationTrendChartUtils";
import PublicationTrendLineChart from "./PublicationTrendLineChart";
import styles from "./PublicationTrendChart.module.css";

const DESCRIPTION =
  "Yearly publication volume and highly cited research output for the selected country, from 2003 to 2024.";

export default function PublicationTrendChart({
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
      .getPublicationTrendlineCountry(subTechId, countryId)
      .then((data) => {
        if (cancelled) return;
        setRaw(data);
        const rows = parsePublicationTrendline(data);
        if (!rows.length) {
          setError("No publication trend data returned for this country.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Could not load publication trend data.");
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
    const parsed = parsePublicationTrendline(raw);
    return toPublicationTrendChartRows(parsed);
  }, [raw]);

  const title = `Publications Trend${countryLabel ? ` · ${countryLabel}` : ""}`;

  return (
    <section className={styles.card} aria-labelledby="pub-trend-title">
      <header className={styles.header}>
        <h2 id="pub-trend-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.description}>{DESCRIPTION}</p>
      </header>

      {error ? <p className={styles.errorNote}>{error}</p> : null}

      <PublicationTrendLineChart data={chartData} loading={loading} />
    </section>
  );
}
