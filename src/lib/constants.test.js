import { describe, it, expect } from "vitest";
import { formatDuration } from "./constants";

describe("formatDuration", () => {
  it("formats minutes, whole hours and mixed durations", () => {
    expect(formatDuration(15)).toBe("15m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(80)).toBe("1h 20m");
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(180)).toBe("3h");
    expect(formatDuration(135)).toBe("2h 15m");
  });
});
