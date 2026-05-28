import { supabase } from "../lib/supabase";

export default function Account({ active, session }) {
  const email = session?.user?.email || "";
  const initial = email[0]?.toUpperCase() || "?";
  const joined = new Date(session?.user?.created_at).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );

  async function signOut() {
    await supabase.auth.signOut();
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
          Prism · You
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
        {[
          { label: "Email", value: email },
          { label: "Member Since", value: joined },
        ].map((row) => (
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
    </div>
  );
}
