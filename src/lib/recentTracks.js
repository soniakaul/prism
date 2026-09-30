// The last few tracks you logged or timed on this device, most recent first.
// Only used to order the track picker, so losing it costs nothing.
const KEY = "prism_recent_tracks";

export function recentTrackIds() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function rememberTrack(id) {
  try {
    const next = [id, ...recentTrackIds().filter((x) => x !== id)].slice(0, 5);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable: the picker just won't reorder
  }
}
