export default function BottomNav({ current, onChange }) {
  const tabs = [
    { id: "activity", label: "Activity", icon: <GridIcon /> },
    { id: "projects", label: "Projects", icon: <ListIcon /> },
    { id: "log", label: "Log", icon: <ClockIcon /> },
    { id: "account", label: "Account", icon: <UserIcon /> },
  ];

  return (
    <nav
      style={{
        height: "var(--nav-h)",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        display: "flex",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            transition: "background 0.15s",
            ...(current === t.id ? {} : {}),
          }}
        >
          <div
            style={{
              color: current === t.id ? "var(--text)" : "var(--text-dim)",
              transition: "color 0.15s",
            }}
          >
            {t.icon}
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: current === t.id ? "var(--text)" : "var(--text-dim)",
              transition: "color 0.15s",
            }}
          >
            {t.label}
          </div>
        </button>
      ))}
    </nav>
  );
}

function GridIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 3" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
