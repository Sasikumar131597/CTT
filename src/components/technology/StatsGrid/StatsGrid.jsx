import StatCard from "../StatCard/StatCard";
import styles from "./StatsGrid.module.css";

export default function StatsGrid({ stats, subTechId, selectedCountry }) {
  return (
    <section className={styles.grid} aria-label="Technology metrics">
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          {...stat}
          subTechId={subTechId}
          countryId={selectedCountry}
        />
      ))}
    </section>
  );
}
