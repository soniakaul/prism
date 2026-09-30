import { useState, useEffect } from "react";
import * as db from "../lib/db";
import { toDateKey, addDays, formatDayKey } from "../lib/dates";
import {
  DURATIONS,
  INTENSITIES,
  TIER_OPACITY,
  formatLoose,
} from "../lib/constants";
import { tierFor } from "../lib/tiers";
import { reportError } from "../lib/toast";
import Page from "../components/Page";
import SidePanel from "../components/SidePanel";
import IntensityMeter from "../components/IntensityMeter";

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

// Projects as a grid of cards that fills the screen (one column on a phone).
// Tapping a card opens its details in a side panel: rename, recolor, delete,
// and see or edit its sessions.
export default function Projects({ active }) {
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [panel, setPanel] = useState(null); // { kind: "project", id } | { kind: "new" }

  function fetchData() {
    return Promise.all([db.getProjects(), db.getSessions()])
      .then(([proj, sess]) => {
        setProjects(proj);
        setSessions(sess);
      })
      .catch((err) => reportError("Couldn't load your projects", err));
  }

  useEffect(() => {
    if (!active) return;
    fetchData();
  }, [active]);

  // run a change, report failures, and refresh; resolves true on success
  async function change(action, message) {
    try {
      await action();
    } catch (err) {
      reportError(message, err);
      return false;
    }
    await fetchData();
    return true;
  }

  const byProject = new Map();
  for (const s of sessions) {
    if (!byProject.has(s.project_id)) byProject.set(s.project_id, []);
    byProject.get(s.project_id).push(s);
  }
  const today = toDateKey();
  const last28 = Array.from({ length: 28 }, (_, i) => addDays(today, i - 27));
  const open =
    panel?.kind === "project" && projects.find((p) => p.id === panel.id);

  return (
    <Page active={active} eyebrow="Your Work" title="Projects">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            sessions={byProject.get(p.id) || []}
            days={last28}
            onOpen={() => setPanel({ kind: "project", id: p.id })}
          />
        ))}
        <button
          onClick={() => setPanel({ kind: "new" })}
          style={{
            minHeight: 128,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "transparent",
            border: "1px dashed var(--border)",
            borderRadius: 10,
            color: "var(--text-dim)",
            fontSize: 13,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 18 }}>+</span> New project
        </button>
      </div>

      {panel && (panel.kind === "new" || open) && (
        <SidePanel
          label={open ? open.name : "New project"}
          onClose={() => setPanel(null)}
        >
          {(close) =>
            open ? (
              <ProjectDetail
                project={open}
                sessions={byProject.get(open.id) || []}
                onClose={close}
                onRename={(name, color) =>
                  change(
                    () => db.updateProject(open.id, { name, color }),
                    "Couldn't save your changes",
                  )
                }
                onDelete={async () => {
                  close();
                  await change(
                    () => db.deleteProject(open.id),
                    "Couldn't delete that project",
                  );
                }}
                onSaveSession={(id, duration_minutes, note) =>
                  change(
                    () => db.updateSession(id, { duration_minutes, note }),
                    "Couldn't save your changes",
                  )
                }
                onDeleteSession={(id) =>
                  change(
                    () => db.deleteSession(id),
                    "Couldn't delete that session",
                  )
                }
              />
            ) : (
              <NewProject
                onCancel={close}
                onAdd={async (name, color) => {
                  const ok = await change(
                    () => db.addProject({ name, color }),
                    "Couldn't add that project",
                  );
                  if (ok) close();
                }}
              />
            )
          }
        </SidePanel>
      )}
    </Page>
  );
}

function ProjectCard({ project: p, sessions, days, onOpen }) {
  const totalMin = sessions.reduce((a, s) => a + s.duration_minutes, 0);
  const perDay = new Map();
  for (const s of sessions)
    perDay.set(s.date, (perDay.get(s.date) || 0) + s.duration_minutes);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.transform = "translateY(-2px)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderTop: `3px solid ${p.color}`,
        borderRadius: 10,
        padding: "18px 20px 20px",
        cursor: "pointer",
        transition: "transform 0.15s",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: p.color,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
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
          marginTop: 4,
        }}
      >
        {sessions.length} sessions · {Math.round((totalMin / 60) * 10) / 10}h
      </div>
      {/* the last four weeks, one square per day, shaded by level */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(28, 1fr)",
          gap: 2,
          marginTop: 18,
        }}
      >
        {days.map((d) => {
          const mins = perDay.get(d) || 0;
          return (
            <span
              key={d}
              style={{
                aspectRatio: "1",
                borderRadius: 2,
                background: mins ? p.color : "var(--surface2)",
                opacity: mins ? TIER_OPACITY[tierFor(mins)] : 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function ProjectDetail({
  project: p,
  sessions,
  onClose,
  onRename,
  onDelete,
  onSaveSession,
  onDeleteSession,
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(p.name);
  const [color, setColor] = useState(p.color);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const totalMin = sessions.reduce((a, s) => a + s.duration_minutes, 0);

  async function save() {
    if (!name.trim()) return;
    if (await onRename(name.trim(), color)) setEditing(false);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 4,
            alignSelf: "stretch",
            borderRadius: 2,
            background: editing ? color : p.color,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: editing ? color : p.color,
              lineHeight: 1.1,
              overflowWrap: "anywhere",
            }}
          >
            {editing ? name || "Untitled" : p.name}
          </div>
          <div style={{ ...labelStyle, marginTop: 6 }}>
            {sessions.length} sessions · {Math.round((totalMin / 60) * 10) / 10}
            h
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {editing ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            margin: "22px 0 8px",
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            aria-label="Project name"
            style={{ ...inputStyle, color }}
          />
          <ColorSwatches value={color} onChange={setColor} />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <button onClick={save} style={btn.primary}>
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setName(p.name);
                setColor(p.color);
                setConfirmDelete(false);
              }}
              style={btn.ghost}
            >
              Cancel
            </button>
            <div style={{ marginLeft: "auto" }}>
              {confirmDelete ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span style={labelStyle}>
                    Delete {sessions.length} sessions too?
                  </span>
                  <button onClick={onDelete} style={btn.dangerSolid}>
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={btn.ghost}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={btn.danger}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          style={{ ...btn.ghost, margin: "18px 0 8px" }}
        >
          Edit project
        </button>
      )}

      <div
        style={{ height: 1, background: "var(--border)", margin: "22px 0" }}
      />
      <div style={{ ...labelStyle, marginBottom: 12 }}>Sessions</div>

      {sessions.length === 0 ? (
        <div style={{ ...labelStyle, padding: "8px 0" }}>No sessions yet</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sessions.map((s) =>
            editingSession === s.id ? (
              <SessionEditor
                key={s.id}
                session={s}
                track={p}
                onCancel={() => setEditingSession(null)}
                onSave={async (dur, note) => {
                  if (await onSaveSession(s.id, dur, note))
                    setEditingSession(null);
                }}
                onDelete={async () => {
                  if (await onDeleteSession(s.id)) setEditingSession(null);
                }}
              />
            ) : (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 14px",
                  background: "var(--bg)",
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: p.color,
                    opacity: TIER_OPACITY[tierFor(s.duration_minutes)],
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--text-mid)",
                    }}
                  >
                    {formatDayKey(s.date)}
                  </div>
                  <div style={{ ...labelStyle, marginTop: 3 }}>
                    {formatLoose(s.duration_minutes)} ·{" "}
                    {INTENSITIES[tierFor(s.duration_minutes)]}
                    {s.note ? ` · ${s.note}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => setEditingSession(s.id)}
                  style={btn.small}
                >
                  Edit
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function SessionEditor({ session, track, onSave, onCancel, onDelete }) {
  const [dur, setDur] = useState(session.duration_minutes);
  const [note, setNote] = useState(session.note || "");
  const [confirm, setConfirm] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "16px 16px 18px",
        background: "var(--bg)",
        borderRadius: 8,
        borderLeft: `3px solid ${track.color}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: track.color,
        }}
      >
        {formatDayKey(session.date)}
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
            onClick={() => setDur(d.value)}
            style={{
              flex: 1,
              padding: "9px 2px",
              border: "none",
              borderRight:
                i < DURATIONS.length - 1 ? "1px solid var(--border)" : "none",
              background: dur === d.value ? "var(--surface2)" : "transparent",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: dur === d.value ? "var(--text)" : "var(--text-dim)",
              cursor: "pointer",
            }}
          >
            {d.label}
          </button>
        ))}
      </div>
      <IntensityMeter track={track} minutes={dur} height={26} labelSize={9} />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="note"
        aria-label="Note"
        style={{ ...inputStyle, fontSize: 14, resize: "none", lineHeight: 1.5 }}
      />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <button onClick={() => onSave(dur, note)} style={btn.primary}>
          Save
        </button>
        <button onClick={onCancel} style={btn.ghost}>
          Cancel
        </button>
        <div style={{ marginLeft: "auto" }}>
          {confirm ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={labelStyle}>Sure?</span>
              <button onClick={onDelete} style={btn.dangerSolid}>
                Delete
              </button>
              <button onClick={() => setConfirm(false)} style={btn.ghost}>
                No
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirm(true)} style={btn.danger}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NewProject({ onAdd, onCancel }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const add = () => name.trim() && onAdd(name.trim(), color);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            flex: 1,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color,
          }}
        >
          {name || "New project"}
        </div>
        <CloseButton onClick={onCancel} />
      </div>
      <input
        autoFocus
        placeholder="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        aria-label="Project name"
        style={inputStyle}
      />
      <ColorSwatches value={color} onChange={setColor} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={add} style={{ ...btn.primary, flex: 1 }}>
          Add
        </button>
        <button onClick={onCancel} style={btn.ghost}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ColorSwatches({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          aria-label={`Color ${c}`}
          aria-pressed={value === c}
          style={{
            width: 28,
            height: 28,
            borderRadius: 5,
            background: c,
            cursor: "pointer",
            border:
              value === c ? "2px solid var(--text)" : "2px solid transparent",
          }}
        />
      ))}
    </div>
  );
}

function CloseButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close"
      style={{
        background: "transparent",
        border: "none",
        color: "var(--text-dim)",
        fontSize: 24,
        lineHeight: 1,
        cursor: "pointer",
        padding: 4,
      }}
    >
      ×
    </button>
  );
}

const labelStyle = {
  fontSize: 11,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--text-dim)",
};

const inputStyle = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "12px 14px",
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "var(--text)",
  outline: "none",
};

const base = {
  borderRadius: 6,
  fontSize: 13,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  cursor: "pointer",
  padding: "10px 16px",
};
const btn = {
  primary: {
    ...base,
    padding: "10px 20px",
    background: "var(--text)",
    color: "var(--bg)",
    border: "none",
    fontWeight: 700,
  },
  ghost: {
    ...base,
    background: "transparent",
    color: "var(--text-dim)",
    border: "1px solid var(--border)",
  },
  danger: {
    ...base,
    background: "transparent",
    color: "#b8716e",
    border: "1px solid #b8716e",
  },
  dangerSolid: {
    ...base,
    background: "#b8716e",
    color: "var(--bg)",
    border: "none",
    fontWeight: 700,
  },
  small: {
    ...base,
    padding: "6px 12px",
    fontSize: 11,
    background: "transparent",
    color: "var(--text-dim)",
    border: "1px solid var(--border)",
  },
};
