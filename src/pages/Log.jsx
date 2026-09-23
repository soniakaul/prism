import { useState, useEffect } from "react";
import * as db from "../lib/db";
import { toDateKey } from "../lib/dates";
import { DURATIONS, INTENSITIES, INTENSITY_OPACITY } from "../lib/constants";
import { reportError } from "../lib/toast";
import Page from "../components/Page";

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

  const activeProj = projects.find((p) => p.id === selProj);

  async function submit() {
    if (!selProj) return;
    setLoading(true);
    try {
      await db.addSession({
        project_id: selProj,
        duration_minutes: selDur,
        intensity: selInt,
        note,
        date: toDateKey(),
      });
    } catch (err) {
      reportError("Couldn't save your session. Try again", err);
      return;
    } finally {
      setLoading(false);
    }
    setNote("");
    setBurst(true);
    setTimeout(() => {
      setBurst(false);
      onSuccess();
    }, 1200);
  }

  return (
    <Page active={active} eyebrow="Record" title="Log Session">
      {burst && <Burst color={activeProj?.color || "#c87941"} />}

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
                      opacity: INTENSITY_OPACITY[level],
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
