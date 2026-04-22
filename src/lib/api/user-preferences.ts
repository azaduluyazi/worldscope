import { supabase } from "@/lib/db/supabase";

interface UserPreferences {
  theme_id?: string;
  locale?: string;
}

export async function syncPreferencesToDB(userId: string, prefs: UserPreferences): Promise<void> {
  try {
    await supabase
      .from("user_profiles")
      .update({ ...prefs, updated_at: new Date().toISOString() })
      .eq("id", userId);
  } catch {
    // Silently fail — localStorage is the fallback
  }
}

export async function loadPreferencesFromDB(userId: string): Promise<UserPreferences | null> {
  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("theme_id, locale")
      .eq("id", userId)
      .single();
    if (!data) return null;
    // DB returns `null` for unset prefs; our interface uses optional
    // properties (`?: string`). Normalize at the boundary.
    return {
      ...(data.theme_id ? { theme_id: data.theme_id } : {}),
      ...(data.locale ? { locale: data.locale } : {}),
    };
  } catch (err) {
    console.error("[user-preferences/load]", err);
    return null;
  }
}
