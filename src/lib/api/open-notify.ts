/**
 * Open Notify — ISS location + astronauts in space. No key required.
 * http://open-notify.org/Open-Notify-API/
 */

export interface ISSPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface AstronautInfo {
  name: string;
  craft: string;
}

/** Fetch current ISS position */
export async function fetchISSPosition(): Promise<ISSPosition | null> {
  try {
    const res = await fetch("http://api.open-notify.org/iss-now.json", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      latitude: parseFloat(data.iss_position.latitude),
      longitude: parseFloat(data.iss_position.longitude),
      timestamp: data.timestamp,
    };
  } catch {
    return null;
  }
}

/** Fetch people currently in space */
export async function fetchAstronauts(): Promise<AstronautInfo[]> {
  try {
    const res = await fetch("http://api.open-notify.org/astros.json", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.people || []).map((p: { name: string; craft: string }) => ({
      name: p.name,
      craft: p.craft,
    }));
  } catch {
    return [];
  }
}
