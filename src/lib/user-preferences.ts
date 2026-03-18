/**
 * User Preferences — persisted to localStorage.
 * No auth needed — anonymous user settings.
 */

export interface UserPreferences {
  /** Selected dashboard variant */
  variant: string;
  /** Locale */
  locale: string;
  /** Map layer visibility */
  mapLayers: {
    heatmap: boolean;
    clusters: boolean;
    flights: boolean;
    vessels: boolean;
    gpsJamming: boolean;
    cables: boolean;
  };
  /** Active category filters */
  categoryFilters: string[];
  /** Muted state for broadcasts */
  broadcastMuted: boolean;
  /** Last visited country page */
  lastCountry: string | null;
  /** Analytics time range preference */
  analyticsRange: number;
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
}

const STORAGE_KEY = "worldscope_prefs";

const DEFAULT_PREFS: UserPreferences = {
  variant: "world",
  locale: "en",
  mapLayers: {
    heatmap: false,
    clusters: true,
    flights: true,
    vessels: true,
    gpsJamming: true,
    cables: false,
  },
  categoryFilters: [],
  broadcastMuted: true,
  lastCountry: null,
  analyticsRange: 24,
  sidebarCollapsed: false,
};

/** Load user preferences from localStorage */
export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFS;
    const parsed = JSON.parse(stored);
    // Merge with defaults to handle new fields
    return { ...DEFAULT_PREFS, ...parsed, mapLayers: { ...DEFAULT_PREFS.mapLayers, ...parsed.mapLayers } };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Save user preferences to localStorage */
export function savePreferences(prefs: Partial<UserPreferences>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadPreferences();
    const updated = { ...current, ...prefs };
    if (prefs.mapLayers) {
      updated.mapLayers = { ...current.mapLayers, ...prefs.mapLayers };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be full or blocked
  }
}

/** Save a single preference key */
export function savePref<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
  savePreferences({ [key]: value } as Partial<UserPreferences>);
}

/** Clear all preferences */
export function clearPreferences(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
