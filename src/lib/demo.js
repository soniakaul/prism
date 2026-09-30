// Demo / filming mode (dev only, open the app with ?demo=1): a year of
// made-up but plausible sessions on made-up tracks. Generated from a fixed
// seed so every reload shows the same garden and shots can be re-recorded.
// Nothing here is real data, and nothing is saved: edits live in memory.
import { toDateKey, addDays, fromDateKey } from "./dates";

export const DEMO_ENABLED =
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("demo");

const TRACKS = [
  {
    id: "demo-prism",
    name: "Prism Development",
    color: "#c87941",
    weekday: 0.62,
    weekend: 0.45,
    minutes: [30, 240],
    notes: [
      "bloom animation",
      "tier engine",
      "grid layout",
      "track setup screen",
      "share card export",
      "timer polish",
    ],
  },
  {
    id: "demo-leetcode",
    name: "Leetcode",
    color: "#8a7fbe",
    weekday: 0.5,
    weekend: 0.3,
    minutes: [30, 170],
    notes: [
      "two pointers",
      "sliding window",
      "graphs: BFS",
      "DP warmup",
      "binary search",
    ],
  },
  {
    id: "demo-ai",
    name: "AI Coursework",
    color: "#5e8faa",
    weekday: 0.25,
    weekend: 0.55,
    minutes: [45, 200],
    notes: [
      "evals lecture",
      "agents reading",
      "RAG notebook",
      "fine-tuning lab",
    ],
  },
  {
    id: "demo-spanish",
    name: "Spanish",
    color: "#6fa88c",
    weekday: 0.55,
    weekend: 0.5,
    minutes: [15, 100],
    notes: [
      "podcast + flashcards",
      "conversation practice",
      "subjuntivo drills",
    ],
  },
  {
    id: "demo-guitar",
    name: "Guitar",
    color: "#c4a84e",
    weekday: 0.3,
    weekend: 0.5,
    minutes: [20, 120],
    notes: ["fingerpicking", "barre chords", "learning a new song"],
  },
];

// mulberry32: tiny seeded PRNG, good enough for fake data
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round5 = (m) => Math.max(5, Math.round(m / 5) * 5);

export function generateDemo(today = toDateKey(), days = 365) {
  const rand = rng(20260923);
  const projects = TRACKS.map((t, i) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    priority: null,
    hide_on_share: false,
    created_at: `2025-09-0${i + 1}T00:00:00Z`,
    user_id: "demo",
  }));

  const sessions = [];
  let n = 0;
  // one quiet stretch, like a trip, about four months back
  const tripStart = addDays(today, -120);
  const tripEnd = addDays(today, -113);

  // yesterday and earlier; today starts empty so logging can be filmed live
  for (let back = days; back >= 1; back--) {
    const date = addDays(today, -back);
    if (date >= tripStart && date <= tripEnd) continue;
    if (rand() < 0.1) continue; // rest day

    const weekend = [0, 6].includes(fromDateKey(date).getDay());
    // weeks swell and ease so the grid has rhythm, not noise
    const energy = 0.8 + 0.3 * Math.sin(back / 17) + (rand() - 0.5) * 0.2;

    for (const t of TRACKS) {
      if (rand() > (weekend ? t.weekend : t.weekday) * energy) continue;
      const [lo, hi] = t.minutes;
      const total = round5(lo + (hi - lo) * Math.pow(rand(), 1.4) * energy);
      // longer days sometimes come in two sittings (lines inside a petal)
      const parts = total >= 60 && rand() < 0.35 ? 2 : 1;
      for (let p = 0; p < parts; p++) {
        sessions.push({
          id: `demo-s-${n++}`,
          project_id: t.id,
          duration_minutes: parts === 1 ? total : round5(total / 2),
          note:
            rand() < 0.4 ? t.notes[Math.floor(rand() * t.notes.length)] : null,
          date,
          source: "manual",
          created_at: `${date}T${String(17 + p * 2).padStart(2, "0")}:00:00`,
          user_id: "demo",
        });
      }
    }
  }

  return { projects, sessions };
}
