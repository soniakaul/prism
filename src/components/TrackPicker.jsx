import { useState, useRef, useEffect } from "react";
import { useWide } from "../lib/useWide";
import { recentTrackIds } from "../lib/recentTracks";

const SEARCH_AFTER = 6; // show a search box once there are more tracks than this

// One line when closed: the track's color dot and name. Open, it lists every
// track (recent ones first), with search for long lists. A dropdown on wide
// screens, a sheet from the bottom on phones. Arrow keys, Enter and Escape work.
// disabled: shown but locked (e.g. to the project a running timer is on)
export default function TrackPicker({ tracks, value, onChange, disabled }) {
  const wide = useWide();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const selected = tracks.find((t) => t.id === value);

  // recent first (only worth it with a few tracks), then everything else
  const recent =
    tracks.length > 3
      ? recentTrackIds()
          .map((id) => tracks.find((t) => t.id === id))
          .filter(Boolean)
          .slice(0, 3)
      : [];
  const q = query.trim().toLowerCase();
  const sections = q
    ? [
        {
          title: null,
          items: tracks.filter((t) => t.name.toLowerCase().includes(q)),
        },
      ]
    : [
        { title: recent.length ? "Recent" : null, items: recent },
        {
          title: recent.length ? "All tracks" : null,
          items: tracks.filter((t) => !recent.includes(t)),
        },
      ].filter((s) => s.items.length);
  const flat = sections.flatMap((s) => s.items);

  function show() {
    setQuery("");
    setActive(Math.max(0, flatIndexOf(value)));
    setOpen(true);
  }
  function hide() {
    setOpen(false);
    triggerRef.current?.focus();
  }
  function pick(t) {
    onChange(t.id);
    hide();
  }
  function flatIndexOf(id) {
    return flat.findIndex((t) => t.id === id);
  }

  function onKeyDown(e) {
    if (!open) {
      if (["ArrowDown", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      hide();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && flat[active]) {
      e.preventDefault();
      pick(flat[active]);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  // a click anywhere else closes the dropdown
  useEffect(() => {
    if (!open || !wide) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, wide]);

  const list = (
    <div onKeyDown={onKeyDown}>
      {tracks.length > SEARCH_AFTER && (
        <input
          autoFocus={wide}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          placeholder="Search tracks"
          aria-label="Search tracks"
          style={{
            width: "100%",
            height: 38,
            marginBottom: 4,
            padding: "0 12px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--text)",
            fontSize: 14,
            outline: "none",
          }}
        />
      )}
      <div role="listbox" aria-label="Tracks">
        {sections.map((s) => (
          <div key={s.title ?? "all"}>
            {s.title && (
              <div
                style={{
                  padding: "10px 10px 4px",
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--text-dim)",
                }}
              >
                {s.title}
              </div>
            )}
            {s.items.map((t) => {
              const i = flat.indexOf(t);
              const isSel = t.id === value;
              return (
                <div
                  key={t.id}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(t)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 42,
                    padding: "0 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    background:
                      i === active ? "var(--surface2)" : "transparent",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: t.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 13,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: isSel ? "var(--text)" : "var(--text-mid)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.name}
                  </span>
                  {isSel && <Check />}
                </div>
              );
            })}
          </div>
        ))}
        {flat.length === 0 && (
          <div
            style={{
              padding: "14px 10px",
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
            }}
          >
            No tracks match
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: "100%",
          height: 50,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          background: "var(--surface)",
          border: `1px solid ${open ? "var(--text-mid)" : "var(--border)"}`,
          borderRadius: 8,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.7 : 1,
          transition: "border-color 0.15s",
        }}
      >
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: selected?.color || "var(--border)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: "left",
            fontSize: 15,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: selected ? "var(--text)" : "var(--text-dim)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {selected?.name || "Choose a track"}
        </span>
        {!disabled && <Chevron up={open} />}
      </button>

      {open && wide && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 20,
            maxHeight: 340,
            overflowY: "auto",
            padding: 6,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
          }}
        >
          {list}
        </div>
      )}

      {open && !wide && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150 }}>
          <div
            onClick={hide}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
            }}
          />
          <div
            className="sheet-up"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: "72dvh",
              overflowY: "auto",
              padding: "10px 12px calc(16px + var(--safe-bottom))",
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
              borderRadius: "16px 16px 0 0",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "var(--border)",
                margin: "0 auto 12px",
              }}
            />
            {list}
          </div>
        </div>
      )}
    </div>
  );
}

function Chevron({ up }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      style={{
        color: "var(--text-dim)",
        transform: up ? "rotate(180deg)" : "none",
        transition: "transform 0.15s",
        flexShrink: 0,
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ color: "var(--text)", flexShrink: 0 }}
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
