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
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
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
            fontSize: 10,
            letterSpacing: "0.3em",
            color: "var(--text-dim)",
            textTransform: "uppercase",
          }}
        >
          your build log
        </div>
      </div>

      <button
        onClick={signInWithGoogle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "14px 28px",
          cursor: "pointer",
          fontFamily: "Agdasima, sans-serif",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--text)",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "var(--text-mid)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = "var(--border)")
        }
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
