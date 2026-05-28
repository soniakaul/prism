import { useState, useEffect } from "react";
import { supabase, DEV_MODE, DEV_USER_ID } from "../lib/supabase";

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

export default function Log({ active, onSuccess }) {
  const [projects, setProjects] = useState([]);
  const [selProj, setSelProj] = useState(null);
  const [selDur, setSelDur] = useState(60);
  const [selInt, setSelInt] = useState(2);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!active) return;
    supabase
      .from("projects")
      .select("*")
      .order("created_at")
      .then(({ data }) => {
        setProjects(data || []);
        if (data?.length && !selProj) setSelProj(data[0].id);
      });
  }, [active]);

  const activeProj = projects.find((p) => p.id === selProj);

  async function submit() {
    if (!selProj) return;
    setLoading(true);
    const user = DEV_MODE
      ? { id: DEV_USER_ID }
      : (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from("sessions").insert({
      user_id: user.id,
      project_id: selProj,
      duration_minutes: selDur,
      intensity: selInt,
      note: note || null,
      date: localDate(),
    });
    setLoading(false);
    if (!error) {
      setNote("");
      setBurst(true);
      setTimeout(() => {
        setBurst(false);
        onSuccess();
      }, 1200);
    }
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
      {burst && <Burst color={activeProj?.color || "#c87941"} />}

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
          Prism · Record
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
          Log Session
        </div>
      </div>

      <div
        style={{
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* project */}
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
                      selProj === p.id ? "none" : "1px solid var(--border)",
                    background: selProj === p.id ? p.color : "transparent",
                    color: selProj === p.id ? "var(--bg)" : "var(--text-mid)",
                    transition: "all 0.15s",
                  }}
                >
                  {p.name}
                </button>
              ))
            )}
          </div>
        </Field>

        {/* duration */}
        <Field label="Duration">
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
                onClick={() => setSelDur(d.value)}
                style={{
                  flex: 1,
                  padding: "12px 4px",
                  border: "none",
                  borderRight:
                    i < DURATIONS.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                  background:
                    selDur === d.value ? "var(--surface2)" : "transparent",
                  fontSize: 14,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: selDur === d.value ? "var(--text)" : "var(--text-mid)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "center",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Field>

        {/* intensity */}
        <Field label="Intensity">
          <div style={{ display: "flex", gap: 8 }}>
            {INTENSITIES.map((label, i) => {
              const level = i + 1;
              const color = activeProj?.color || "#c87941";
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    onClick={() => setSelInt(level)}
                    style={{
                      width: "100%",
                      height: 44,
                      borderRadius: 4,
                      cursor: "pointer",
                      background: color,
                      opacity: level * 0.25,
                      border:
                        selInt === level
                          ? "2px solid var(--text)"
                          : "1px solid transparent",
                      transition: "border-color 0.15s, transform 0.15s",
                      transform:
                        selInt === level ? "scaleY(1.05)" : "scaleY(1)",
                    }}
                  />
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.12em",
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
        </Field>

        {/* note */}
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

        <button
          onClick={submit}
          disabled={loading || !selProj}
          style={{
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
            opacity: loading || !selProj ? 0.5 : 1,
            transition: "opacity 0.2s, transform 0.2s",
          }}
        >
          {loading ? "Logging..." : "Log"}
        </button>
      </div>
    </div>
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

function Burst({ color }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: color,
          color: "var(--bg)",
          padding: "14px 32px",
          borderRadius: 100,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        Logged
      </div>
      <style>{`@keyframes popIn { from { transform: scale(0.5); opacity:0 } to { transform: scale(1); opacity:1 } }`}</style>
    </div>
  );
}
