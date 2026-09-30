import { useSyncExternalStore } from "react";

// Wide screens (tablets in landscape, laptops, desktops) get the left rail,
// the two-column Log and the project side panel; phones keep the stacked
// layout and the bottom tab bar.
const WIDE = "(min-width: 900px)";

export function useWide() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(WIDE);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(WIDE).matches,
  );
}
