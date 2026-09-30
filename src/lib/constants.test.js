import { describe, it, expect } from "vitest";
import { formatDuration, formatLoose } from "./constants";

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

describe("formatLoose", () => {
  it("shows presets exactly", () => {
    expect(formatLoose(15)).toBe("15m");
    expect(formatLoose(60)).toBe("1h");
    expect(formatLoose(90)).toBe("1.5h");
    expect(formatLoose(180)).toBe("3h+");
  });

  it("rounds everything else to the nearest preset with a ~", () => {
    expect(formatLoose(103)).toBe("~1.5h");
    expect(formatLoose(110)).toBe("~2h");
    expect(formatLoose(2)).toBe("~15m");
    expect(formatLoose(45)).toBe("~1h"); // ties round up
    expect(formatLoose(160)).toBe("~3h");
  });

  it("reads anything from 3 hours up as 3h+", () => {
    expect(formatLoose(200)).toBe("3h+");
    expect(formatLoose(600)).toBe("3h+");
  });
});
