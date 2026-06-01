import { useEffect, useMemo, useState } from "react";

import { api } from "../../../api/client";
import {
  parsePublicationCountryRank,
  sortCountriesByTotalPublications,
} from "../../../utils/publicationRankChartUtils";
import GroupedRankBarChart from "./GroupedRankBarChart";
import styles from "./PublicationCountryRankChart.module.css";

const TITLE = "Research Output and Citation Impact by Country";
const DESCRIPTION =
  "A country-wise comparison of total scientific publications alongside the share of top 10% and top 1% highly cited papers, highlighting both research volume and quality across leading nations.";

export default function PublicationCountryRankChart({
  subTechId,
  highlightCountryId = "",
}) {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!subTechId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setRaw(null);

    api
      .getGlobalPublicationCountryRank(subTechId)
      .then((data) => {
        if (cancelled) return;
        setRaw(data);
        const rows = parsePublicationCountryRank(data);
        if (!rows.length) {
          setError(
            "Country rank API returned data, but it did not match the expected format."
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Could not load country rank data.");
          setRaw(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subTechId]);

  const chartData = useMemo(() => {
    const rows = parsePublicationCountryRank(raw);
    const highlightId =
      highlightCountryId && highlightCountryId !== "global"
        ? String(highlightCountryId)
        : "";

    return sortCountriesByTotalPublications(
      rows.map((row) => ({
        ...row,
        isHighlighted: Boolean(highlightId && row.countryId === highlightId),
      }))
    );
  }, [raw, highlightCountryId]);

  return (
    <section className={styles.card} aria-labelledby="pub-country-rank-title">
      <header className={styles.header}>
        <h2 id="pub-country-rank-title" className={styles.title}>
          {TITLE}
        </h2>
        <p className={styles.description}>{DESCRIPTION}</p>
      </header>

      {error ? <p className={styles.errorNote}>{error}</p> : null}

      <GroupedRankBarChart data={chartData} loading={loading} />
    </section>
  );
}
