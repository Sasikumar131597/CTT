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
}) {
  return (
    <article
      className={styles.card}
      style={{ "--accent-color": accentColor }}
    >
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{formatValue(value)}</p>
      <div className={styles.footer}>
        <span className={styles.footerText}>{footerText}</span>
      </div>
    </article>
  );
}
