export const DURATIONS = [
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "1h", value: 60 },
  { label: "1.5h", value: 90 },
  { label: "2h", value: 120 },
  { label: "3h+", value: 180 },
];

// Intensity levels, indexed by tier: 0 is a trace (time under tier 1),
// then tiers 1-3. TIER_OPACITY is the shade for each, shared by the grid
// and the intensity meter so a level looks the same everywhere.
export const INTENSITIES = ["Light", "Focused", "Deep", "Locked In"];
export const TIER_OPACITY = [0.2, 0.45, 0.7, 1];

// 45 -> "45m", 60 -> "1h", 80 -> "1h 20m"
export function formatDuration(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
