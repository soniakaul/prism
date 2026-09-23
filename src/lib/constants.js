export const DURATIONS = [
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "1h", value: 60 },
  { label: "1.5h", value: 90 },
  { label: "2h", value: 120 },
  { label: "3h+", value: 180 },
];

export const INTENSITIES = ["Light", "Focused", "Deep", "Locked In"];

// Opacity for intensity 1–4 (index 0 unused). The grid and every picker
// read from here so a level looks the same everywhere.
export const INTENSITY_OPACITY = [0, 0.2, 0.45, 0.7, 1];

export function formatDuration(mins) {
  return mins < 60 ? `${mins}m` : `${mins / 60}h`;
}
