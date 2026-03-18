/**
 * RainViewer — Free weather radar and satellite imagery API.
 * No API key required.
 * https://www.rainviewer.com/api.html
 */

export interface RainViewerRadarFrame {
  time: number;
  path: string;
}

export interface RainViewerSatelliteFrame {
  time: number;
  path: string;
}

export interface RainViewerData {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RainViewerRadarFrame[];
    nowcast: RainViewerRadarFrame[];
  };
  satellite: {
    infrared: RainViewerSatelliteFrame[];
  };
}

/**
 * Fetch current weather radar and satellite map metadata from RainViewer.
 * Returns frame URLs for overlay rendering on maps.
 */
export async function fetchRainViewerMaps(): Promise<RainViewerData | null> {
  try {
    const res = await fetch("https://api.rainviewer.com/public/weather-maps.json", {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data: RainViewerData = await res.json();
    return data;
  } catch {
    return null;
  }
}

/**
 * Get the latest radar tile URL for map overlay.
 * Returns the full tile URL template for the most recent radar frame.
 */
export function getLatestRadarTileUrl(data: RainViewerData): string | null {
  const frames = data.radar?.past;
  if (!frames || frames.length === 0) return null;

  const latest = frames[frames.length - 1];
  // Tile URL format: {host}{path}/{size}/{z}/{x}/{y}/{color}/{options}.png
  return `${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;
}

/**
 * Get the latest satellite infrared tile URL.
 */
export function getLatestSatelliteTileUrl(data: RainViewerData): string | null {
  const frames = data.satellite?.infrared;
  if (!frames || frames.length === 0) return null;

  const latest = frames[frames.length - 1];
  return `${data.host}${latest.path}/256/{z}/{x}/{y}/0/0_0.png`;
}
