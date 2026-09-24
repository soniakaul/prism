// Tier and dominance math. Pure functions, no I/O: every number the grid,
// bloom and stats show is derived here from raw sessions. (The AI never
// computes any of this; it only turns words into sessions.)
//
// A track is a row from `projects`; sessions point at it via project_id.

// One scale for every track, in minutes that day: tier 1 (Focused) at 1h,
// tier 2 (Deep) at 2h, tier 3 (Locked In) at 3h. Under 1h is a trace (Light).
export const THRESHOLDS = [60, 120, 180];

// 0-3. A track with time logged but under tier 1 is tier 0 with trace=true.
export function tierFor(totalMin) {
  const [t1, t2, t3] = THRESHOLDS;
  if (totalMin >= t3) return 3;
  if (totalMin >= t2) return 2;
  if (totalMin >= t1) return 1;
  return 0;
}

// Order for "who colors the square": highest tier, then the most time
// (5h beats 3h), then the user's ranking (lower priority number wins,
// unranked last), then oldest track.
export function compareDominance(a, b) {
  if (a.tier !== b.tier) return b.tier - a.tier;
  if (a.overflow !== b.overflow) return b.overflow - a.overflow;
  const pa = a.track.priority ?? Infinity;
  const pb = b.track.priority ?? Infinity;
  if (pa !== pb) return pa - pb;
  return (a.track.created_at ?? "").localeCompare(b.track.created_at ?? "");
}

// One day: per-track totals and tiers, strongest first, plus the track that
// colors the square. `dominant` is null only when nothing was logged. When
// every track is under tier 1, dominant is still set and dominant.trace is
// true, so the square can show a faint tint.
export function summarizeDay(sessions, tracksById) {
  const byTrack = new Map();
  for (const s of sessions) {
    const track = tracksById.get(s.project_id);
    if (!track) continue; // session from a deleted track
    let entry = byTrack.get(track.id);
    if (!entry) {
      entry = { track, totalMin: 0, sessions: [] };
      byTrack.set(track.id, entry);
    }
    entry.totalMin += s.duration_minutes;
    entry.sessions.push(s);
  }

  const tracks = [...byTrack.values()].map((e) => {
    const tier = tierFor(e.totalMin);
    return {
      ...e,
      tier,
      trace: tier === 0 && e.totalMin > 0,
      overflow: e.totalMin / THRESHOLDS[2],
    };
  });
  tracks.sort(compareDominance);

  return { tracks, dominant: tracks[0] ?? null };
}

// Every logged day, keyed by date.
export function summarizeDays(sessions, tracks) {
  const tracksById = new Map(tracks.map((t) => [t.id, t]));
  const byDate = new Map();
  for (const s of sessions) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date).push(s);
  }
  const days = new Map();
  for (const [date, list] of byDate) {
    const day = summarizeDay(list, tracksById);
    if (day.dominant) days.set(date, day);
  }
  return days;
}
