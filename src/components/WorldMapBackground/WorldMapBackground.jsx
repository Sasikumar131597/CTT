import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import styles from "./WorldMapBackground.module.css";

// If using Vite
import geoUrl from "./in_countries.min.geojson?url";

export default function WorldMapBackground() {
  return (
    <div className={styles.wrapper}>
      {/* Background World Map */}
      <div className={styles.mapContainer}>
        <ComposableMap
          projection="geoMercator"
          className={styles.map}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: "#0f4c81",
                      stroke: "#ffffff",
                      strokeWidth: 0.3,
                      outline: "none",
                    }
                  }}
                />
              ))
            }
          </Geographies>
        </ComposableMap>
      </div>
    </div>
  );
}