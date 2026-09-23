import { describe, it, expect } from "vitest";
import { tierFor, summarizeDay, summarizeDays } from "./tiers";

const track = (id, extra = {}) => ({
  id,
  name: id,
  color: "#000",
  created_at: `2026-01-0${id.length}T00:00:00Z`,
  ...extra,
});
const session = (project_id, duration_minutes, date = "2026-09-23") => ({
  id: `${project_id}-${duration_minutes}-${Math.random()}`,
  project_id,
  duration_minutes,
  date,
});
const byId = (...tracks) => new Map(tracks.map((t) => [t.id, t]));

describe("tierFor", () => {
  const t = track("a");

  it("uses 1h / 2h / 3h by default", () => {
    expect(tierFor(0, t)).toBe(0);
    expect(tierFor(59, t)).toBe(0);
    expect(tierFor(60, t)).toBe(1);
    expect(tierFor(119, t)).toBe(1);
    expect(tierFor(120, t)).toBe(2);
    expect(tierFor(180, t)).toBe(3);
    expect(tierFor(600, t)).toBe(3);
  });

  it("respects per-track thresholds", () => {
    const light = track("b", { tier1_min: 15, tier2_min: 30, tier3_min: 45 });
    expect(tierFor(15, light)).toBe(1);
    expect(tierFor(45, light)).toBe(3);
  });
});

describe("summarizeDay", () => {
  it("adds sessions up within a track, never across tracks", () => {
    const a = track("a");
    const b = track("bb");
    const day = summarizeDay(
      [session("a", 60), session("a", 60), session("bb", 90)],
      byId(a, b),
    );
    const totals = Object.fromEntries(
      day.tracks.map((t) => [t.track.id, [t.totalMin, t.tier]]),
    );
    expect(totals).toEqual({ a: [120, 2], bb: [90, 1] });
    expect(day.dominant.track.id).toBe("a");
  });

  it("marks time under tier 1 as a trace", () => {
    const a = track("a");
    const day = summarizeDay([session("a", 30)], byId(a));
    expect(day.dominant.tier).toBe(0);
    expect(day.dominant.trace).toBe(true);
  });

  it("lets any real tier beat a trace", () => {
    const a = track("a");
    const b = track("bb", { tier1_min: 60 });
    const day = summarizeDay([session("a", 50), session("bb", 60)], byId(a, b));
    expect(day.dominant.track.id).toBe("bb");
  });

  it("breaks a tier tie by overflow past the top threshold", () => {
    const a = track("a"); // 3h top
    const b = track("bb"); // 3h top
    const day = summarizeDay(
      [session("a", 180), session("bb", 300)],
      byId(a, b),
    );
    expect(day.dominant.track.id).toBe("bb"); // 5h beats 3h
  });

  it("compares overflow as a ratio across different thresholds", () => {
    const short = track("a", { tier1_min: 20, tier2_min: 40, tier3_min: 60 });
    const long = track("bb"); // 3h top
    // 90m on a 1h-top track (1.5x) beats 240m on a 3h-top track (1.33x)
    const day = summarizeDay(
      [session("a", 90), session("bb", 240)],
      byId(short, long),
    );
    expect(day.dominant.track.id).toBe("a");
  });

  it("falls back to the user's ranking, then the oldest track", () => {
    const a = track("a", { priority: 2 });
    const b = track("bb", { priority: 1 });
    const c = track("ccc");
    const ranked = summarizeDay(
      [session("a", 120), session("bb", 120), session("ccc", 120)],
      byId(a, b, c),
    );
    expect(ranked.tracks.map((t) => t.track.id)).toEqual(["bb", "a", "ccc"]);

    const unranked = summarizeDay(
      [session("ccc", 120), session("a", 120)],
      byId(track("a"), c),
    );
    expect(unranked.dominant.track.id).toBe("a"); // created first
  });

  it("ignores sessions from deleted tracks", () => {
    const day = summarizeDay([session("gone", 300)], byId(track("a")));
    expect(day.dominant).toBeNull();
    expect(day.tracks).toEqual([]);
  });
});

describe("summarizeDays", () => {
  it("groups by date and skips days with nothing valid", () => {
    const a = track("a");
    const days = summarizeDays(
      [
        session("a", 60, "2026-09-22"),
        session("a", 120, "2026-09-23"),
        session("gone", 60, "2026-09-21"),
      ],
      [a],
    );
    expect([...days.keys()].sort()).toEqual(["2026-09-22", "2026-09-23"]);
    expect(days.get("2026-09-23").dominant.tier).toBe(2);
  });
});
