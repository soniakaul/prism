import { supabase, DEV_MODE, DEV_USER_ID } from "./supabase";

const GUEST_FLAG = "prism_guest";
const GUEST_PROJECTS = "prism_guest_projects";
const GUEST_SESSIONS = "prism_guest_sessions";

export function isGuest() {
  return localStorage.getItem(GUEST_FLAG) === "1";
}
export function enterGuest() {
  localStorage.setItem(GUEST_FLAG, "1");
}
export function exitGuest() {
  localStorage.removeItem(GUEST_FLAG);
}
export function clearGuestData() {
  localStorage.removeItem(GUEST_PROJECTS);
  localStorage.removeItem(GUEST_SESSIONS);
}
export function guestCreatedAt() {
  let t = localStorage.getItem("prism_guest_created");
  if (!t) {
    t = new Date().toISOString();
    localStorage.setItem("prism_guest_created", t);
  }
  return t;
}

function readG(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function writeG(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function currentUserId() {
  if (DEV_MODE) return DEV_USER_ID;
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

// ─── PROJECTS ──────────────────────────────────────────
export async function getProjects() {
  if (isGuest()) {
    return readG(GUEST_PROJECTS).sort((a, b) =>
      (a.created_at || "").localeCompare(b.created_at || ""),
    );
  }
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at");
  return data || [];
}

export async function addProject({ name, color }) {
  if (isGuest()) {
    const list = readG(GUEST_PROJECTS);
    list.push({
      id: uid(),
      name,
      color,
      created_at: new Date().toISOString(),
      user_id: "guest",
    });
    writeG(GUEST_PROJECTS, list);
    return;
  }
  const user_id = await currentUserId();
  await supabase.from("projects").insert({ name, color, user_id });
}

export async function updateProject(id, { name, color }) {
  if (isGuest()) {
    const list = readG(GUEST_PROJECTS).map((p) =>
      p.id === id ? { ...p, name, color } : p,
    );
    writeG(GUEST_PROJECTS, list);
    return;
  }
  await supabase.from("projects").update({ name, color }).eq("id", id);
}

export async function deleteProject(id) {
  if (isGuest()) {
    writeG(
      GUEST_PROJECTS,
      readG(GUEST_PROJECTS).filter((p) => p.id !== id),
    );
    writeG(
      GUEST_SESSIONS,
      readG(GUEST_SESSIONS).filter((s) => s.project_id !== id),
    );
    return;
  }
  await supabase.from("sessions").delete().eq("project_id", id);
  await supabase.from("projects").delete().eq("id", id);
}

// ─── SESSIONS ──────────────────────────────────────────
export async function getSessions() {
  if (isGuest()) {
    return readG(GUEST_SESSIONS).sort((a, b) =>
      (b.date || "").localeCompare(a.date || ""),
    );
  }
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .order("date", { ascending: false });
  return data || [];
}

export async function getSessionsByDate(date) {
  if (isGuest()) {
    return readG(GUEST_SESSIONS).filter((s) => s.date === date);
  }
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("date", date);
  return data || [];
}

export async function addSession({
  project_id,
  duration_minutes,
  intensity,
  note,
  date,
}) {
  if (isGuest()) {
    const list = readG(GUEST_SESSIONS);
    list.push({
      id: uid(),
      project_id,
      duration_minutes,
      intensity,
      note: note || null,
      date,
      user_id: "guest",
    });
    writeG(GUEST_SESSIONS, list);
    return { error: null };
  }
  const user_id = await currentUserId();
  return await supabase.from("sessions").insert({
    user_id,
    project_id,
    duration_minutes,
    intensity,
    note: note || null,
    date,
  });
}

export async function updateSession(
  id,
  { duration_minutes, intensity, note },
) {
  if (isGuest()) {
    const list = readG(GUEST_SESSIONS).map((s) =>
      s.id === id
        ? { ...s, duration_minutes, intensity, note: note || null }
        : s,
    );
    writeG(GUEST_SESSIONS, list);
    return;
  }
  await supabase
    .from("sessions")
    .update({ duration_minutes, intensity, note: note || null })
    .eq("id", id);
}

export async function deleteSession(id) {
  if (isGuest()) {
    writeG(
      GUEST_SESSIONS,
      readG(GUEST_SESSIONS).filter((s) => s.id !== id),
    );
    return;
  }
  await supabase.from("sessions").delete().eq("id", id);
}
