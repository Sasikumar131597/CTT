import React, { useEffect, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import * as am5 from "@amcharts/amcharts5";
import * as am5flow from "@amcharts/amcharts5/flow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

import geoUrl from "../../WorldMapBackground/in_countries.min.geojson?url";
import { api } from "../../../api/client";
import worldStyles from "../../WorldMapBackground/WorldMapBackground.module.css";

const SAFFRON = "#FF9933";

// Simple palette for destination countries (no overlap with India saffron).
const DEST_COLORS = [
  "#5B8AF5",
  "#2DC653",
  "#C9A227",
  "#7B5EA7",
  "#F4845F",
  "#E84393",
  "#3DB380",
  "#D4781E",
  "#60C4D6",
  "#A259FF",
  "#E63946",
  "#1A936F",
];

const COUNTRY_NAME_MAP = {
  "United States of America": "USA",
  "United States": "USA",
  USA: "USA",
  "United Kingdom": "UK",
  UK: "UK",
};

function normalizeCountryName(name) {
  if (!name) return "Unknown";
  return COUNTRY_NAME_MAP[name] || name;
}

function buildDestColorMap(partners) {
  const unique = Array.from(new Set(partners));
  const map = {};
  unique.forEach((name, idx) => {
    map[name] = DEST_COLORS[idx % DEST_COLORS.length];
  });
  return map;
}

function createSankey(rootId, sourceCountry, apiRows) {
  const root = am5.Root.new(rootId);
  root._logo?.dispose();
  root.setThemes([am5themes_Animated.new(root)]);

  const series = root.container.children.push(
    am5flow.Sankey.new(root, {
      sourceIdField: "from",
      targetIdField: "to",
      valueField: "value",
      // Extra room on the right so country labels don't feel cramped.
      paddingRight: 280,
      paddingLeft: 50,
      paddingTop: 20,
      paddingBottom: 20,
      nodePadding: 20,
      nodeWidth: 20,
      linkTension: 0.58,
    })
  );

  // Give labels a bit more spacing from nodes.
  series.nodes.labels.template.setAll({
    dx: 10,
    fontSize: 12,
  });

  // Clean ribbon look (like the reference): gradient from source → destination.
  // `autoGradient` uses node colors from `series.nodes` `colorField`.
  series.links.template.setAll({
    fillOpacity: 0.6,
    strokeOpacity: 0,
    interactive: true,
    autoGradient: true,
  });

  const partnerNames = apiRows.map((d) =>
    normalizeCountryName(d.collaboration_country_name)
  );
  const colorMap = buildDestColorMap(partnerNames);

  const nodes = [
    {
      id: sourceCountry,
      name: sourceCountry,
      nodeColor: SAFFRON,
    },
    ...Array.from(new Set(partnerNames)).map((partner) => ({
      id: partner,
      name: partner,
      nodeColor: colorMap[partner],
    })),
  ];

  const links = apiRows
    .map((row) => {
      const partner = normalizeCountryName(row.collaboration_country_name);
      const value = Number(row.co_publications) || 0;
      if (!value) return null;
      return {
        from: sourceCountry,
        to: partner,
        value,
      };
    })
    .filter(Boolean);

  // amCharts Sankey expects links in `series.data` and nodes in `series.nodes.data`.
  series.nodes.setAll({ idField: "id", nameField: "name" });
  series.nodes.set("colorField", "nodeColor");
  series.nodes.data.setAll(nodes);
  series.data.setAll(links);

  return root;
}

export default function PublicationInternationalCollaboration({
  subTechId,
  countryId,
  countryLabel = "India",
}) {
  const [hoverTooltip, setHoverTooltip] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const sankeyRootRef = useRef(null);
  const SANKEY_DIV_ID = "publication-sankey-chart";

  useEffect(
    () => () => {
      if (sankeyRootRef.current) {
        sankeyRootRef.current.dispose();
        sankeyRootRef.current = null;
      }
    },
    []
  );

  const closeOverlay = () => {
    setSelectedCountry(null);
    setRows([]);
    setError("");
    setLoading(false);
    if (sankeyRootRef.current) {
      sankeyRootRef.current.dispose();
      sankeyRootRef.current = null;
    }
  };

  const handleCountryClick = async (geo) => {
    const name =
      geo.properties?.NAME ?? geo.properties?.name ?? geo.properties?.ADMIN;
    const normalized = normalizeCountryName(name);

    setSelectedCountry(normalized);
    setLoading(true);
    setError("");
    setRows([]);

    try {
      const data = await api.getPublicationInternationalCollaboration(
        subTechId,
        countryId
      );

      const items = Array.isArray(data) ? data : data?.data ?? [];
      const filtered = items
        .filter(
          (d) =>
            normalizeCountryName(d.parent_country_name) === normalized &&
            (Number(d.co_publications) || 0) > 0
        )
        .sort(
          (a, b) =>
            (Number(b.co_publications) || 0) -
            (Number(a.co_publications) || 0)
        )
        .slice(0, 10);

      setRows(filtered);

      if (sankeyRootRef.current) {
        sankeyRootRef.current.dispose();
        sankeyRootRef.current = null;
      }
      if (filtered.length) {
        // Ensure the container is visible before creating amCharts root.
        requestAnimationFrame(() => {
          try {
            sankeyRootRef.current = createSankey(
              SANKEY_DIV_ID,
              normalized,
              filtered
            );
          } catch (e) {
            setError(
              e?.message || "Could not render Sankey chart for this selection."
            );
          }
        });
      }
    } catch (err) {
      setError(
        err?.message ||
          "Could not load international collaboration data for this country."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="publication-collab-title">
      <header style={{ marginBottom: "0.75rem" }}>
        <h2
          id="publication-collab-title"
          style={{
            margin: 0,
            fontSize: "1.05rem",
            fontWeight: 600,
            color: "#0f172a",
          }}
        >
          World Collaboration Map · {countryLabel}
        </h2>
        <p
          style={{
            margin: "0.25rem 0 0",
            fontSize: "0.82rem",
            color: "#64748b",
          }}
        >
          Click a country on the map to view its top collaboration partners in
          publications as a Sankey diagram.
        </p>
      </header>

      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Match HomePage `WorldMapBackground` design/colors/boundaries */}
        <div
          className={worldStyles.wrapper}
          style={{
            height: 520,
            borderRadius: 0,
          }}
        >
          <div
            className={worldStyles.mapContainer}
            style={{
              opacity: 1,
              pointerEvents: selectedCountry ? "none" : "auto",
            }}
          >
            <ComposableMap
              projection="geoMercator"
              className={worldStyles.map}
              projectionConfig={{ scale: 170 }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      className={worldStyles.country}
                      onMouseEnter={() => {
                        const name =
                          geo.properties?.NAME ??
                          geo.properties?.name ??
                          geo.properties?.ADMIN;
                        setHoverTooltip(name || "");
                      }}
                      onMouseLeave={() => setHoverTooltip(null)}
                      onClick={() => handleCountryClick(geo)}
                      style={{
                        default: {
                          fill: "#0f4c81",
                          stroke: "#ffffff",
                          strokeWidth: 0.3,
                          outline: "none",
                        },
                        hover: {
                          fill: "#0f4c81",
                          stroke: "#ffffff",
                          strokeWidth: 0.3,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#0f4c81",
                          stroke: "#ffffff",
                          strokeWidth: 0.3,
                          outline: "none",
                        },
                      }}
                    />
                  ))
                }
              </Geographies>
            </ComposableMap>
          </div>
        </div>

        {hoverTooltip ? (
          <div
            style={{
              margin: "0.75rem 1.25rem 0",
              fontSize: "0.78rem",
              color: "#64748b",
            }}
          >
            Hovering: <strong>{hoverTooltip}</strong>
          </div>
        ) : null}

        <div style={{ margin: "1.25rem 1.25rem 1rem" }}>
          {loading && (
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "#4b5563",
              }}
            >
              Loading collaboration data…
            </p>
          )}
          {error && (
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "#b91c1c",
              }}
            >
              {error}
            </p>
          )}
          {!loading && !error && selectedCountry && !rows.length ? (
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "#6b7280",
              }}
            >
              No collaboration records found for {selectedCountry}.
            </p>
          ) : null}
        </div>

        {selectedCountry ? (
          <>
            {/* Backdrop */}
            <div
              onClick={closeOverlay}
              role="button"
              tabIndex={0}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(10, 12, 30, 0.45)",
                backdropFilter: "blur(4px)",
                zIndex: 40,
              }}
            />

            {/* Popup */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label="International collaboration Sankey"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(980px, 94%)",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 18,
                  overflow: "hidden",
                  border: "1px solid rgba(82,108,255,0.35)",
                  boxShadow:
                    "0 0 0 1px rgba(82,108,255,0.06), 0 8px 40px rgba(82,108,255,0.14), 0 28px 70px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    padding: "14px 18px",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    background: "#fafbff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#526CFF",
                        boxShadow: "0 0 0 3px rgba(82,108,255,0.25)",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#0f172a",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {selectedCountry}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#64748b",
                          marginTop: 2,
                          fontFamily:
                            '"Plus Jakarta Sans", "Outfit", system-ui, sans-serif',
                        }}
                      >
                        Publication collaborations (Top 10 partners)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 9,
                          letterSpacing: ".14em",
                          color: "#64748b",
                          textTransform: "uppercase",
                          marginBottom: 2,
                          fontFamily:
                            '"Plus Jakarta Sans", "Outfit", system-ui, sans-serif',
                        }}
                      >
                        Total Co-publications
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#0f172a",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {rows
                          .reduce(
                            (acc, r) => acc + (Number(r.co_publications) || 0),
                            0
                          )
                          .toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeOverlay}
                      style={{
                        fontSize: 11,
                        color: "#0f172a",
                        background: "transparent",
                        border: "1px solid rgba(0,0,0,0.12)",
                        borderRadius: 8,
                        padding: "7px 14px",
                        cursor: "pointer",
                        lineHeight: 1,
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {error ? (
                  <div
                    style={{
                      margin: "14px 16px 0",
                      padding: "10px 14px",
                      borderRadius: 8,
                      background: "rgba(229,62,62,.06)",
                      border: "1px solid rgba(229,62,62,.2)",
                      color: "#b91c1c",
                      fontSize: 12,
                    }}
                  >
                    {error}
                  </div>
                ) : null}

                {loading ? (
                  <div
                    style={{
                      padding: "16px",
                      fontSize: 12,
                      color: "#526CFF",
                    }}
                  >
                    Loading…
                  </div>
                ) : rows.length ? (
                  <div style={{ padding: "8px 10px 12px" }}>
                    <div id={SANKEY_DIV_ID} style={{ width: "100%", height: 420 }} />
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "40px 16px",
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: 12,
                    }}
                  >
                    No collaboration data available.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

