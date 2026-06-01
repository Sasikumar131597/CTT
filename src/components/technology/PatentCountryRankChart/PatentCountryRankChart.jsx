import { useEffect, useMemo, useState } from "react";

import { api } from "../../../api/client";
import {
  aggregatePatentsFromMultiline,
  parsePatentCountryRank,
  takeTopCountriesByPatentActivity,
} from "../../../utils/patentRankChartUtils";
import GroupedPatentBarChart from "./GroupedPatentBarChart";
import styles from "./PatentCountryRankChart.module.css";

const TITLE = "Patent Activity by Country: Applications and Grants";
const DESCRIPTION =
  "A country-wise comparison of patent applications and grants, reflecting the innovation activity and intellectual property output of leading nations in this technology.";

export default function PatentCountryRankChart({
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

    const loadRank = async () => {
      try {
        return await api.getGlobalPatentsCountryRank(subTechId);
      } catch {
        const multiline = await api.getGlobalPatentCountryRankMultiline(subTechId);
        return aggregatePatentsFromMultiline(multiline);
      }
    };

    loadRank()
      .then((data) => {
        if (cancelled) return;
        setRaw(data);
        const rows = parsePatentCountryRank(data);
        if (!rows.length) {
          setError(
            "Patent rank API returned data, but it did not match the expected format."
          );
        } else {
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Could not load patent country rank data.");
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
    const rows = parsePatentCountryRank(raw);
    const highlightId =
      highlightCountryId && highlightCountryId !== "global"
        ? String(highlightCountryId)
        : "";

    return takeTopCountriesByPatentActivity(
      rows.map((row) => ({
        ...row,
        isHighlighted: Boolean(highlightId && row.countryId === highlightId),
      }))
    );
  }, [raw, highlightCountryId]);

  return (
    <section className={styles.card} aria-labelledby="patent-country-rank-title">
      <header className={styles.header}>
        <h2 id="patent-country-rank-title" className={styles.title}>
          {TITLE}
        </h2>
        <p className={styles.description}>{DESCRIPTION}</p>
      </header>

      {error ? <p className={styles.errorNote}>{error}</p> : null}

      <GroupedPatentBarChart data={chartData} loading={loading} />
    </section>
  );
}
