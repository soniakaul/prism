import { useLayoutEffect, useEffect, useRef, useCallback } from "react";
import { animate, useReducedMotion } from "framer-motion";

// Opening a day. The grid dims, a copy of the tapped square floats to the
// middle and turns into a bud, and the flower unfurls from it (renderVisual
// gets the delay for its own animation so it starts as the bud lands). The
// day's details rise in underneath. Closing plays it back into the square.
// Only transform and opacity animate.
const LAND = 0.52; // seconds until the bud lands

export default function Bloom({
  origin, // the tapped square's on-screen rect
  color,
  shade,
  anchorY = 0.5, // where on the visual the bud lands (0 top, 1 bottom)
  renderVisual,
  header,
  onClose,
  children,
}) {
  const backdropRef = useRef(null);
  const moverRef = useRef(null);
  const visualRef = useRef(null);
  const headerRef = useRef(null);
  const detailsRef = useRef(null);
  const closing = useRef(false);
  const reduce = useReducedMotion();

  // from the square's center to the point where the flower grows
  const travel = useCallback(() => {
    const r = visualRef.current.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - (origin.left + origin.width / 2),
      y: r.top + r.height * anchorY - (origin.top + origin.height / 2),
    };
  }, [origin, anchorY]);

  useLayoutEffect(() => {
    animate(
      backdropRef.current,
      { opacity: [0, 1] },
      { duration: reduce ? 0.15 : 0.35 },
    );
    animate(
      headerRef.current,
      { opacity: [0, 1] },
      { duration: 0.25, delay: reduce ? 0 : 0.2 },
    );
    if (reduce) {
      animate(detailsRef.current, { opacity: [0, 1] }, { duration: 0.15 });
      return;
    }
    const { x, y } = travel();
    animate(
      moverRef.current,
      {
        x: [0, x, x],
        y: [0, y, y],
        rotate: [0, 45, 45],
        scale: [1, 0.8, 0.2],
        opacity: [shade, shade, 0],
      },
      { duration: 0.62, times: [0, 0.75, 1], ease: [0.4, 0, 0.2, 1] },
    );
    animate(
      detailsRef.current,
      { opacity: [0, 1], y: [16, 0] },
      { duration: 0.4, delay: 0.95, ease: "easeOut" },
    );
  }, [reduce, shade, travel]);

  const close = useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    const fade = { duration: 0.15 };
    animate(detailsRef.current, { opacity: 0 }, fade);
    animate(headerRef.current, { opacity: 0 }, fade);
    if (reduce) {
      await animate(backdropRef.current, { opacity: 0 }, fade);
      onClose();
      return;
    }
    const { x, y } = travel(); // measure before the flower starts shrinking
    animate(
      visualRef.current,
      { opacity: 0, scale: 0.6 },
      { duration: 0.25, ease: "easeIn" },
    );
    animate(
      backdropRef.current,
      { opacity: 0 },
      { duration: 0.35, delay: 0.2 },
    );
    await animate(
      moverRef.current,
      {
        x: [x, x, 0],
        y: [y, y, 0],
        rotate: [45, 45, 0],
        scale: [0.2, 0.8, 1],
        opacity: [0, shade, shade],
      },
      { duration: 0.55, times: [0, 0.3, 1], ease: [0.4, 0, 0.2, 1] },
    );
    onClose();
  }, [reduce, shade, onClose, travel]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // taps on empty space close it; taps on the flower or details don't
  const closeOnSelf = (e) => e.target === e.currentTarget && close();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <div
        ref={backdropRef}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(17, 18, 16, 0.97)",
          opacity: 0,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        onClick={closeOnSelf}
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          padding:
            "calc(20px + var(--safe-top)) 20px calc(28px + var(--safe-bottom))",
        }}
      >
        <div onClick={closeOnSelf} style={{ maxWidth: 420, margin: "0 auto" }}>
          <div
            ref={headerRef}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              opacity: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>{header}</div>
            <button
              onClick={close}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-dim)",
                fontSize: 22,
                cursor: "pointer",
                lineHeight: 1,
                padding: 4,
              }}
            >
              ×
            </button>
          </div>
          <div
            ref={visualRef}
            style={{ width: 250, height: 250, margin: "8px auto 12px" }}
          >
            {renderVisual(LAND * 1000)}
          </div>
          <div ref={detailsRef} style={{ opacity: 0 }}>
            {children}
          </div>
        </div>
      </div>
      {/* the traveling copy of the square that becomes the bud */}
      <div
        ref={moverRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: origin.left,
          top: origin.top,
          width: origin.width,
          height: origin.height,
          borderRadius: 3,
          background: color,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
