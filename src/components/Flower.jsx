import { useId } from "react";

// A day as a flower: one petal per track, strongest pointing up and the rest
// clockwise by level. Petal length is the track's level for the day (a trace
// is a small bud); thin lines inside a petal split it into its sessions.
// Petals grow in with a staggered CSS animation (see .bloom-* in index.css).

const C = 100; // center of the 200x200 viewBox
const R = 92; // longest petal
const LENGTH = [0.3, 0.55, 0.78, 1]; // by tier; 0 = trace bud
const CREAM = "#e8e4dc";
const CARD = "#191a18"; // split lines are cut in the card's color

// narrow petals as more of them share the circle, so they don't overlap
function roomFor(n) {
  return Math.min(1, 2.2 * Math.tan(Math.PI / Math.max(n, 3)));
}

function petal(L, room) {
  const w = L * 0.34 * room;
  return (
    <path
      d={`M0 0 C ${w} ${-L * 0.3}, ${w} ${-L * 0.78}, 0 ${-L} C ${-w} ${-L * 0.78}, ${-w} ${-L * 0.3}, 0 0 Z`}
    />
  );
}

export default function Flower({
  day,
  size = 250,
  delay = 0,
  emphasize = null, // track id whose petal grows in last, after logging
}) {
  const uid = useId().replace(/:/g, "");
  const tracks = day.tracks;
  const n = tracks.length;
  const room = roomFor(n);

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={tracks
        .map(
          (t) =>
            `${t.track.name} ${["light", "focused", "deep", "locked in"][t.tier]}`,
        )
        .join(", ")}
      style={{ display: "block", overflow: "visible" }}
    >
      {tracks.map((t, i) => {
        const L = R * LENGTH[t.tier];
        const shape = petal(L, room);
        const clip = `${uid}-${i}`;
        // where one session ends and the next begins, as a share of the petal
        let acc = 0;
        const splits = t.sessions
          .slice(0, -1)
          .map((s) => (acc += s.duration_minutes) / t.totalMin);
        return (
          <g
            key={t.track.id}
            className="bloom-petal"
            style={{
              "--d": `${delay + (t.track.id === emphasize ? n * 90 + 200 : i * 90)}ms`,
            }}
          >
            <g transform={`translate(${C} ${C}) rotate(${(i * 360) / n})`}>
              <clipPath id={clip}>{shape}</clipPath>
              <g fill={t.track.color} opacity={t.trace ? 0.55 : 0.95}>
                {shape}
              </g>
              <g clipPath={`url(#${clip})`}>
                {splits.map((f) => (
                  <line
                    key={f}
                    x1={-R}
                    x2={R}
                    y1={-L * f}
                    y2={-L * f}
                    stroke={CARD}
                    strokeWidth="2.5"
                  />
                ))}
              </g>
            </g>
          </g>
        );
      })}
      <circle
        className="bloom-dot"
        style={{ "--d": `${delay + n * 90}ms` }}
        cx={C}
        cy={C}
        r="7"
        fill={CREAM}
      />
    </svg>
  );
}

// A rest day: a small sprout. Rest counts.
export function Sprout({ size = 250, delay = 0 }) {
  const green = "#7a9e6e";
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Rest day sprout"
      style={{ display: "block" }}
    >
      <line
        x1="70"
        x2="130"
        y1="160"
        y2="160"
        stroke="#2c2e2b"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        className="sprout-stem"
        style={{ "--d": `${delay}ms` }}
        d="M100 160 C 100 140, 98 125, 100 105"
        fill="none"
        stroke={green}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        className="sprout-leaf"
        style={{ "--d": `${delay + 300}ms`, transformOrigin: "100px 124px" }}
        d="M100 124 C 88 124, 74 116, 70 100 C 86 100, 98 108, 100 124 Z"
        fill={green}
      />
      <path
        className="sprout-leaf"
        style={{ "--d": `${delay + 420}ms`, transformOrigin: "100px 112px" }}
        d="M100 112 C 110 110, 124 100, 128 84 C 112 86, 101 96, 100 112 Z"
        fill={green}
        opacity="0.85"
      />
    </svg>
  );
}
