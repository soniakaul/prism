import { useState, useEffect } from "react";
import { supabase, DEV_MODE, DEV_USER_ID } from "../lib/supabase";

const COLORS = [
  "#c87941",
  "#6fa88c",
  "#8a7fbe",
  "#c4a84e",
  "#5e8faa",
  "#b8716e",
  "#7a9e6e",
  "#a07fbf",
  "#c4775a",
  "#6e8fa8",
];

const DURATIONS = [
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "1h", value: 60 },
  { label: "1.5h", value: 90 },
  { label: "2h", value: 120 },
  { label: "3h+", value: 180 },
];
const INTENSITIES = ["Light", "Focused", "Deep", "Locked In"];

export default function Projects({ active }) {
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editDur, setEditDur] = useState(60);
  const [editInt, setEditInt] = useState(2);
  const [editNote, setEditNote] = useState("");
  const [confirmDeleteSession, setConfirmDeleteSession] = useState(null);

  useEffect(() => {
    if (!active) return;
    fetchData();
  }, [active]);

  async function fetchData() {
    const { data: proj } = await supabase
      .from("projects")
      .select("*")
      .order("created_at");
    const { data: sess } = await supabase
      .from("sessions")
      .select("*")
      .order("date", { ascending: false });
    setProjects(proj || []);
    setSessions(sess || []);
  }

  async function addProject() {
    if (!newName.trim()) return;
    const user = DEV_MODE
      ? { id: DEV_USER_ID }
      : (await supabase.auth.getUser()).data.user;
    await supabase
      .from("projects")
      .insert({ name: newName.trim(), color: newColor, user_id: user.id });
    setNewName("");
    setAdding(false);
    fetchData();
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditColor(p.color);
    setConfirmDeleteId(null);
    setExpandedId(null);
  }

  async function saveEdit(id) {
    if (!editName.trim()) return;
    await supabase
      .from("projects")
      .update({ name: editName.trim(), color: editColor })
      .eq("id", id);
    setEditingId(null);
    fetchData();
  }

  async function deleteProject(id) {
    await supabase.from("sessions").delete().eq("project_id", id);
    await supabase.from("projects").delete().eq("id", id);
    setConfirmDeleteId(null);
    setEditingId(null);
    fetchData();
  }

  function toggleExpand(id) {
    setExpandedId(expandedId === id ? null : id);
    setEditingId(null);
    setEditingSession(null);
  }

  function startEditSession(s) {
    setEditingSession(s);
    setEditDur(s.duration_minutes);
    setEditInt(s.intensity);
    setEditNote(s.note || "");
    setConfirmDeleteSession(null);
  }

  async function saveSession() {
    await supabase
      .from("sessions")
      .update({
        duration_minutes: editDur,
        intensity: editInt,
        note: editNote || null,
      })
      .eq("id", editingSession.id);
    setEditingSession(null);
    fetchData();
  }

  async function deleteSession(id) {
    await supabase.from("sessions").delete().eq("id", id);
    setConfirmDeleteSession(null);
    setEditingSession(null);
    fetchData();
  }

  function hoursForProject(pid) {
    return (
      Math.round(
        (sessions
          .filter((s) => s.project_id === pid)
          .reduce((a, s) => a + s.duration_minutes, 0) /
          60) *
          10,
      ) / 10
    );
  }

  function sessionsForProject(pid) {
    return sessions.filter((s) => s.project_id === pid);
  }

  function formatDur(mins) {
    return mins < 60 ? `${mins}m` : `${mins / 60}h`;
  }

  return (
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
          Prism · Your Work
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
          Projects
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          background: "var(--border)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
          maxWidth: 600,
        }}
      >
        {projects.map((p) => {
          const projSessions = sessionsForProject(p.id);
          const isExpanded = expandedId === p.id;
          const isEditing = editingId === p.id;

          return (
            <div key={p.id}>
              {/* main row */}
              {!isEditing && (
                <div
                  style={{
                    background: "var(--surface)",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      height: 36,
                      borderRadius: 2,
                      background: p.color,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{ flex: 1, cursor: "pointer" }}
                    onClick={() => toggleExpand(p.id)}
                  >
                    <div
                      style={{
                        fontSize: 19,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: p.color,
                        marginBottom: 3,
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "var(--text-dim)",
                      }}
                    >
                      {projSessions.length} sessions · {hoursForProject(p.id)}h
                    </div>
                  </div>
                  {/* expand toggle */}
                  <div
                    onClick={() => toggleExpand(p.id)}
                    style={{
                      cursor: "pointer",
                      color: "var(--text-dim)",
                      fontSize: 18,
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      userSelect: "none",
                    }}
                  >
                    ›
                  </div>
                  {/* edit button */}
                  <button
                    onClick={() => startEdit(p)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "6px 12px",
                      fontSize: 13,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--text-dim)",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}

              {/* edit row */}
              {isEditing && (
                <div
                  style={{
                    background: "var(--surface2)",
                    padding: "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    borderLeft: `3px solid ${editColor}`,
                  }}
                >
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(p.id)}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "10px 14px",
                      fontSize: 17,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: editColor,
                      outline: "none",
                      width: "100%",
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {COLORS.map((c) => (
                      <div
                        key={c}
                        onClick={() => setEditColor(c)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          background: c,
                          cursor: "pointer",
                          border:
                            editColor === c
                              ? "2px solid var(--text)"
                              : "2px solid transparent",
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <button
                      onClick={() => saveEdit(p.id)}
                      style={{
                        padding: "9px 20px",
                        background: "var(--text)",
                        color: "var(--bg)",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{
                        padding: "9px 16px",
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
                      Cancel
                    </button>
                    <div style={{ marginLeft: "auto" }}>
                      {confirmDeleteId === p.id ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              letterSpacing: "0.15em",
                              textTransform: "uppercase",
                              color: "var(--text-dim)",
                            }}
                          >
                            Delete {projSessions.length} sessions too?
                          </span>
                          <button
                            onClick={() => deleteProject(p.id)}
                            style={{
                              padding: "9px 16px",
                              background: "#b8716e",
                              color: "var(--bg)",
                              border: "none",
                              borderRadius: 6,
                              fontSize: 14,
                              fontWeight: 700,
                              letterSpacing: "0.15em",
                              textTransform: "uppercase",
                              cursor: "pointer",
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{
                              padding: "9px 16px",
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
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(p.id)}
                          style={{
                            padding: "9px 16px",
                            background: "transparent",
                            color: "#b8716e",
                            border: "1px solid #b8716e",
                            borderRadius: 6,
                            fontSize: 14,
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

              {/* sessions list */}
              {isExpanded && !isEditing && (
                <div
                  style={{
                    background: "var(--bg)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  {projSessions.length === 0 ? (
                    <div
                      style={{
                        padding: "16px 24px",
                        fontSize: 13,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "var(--text-dim)",
                      }}
                    >
                      No sessions yet
                    </div>
                  ) : (
                    projSessions.map((s) => {
                      const isEditingS = editingSession?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          style={{ borderBottom: "1px solid var(--border)" }}
                        >
                          {!isEditingS ? (
                            <div
                              style={{
                                padding: "14px 24px 14px 32px",
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "var(--text-mid)",
                                    marginBottom: 3,
                                  }}
                                >
                                  {s.date}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    letterSpacing: "0.15em",
                                    textTransform: "uppercase",
                                    color: "var(--text-dim)",
                                  }}
                                >
                                  {formatDur(s.duration_minutes)} ·{" "}
                                  {INTENSITIES[s.intensity - 1]}
                                  {s.note ? ` · ${s.note}` : ""}
                                </div>
                              </div>
                              {/* intensity pip */}
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 2,
                                  background: p.color,
                                  opacity: s.intensity * 0.25,
                                  flexShrink: 0,
                                }}
                              />
                              <button
                                onClick={() => startEditSession(s)}
                                style={{
                                  background: "transparent",
                                  border: "1px solid var(--border)",
                                  borderRadius: 4,
                                  padding: "5px 10px",
                                  fontSize: 12,
                                  letterSpacing: "0.15em",
                                  textTransform: "uppercase",
                                  color: "var(--text-dim)",
                                  cursor: "pointer",
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <div
                              style={{
                                padding: "16px 24px 16px 32px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                                borderLeft: `3px solid ${p.color}`,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  color: p.color,
                                }}
                              >
                                {s.date}
                              </div>
                              {/* duration */}
                              <div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    letterSpacing: "0.25em",
                                    textTransform: "uppercase",
                                    color: "var(--text-dim)",
                                    marginBottom: 6,
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
                                  }}
                                >
                                  {DURATIONS.map((d, i) => (
                                    <button
                                      key={d.value}
                                      onClick={() => setEditDur(d.value)}
                                      style={{
                                        flex: 1,
                                        padding: "8px 4px",
                                        border: "none",
                                        borderRight:
                                          i < DURATIONS.length - 1
                                            ? "1px solid var(--border)"
                                            : "none",
                                        background:
                                          editDur === d.value
                                            ? "var(--surface2)"
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
                              </div>
                              {/* intensity */}
                              <div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    letterSpacing: "0.25em",
                                    textTransform: "uppercase",
                                    color: "var(--text-dim)",
                                    marginBottom: 6,
                                  }}
                                >
                                  Intensity
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
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
                                            height: 28,
                                            borderRadius: 4,
                                            cursor: "pointer",
                                            background: p.color,
                                            opacity: level * 0.25,
                                            border:
                                              editInt === level
                                                ? "2px solid var(--text)"
                                                : "1px solid transparent",
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
                              </div>
                              {/* note */}
                              <div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    letterSpacing: "0.25em",
                                    textTransform: "uppercase",
                                    color: "var(--text-dim)",
                                    marginBottom: 6,
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
                                    fontSize: 14,
                                    color: "var(--text)",
                                    resize: "none",
                                    outline: "none",
                                    lineHeight: 1.5,
                                  }}
                                />
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                }}
                              >
                                <button
                                  onClick={saveSession}
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
                                  onClick={() => setEditingSession(null)}
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
                                  {confirmDeleteSession === s.id ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 6,
                                        alignItems: "center",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 14,
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
                                        onClick={() =>
                                          setConfirmDeleteSession(null)
                                        }
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
                                      onClick={() =>
                                        setConfirmDeleteSession(s.id)
                                      }
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
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* add project */}
        {adding ? (
          <div
            style={{
              background: "var(--surface)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              borderTop: "1px dashed var(--border)",
            }}
          >
            <input
              autoFocus
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProject()}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "10px 14px",
                fontSize: 16,
                letterSpacing: "0.05em",
                color: "var(--text)",
                outline: "none",
                width: "100%",
              }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    background: c,
                    cursor: "pointer",
                    border:
                      newColor === c
                        ? "2px solid var(--text)"
                        : "2px solid transparent",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={addProject}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "var(--text)",
                  color: "var(--bg)",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewName("");
                }}
                style={{
                  padding: "10px 16px",
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
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setAdding(true)}
            style={{
              background: "var(--surface)",
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              borderTop: "1px dashed var(--border)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--surface2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--surface)")
            }
          >
            <div style={{ fontSize: 18, color: "var(--text-dim)" }}>+</div>
            <div
              style={{
                fontSize: 13,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-dim)",
              }}
            >
              New Project
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
