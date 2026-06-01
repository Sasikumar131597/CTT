export const SERIES = [
  {
    key: "total",
    label: "Total Publications",
    colorKey: "total",
  },
  {
    key: "top10",
    label: "Top 10% Highly Cited Publications",
    colorKey: "top10",
  },
  {
    key: "top1",
    label: "Top 1% Highly Cited Publications",
    colorKey: "top1",
  },
];

export const BAR_COLORS = {
  default: {
    total: "#0d9488",
    top10: "#3b82f6",
    top1: "#1e3a8a",
  },
  highlight: {
    total: "#fb923c",
    top10: "#ea580c",
    top1: "#9a3412",
  },
};

export function getBarFill(isHighlighted, colorKey) {
  const palette = isHighlighted ? BAR_COLORS.highlight : BAR_COLORS.default;
  return palette[colorKey];
}
