import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kyijpandvpyexrfgmlni.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_niadS8k3_3hFDo6j9dO1Sw_UV9_fu0A";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── DEV MODE ───────────────────────────────
// Toggle this to switch between dev and production
export const DEV_MODE = true; // ← flip to false for production
export const DEV_USER_ID = "0ee5fa87-24a7-486c-84e0-a958b6ef5b51";
// ────────────────────────────────────────────
