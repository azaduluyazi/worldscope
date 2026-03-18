/**
 * Climatiq — Carbon footprint calculation
 */

export async function estimateCarbonFootprint(activity: string, value: number): Promise<{ co2e: number; unit: string } | null> {
  const apiKey = process.env.CLIMATIQ_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://beta4.api.climatiq.io/estimate", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ emission_factor: { activity_id: activity }, parameters: { energy: value, energy_unit: "kWh" } }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { co2e: data.co2e || 0, unit: data.co2e_unit || "kg" };
  } catch { return null; }
}
