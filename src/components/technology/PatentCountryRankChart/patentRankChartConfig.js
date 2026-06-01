export const PATENT_SERIES = [
  {
    key: "granted",
    label: "Patent Granted",
    colorKey: "granted",
  },
  {
    key: "applied",
    label: "Patent Applied",
    colorKey: "applied",
  },
];

export const PATENT_BAR_COLORS = {
  default: {
    granted: "#22c55e",
    applied: "#3b82f6",
  },
  highlight: {
    granted: "#fb923c",
    applied: "#ea580c",
  },
};

export function getPatentBarFill(isHighlighted, colorKey) {
  const palette = isHighlighted
    ? PATENT_BAR_COLORS.highlight
    : PATENT_BAR_COLORS.default;
  return palette[colorKey];
}
