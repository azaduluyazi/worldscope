/**
 * GreyNoise — Internet threat intelligence for IP addresses.
 * Requires GREYNOISE_API_KEY environment variable.
 * https://docs.greynoise.io/
 */

export interface GreyNoiseResult {
  ip: string;
  noise: boolean;
  riot: boolean;
  classification: string; // "benign" | "malicious" | "unknown"
  name: string;
  link: string;
  lastSeen: string;
  message: string;
}

/**
 * Look up an IP address in GreyNoise Community API.
 * Returns threat classification data.
 * Gracefully returns null when GREYNOISE_API_KEY is not set.
 */
export async function fetchGreyNoiseIP(
  ip: string,
): Promise<GreyNoiseResult | null> {
  const apiKey = process.env.GREYNOISE_API_KEY;
  if (!apiKey) return null;
  if (!ip) return null;

  try {
    const res = await fetch(
      `https://api.greynoise.io/v3/community/${encodeURIComponent(ip)}`,
      {
        signal: AbortSignal.timeout(8000),
        headers: {
          key: apiKey,
          "User-Agent": "WorldScope/1.0",
        },
      },
    );
    if (!res.ok) return null;

    const data = await res.json();

    return {
      ip: data.ip || ip,
      noise: Boolean(data.noise),
      riot: Boolean(data.riot),
      classification: String(data.classification || "unknown"),
      name: String(data.name || ""),
      link: String(data.link || `https://viz.greynoise.io/ip/${ip}`),
      lastSeen: String(data.last_seen || ""),
      message: String(data.message || ""),
    };
  } catch {
    return null;
  }
}

/** Bulk IP lookup — checks multiple IPs against GreyNoise */
export async function fetchGreyNoiseBulk(
  ips: string[],
): Promise<GreyNoiseResult[]> {
  const apiKey = process.env.GREYNOISE_API_KEY;
  if (!apiKey || ips.length === 0) return [];

  const results: GreyNoiseResult[] = [];
  // Community API doesn't support bulk, so we query sequentially with a limit
  for (const ip of ips.slice(0, 10)) {
    const result = await fetchGreyNoiseIP(ip);
    if (result) results.push(result);
  }

  return results;
}
