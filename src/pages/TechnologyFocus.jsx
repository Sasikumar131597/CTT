import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import DashboardHeader from "../components/technology/DashboardHeader/DashboardHeader";
import PatentTrendChart from "../components/technology/PatentTrendChart/PatentTrendChart";
import PublicationTrendChart from "../components/technology/PublicationTrendChart/PublicationTrendChart";
import PublicationInternationalCollaboration from "../components/technology/PublicationCollaboration/PublicationInternationalCollaboration";
import {
  buildCountryOptions,
  findSubTechnology,
  getDefaultCountryValue,
  getTrendChartCountryId,
} from "../utils/technologyUtils";
import {
  patentPath,
  publicationPath,
  technologyDashboardPath,
} from "../utils/technologyRoutes";
import { api } from "../api/client";
import styles from "./TechnologyFocus.module.css";

const FOCUS_CONFIG = {
  publication: {
    titleSuffix: "Publications",
    subtitle:
      "Yearly publication volume and highly cited research for the selected country.",
    Charts: "publication",
  },
  patent: {
    titleSuffix: "Patent Records",
    subtitle:
      "Yearly patent grants and applications for the selected country.",
    Charts: "patent",
  },
};

export default function TechnologyFocus({ focus }) {
  const { subTechId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const config = FOCUS_CONFIG[focus];

  const [technologies, setTechnologies] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(
    () => location.state?.countryId ?? ""
  );
  const [techLoading, setTechLoading] = useState(true);
  const [countriesLoading, setCountriesLoading] = useState(true);

  const activeSubTech = useMemo(
    () => findSubTechnology(technologies, subTechId),
    [technologies, subTechId]
  );

  const trendCountryId = useMemo(
    () => getTrendChartCountryId(selectedCountry, countryOptions),
    [selectedCountry, countryOptions]
  );

  const trendCountryLabel = useMemo(() => {
    const match = countryOptions.find((c) => c.value === trendCountryId);
    return match?.label ?? "India";
  }, [countryOptions, trendCountryId]);

  useEffect(() => {
    let cancelled = false;

    api
      .getSubTechnologies()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data.data ?? [];
        setTechnologies(list);
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
        setSelectedCountry((prev) => {
          if (prev && options.some((o) => o.value === prev)) return prev;
          return location.state?.countryId || getDefaultCountryValue(options);
        });
      })
      .catch(() => {
        if (!cancelled) {
          setCountryOptions([
            { value: "global", label: "Global" },
            { value: "12", label: "India" },
          ]);
          setSelectedCountry((prev) => prev || "12");
        }
      })
      .finally(() => {
        if (!cancelled) setCountriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location.state?.countryId]);

  const handleTechnologyChange = (nextId) => {
    if (nextId === String(subTechId)) return;
    const path =
      focus === "publication" ? publicationPath(nextId) : patentPath(nextId);
    navigate(path, { state: { countryId: selectedCountry } });
  };

  if (techLoading && countriesLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.centerState}>
          <CircularProgress size={32} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const subTechName =
    activeSubTech?.sub_tech_name?.trim() ?? "Technology Dashboard";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link
          to={technologyDashboardPath(subTechId)}
          className={styles.backLink}
        >
          <ArrowBackIcon fontSize="small" aria-hidden />
          Back to dashboard
        </Link>

        <DashboardHeader
          title={`${subTechName} · ${config.titleSuffix}`}
          subtitle={config.subtitle}
          technologies={technologies}
          selectedTechnologyId={String(subTechId)}
          onTechnologyChange={handleTechnologyChange}
          countryOptions={countryOptions}
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
          countriesLoading={countriesLoading}
        />

        {config.Charts === "publication" ? (
          <>
            <PublicationTrendChart
              subTechId={subTechId}
              countryId={trendCountryId}
              countryLabel={trendCountryLabel}
            />
            <div style={{ marginTop: "1.5rem" }}>
              <PublicationInternationalCollaboration
                subTechId={subTechId}
                countryId={trendCountryId}
                countryLabel={trendCountryLabel}
              />
            </div>
          </>
        ) : (
          <PatentTrendChart
            subTechId={subTechId}
            countryId={trendCountryId}
            countryLabel={trendCountryLabel}
          />
        )}
      </div>
    </div>
  );
}
