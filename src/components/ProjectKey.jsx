import { useState, useRef, useLayoutEffect } from "react";

// The Activity grid's key. Each chip shows or hides its project on the grid;
// hidden ones dim and strike through. When the chips don't fit on one line,
// the rest fold behind a "+N more" chip.
export default function ProjectKey({ projects, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const [fit, setFit] = useState(projects.length);
  const measureRef = useRef(null);

  // count how many chips fit on the first line, leaving room for "+N more"
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => {
      const chips = [...el.children];
      if (!chips.length) return;
      const top = chips[0].offsetTop;
      const first = chips.filter((c) => c.offsetTop === top).length;
      setFit(first >= chips.length ? chips.length : Math.max(1, first - 1));
    };
    measure(); // right away, not just when the observer first reports
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [projects]);

  const folded = !expanded && fit < projects.length;
  const visible = folded ? projects.slice(0, fit) : projects;

  return (
    <div style={{ position: "relative", marginTop: 24 }}>
      {/* invisible copy of every chip, only for measuring */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          ...rowStyle,
          position: "absolute",
          inset: "0 0 auto 0",
          visibility: "hidden",
        }}
      >
        {projects.map((p) => (
          <Chip key={p.id} project={p} />
        ))}
      </div>

      <div style={rowStyle}>
        {visible.map((p) => (
          <Chip key={p.id} project={p} onClick={() => onToggle(p)} />
        ))}
        {folded && (
          <button onClick={() => setExpanded(true)} style={chipStyle}>
            <span style={textStyle}>+{projects.length - fit} more</span>
          </button>
        )}
        {expanded && fit < projects.length && (
          <button onClick={() => setExpanded(false)} style={chipStyle}>
            <span style={textStyle}>Less</span>
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({ project: p, onClick }) {
  const shown = p.show_on_grid !== false;
  return (
    <button
      onClick={onClick}
      aria-pressed={shown}
      title={shown ? "Hide on the grid" : "Show on the grid"}
      style={{ ...chipStyle, opacity: shown ? 1 : 0.4 }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: p.color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          ...textStyle,
          textDecoration: shown ? "none" : "line-through",
        }}
      >
        {p.name}
      </span>
    </button>
  );
}

const rowStyle = { display: "flex", flexWrap: "wrap", gap: 8 };

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 12px",
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: 100,
  cursor: "pointer",
  transition: "opacity 0.2s",
  maxWidth: "100%",
};

const textStyle = {
  fontSize: 12,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "var(--text-mid)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
