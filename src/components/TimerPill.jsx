import { useTimer, useNow, stopTimer, formatClock } from "../lib/timer";

// While a session timer runs, this quiet pill floats above the nav on every
// tab except Log (which shows the timer itself). Tap it to open Log; tap the
// stop button to stop and go log it.
export default function TimerPill({ onOpen }) {
  const timer = useTimer();
  const running = !!timer && !timer.stoppedAt;
  const now = useNow(running);
  if (!running) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      aria-label={`${timer.name} timer running. Open Log`}
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 12,
        maxWidth: 420,
        margin: "0 auto",
        height: 48,
        borderRadius: 100,
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 7px 0 16px",
        cursor: "pointer",
        zIndex: 50,
      }}
    >
      <span
        className="timer-dot"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: timer.color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--text-mid)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {timer.name}
      </span>
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          color: "var(--text)",
        }}
      >
        {formatClock(now - timer.startedAt)}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          stopTimer();
          onOpen();
        }}
        aria-label="Stop timer"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "none",
          background: timer.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: "var(--bg)",
          }}
        />
      </button>
    </div>
  );
}
