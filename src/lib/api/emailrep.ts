/**
 * EmailRep.io — Email reputation and threat intelligence.
 * Free tier available, API key optional for higher limits.
 * https://emailrep.io/docs
 */

import type { IntelItem, Severity } from "@/types/intel";

export interface EmailReputation {
  email: string;
  reputation: "high" | "medium" | "low" | "none";
  suspicious: boolean;
  references: number;
  details: {
    blacklisted: boolean;
    malicious_activity: boolean;
    credentials_leaked: boolean;
    data_breach: boolean;
    dark_web_appearance: boolean;
    last_seen: string;
    domain_exists: boolean;
    domain_reputation: string;
    profiles: string[];
  };
}

function reputationToSeverity(rep: EmailReputation): Severity {
  if (rep.details.malicious_activity || rep.details.blacklisted) return "critical";
  if (rep.suspicious || rep.details.dark_web_appearance) return "high";
  if (rep.details.credentials_leaked || rep.details.data_breach) return "medium";
  if (rep.reputation === "low") return "low";
  return "info";
}

/**
 * Fetch email reputation data from EmailRep.io.
 * Returns threat intelligence for a given email address.
 */
export async function fetchEmailReputation(email: string): Promise<IntelItem[]> {
  if (!email || !email.includes("@")) return [];

  try {
    const apiKey = process.env.EMAILREP_API_KEY;
    const headers: Record<string, string> = {
      "User-Agent": "WorldScope/1.0",
      Accept: "application/json",
    };
    if (apiKey) headers["Key"] = apiKey;

    const res = await fetch(`https://emailrep.io/${encodeURIComponent(email)}`, {
      signal: AbortSignal.timeout(8000),
      headers,
    });
    if (!res.ok) return [];

    const data: EmailReputation = await res.json();

    const flags: string[] = [];
    if (data.details.blacklisted) flags.push("Blacklisted");
    if (data.details.malicious_activity) flags.push("Malicious Activity");
    if (data.details.credentials_leaked) flags.push("Credentials Leaked");
    if (data.details.data_breach) flags.push("Data Breach");
    if (data.details.dark_web_appearance) flags.push("Dark Web");

    return [
      {
        id: `emailrep-${Buffer.from(email).toString("base64url").slice(0, 24)}`,
        title: `Email Reputation: ${email} — ${data.reputation}`,
        summary: `Suspicious: ${data.suspicious} | References: ${data.references} | Flags: ${flags.join(", ") || "None"}`,
        url: "https://emailrep.io/",
        source: "EmailRep.io",
        category: "cyber",
        severity: reputationToSeverity(data),
        publishedAt: data.details.last_seen || new Date().toISOString(),
      },
    ];
  } catch {
    return [];
  }
}
