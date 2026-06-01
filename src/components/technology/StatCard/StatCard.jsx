import { useNavigate } from "react-router-dom";

import { patentPath, publicationPath } from "../../../utils/technologyRoutes";
import styles from "./StatCard.module.css";

function formatValue(value) {
  if (typeof value === "number") {
    return value.toLocaleString("en-US");
  }
  return value;
}

export default function StatCard({
  accentColor,
  label,
  value,
  footerText,
  detailView,
  subTechId,
  countryId,
}) {
  const navigate = useNavigate();
  const isClickable = Boolean(detailView && subTechId);

  const handleActivate = () => {
    if (!isClickable) return;

    const path =
      detailView === "publication"
        ? publicationPath(subTechId)
        : patentPath(subTechId);

    navigate(path, countryId ? { state: { countryId } } : undefined);
  };

  const handleKeyDown = (event) => {
    if (!isClickable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <article
      className={`${styles.card} ${isClickable ? styles.clickable : ""}`}
      style={{ "--accent-color": accentColor }}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      aria-label={
        isClickable
          ? `${label}, ${formatValue(value)}. View ${detailView} details.`
          : undefined
      }
    >
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{formatValue(value)}</p>
      <div className={styles.footer}>
        <span className={styles.footerText}>{footerText}</span>
      </div>
    </article>
  );
}
