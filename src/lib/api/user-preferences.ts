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
    return data;
  } catch {
    return null;
  }
}
