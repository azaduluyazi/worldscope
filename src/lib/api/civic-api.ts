/**
 * Google Civic Information API — Election and representative data.
 * Requires a Google API key.
 * https://developers.google.com/civic-information
 */

import type { IntelItem } from "@/types/intel";

interface CivicElection {
  id: string;
  name: string;
  electionDay: string;
  ocdDivisionId: string;
}

interface CivicElectionsResponse {
  kind: string;
  elections: CivicElection[];
}

interface CivicRepresentative {
  name: string;
  party: string;
  phones?: string[];
  urls?: string[];
  photoUrl?: string;
  channels?: Array<{ type: string; id: string }>;
}

interface CivicOffice {
  name: string;
  divisionId: string;
  officialIndices: number[];
}

interface CivicRepresentativesResponse {
  offices: CivicOffice[];
  officials: CivicRepresentative[];
}

const CIVIC_BASE = "https://www.googleapis.com/civicinfo/v2";

/**
 * Fetch upcoming elections from Google Civic Information API.
 * Returns election data as IntelItems.
 */
export async function fetchElections(): Promise<IntelItem[]> {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(`${CIVIC_BASE}/elections?key=${apiKey}`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data: CivicElectionsResponse = await res.json();
    if (!Array.isArray(data.elections)) return [];

    return data.elections
      .filter((e) => e.id !== "2000") // Filter out test election
      .map((election): IntelItem => ({
        id: `civic-election-${election.id}`,
        title: `Election: ${election.name}`,
        summary: `Election Day: ${election.electionDay} | Division: ${election.ocdDivisionId}`,
        url: "https://www.google.com/civics/",
        source: "Google Civic API",
        category: "diplomacy",
        severity: isUpcoming(election.electionDay) ? "medium" : "info",
        publishedAt: `${election.electionDay}T00:00:00Z`,
      }));
  } catch {
    return [];
  }
}

/**
 * Fetch representatives for a given address.
 * Returns representative data as IntelItems.
 */
export async function fetchRepresentatives(address: string): Promise<IntelItem[]> {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey || !address) return [];

  try {
    const params = new URLSearchParams({
      address,
      key: apiKey,
    });

    const res = await fetch(`${CIVIC_BASE}/representatives?${params}`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data: CivicRepresentativesResponse = await res.json();
    if (!data.offices || !data.officials) return [];

    const items: IntelItem[] = [];
    for (const office of data.offices) {
      for (const idx of office.officialIndices) {
        const official = data.officials[idx];
        if (!official) continue;

        items.push({
          id: `civic-rep-${office.divisionId}-${idx}`,
          title: `${office.name}: ${official.name}`,
          summary: `Party: ${official.party || "N/A"} | Division: ${office.divisionId}`,
          url: official.urls?.[0] || "https://www.google.com/civics/",
          source: "Google Civic API",
          category: "diplomacy",
          severity: "info",
          publishedAt: new Date().toISOString(),
          imageUrl: official.photoUrl || undefined,
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}

function isUpcoming(dateStr: string): boolean {
  try {
    const electionDate = new Date(dateStr);
    const now = new Date();
    const diffDays = (electionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays < 30;
  } catch {
    return false;
  }
}
