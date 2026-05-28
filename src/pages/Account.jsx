import { useState } from "react";
import { supabase } from "../lib/supabase";
import { clearGuestData, guestCreatedAt } from "../lib/db";

export default function Account({ active, session, guest, onLeaveGuest }) {
  const [confirmClear, setConfirmClear] = useState(false);

  const email = guest ? "Guest" : session?.user?.email || "";
  const initial = guest ? "G" : email[0]?.toUpperCase() || "?";
  const joined = guest
    ? new Date(guestCreatedAt()).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : new Date(session?.user?.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

  async function signOut() {
    await supabase.auth.signOut();
  }

  function handleClear() {
    clearGuestData();
    onLeaveGuest();
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflowY: "auto",
        padding: "clamp(28px, 5vw, 48px) clamp(20px, 4vw, 52px) 32px",
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
          <span style={{ textTransform: "none" }}>prism</span> ·{" "}
          {guest ? "Guest" : "You"}
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
          Account
        </div>
      </div>

      {/* avatar */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: "var(--text-mid)",
          marginBottom: 16,
        }}
      >
        {initial}
      </div>

      <div
        style={{
          fontSize: 13,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
          marginBottom: 32,
        }}
      >
        {email}
      </div>

      {/* rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          background: "var(--border)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
          maxWidth: 480,
        }}
      >
        {(guest
          ? [
              { label: "Mode", value: "Guest · local only" },
              { label: "Started", value: joined },
            ]
          : [
              { label: "Email", value: email },
              { label: "Member Since", value: joined },
            ]
        ).map((row) => (
          <div
            key={row.label}
            style={{
              background: "var(--surface)",
              padding: "18px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 15,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-mid)",
              }}
            >
              {row.label}
            </div>
            <div
              style={{
                fontSize: 13,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-dim)",
              }}
            >
              {row.value}
            </div>
          </div>
        ))}
      </div>

      {guest ? (
        <div
          style={{
            maxWidth: 480,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            onClick={onLeaveGuest}
            style={{
              width: "100%",
              padding: "14px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 15,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
              cursor: "pointer",
            }}
          >
            Exit Guest Mode
          </button>
          {confirmClear ? (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-dim)",
                }}
              >
                Wipe all local data?
              </span>
              <button
                onClick={handleClear}
                style={{
                  padding: "10px 18px",
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
                Wipe
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{
                  padding: "10px 14px",
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
              onClick={() => setConfirmClear(true)}
              style={{
                width: "100%",
                padding: "14px",
                background: "transparent",
                border: "1px solid #b8716e",
                borderRadius: 6,
                fontSize: 15,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#b8716e",
                cursor: "pointer",
                opacity: 0.8,
              }}
            >
              Clear Local Data
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={signOut}
          style={{
            marginTop: 24,
            maxWidth: 480,
            width: "100%",
            padding: "14px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: 15,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
            cursor: "pointer",
            transition: "all 0.15s",
            display: "block",
          }}
        >
          Sign Out
        </button>
      )}
    </div>
  );
}
