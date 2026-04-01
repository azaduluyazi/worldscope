/**
 * Day/Night Terminator — computes the solar terminator line
 * as an array of lat/lng points forming the boundary between
 * day and night on Earth at the current moment.
 *
 * Used by the "day-night" layer to render a polygon overlay
 * showing which parts of the world are currently in darkness.
 */

/** Get the sun's ecliptic longitude for a given Julian date */
function solarPosition(now: Date): { lat: number; lng: number } {
  const rad = Math.PI / 180;
  const jd = now.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;

  // Mean longitude and anomaly
  const L = ((280.46 + 0.9856474 * n) % 360 + 360) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360 + 360) % 360;

  // Ecliptic longitude
  const lambda = L + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad);

  // Obliquity of ecliptic
  const epsilon = 23.439 - 0.0000004 * n;

  // Sun declination
  const sunLat = Math.asin(Math.sin(epsilon * rad) * Math.sin(lambda * rad)) / rad;

  // Sun right ascension → hour angle → longitude
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const sunLng = -(gmst / 24) * 360 + ((lambda < 180 ? lambda : lambda - 360));

  return { lat: sunLat, lng: ((sunLng + 540) % 360) - 180 };
}

/**
 * Generate terminator polygon points.
 * Returns an array of {lat, lng} points forming the night-side boundary.
 * @param resolution - Number of points along the terminator (default 72 = every 5°)
 */
export function computeTerminator(resolution = 72): Array<{ lat: number; lng: number }> {
  const now = new Date();
  const sun = solarPosition(now);
  const rad = Math.PI / 180;

  const points: Array<{ lat: number; lng: number }> = [];

  for (let i = 0; i <= resolution; i++) {
    const angle = (i / resolution) * 360;
    const angleRad = angle * rad;

    // Point on the terminator circle (90° from sun)
    const lat = Math.asin(
      Math.sin(sun.lat * rad) * Math.cos(angleRad) +
      Math.cos(sun.lat * rad) * Math.sin(angleRad) * Math.cos(0)
    ) / rad;

    const lng = sun.lng + Math.atan2(
      Math.sin(angleRad) * Math.sin(Math.PI / 2),
      Math.cos(angleRad) - Math.sin(sun.lat * rad) * Math.sin(lat * rad)
    ) / rad;

    // Normalize longitude to [-180, 180]
    const normalizedLng = ((lng + 540) % 360) - 180;

    points.push({ lat, lng: normalizedLng });
  }

  return points;
}

/**
 * Get the night-side polygon as GlobePoint-compatible data.
 * Returns center point of the night side for Globe3D rendering.
 */
export function getNightCenter(): { lat: number; lng: number } {
  const sun = solarPosition(new Date());
  // Night center is antipodal to sun position
  return {
    lat: -sun.lat,
    lng: ((sun.lng + 180 + 540) % 360) - 180,
  };
}
