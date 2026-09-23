import { useState, useEffect } from "react";
import { onToast } from "../lib/toast";

export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(
    () =>
      onToast((message) => {
        const id = Date.now() + Math.random();
        setItems((list) => [...list, { id, message }]);
        setTimeout(
          () => setItems((list) => list.filter((t) => t.id !== id)),
          4000,
        );
      }),
    [],
  );

  if (items.length === 0) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: "calc(16px + var(--safe-top))",
        left: 16,
        right: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        zIndex: 300,
        pointerEvents: "none",
      }}
    >
      {items.map((t) => (
        <div
          key={t.id}
          style={{
            background: "var(--surface2)",
            border: "1px solid #b8716e",
            borderRadius: 8,
            padding: "12px 18px",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text)",
            maxWidth: 420,
            textAlign: "center",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
