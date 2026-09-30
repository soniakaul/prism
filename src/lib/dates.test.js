import { describe, it, expect } from "vitest";
import {
  toDateKey,
  addDays,
  weekColumns,
  monthLabels,
  logicalToday,
  isOpen,
} from "./dates";

describe("toDateKey", () => {
  it("uses the local day, even late in the evening", () => {
    expect(toDateKey(new Date(2026, 8, 23, 20, 0))).toBe("2026-09-23");
    expect(toDateKey(new Date(2026, 8, 23, 23, 59))).toBe("2026-09-23");
    expect(toDateKey(new Date(2026, 8, 23, 0, 1))).toBe("2026-09-23");
  });
});

describe("addDays", () => {
  it("crosses month, year and DST boundaries", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02"); // US DST ends
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09"); // US DST starts
  });
});

describe("weekColumns", () => {
  // 2026-09-23 is a Wednesday
  const cols = weekColumns("2026-09-23", 13, 0);

  it("starts every column on Sunday", () => {
    for (const col of cols) {
      expect(new Date(col[0] + "T12:00").getDay()).toBe(0);
    }
  });

  it("puts today in the last column, on its weekday row", () => {
    const last = cols.at(-1);
    expect(last[3]).toBe("2026-09-23");
    expect(last[0]).toBe("2026-09-20");
    expect(last[6]).toBe("2026-09-26");
  });

  it("returns the requested number of contiguous weeks", () => {
    expect(cols).toHaveLength(13);
    expect(addDays(cols[0][6], 1)).toBe(cols[1][0]);
  });

  it("supports a Monday week start", () => {
    const mon = weekColumns("2026-09-23", 2, 1);
    expect(mon.at(-1)[0]).toBe("2026-09-21");
    expect(mon.at(-1)[2]).toBe("2026-09-23");
  });

  it("works when today is the first day of the week", () => {
    const c = weekColumns("2026-09-20", 1, 0);
    expect(c[0][0]).toBe("2026-09-20");
  });
});

describe("monthLabels", () => {
  it("drops the first label when the next month starts right after", () => {
    // first column starts Jun 21; the next column (Jun 28) is still June,
    // the one after (Jul 5) starts July -> labels at 0 and 2 would collide
    const cols = weekColumns("2026-09-23", 14, 0);
    const labels = monthLabels(cols, 3);
    expect(labels[0].text).not.toBe("JUN");
    expect(labels.map((l) => l.text)).toEqual(["JUL", "AUG", "SEP"]);
  });

  it("keeps the first label when there is room", () => {
    const cols = weekColumns("2026-09-23", 13, 0); // starts Jun 28
    const labels = monthLabels(cols, 1);
    expect(labels[0]).toEqual({ index: 0, text: "JUN" });
  });
});

describe("logicalToday", () => {
  it("is the calendar day during the day", () => {
    expect(logicalToday(new Date(2026, 8, 23, 9, 0))).toBe("2026-09-23");
    expect(logicalToday(new Date(2026, 8, 23, 23, 59))).toBe("2026-09-23");
  });

  it("stays on yesterday until the lock hour", () => {
    expect(logicalToday(new Date(2026, 8, 24, 0, 30))).toBe("2026-09-23");
    expect(logicalToday(new Date(2026, 8, 24, 2, 59))).toBe("2026-09-23");
    expect(logicalToday(new Date(2026, 8, 24, 3, 0))).toBe("2026-09-24");
  });

  it("respects a custom lock hour", () => {
    expect(logicalToday(new Date(2026, 8, 24, 0, 30), 0)).toBe("2026-09-24");
    expect(logicalToday(new Date(2026, 8, 24, 4, 30), 5)).toBe("2026-09-23");
  });

  it("handles the lock across a month boundary", () => {
    expect(logicalToday(new Date(2026, 9, 1, 1, 0))).toBe("2026-09-30");
  });
});

describe("isOpen", () => {
  const lateNight = new Date(2026, 8, 24, 1, 0);

  it("keeps the previous day open in the grace window", () => {
    expect(isOpen("2026-09-23", lateNight)).toBe(true);
    expect(isOpen("2026-09-24", lateNight)).toBe(false);
  });

  it("locks every other day", () => {
    const noon = new Date(2026, 8, 23, 12, 0);
    expect(isOpen("2026-09-23", noon)).toBe(true);
    expect(isOpen("2026-09-22", noon)).toBe(false);
    expect(isOpen("2026-09-24", noon)).toBe(false);
  });
});
