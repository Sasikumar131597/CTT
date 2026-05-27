import FilterSelect from "../FilterSelect/FilterSelect";
import SearchableSubTechSelect from "../SearchableSubTechSelect/SearchableSubTechSelect";
import styles from "./DashboardHeader.module.css";

export default function DashboardHeader({
  title,
  subtitle,
  technologies,
  selectedTechnologyId,
  onTechnologyChange,
  countryOptions,
  selectedCountry,
  onCountryChange,
  countriesLoading = false,
}) {
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{title}</h1>
        </div>

        <div className={styles.filtersRow} data-subtech-filters>
          <div className={styles.subtechField}>
            {/* <span className={styles.subtechLabel}>Sub-technology</span> */}
            <SearchableSubTechSelect
              highlighted
              technologies={technologies}
              selectedSubTechId={selectedTechnologyId}
              onChange={onTechnologyChange}
            />
          </div>

          <div className={styles.countryField}>
            {/* <span className={styles.countryLabel}>Country</span> */}
            <FilterSelect
              highlighted
              id="country-filter"
              label="Country"
              value={selectedCountry}
              options={
                countryOptions.length > 0
                  ? countryOptions
                  : [{ value: "", label: "Loading countries..." }]
              }
              disabled={countriesLoading || countryOptions.length === 0}
              onChange={onCountryChange}
            />
          </div>
        </div>
      </div>

      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </header>
  );
}
