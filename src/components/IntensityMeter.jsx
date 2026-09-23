import { tierFor } from "../lib/tiers";
import { INTENSITIES, TIER_OPACITY } from "../lib/constants";

// Read-only preview of the intensity a duration reaches on a track, for that
// session alone: bars fill up to its level in the track's color, using the
// same shades as the grid. Filling staggers upward, emptying downward.
export default function IntensityMeter({
  track,
  minutes,
  height = 44,
  labelSize = 10,
}) {
  const level = track && minutes > 0 ? tierFor(minutes, track) : -1;
  const color = track?.color || "var(--text-dim)";

  return (
    <div
      role="img"
      aria-label={level >= 0 ? `Intensity: ${INTENSITIES[level]}` : "Intensity"}
      style={{ display: "flex", gap: 8 }}
    >
      {INTENSITIES.map((label, i) => {
        const lit = i <= level;
        const delay = (lit ? i : INTENSITIES.length - 1 - i) * 50;
        return (
          <div
            key={label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height,
                borderRadius: 4,
                background: "var(--surface2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: color,
                  opacity: lit ? TIER_OPACITY[i] : 0,
                  transform: lit ? "scaleY(1)" : "scaleY(0)",
                  transformOrigin: "bottom",
                  transition: `opacity 0.3s ${delay}ms, transform 0.3s ${delay}ms`,
                }}
              />
            </div>
            <div
              style={{
                fontSize: labelSize,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textAlign: "center",
                color: i === level ? "var(--text-mid)" : "var(--text-dim)",
                transition: "color 0.3s",
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
