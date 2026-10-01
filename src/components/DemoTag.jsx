import { isDemo, isCleanDemo } from "../lib/db";

// Tells visitors on the demo link (e.g. from a resume) that they're looking
// at sample data. Add &clean to the URL to hide it for filming.
export default function DemoTag() {
  if (!isDemo() || isCleanDemo()) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: "calc(12px + var(--safe-top))",
        right: "calc(14px + var(--safe-right))",
        zIndex: 60,
        padding: "6px 12px",
        borderRadius: 100,
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        fontSize: 10,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: "var(--text-mid)",
        pointerEvents: "none",
      }}
    >
      Demo · sample data
    </div>
  );
}
