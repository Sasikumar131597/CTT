import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  filterTechnologies,
  findParentTechnology,
  findSubTechnology,
} from "../../../utils/technologyUtils";
import styles from "./SearchableSubTechSelect.module.css";

export default function SearchableSubTechSelect({
  technologies,
  selectedSubTechId,
  onChange,
  placeholder = "Search technology or sub-technology",
  highlighted = false,
}) {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredTech, setHoveredTech] = useState(null);
  const [dropdownLayout, setDropdownLayout] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const syncDropdownLayout = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const triggerRect = el.getBoundingClientRect();
    const filtersRow = el.closest("[data-subtech-filters]");

    if (filtersRow) {
      const filtersRect = filtersRow.getBoundingClientRect();
      setDropdownLayout({
        top: triggerRect.bottom + 6,
        left: filtersRect.left,
        width: filtersRect.width,
      });
      return;
    }

    setDropdownLayout({
      top: triggerRect.bottom + 6,
      left: triggerRect.left,
      width: triggerRect.width,
    });
  }, []);

  const activeSub = useMemo(
    () => findSubTechnology(technologies, selectedSubTechId),
    [technologies, selectedSubTechId]
  );

  const parentTech = useMemo(
    () => findParentTechnology(technologies, selectedSubTechId),
    [technologies, selectedSubTechId]
  );

  const selectedName = activeSub?.sub_tech_name?.trim() ?? "";
  const isBrowseMode =
    showDropdown || !activeSub || search.trim() !== selectedName;

  const filteredTechs = useMemo(
    () => filterTechnologies(technologies, search),
    [technologies, search]
  );

  const displayTech = useMemo(() => {
    if (
      hoveredTech &&
      filteredTechs.some((tech) => tech.tech_id === hoveredTech.tech_id)
    ) {
      return hoveredTech;
    }
    const parent = findParentTechnology(technologies, selectedSubTechId);
    if (parent && filteredTechs.some((tech) => tech.tech_id === parent.tech_id)) {
      return parent;
    }
    return filteredTechs[0] ?? null;
  }, [hoveredTech, filteredTechs, technologies, selectedSubTechId]);

  useEffect(() => {
    if (!showDropdown && activeSub) {
      setSearch(selectedName);
    }
  }, [activeSub, showDropdown, selectedName]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const dropdownEl = document.getElementById("subtech-select-dropdown");
      if (
        wrapperRef.current?.contains(event.target) ||
        dropdownEl?.contains(event.target)
      ) {
        return;
      }
      setShowDropdown(false);
      if (activeSub) setSearch(selectedName);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeSub, selectedName]);

  useEffect(() => {
    if (!showDropdown) return undefined;

    syncDropdownLayout();
    window.addEventListener("resize", syncDropdownLayout);
    window.addEventListener("scroll", syncDropdownLayout, true);

    return () => {
      window.removeEventListener("resize", syncDropdownLayout);
      window.removeEventListener("scroll", syncDropdownLayout, true);
    };
  }, [showDropdown, syncDropdownLayout]);

  const openDropdown = () => {
    syncDropdownLayout();
    setShowDropdown(true);
    setHoveredTech(findParentTechnology(technologies, selectedSubTechId));
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSelectSub = (sub) => {
    const name = sub.sub_tech_name?.trim() ?? "";
    setSearch(name);
    setShowDropdown(false);
    onChange(String(sub.sub_tech_id));
  };

  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setSearch("");
    setHoveredTech(null);
    setShowDropdown(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const showClearIcon = Boolean(activeSub) && !isBrowseMode;

  return (
    <div
      className={`${styles.wrapper} ${highlighted ? styles.highlighted : ""}`}
      ref={wrapperRef}
    >
      <label className={styles.srOnly} htmlFor="subtech-search">
        Search sub-technology
      </label>

      <div
        className={`${styles.inputRow} ${showDropdown ? styles.inputRowOpen : ""} ${
          !isBrowseMode ? styles.inputRowSelected : ""
        }`}
      >
        <input
          ref={inputRef}
          id="subtech-search"
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={search}
          readOnly={!isBrowseMode && Boolean(activeSub)}
          onClick={openDropdown}
          onFocus={openDropdown}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
            requestAnimationFrame(syncDropdownLayout);
          }}
          autoComplete="off"
        />

        {!isBrowseMode && parentTech ? (
          <span className={styles.categoryHint} title={parentTech.technology_name}>
            {parentTech.technology_name}
          </span>
        ) : null}

        <div className={styles.actions}>
          {showClearIcon ? (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              aria-label="Clear selection and choose another technology"
            >
              <span className={styles.clearIcon} aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            className={`${styles.toggleBtn} ${showDropdown ? styles.toggleOpen : ""}`}
            onClick={() => {
              if (showDropdown) {
                setShowDropdown(false);
                if (activeSub) setSearch(selectedName);
              } else {
                openDropdown();
              }
            }}
            aria-label={showDropdown ? "Close technology list" : "Open technology list"}
            aria-expanded={showDropdown}
          >
            <span className={styles.chevron} aria-hidden="true" />
          </button>
        </div>
      </div>

      {showDropdown && dropdownLayout.width > 0
        ? createPortal(
            <div
              id="subtech-select-dropdown"
              className={styles.dropdown}
              role="listbox"
              style={{
                top: dropdownLayout.top,
                left: dropdownLayout.left,
                width: dropdownLayout.width,
              }}
            >
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownHint}>
                  Browse categories or type to find a sub-technology
                </p>
              </div>
              <div className={styles.dropdownInner}>
                <div className={styles.techList}>
                  {filteredTechs.length === 0 ? (
                    <p className={styles.emptyState}>No results found</p>
                  ) : (
                    filteredTechs.map((tech) => (
                      <button
                        key={tech.tech_id}
                        type="button"
                        className={`${styles.techItem} ${
                          displayTech?.tech_id === tech.tech_id ? styles.techItemActive : ""
                        }`}
                        onMouseEnter={() => setHoveredTech(tech)}
                        onFocus={() => setHoveredTech(tech)}
                      >
                        <span className={styles.itemLabel}>{tech.technology_name}</span>
                      </button>
                    ))
                  )}
                </div>

                <div className={styles.subtechList}>
                  <p className={styles.subtechTitle}>
                    {displayTech
                      ? displayTech.technology_name
                      : "Select a category"}
                  </p>
                  <div className={styles.subtechItems}>
                    {displayTech?.sub_techs?.length ? (
                      displayTech.sub_techs.map((sub) => {
                        const isSelected =
                          String(sub.sub_tech_id) === String(selectedSubTechId);
                        return (
                          <button
                            key={sub.sub_tech_id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            className={`${styles.subtechItem} ${
                              isSelected ? styles.subtechItemSelected : ""
                            }`}
                            onClick={() => handleSelectSub(sub)}
                          >
                            <span className={styles.itemLabel}>{sub.sub_tech_name}</span>
                            {isSelected ? (
                              <span className={styles.currentBadge}>Current</span>
                            ) : null}
                          </button>
                        );
                      })
                    ) : (
                      <p className={styles.emptyState}>Hover a category on the left</p>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
