import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, CircularProgress, Alert, TextField, Paper,
  Typography, List, ListItemButton, ListItemText,
  Button, InputAdornment, IconButton, Fade, Grow,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import styles from "../styles/HomePage.module.css";
import WorldMapBackground from "../components/WorldMapBackground/WorldMapBackground";
import { api } from "../api/client";

export default function HomePage() {
  const navigate = useNavigate();
  const inputRef   = useRef(null);
  const dropdownRef = useRef(null);

  const [technologies,    setTechnologies]   = useState([]);
  const [filteredTechs,   setFilteredTechs]  = useState([]);
  const [selectedTech,    setSelectedTech]   = useState(null);
  const [selectedSubTech, setSelectedSubTech]= useState(null);
  const [search,          setSearch]         = useState("");
  const [showDropdown,    setShowDropdown]   = useState(false);
  const [dropdownCoords,  setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
  const [loading,         setLoading]        = useState(true);
  const [error,           setError]          = useState("");

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    api.getSubTechnologies()
      .then((data) => {
        console.log("✅ Technologies loaded:", data);
        // Guard: API sometimes wraps data in { data: [...] }
        const list = Array.isArray(data) ? data : data.data ?? [];
        if (list.length === 0) {
          console.warn("⚠️ Empty technology list returned");
        }
        setTechnologies(list);
        setFilteredTechs(list);
      })
      .catch((err) => {
        console.error("❌ Failed to load technologies:", err);
        setError(`Failed to load technologies: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Search filter ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setFilteredTechs(technologies); return; }
    const kw = search.toLowerCase();
    const result = technologies
      .map((tech) => ({
        ...tech,
        sub_techs: (tech.sub_techs ?? []).filter((s) =>
          s.sub_tech_name.toLowerCase().includes(kw)
        ),
      }))
      .filter(
        (tech) =>
          tech.technology_name.toLowerCase().includes(kw) ||
          tech.sub_techs.length > 0
      );
    setFilteredTechs(result);
  }, [search, technologies]);

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current   && !inputRef.current.contains(e.target)
      ) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const openDropdown = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: r.bottom + window.scrollY + 6,
        left: r.left + window.scrollX,
        width: r.width,
      });
    }
    setShowDropdown(true);
  };

  const handleSelectSub = (sub, tech) => {
    setSelectedTech(tech);
    setSelectedSubTech(sub);
    setSearch(sub.sub_tech_name);
    setShowDropdown(false);
  };

  const handleExplore = () => {
    if (!selectedSubTech) { alert("Please select a sub-technology"); return; }
    navigate(`/technology/${selectedSubTech.sub_tech_id}`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <Box className={styles.centerLoader}>
      <CircularProgress />
      <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
        Loading technologies...
      </Typography>
    </Box>
  );

  return (
    <>
      <Box className={styles.wcSection}>
        <Box className={styles.mapLayer}><WorldMapBackground /></Box>

        <Box className={styles.searchContainer}>
          <Grow in timeout={500}>
            <Paper className={styles.searchCard} elevation={8}>
              <Box className={styles.searchRow}>
                <TextField
                  inputRef={inputRef}
                  fullWidth
                  placeholder="Search Technology"
                  value={search}
                  onClick={openDropdown}
                  onChange={(e) => { setSearch(e.target.value); openDropdown(); }}
                  className={styles.searchInput}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowDropdown(!showDropdown)}>
                          <KeyboardArrowDownIcon
                            className={showDropdown
                              ? `${styles.dropdownArrow} ${styles.rotated}`
                              : styles.dropdownArrow}
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button variant="contained" className={styles.exploreBtn} onClick={handleExplore}>
                  EXPLORE
                </Button>
              </Box>
            </Paper>
          </Grow>
        </Box>
      </Box>

      {showDropdown && (
        <Fade in timeout={200}>
          <Paper
            ref={dropdownRef}
            className={styles.dropdownPanel}
            elevation={10}
            style={{
              top: dropdownCoords.top,
              left: dropdownCoords.left,
              minWidth: dropdownCoords.width,
            }}
          >
            <Box className={styles.dropdownInner}>
              {/* LEFT — tech categories */}
              <Box className={styles.techList}>
                <List disablePadding>
                  {filteredTechs.length === 0 ? (
                    <Typography sx={{ p: 2, color: "text.secondary" }}>
                      No results found
                    </Typography>
                  ) : (
                    filteredTechs.map((tech) => (
                      <ListItemButton
                        key={tech.tech_id}
                        className={styles.listItem}
                        onMouseEnter={() => setSelectedTech(tech)}
                        selected={selectedTech?.tech_id === tech.tech_id}
                      >
                        <ListItemText
                          primary={
                            <Typography className={styles.listItemTitle}>
                              {tech.technology_name}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    ))
                  )}
                </List>
              </Box>

              {/* RIGHT — sub-technologies */}
              <Box className={styles.subtechList}>
                <Typography className={styles.subtechTitle}>
                  {selectedTech ? "Select Sub Technology" : "Hover a Category"}
                </Typography>
                <List disablePadding>
                  {selectedTech?.sub_techs?.map((sub) => (
                    <ListItemButton
                      key={sub.sub_tech_id}
                      className={styles.listItem}
                      onClick={() => handleSelectSub(sub, selectedTech)}
                    >
                      <ListItemText
                        primary={
                          <Typography className={styles.listSub}>
                            {sub.sub_tech_name}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            </Box>
          </Paper>
        </Fade>
      )}
    </>
  );
}