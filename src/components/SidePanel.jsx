import { useEffect, useState } from "react";
import { useWide } from "../lib/useWide";

// A panel over the page: slides in from the right on wide screens, up from
// the bottom (nearly full height) on phones. Closes on the backdrop, Escape,
// or the close function handed to children, and animates out either way.
export default function SidePanel({ label, onClose, children }) {
  const wide = useWide();
  const [leaving, setLeaving] = useState(false);
  const close = () => setLeaving(true);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setLeaving(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const motion = wide
    ? leaving
      ? "panel-out-right"
      : "panel-in-right"
    : leaving
      ? "sheet-down"
      : "sheet-up";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90 }}>
      <div
        onClick={close}
        className={leaving ? "fade-out" : "fade-in"}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.55)",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={motion}
        onAnimationEnd={(e) => {
          if (leaving && e.target === e.currentTarget) onClose();
        }}
        style={
          wide
            ? {
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                width: "min(480px, 100%)",
                overflowY: "auto",
                padding:
                  "calc(28px + var(--safe-top)) calc(32px + var(--safe-right)) calc(32px + var(--safe-bottom)) 32px",
                background: "var(--surface)",
                borderLeft: "1px solid var(--border)",
              }
            : {
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                top: "calc(28px + var(--safe-top))",
                overflowY: "auto",
                padding: "20px 20px calc(28px + var(--safe-bottom))",
                background: "var(--surface)",
                borderTop: "1px solid var(--border)",
                borderRadius: "16px 16px 0 0",
              }
        }
      >
        {children(close)}
      </div>
    </div>
  );
}
