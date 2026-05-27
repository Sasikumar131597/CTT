import styles from "./FilterSelect.module.css";

export default function FilterSelect({
  label,
  value,
  options,
  onChange,
  id,
  highlighted = false,
  disabled = false,
}) {
  return (
    <div className={`${styles.wrapper} ${highlighted ? styles.highlighted : ""}`}>
      {label ? (
        <label className={styles.srOnly} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={`${styles.select} ${highlighted ? styles.selectHighlighted : ""}`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
