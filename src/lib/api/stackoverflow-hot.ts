/**
 * StackOverflow — Hot Questions via Stack Exchange API.
 * Source: https://api.stackexchange.com/2.3/questions
 * No API key required (rate-limited to 300 req/day without key).
 */

import type { IntelItem } from "@/types/intel";

interface StackQuestion {
  question_id: number;
  title: string;
  link: string;
  tags: string[];
  score: number;
  creation_date: number;
  owner?: { display_name?: string };
}

interface StackResponse {
  items: StackQuestion[];
}

export async function fetchStackOverflowHot(): Promise<IntelItem[]> {
  try {
    const res = await fetch(
      "https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&site=stackoverflow&pagesize=10",
      { signal: AbortSignal.timeout(10000), next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const data: StackResponse = await res.json();

    return (data.items || []).map((q, idx) => ({
      id: `stackoverflow-${q.question_id}-${idx}`,
      title: q.title,
      summary: `Tags: ${q.tags.join(", ")} | Score: ${q.score}${q.owner?.display_name ? " | by " + q.owner.display_name : ""}`,
      url: q.link,
      source: "StackOverflow",
      category: "tech" as const,
      severity: "info" as const,
      publishedAt: q.creation_date
        ? new Date(q.creation_date * 1000).toISOString()
        : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}
