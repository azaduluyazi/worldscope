/**
 * Interpol Red Notices — Public API for wanted persons.
 * Free, no API key required.
 * https://interpol.api.bund.dev/
 */

import type { IntelItem } from "@/types/intel";

interface InterpolNotice {
  forename: string;
  name: string;
  entity_id: string;
  date_of_birth: string;
  nationalities: string[];
  country_of_birth_id: string;
  _links: {
    self: { href: string };
    images: { href: string };
    thumbnail: { href: string };
  };
}

interface InterpolResponse {
  total: number;
  query: Record<string, unknown>;
  _embedded: {
    notices: InterpolNotice[];
  };
  _links: Record<string, { href: string }>;
}

/**
 * Fetch Interpol Red Notices — internationally wanted persons.
 * Returns the latest red notices as IntelItems.
 */
export async function fetchInterpolRedNotices(limit = 20): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      `https://ws-public.interpol.int/notices/v1/red?resultPerPage=${limit}`,
      {
        signal: AbortSignal.timeout(10000),
        headers: {
          Accept: "application/json",
          "User-Agent": "WorldScope/1.0",
        },
      }
    );
    if (!res.ok) return [];

    const data: InterpolResponse = await res.json();
    const notices = data._embedded?.notices;
    if (!Array.isArray(notices)) return [];

    return notices.map((notice): IntelItem => {
      const fullName = [notice.forename, notice.name].filter(Boolean).join(" ");
      const nationalities = notice.nationalities?.join(", ") || "Unknown";

      return {
        id: `interpol-${notice.entity_id}`,
        title: `Interpol Red Notice: ${fullName}`,
        summary: `DOB: ${notice.date_of_birth || "Unknown"} | Nationality: ${nationalities} | Origin: ${notice.country_of_birth_id || "Unknown"}`,
        url: notice._links?.self?.href || "https://www.interpol.int/How-we-work/Notices/Red-Notices",
        source: "Interpol",
        category: "conflict",
        severity: "high",
        publishedAt: new Date().toISOString(),
        countryCode: notice.country_of_birth_id || undefined,
        imageUrl: notice._links?.thumbnail?.href || undefined,
      };
    });
  } catch {
    return [];
  }
}
