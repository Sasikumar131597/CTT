import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircularProgress } from "@mui/material";

import { api } from "../api/client";
import CountryTrendsChart from "../components/technology/CountryTrendsChart/CountryTrendsChart";
import DashboardHeader from "../components/technology/DashboardHeader/DashboardHeader";
import StatsGrid from "../components/technology/StatsGrid/StatsGrid";
import {
  buildCountryOptions,
  findSubTechnology,
  getDefaultCountryValue,
  mapPublicationCountToCards,
  parseCountryPatentCount,
  parseCountryPublicationCount,
  parseGlobalPatentCount,
} from "../utils/technologyUtils";
import styles from "./Technology.module.css";

const SUBTITLE =
  "Country-wise scientific output · publications, citations and patent data · 2003 – 2024";

export default function Technology() {
  const { subTechId } = useParams();
  const navigate = useNavigate();

  const [technologies, setTechnologies] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [stats, setStats] = useState(() =>
    mapPublicationCountToCards([], "global", "Global", subTechId)
  );
  const [techLoading, setTechLoading] = useState(true);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  const activeSubTech = useMemo(
    () => findSubTechnology(technologies, subTechId),
    [technologies, subTechId]
  );

  const countryLabel = useMemo(() => {
    const match = countryOptions.find((c) => c.value === selectedCountry);
    return match?.label ?? "India";
  }, [countryOptions, selectedCountry]);

  useEffect(() => {
    let cancelled = false;

    api
      .getSubTechnologies()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data.data ?? [];
        setTechnologies(list);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load technologies:", err);
        }
      })
      .finally(() => {
        if (!cancelled) setTechLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    api
      .getSelectedCountries()
      .then((data) => {
        if (cancelled) return;
        const options = buildCountryOptions(data);
        setCountryOptions(options);
        setSelectedCountry((prev) => prev || getDefaultCountryValue(options));
      })
      .catch((err) => {
        console.error("Failed to load countries:", err);
        if (!cancelled) {
          setCountryOptions([
            { value: "global", label: "Global" },
            { value: "12", label: "India" },
          ]);
          setSelectedCountry("12");
        }
      })
      .finally(() => {
        if (!cancelled) setCountriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!subTechId || !selectedCountry) return;

    let cancelled = false;
    setStatsLoading(true);

    const fetchCountryStats = selectedCountry !== "global";

    Promise.allSettled([
      api.getGlobalPublicationCount(subTechId),
      api.getGlobalPatentCount(subTechId),
      ...(fetchCountryStats
        ? [
            api.getCountryPublicationCount(subTechId, selectedCountry),
            api.getCountryPatentCount(subTechId, selectedCountry),
          ]
        : []),
    ])
      .then((results) => {
        if (cancelled) return;

        const [
          publicationResult,
          patentResult,
          countryPublicationResult,
          countryPatentResult,
        ] = results;

        const publicationData =
          publicationResult.status === "fulfilled" ? publicationResult.value : [];
        const globalPatentCount =
          patentResult.status === "fulfilled"
            ? parseGlobalPatentCount(patentResult.value, subTechId)
            : null;

        const countryPublicationCount =
          fetchCountryStats &&
          countryPublicationResult?.status === "fulfilled"
            ? parseCountryPublicationCount(
                countryPublicationResult.value,
                subTechId
              )
            : null;

        const countryPatentCount =
          fetchCountryStats && countryPatentResult?.status === "fulfilled"
            ? parseCountryPatentCount(countryPatentResult.value, subTechId)
            : null;

        let nextStats = mapPublicationCountToCards(
          publicationData,
          selectedCountry,
          countryLabel,
          subTechId
        );

        if (globalPatentCount != null) {
          nextStats = nextStats.map((card) =>
            card.id === "global-patents"
              ? { ...card, value: globalPatentCount }
              : card
          );
        }

        if (countryPublicationCount != null) {
          nextStats = nextStats.map((card) =>
            card.id === "country-publications"
              ? { ...card, value: countryPublicationCount, footerText: countryLabel }
              : card
          );
        }

        if (countryPatentCount != null) {
          nextStats = nextStats.map((card) =>
            card.id === "country-patents"
              ? { ...card, value: countryPatentCount, footerText: countryLabel }
              : card
          );
        }

        setStats(nextStats);

        const publicationFailed = publicationResult.status === "rejected";
        const patentFailed = patentResult.status === "rejected";
        const countryPublicationFailed =
          fetchCountryStats && countryPublicationResult?.status === "rejected";
        const countryPatentFailed =
          fetchCountryStats && countryPatentResult?.status === "rejected";

        const allCountryFailed =
          fetchCountryStats && countryPublicationFailed && countryPatentFailed;

        if (
          publicationFailed &&
          patentFailed &&
          (!fetchCountryStats || allCountryFailed)
        ) {
          setError("Could not load publication/patent data.");
        } else {
          setError("");
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subTechId, selectedCountry, countryLabel]);

  const handleTechnologyChange = (nextId) => {
    if (nextId !== String(subTechId)) {
      navigate(`/technology/${nextId}`);
    }
  };

  if (techLoading && statsLoading && countriesLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.centerState}>
          <CircularProgress size={32} />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const pageTitle = activeSubTech?.sub_tech_name?.trim() ?? "Technology Dashboard";

  return (
    <div className={styles.page}>
      <div className={styles.container} data-technology-dashboard>
        {error ? <p className={styles.errorBanner}>{error}</p> : null}

        <DashboardHeader
          title={pageTitle}
          subtitle={SUBTITLE}
          technologies={technologies}
          selectedTechnologyId={String(subTechId)}
          onTechnologyChange={handleTechnologyChange}
          countryOptions={countryOptions}
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
          countriesLoading={countriesLoading}
        />

        {statsLoading ? (
          <div className={styles.statsLoading}>
            <CircularProgress size={24} />
            <span>Updating publication/patent data...</span>
          </div>
        ) : null}

        <StatsGrid stats={stats} />

        <CountryTrendsChart subTechId={subTechId} />
      </div>
    </div>
  );
}
