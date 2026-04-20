import { useState, useEffect } from "react";
import { supabase, DEV_MODE, DEV_USER_ID } from "./lib/supabase";
import Activity from "./pages/Activity";
import Projects from "./pages/Projects";
import Log from "./pages/Log";
import Account from "./pages/Account";
import BottomNav from "./components/BottomNav";

export default function App() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("activity");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            fontFamily: "Agdasima, sans-serif",
            letterSpacing: "0.12em",
            background: "linear-gradient(135deg, #c87941, #8a7fbe)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          PRISM
        </div>
      </div>
    );

  if (!DEV_MODE && !session) return <Auth />;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "1fr var(--nav-h)",
        height: "100vh",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden" }}>
        <Activity active={page === "activity"} />
        <Projects active={page === "projects"} onNavigate={setPage} />
        <Log active={page === "log"} onSuccess={() => setPage("activity")} />
        <Account active={page === "account"} session={session} />
      </div>
      <BottomNav current={page} onChange={setPage} />
    </div>
  );
}

function Auth() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (!error) setSent(true);
    setLoading(false);
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "40px",
        gap: "32px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            fontFamily: "Agdasima, sans-serif",
            letterSpacing: "0.12em",
            background: "linear-gradient(135deg, #c87941, #8a7fbe, #5e8faa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}
        >
          PRISM
        </div>
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.3em",
            color: "var(--text-dim)",
            textTransform: "uppercase",
          }}
        >
          your build log
        </div>
      </div>

      {sent ? (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 14,
              letterSpacing: "0.1em",
              color: "var(--text-mid)",
              textTransform: "uppercase",
            }}
          >
            Check your email ✦
          </div>
          <div
            style={{
              fontSize: 13,
              letterSpacing: "0.1em",
              color: "var(--text-dim)",
              marginTop: 8,
              textTransform: "uppercase",
            }}
          >
            Magic link sent to {email}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
            maxWidth: 340,
          }}
        >
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && signIn()}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "14px 16px",
              fontSize: 14,
              letterSpacing: "0.05em",
              color: "var(--text)",
              outline: "none",
              width: "100%",
            }}
          />
          <button
            onClick={signIn}
            disabled={loading || !email}
            style={{
              background: "var(--text)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 6,
              padding: "14px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
              opacity: loading || !email ? 0.5 : 1,
            }}
          >
            {loading ? "Sending..." : "Begin"}
          </button>
        </div>
      )}
    </div>
  );
}
