import { useState, useEffect, useRef } from "react";
import * as db from "../lib/db";
import { toDateKey, logicalToday, formatDayKey } from "../lib/dates";
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
import TrackPicker from "../components/TrackPicker";
import TodayPanel from "../components/TodayPanel";
import { rememberTrack } from "../lib/recentTracks";
import { summarizeDay } from "../lib/tiers";
import { useWide } from "../lib/useWide";

// Three states: pick a track and log a finished session (or start a timer),
// a running timer, and a stopped timer waiting to be logged. New sessions
// always go to today (which runs until 3am). After a log you stay here and
// today's flower fills out to show it.
export default function Log({ active }) {
  const [projects, setProjects] = useState([]);
  const [selProj, setSelProj] = useState(null);
  const [selDur, setSelDur] = useState(60);
  // after the timer stops, tapping a preset replaces the timed length
  const [picked, setPicked] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [todaySessions, setTodaySessions] = useState([]);
  // the log that just landed: its petal grows out on the Today flower
  // { key, trackId, minutes, before }; cleared as soon as you pick again
  const [logged, setLogged] = useState(null);
  const wide = useWide();
  const todayRef = useRef(null);
  const logCount = useRef(0); // keys each log's fill animation

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
    // for the Today panel
    db.getSessionsByDate(logicalToday())
      .then(setTodaySessions)
      .catch((err) => reportError("Couldn't load today's sessions", err));
  }, [active]);

  const trackId = timer ? timer.trackId : selProj;
  const track = projects.find((p) => p.id === trackId);
  const timed = stopped && !picked;
  const duration = timed ? timerMinutes(timer) : selDur;
  const today = logicalToday();
  const lateNight = today !== toDateKey();
  // what the Today panel previews: the running clock, or the picked length
  const pending = trackId && {
    trackId,
    minutes: running
      ? Math.max(1, Math.floor((now - timer.startedAt) / 60000))
      : duration,
  };

  function begin() {
    if (!track) return;
    rememberTrack(track.id);
    setLogged(null);
    startTimer(track);
  }

  function pickTrack(id) {
    setSelProj(id);
    setLogged(null);
  }

  function pickDuration(value) {
    setSelDur(value);
    setLogged(null);
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
    rememberTrack(trackId);
    const byId = new Map(projects.map((p) => [p.id, p]));
    const before =
      summarizeDay(todaySessions, byId).tracks.find(
        (t) => t.track.id === trackId,
      ) ?? null;
    try {
      setTodaySessions(await db.getSessionsByDate(today));
    } catch (err) {
      reportError("Couldn't load today's sessions", err);
    }
    logCount.current += 1;
    setLogged({ key: logCount.current, trackId, minutes: duration, before });
    setNote("");
    setPicked(false);
    if (timer) clearTimer();
    // on a phone the flower is above the form; bring it into view to watch
    if (!wide)
      todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const dayLine = lateNight
    ? `Still ${formatDayKey(today)} until 3am`
    : `For ${formatDayKey(today)}`;

  // top right on wide screens, the top row on phones: pick a project and
  // start or stop the timer (the pick is locked to a running timer's project)
  const controls =
    projects.length === 0 ? (
      <div style={{ ...labelStyle, fontSize: 13 }}>
        No projects yet — add one first
      </div>
    ) : (
      <>
        <TrackPicker
          tracks={projects}
          value={trackId}
          onChange={pickTrack}
          disabled={!!timer}
        />
        {!stopped && (
          <button
            onClick={running ? stopTimer : begin}
            disabled={!running && !track}
            style={{
              height: 50,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: wide ? "0 20px" : "0 16px",
              flexShrink: 0,
              borderRadius: 8,
              border: "none",
              background:
                (running ? timer.color : track?.color) || "var(--surface2)",
              color: "var(--bg)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {running ? (
              <span
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 2,
                  background: "var(--bg)",
                }}
              />
            ) : (
              <span
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  borderLeft: "10px solid var(--bg)",
                }}
              />
            )}
            {running ? "Stop" : wide ? "Start timer" : "Start"}
          </button>
        )}
      </>
    );

  // while a timer runs, the clock takes the form's place, centered
  const clock = running && (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        width: "100%",
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
      <div style={{ width: "100%", maxWidth: 400 }}>
        <IntensityMeter
          track={track || { color: timer.color }}
          minutes={Math.floor((now - timer.startedAt) / 60000)}
        />
      </div>
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
  );

  // log a finished session, or a stopped timer's session
  const form = (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {stopped && (
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
                ...labelStyle,
                fontSize: 13,
                color: "var(--text-mid)",
                whiteSpace: "nowrap",
              }}
            >
              {formatDuration(timerMinutes(timer))} · shows as{" "}
              {formatLoose(timerMinutes(timer))}
            </span>
          </div>
        </Field>
      )}

      <Field label={stopped ? "Or pick a length" : "Log a finished session"}>
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
  );

  const todayFlower = (
    <div ref={todayRef} style={{ width: "100%", scrollMarginTop: 24 }}>
      <TodayPanel
        tracks={projects}
        todaySessions={todaySessions}
        pending={pending}
        logged={logged}
      />
    </div>
  );

  return (
    <Page
      active={active}
      eyebrow="Record"
      title="Log Session"
      subtitle={dayLine}
      actions={controls}
    >
      {wide ? (
        // form (or the running clock) on the left, today's flower on the right
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 440px) minmax(0, 1fr)",
            gap: 56,
          }}
        >
          <div
            style={{
              minHeight: 460,
              display: "flex",
              flexDirection: "column",
              justifyContent: running ? "center" : "flex-start",
            }}
          >
            {running ? clock : form}
          </div>
          <div
            style={{
              borderLeft: "1px solid var(--border)",
              paddingLeft: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {todayFlower}
          </div>
        </div>
      ) : (
        // phones: the flower first, then the form (or the running clock)
        <div
          style={{
            maxWidth: 480,
            display: "flex",
            flexDirection: "column",
            gap: 36,
          }}
        >
          {todayFlower}
          {running ? clock : form}
        </div>
      )}
    </Page>
  );
}

const labelStyle = {
  fontSize: 11,
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: "var(--text-dim)",
};

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
