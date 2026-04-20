import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const DURATIONS = [
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "1h", value: 60 },
  { label: "1.5h", value: 90 },
  { label: "2h", value: 120 },
  { label: "3h+", value: 180 },
];
const INTENSITIES = ["Light", "Focused", "Deep", "Locked In"];

function localDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Activity({ active }) {
  const [sessions, setSessions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [modal, setModal] = useState(null); // { date, sessions: [] }
  const [editing, setEditing] = useState(null); // session being edited
  const [editDur, setEditDur] = useState(60);
  const [editInt, setEditInt] = useState(2);
  const [editNote, setEditNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!active) return;
    fetchData();
  }, [active]);

  async function fetchData() {
    const { data: proj } = await supabase.from("projects").select("*");
    const { data: sess } = await supabase.from("sessions").select("*");
    setProjects(proj || []);
    setSessions(sess || []);
  }

  const gridMap = {};
  sessions.forEach((s) => {
    const proj = projects.find((p) => p.id === s.project_id);
    if (!proj) return;
    const existing = gridMap[s.date];
    if (!existing || s.intensity > existing.intensity) {
      gridMap[s.date] = {
        color: proj.color,
        intensity: s.intensity,
        date: s.date,
      };
    }
  });

  // 52 weeks GitHub style
  const today = new Date();
  const weeks = [];
  const start = new Date(today);
  start.setDate(today.getDate() - (52 * 7 - 1));
  for (let w = 0; w < 52; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      col.push(date.toISOString().split("T")[0]);
    }
    weeks.push(col);
  }

  const totalHours = sessions.reduce((a, s) => a + s.duration_minutes, 0) / 60;
  const thisMonth = sessions.filter((s) =>
    s.date?.startsWith(localDate().slice(0, 7)),
  );
  const monthHours = thisMonth.reduce((a, s) => a + s.duration_minutes, 0) / 60;
  let streak = 0;
  const dateSet = new Set(sessions.map((s) => s.date));
  const check = new Date();
  while (dateSet.has(localDate(check))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const WEEKS = 52;
  const GAP = 3;
  const CELL = Math.floor((window.innerWidth - 104 - 24 - WEEKS * GAP) / WEEKS);

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
    setEditInt(s.intensity);
    setEditNote(s.note || "");
    setConfirmDelete(null);
  }

  async function saveEdit() {
    await supabase
      .from("sessions")
      .update({
        duration_minutes: editDur,
        intensity: editInt,
        note: editNote || null,
      })
      .eq("id", editing.id);
    setEditing(null);
    await fetchData();
    const updated =
      (await supabase.from("sessions").select("*").eq("date", modal.date))
        .data || [];
    setModal((m) => ({ ...m, sessions: updated }));
  }

  async function deleteSession(id) {
    await supabase.from("sessions").delete().eq("id", id);
    setConfirmDelete(null);
    setEditing(null);
    await fetchData();
    const updated =
      (await supabase.from("sessions").select("*").eq("date", modal.date))
        .data || [];
    if (updated.length === 0) setModal(null);
    else setModal((m) => ({ ...m, sessions: updated }));
  }

  const modalProj = editing
    ? projects.find((p) => p.id === editing.project_id)
    : null;

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          padding: "48px 52px 32px",
          opacity: active ? 1 : 0,
          transform: active ? "translateY(0)" : "translateY(12px)",
          pointerEvents: active ? "all" : "none",
          transition: "opacity 0.3s, transform 0.3s",
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
              marginBottom: 6,
            }}
          >
            Prism · {months[today.getMonth()]} {today.getFullYear()}
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
            Activity
          </div>
        </div>

        <div style={{ overflowX: "100%" }}>
          <div style={{ display: "flex", marginLeft: 24, marginBottom: 6 }}>
            {weeks.map((week, wi) => {
              const firstDay = new Date(week[0] + "T12:00:00");
              const showLabel =
                wi === 0 ||
                new Date(weeks[wi - 1][0] + "T12:00:00").getMonth() !==
                  firstDay.getMonth();
              return (
                <div
                  key={wi}
                  style={{
                    width: CELL + GAP,
                    flexShrink: 0,
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text-dim)",
                  }}
                >
                  {showLabel
                    ? firstDay
                        .toLocaleString("en-US", { month: "short" })
                        .toUpperCase()
                    : ""}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: GAP }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: GAP,
                width: 14,
                flexShrink: 0,
              }}
            >
              {dayLabels.map((d, i) => (
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
                  {week.map((date, di) => {
                    const cell = gridMap[date];
                    const hasSession = !!cell;
                    return (
                      <div
                        key={di}
                        title={date}
                        onClick={() => openCell(date)}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 3,
                          flexShrink: 0,
                          background: cell ? cell.color : "var(--surface2)",
                          opacity: cell
                            ? [0, 0.2, 0.45, 0.7, 1][cell.intensity]
                            : 1,
                          cursor: hasSession ? "pointer" : "default",
                          transition: "transform 0.15s",
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
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <Stat label="This month" value={`${Math.round(monthHours)}h`} />
          <Stat label="Sessions" value={thisMonth.length} />
          <Stat label="Streak" value={`${streak}d`} />
          <Stat label="Total" value={`${Math.round(totalHours)}h`} />
        </div>
      </div>

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
                            {s.duration_minutes < 60
                              ? `${s.duration_minutes}m`
                              : `${s.duration_minutes / 60}h`}{" "}
                            · {INTENSITIES[s.intensity - 1]}
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

                      {/* intensity */}
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
                      <div
                        style={{ display: "flex", gap: 6, marginBottom: 16 }}
                      >
                        {INTENSITIES.map((label, i) => {
                          const level = i + 1;
                          return (
                            <div
                              key={i}
                              style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <div
                                onClick={() => setEditInt(level)}
                                style={{
                                  width: "100%",
                                  height: 32,
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  background: modalProj?.color || "#fff",
                                  opacity: level * 0.25,
                                  border:
                                    editInt === level
                                      ? "2px solid var(--text)"
                                      : "1px solid transparent",
                                  transition: "border-color 0.15s",
                                }}
                              />
                              <div
                                style={{
                                  fontSize: 9,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  color: "var(--text-dim)",
                                }}
                              >
                                {label}
                              </div>
                            </div>
                          );
                        })}
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
