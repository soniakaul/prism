import { useState, useEffect } from "react";
import * as db from "../lib/db";
import { toDateKey, fromDateKey, logicalToday } from "../lib/dates";
import { DURATIONS, formatDuration, formatLoose } from "../lib/constants";
import { reportError } from "../lib/toast";
import {
  useTimer,
  useNow,
  startTimer,
  stopTimer,
  clearTimer,
  timerMinutes,
  formatClock,
} from "../lib/timer";
import Page from "../components/Page";
import IntensityMeter from "../components/IntensityMeter";

const dayLabel = (key) =>
  fromDateKey(key)
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    .replace(",", " ·");

// Three states: pick a track and log a finished session (or start a timer),
// a running timer, and a stopped timer waiting to be logged. New sessions
// always go to today (which runs until 3am).
export default function Log({ active, onLogged }) {
  const [projects, setProjects] = useState([]);
  const [selProj, setSelProj] = useState(null);
  const [selDur, setSelDur] = useState(60);
  // after the timer stops, tapping a preset replaces the timed length
  const [picked, setPicked] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const timer = useTimer();
  const running = !!timer && !timer.stoppedAt;
  const stopped = !!timer?.stoppedAt;
  const now = useNow(running && active);

  useEffect(() => {
    if (!active) return;
    db.getProjects()
      .then((data) => {
        setProjects(data);
        // keep the current pick only if that project still exists
        setSelProj((cur) =>
          data.some((p) => p.id === cur) ? cur : (data[0]?.id ?? null),
        );
      })
      .catch((err) => reportError("Couldn't load your projects", err));
  }, [active]);

  const trackId = timer ? timer.trackId : selProj;
  const track = projects.find((p) => p.id === trackId);
  const timed = stopped && !picked;
  const duration = timed ? timerMinutes(timer) : selDur;
  const today = logicalToday();
  const lateNight = today !== toDateKey();

  function pickDuration(value) {
    setSelDur(value);
    if (stopped) setPicked(true);
  }

  function discardTimer() {
    clearTimer();
    setPicked(false);
    setConfirmCancel(false);
  }

  async function submit() {
    if (!trackId) return;
    setLoading(true);
    try {
      await db.addSession({
        project_id: trackId,
        duration_minutes: duration,
        note,
        date: today,
        source: timed ? "timer" : "manual",
      });
    } catch (err) {
      reportError("Couldn't save your session. Try again", err);
      return;
    } finally {
      setLoading(false);
    }
    setNote("");
    setPicked(false);
    if (timer) clearTimer();
    onLogged({ date: today, trackId });
  }

  return (
    <Page active={active} eyebrow="Record" title="Log Session">
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
          margin: "-24px 0 32px",
        }}
      >
        {lateNight
          ? `Still ${dayLabel(today)} until 3am`
          : `For ${dayLabel(today)}`}
      </div>

      {running ? (
        <div
          style={{
            maxWidth: 480,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
            paddingTop: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="timer-dot"
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: timer.color,
              }}
            />
            <span
              style={{
                fontSize: 14,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: timer.color,
              }}
            >
              {timer.name}
            </span>
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {formatClock(now - timer.startedAt)}
          </div>
          {/* the bars fill up as you work */}
          <div style={{ width: "100%" }}>
            <IntensityMeter
              track={track || { color: timer.color }}
              minutes={Math.floor((now - timer.startedAt) / 60000)}
            />
          </div>
          <button
            onClick={stopTimer}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 44px",
              borderRadius: 100,
              border: "none",
              background: timer.color,
              color: "var(--bg)",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: "var(--bg)",
              }}
            />
            Stop
          </button>
          <button
            onClick={() =>
              confirmCancel ? discardTimer() : setConfirmCancel(true)
            }
            onBlur={() => setConfirmCancel(false)}
            style={{
              background: "transparent",
              border: "none",
              color: confirmCancel ? "#b8716e" : "var(--text-dim)",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {confirmCancel ? "Tap again to discard" : "Cancel timer"}
          </button>
        </div>
      ) : (
        <div
          style={{
            maxWidth: 480,
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          {stopped ? (
            <Field label="Timed session">
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: timer.color,
                  }}
                >
                  {timer.name}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--text-mid)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDuration(timerMinutes(timer))} · shows as{" "}
                  {formatLoose(timerMinutes(timer))}
                </span>
              </div>
            </Field>
          ) : (
            <>
              <Field label="Project">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {projects.length === 0 ? (
                    <div
                      style={{
                        fontSize: 13,
                        letterSpacing: "0.15em",
                        color: "var(--text-dim)",
                        textTransform: "uppercase",
                      }}
                    >
                      No projects yet — add one first
                    </div>
                  ) : (
                    projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelProj(p.id)}
                        style={{
                          padding: "9px 18px",
                          borderRadius: 100,
                          cursor: "pointer",
                          fontSize: 14,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          border:
                            selProj === p.id
                              ? "none"
                              : "1px solid var(--border)",
                          background:
                            selProj === p.id ? p.color : "transparent",
                          color:
                            selProj === p.id ? "var(--bg)" : "var(--text-mid)",
                          transition: "all 0.15s",
                        }}
                      >
                        {p.name}
                      </button>
                    ))
                  )}
                </div>
              </Field>

              <button
                onClick={() => track && startTimer(track)}
                disabled={!track}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: "16px",
                  borderRadius: 6,
                  border: "none",
                  background: track?.color || "var(--surface2)",
                  color: "var(--bg)",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: track ? "pointer" : "default",
                  opacity: track ? 1 : 0.5,
                  transition: "background 0.2s",
                }}
              >
                <span
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "7px solid transparent",
                    borderBottom: "7px solid transparent",
                    borderLeft: "11px solid var(--bg)",
                  }}
                />
                Start timer
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  margin: "-8px 0 -8px",
                }}
              >
                <div
                  style={{ flex: 1, height: 1, background: "var(--border)" }}
                />
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "var(--text-dim)",
                  }}
                >
                  or log a finished session
                </div>
                <div
                  style={{ flex: 1, height: 1, background: "var(--border)" }}
                />
              </div>
            </>
          )}

          <Field label={stopped ? "Or pick a length" : "Duration"}>
            <div
              style={{
                display: "flex",
                border: "1px solid var(--border)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              {DURATIONS.map((d, i) => {
                const on = !timed && selDur === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => pickDuration(d.value)}
                    style={{
                      flex: 1,
                      padding: "12px 4px",
                      border: "none",
                      borderRight:
                        i < DURATIONS.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      background: on ? "var(--surface2)" : "transparent",
                      fontSize: 14,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: on ? "var(--text)" : "var(--text-mid)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      textAlign: "center",
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* what this session earns, previewed in the track's color */}
          <Field label="Intensity">
            <IntensityMeter track={track} minutes={duration} />
          </Field>

          <Field label="Note — optional">
            <textarea
              rows={3}
              placeholder="what did you get done..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "14px 16px",
                fontSize: 16,
                letterSpacing: "0.04em",
                color: "var(--text)",
                resize: "none",
                outline: "none",
                lineHeight: 1.5,
              }}
            />
          </Field>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={submit}
              disabled={loading || !trackId}
              style={{
                flex: 1,
                padding: "16px",
                background: "var(--text)",
                color: "var(--bg)",
                border: "none",
                borderRadius: 6,
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                opacity: loading || !trackId ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Logging..." : "Log"}
            </button>
            {stopped && (
              <button
                onClick={discardTimer}
                style={{
                  padding: "16px 18px",
                  background: "transparent",
                  color: "var(--text-dim)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 14,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Discard
              </button>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
