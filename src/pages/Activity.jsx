import { useState, useEffect, useRef } from "react";
import * as db from "../lib/db";

import { toDateKey, weekColumns, monthLabels } from "../lib/dates";
import { summarizeDays, tierFor } from "../lib/tiers";
import {
  DURATIONS,
  INTENSITIES,
  TIER_OPACITY,
  formatDuration,
} from "../lib/constants";
import { reportError } from "../lib/toast";
import Page from "../components/Page";
import IntensityMeter from "../components/IntensityMeter";

const GAP = 3;
const DAY_LABEL_W = 14;
const DAY_LABEL_COL = DAY_LABEL_W + GAP;
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]; // weeks start Sunday

export default function Activity({ active }) {
  const [sessions, setSessions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [modal, setModal] = useState(null); // { date, sessions: [] }
  const [editing, setEditing] = useState(null); // session being edited
  const [editDur, setEditDur] = useState(60);
  const [editNote, setEditNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const gridWrapRef = useRef(null);
  const [dims, setDims] = useState({ weeks: 52, cell: 14 });

  useEffect(() => {
    if (!active) return;
    fetchData();
  }, [active]);

  useEffect(() => {
    const el = gridWrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      let weeks;
      if (w < 700) weeks = 13;
      else if (w < 1100) weeks = 26;
      else weeks = 52;
      const cell = Math.floor((w - DAY_LABEL_COL - weeks * GAP) / weeks);
      setDims({ weeks, cell: Math.max(8, Math.min(cell, 28)) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  async function fetchData() {
    try {
      const [proj, sess] = await Promise.all([
        db.getProjects(),
        db.getSessions(),
      ]);
      setProjects(proj);
      setSessions(sess);
    } catch (err) {
      reportError("Couldn't load your activity", err);
    }
  }

  // sessions whose project was deleted don't count anywhere
  const known = new Set(projects.map((p) => p.id));
  const logged = sessions.filter((s) => known.has(s.project_id));

  // date -> { tracks, dominant }; the dominant track colors the square
  const days = summarizeDays(logged, projects);

  // adaptive: WEEKS depends on container width (see ResizeObserver above)
  const todayKey = toDateKey();
  const WEEKS = dims.weeks;
  const CELL = dims.cell;
  const weeks = weekColumns(todayKey, WEEKS, 0);
  // a month label needs ~32px; skip the first one if the next is closer
  const labels = monthLabels(weeks, Math.ceil(32 / (CELL + GAP)));
  const timeframe =
    WEEKS >= 52 ? "Past year" : WEEKS >= 26 ? "Past 6 months" : "Past 3 months";

  const totalHours = logged.reduce((a, s) => a + s.duration_minutes, 0) / 60;
  const thisMonth = logged.filter((s) =>
    s.date?.startsWith(todayKey.slice(0, 7)),
  );
  const monthHours = thisMonth.reduce((a, s) => a + s.duration_minutes, 0) / 60;

  function openCell(date) {
    const daySessions = sessions.filter((s) => s.date === date);
    if (daySessions.length === 0) return;
    setModal({ date, sessions: daySessions });
    setEditing(null);
    setConfirmDelete(null);
  }

  function startEdit(s) {
    setEditing(s);
    setEditDur(s.duration_minutes);
    setEditNote(s.note || "");
    setConfirmDelete(null);
  }

  async function saveEdit() {
    try {
      await db.updateSession(editing.id, {
        duration_minutes: editDur,
        note: editNote,
      });
      setEditing(null);
      await fetchData();
      const updated = await db.getSessionsByDate(modal.date);
      setModal((m) => ({ ...m, sessions: updated }));
    } catch (err) {
      reportError("Couldn't save your changes", err);
    }
  }

  async function deleteSession(id) {
    try {
      await db.deleteSession(id);
      setConfirmDelete(null);
      setEditing(null);
      await fetchData();
      const updated = await db.getSessionsByDate(modal.date);
      if (updated.length === 0) setModal(null);
      else setModal((m) => ({ ...m, sessions: updated }));
    } catch (err) {
      reportError("Couldn't delete that session", err);
    }
  }

  const modalProj = editing
    ? projects.find((p) => p.id === editing.project_id)
    : null;

  return (
    <>
      <Page active={active} eyebrow={timeframe} title="Activity">
        <div ref={gridWrapRef} style={{ width: "100%" }}>
          <div
            style={{
              position: "relative",
              height: 12,
              marginLeft: DAY_LABEL_COL,
              marginBottom: 6,
            }}
          >
            {labels.map((l) => (
              <div
                key={l.index}
                style={{
                  position: "absolute",
                  left: l.index * (CELL + GAP),
                  fontSize: 10,
                  lineHeight: "12px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-dim)",
                  whiteSpace: "nowrap",
                }}
              >
                {l.text}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: GAP }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: GAP,
                width: DAY_LABEL_W,
                flexShrink: 0,
              }}
            >
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  style={{
                    height: CELL,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    color: i % 2 === 0 ? "transparent" : "var(--text-dim)",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: GAP }}>
              {weeks.map((week, wi) => (
                <div
                  key={wi}
                  style={{ display: "flex", flexDirection: "column", gap: GAP }}
                >
                  {week.map((date) => {
                    const dominant = days.get(date)?.dominant;
                    const hasSession = !!dominant;
                    // the current week's column runs past today; keep the
                    // slots so rows stay aligned, but don't draw them
                    const future = date > todayKey;
                    return (
                      <div
                        key={date}
                        title={future ? undefined : date}
                        onClick={() => openCell(date)}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 3,
                          flexShrink: 0,
                          visibility: future ? "hidden" : "visible",
                          background: dominant
                            ? dominant.track.color
                            : "var(--surface2)",
                          opacity: dominant ? TIER_OPACITY[dominant.tier] : 1,
                          cursor: hasSession ? "pointer" : "default",
                          // color and shade ease in as a day's tier rises
                          transition:
                            "transform 0.15s, background-color 0.6s, opacity 0.6s",
                        }}
                        onMouseEnter={(e) => {
                          if (hasSession)
                            e.target.style.transform = "scale(1.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "scale(1)";
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {projects.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 24,
            }}
          >
            {projects.map((p) => (
              <div
                key={p.id}
                style={{ display: "flex", alignItems: "center", gap: 7 }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: p.color,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text-mid)",
                  }}
                >
                  {p.name}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{ height: 1, background: "var(--border)", margin: "28px 0" }}
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: 28,
            rowGap: 14,
            alignItems: "center",
          }}
        >
          <Stat label="This month" value={`${Math.round(monthHours)}h`} />
          <Stat label="Sessions" value={thisMonth.length} />
          <Stat label="Total" value={`${Math.round(totalHours)}h`} />
        </div>
      </Page>

      {/* CELL MODAL */}
      {modal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModal(null);
              setEditing(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 36,
              width: 440,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "var(--text-dim)",
                    marginBottom: 4,
                  }}
                >
                  Sessions on
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {modal.date}
                </div>
              </div>
              <button
                onClick={() => {
                  setModal(null);
                  setEditing(null);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-dim)",
                  fontSize: 20,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {modal.sessions.map((s) => {
              const proj = projects.find((p) => p.id === s.project_id);
              const isEditing = editing?.id === s.id;
              return (
                <div key={s.id} style={{ marginBottom: 12 }}>
                  {!isEditing ? (
                    <div
                      style={{
                        background: "var(--surface2)",
                        borderRadius: 8,
                        padding: "16px 18px",
                        borderLeft: `3px solid ${proj?.color || "var(--border)"}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: proj?.color || "var(--text)",
                            }}
                          >
                            {proj?.name || "Unknown"}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              letterSpacing: "0.15em",
                              textTransform: "uppercase",
                              color: "var(--text-dim)",
                              marginTop: 3,
                            }}
                          >
                            {formatDuration(s.duration_minutes)}
                            {proj &&
                              ` · ${INTENSITIES[tierFor(s.duration_minutes, proj)]}`}
                          </div>
                        </div>
                        <button
                          onClick={() => startEdit(s)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: 4,
                            padding: "5px 10px",
                            fontSize: 11,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "var(--text-dim)",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                      </div>
                      {s.note && (
                        <div
                          style={{
                            fontSize: 14,
                            color: "var(--text-mid)",
                            letterSpacing: "0.04em",
                            lineHeight: 1.5,
                          }}
                        >
                          {s.note}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "var(--surface2)",
                        borderRadius: 8,
                        padding: "16px 18px",
                        borderLeft: `3px solid ${modalProj?.color || "var(--border)"}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: modalProj?.color,
                          marginBottom: 14,
                        }}
                      >
                        {modalProj?.name}
                      </div>

                      {/* duration */}
                      <div
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.25em",
                          textTransform: "uppercase",
                          color: "var(--text-dim)",
                          marginBottom: 8,
                        }}
                      >
                        Duration
                      </div>
                      <div
                        style={{
                          display: "flex",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          overflow: "hidden",
                          marginBottom: 16,
                        }}
                      >
                        {DURATIONS.map((d, i) => (
                          <button
                            key={d.value}
                            onClick={() => setEditDur(d.value)}
                            style={{
                              flex: 1,
                              padding: "9px 4px",
                              border: "none",
                              borderRight:
                                i < DURATIONS.length - 1
                                  ? "1px solid var(--border)"
                                  : "none",
                              background:
                                editDur === d.value
                                  ? "var(--surface)"
                                  : "transparent",

                              fontSize: 13,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color:
                                editDur === d.value
                                  ? "var(--text)"
                                  : "var(--text-dim)",
                              cursor: "pointer",
                              textAlign: "center",
                            }}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>

                      {/* intensity preview */}
                      <div
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.25em",
                          textTransform: "uppercase",
                          color: "var(--text-dim)",
                          marginBottom: 8,
                        }}
                      >
                        Intensity
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <IntensityMeter
                          track={modalProj}
                          minutes={editDur}
                          height={32}
                          labelSize={9}
                        />
                      </div>

                      {/* note */}
                      <div
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.25em",
                          textTransform: "uppercase",
                          color: "var(--text-dim)",
                          marginBottom: 8,
                        }}
                      >
                        Note
                      </div>
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        rows={2}
                        style={{
                          width: "100%",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          padding: "10px 12px",
                          fontSize: 15,
                          color: "var(--text)",
                          resize: "none",
                          outline: "none",
                          marginBottom: 14,
                          lineHeight: 1.5,
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <button
                          onClick={saveEdit}
                          style={{
                            padding: "8px 18px",
                            background: "var(--text)",
                            color: "var(--bg)",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          style={{
                            padding: "8px 14px",
                            background: "transparent",
                            color: "var(--text-dim)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            fontSize: 13,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <div style={{ marginLeft: "auto" }}>
                          {confirmDelete === s.id ? (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-dim)",
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                }}
                              >
                                Sure?
                              </span>
                              <button
                                onClick={() => deleteSession(s.id)}
                                style={{
                                  padding: "8px 14px",
                                  background: "#b8716e",
                                  color: "var(--bg)",
                                  border: "none",
                                  borderRadius: 6,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  letterSpacing: "0.15em",
                                  textTransform: "uppercase",
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                style={{
                                  padding: "8px 10px",
                                  background: "transparent",
                                  color: "var(--text-dim)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 6,
                                  fontSize: 13,
                                  letterSpacing: "0.15em",
                                  textTransform: "uppercase",
                                  cursor: "pointer",
                                }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(s.id)}
                              style={{
                                padding: "8px 14px",
                                background: "transparent",
                                color: "#b8716e",
                                border: "1px solid #b8716e",
                                borderRadius: 6,
                                fontSize: 13,
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                opacity: 0.7,
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "var(--text-mid)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
