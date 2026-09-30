import { useState, useEffect, useRef } from "react";
import { summarizeDay } from "../lib/tiers";
import { INTENSITIES, formatLoose } from "../lib/constants";
import Flower from "./Flower";

const canHover =
  typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

// Today on the Log screen: today's flower as it stands, with a dashed outline
// of where the pending log (the picked length, or a running timer) would take
// its track. Right after a log (`logged`), that petal grows out to meet its
// outline instead. Hover a petal (tap on a phone) to see its sessions.
export default function TodayPanel({ tracks, todaySessions, pending, logged }) {
  const [tip, setTip] = useState(null); // { entry, x, y }
  const boxRef = useRef(null);
  const byId = new Map(tracks.map((t) => [t.id, t]));
  const current = summarizeDay(todaySessions, byId);
  const track = !logged && pending && byId.get(pending.trackId);
  const loggedTrack = logged && byId.get(logged.trackId);
  const loggedNow = current.tracks.find((t) => t.track.id === logged?.trackId);
  const preview = track
    ? summarizeDay(
        [
          ...todaySessions,
          {
            id: "pending",
            project_id: track.id,
            duration_minutes: pending.minutes,
          },
        ],
        byId,
      )
    : current;
  const before = current.tracks.find((t) => t.track.id === track?.id) ?? null;
  const after = preview.tracks.find((t) => t.track.id === track?.id);

  function showTip(entry, e) {
    const box = boxRef.current.getBoundingClientRect();
    setTip({
      entry,
      x: Math.max(0, Math.min(e.clientX - box.left + 14, box.width - 230)),
      y: e.clientY - box.top + 14,
    });
  }

  // on touch screens a tap elsewhere closes the details
  useEffect(() => {
    if (!tip || canHover) return;
    const close = (e) => {
      if (!e.target.closest?.("svg")) setTip(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [tip]);

  return (
    <div
      ref={boxRef}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      {preview.dominant ? (
        <Flower
          key={logged?.key ?? "live"}
          day={preview}
          size={260}
          animate={false}
          ghost={track ? { trackId: track.id, before } : null}
          fill={
            logged ? { trackId: logged.trackId, before: logged.before } : null
          }
          onPetal={showTip}
          onPetalLeave={canHover ? () => setTip(null) : null}
        />
      ) : (
        <div
          style={{
            height: 200,
            display: "flex",
            alignItems: "center",
            ...captionStyle,
            color: "var(--text-dim)",
          }}
        >
          Nothing logged yet today
        </div>
      )}

      {loggedTrack && loggedNow ? (
        <div style={captionStyle}>
          Logged +{formatLoose(logged.minutes)} {loggedTrack.name} →{" "}
          <span style={{ color: loggedTrack.color }}>
            {INTENSITIES[loggedNow.tier]}
          </span>
        </div>
      ) : (
        after && (
          <div style={captionStyle}>
            +{formatLoose(pending.minutes)} {track.name} →{" "}
            <span style={{ color: track.color }}>
              {INTENSITIES[after.tier]}
            </span>
          </div>
        )
      )}
      {current.tracks.length > 0 && (
        <div style={{ ...captionStyle, color: "var(--text-dim)" }}>
          {canHover ? "Hover" : "Tap"} a petal for its sessions
        </div>
      )}

      {tip && (
        <div
          style={{
            position: "absolute",
            left: tip.x,
            top: tip.y,
            width: 220,
            zIndex: 5,
            pointerEvents: "none",
            padding: "12px 14px",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: tip.entry.track.color,
            }}
          >
            {tip.entry.track.name}
          </div>
          <div style={{ ...tipLine, color: "var(--text)" }}>
            {formatLoose(tip.entry.totalMin)} today ·{" "}
            {INTENSITIES[tip.entry.tier]}
          </div>
          {tip.entry.sessions
            .filter((s) => s.id !== "pending")
            .map((s) => (
              <div key={s.id} style={tipLine}>
                {formatLoose(s.duration_minutes)}
                {s.note ? ` · ${s.note}` : ""}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

const captionStyle = {
  textAlign: "center",
  fontSize: 12,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "var(--text-mid)",
};

const tipLine = {
  fontSize: 12,
  letterSpacing: "0.06em",
  color: "var(--text-mid)",
  lineHeight: 1.5,
};
