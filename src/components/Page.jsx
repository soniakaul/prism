// Shared shell for the four tab pages: stacked in App, faded in when active,
// with the same responsive padding and iPhone safe-area insets everywhere.
export default function Page({ active, eyebrow, title, children }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflowY: "auto",
        overflowX: "hidden",
        padding:
          "calc(clamp(28px, 5vw, 48px) + var(--safe-top)) max(clamp(20px, 4vw, 52px), var(--safe-right)) calc(32px + var(--pill-space, 0px)) max(clamp(20px, 4vw, 52px), var(--safe-left))",
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(12px)",
        pointerEvents: active ? "all" : "none",
        transition: "opacity 0.3s, transform 0.3s",
      }}
    >
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
            marginBottom: 6,
          }}
        >
          <span style={{ textTransform: "none" }}>prism</span> · {eyebrow}
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            fontFamily: "Agdasima, sans-serif",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}
