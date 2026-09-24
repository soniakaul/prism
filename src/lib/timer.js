import { useSyncExternalStore, useState, useEffect } from "react";
import { isDemo } from "./db";

// The live session timer: one at a time, kept in localStorage so it survives
// closing the app (in memory in demo mode). The track's name and color are
// saved with it so the pill can render without loading tracks.
// State: null | { trackId, name, color, startedAt, stoppedAt }
const KEY = "prism_timer";
const listeners = new Set();
let memory = null;

function load() {
  if (isDemo()) return memory;
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

let current = load();

function save(next) {
  current = next;
  if (isDemo()) memory = next;
  else {
    try {
      if (next) localStorage.setItem(KEY, JSON.stringify(next));
      else localStorage.removeItem(KEY);
    } catch {
      // storage unavailable: the timer still works until the page reloads
    }
  }
  listeners.forEach((fn) => fn());
}

// keep tabs in sync if the app is open in two places
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    current = load();
    listeners.forEach((fn) => fn());
  });
}

export function startTimer(track) {
  save({
    trackId: track.id,
    name: track.name,
    color: track.color,
    startedAt: Date.now(),
    stoppedAt: null,
  });
}

export function stopTimer() {
  if (current && !current.stoppedAt)
    save({ ...current, stoppedAt: Date.now() });
}

export function clearTimer() {
  save(null);
}

export function useTimer() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => current,
  );
}

// Re-renders every second while `running`, for a ticking clock.
export function useNow(running) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);
  return now;
}

// Whole minutes on the clock, at least 1.
export function timerMinutes(timer) {
  const ms = (timer.stoppedAt ?? Date.now()) - timer.startedAt;
  return Math.max(1, Math.round(ms / 60000));
}

// 5083000 -> "01:24:43"
export function formatClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
