import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./CountryMultiSelect.module.css";

/**
 * Searchable multi-select dropdown for countries.
 *
 * Props:
 *   options       — [{ value, label, color, rank? }]
 *   selected      — string[]  (array of selected values)
 *   onChange      — (selected: string[]) => void
 *   disabled      — boolean
 *   placeholder   — string
 */
export default function CountryMultiSelect({
  options = [],
  selected = [],
  onChange,
  disabled = false,
  placeholder = "Search countries…",
  allLabel = "All countries",
  selectedCountLabel,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = useCallback(
    (value) => {
      const next = selectedSet.has(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      onChange(next);
    },
    [selected, selectedSet, onChange]
  );

  const selectAll = () => onChange(options.map((o) => o.value));
  const clearAll = () => onChange([]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const selectedLabels = useMemo(
    () =>
      options
        .filter((o) => selectedSet.has(o.value))
        .map((o) => o.label),
    [options, selectedSet]
  );

  const countLabel =
    selectedCountLabel?.(selected.length) ??
    `${selected.length} countries selected`;

  const triggerText =
    selected.length === 0
      ? allLabel
      : selected.length === options.length
      ? allLabel
      : selected.length === 1
      ? selectedLabels[0]
      : countLabel;

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.triggerText}>{triggerText}</span>
        <svg
          className={`${styles.arrow} ${open ? styles.arrowUp : ""}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          aria-hidden="true"
        >
          <path
            d="M1 1l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox" aria-multiselectable="true">
          <div className={styles.searchRow}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              className={styles.searchInput}
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.actionBtn} onClick={selectAll}>
              Select all
            </button>
            <button type="button" className={styles.actionBtn} onClick={clearAll}>
              Clear
            </button>
          </div>

          <ul className={styles.list}>
            {filtered.length === 0 && (
              <li className={styles.empty}>No countries match</li>
            )}
            {filtered.map((opt) => {
              const checked = selectedSet.has(opt.value);
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={checked}
                  className={`${styles.item} ${checked ? styles.itemChecked : ""}`}
                  onClick={() => toggle(opt.value)}
                >
                  <span
                    className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ""}`}
                    style={checked ? { backgroundColor: opt.color, borderColor: opt.color } : {}}
                  >
                    {checked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" aria-hidden="true">
                        <polyline
                          points="1,4 3.5,6.5 9,1"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {opt.color && (
                    <span
                      className={styles.colorDot}
                      style={{ backgroundColor: opt.color }}
                    />
                  )}
                  <span className={styles.itemLabel}>
                    {opt.rank != null ? (
                      <span className={styles.rank}>{opt.rank}</span>
                    ) : null}
                    {opt.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
