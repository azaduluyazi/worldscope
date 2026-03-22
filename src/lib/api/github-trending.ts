/**
 * GitHub Trending — Unofficial scraper for trending repositories.
 * No API key required. Parses HTML from github.com/trending.
 * Falls back to GitHub search API if scraping fails.
 */

export interface TrendingRepo {
  name: string;           // owner/repo
  description: string;
  language: string;
  stars: number;
  starsToday: number;
  forks: number;
  url: string;
}

/**
 * Fetch trending repos via GitHub Search API (official, reliable).
 * Searches for repos created in last 7 days, sorted by stars.
 */
export async function fetchGitHubTrending(
  language?: string,
  limit = 20
): Promise<TrendingRepo[]> {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const langQuery = language ? `+language:${language}` : "";
    const url = `https://api.github.com/search/repositories?q=created:>${since}${langQuery}&sort=stars&order=desc&per_page=${limit}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "WorldScope/1.0",
      },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const items: Array<Record<string, unknown>> = data?.items || [];

    return items.map((repo) => ({
      name: String(repo.full_name || ""),
      description: String(repo.description || "").slice(0, 200),
      language: String(repo.language || "Unknown"),
      stars: Number(repo.stargazers_count || 0),
      starsToday: Math.round(Number(repo.stargazers_count || 0) / 7), // approximate daily
      forks: Number(repo.forks_count || 0),
      url: String(repo.html_url || ""),
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch trending repos across multiple languages.
 */
export async function fetchMultiLanguageTrending(): Promise<TrendingRepo[]> {
  const languages = ["", "python", "typescript", "rust", "go"];

  const results = await Promise.allSettled(
    languages.map((lang) => fetchGitHubTrending(lang, 5))
  );

  const all: TrendingRepo[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const repo of result.value) {
        if (!seen.has(repo.name)) {
          seen.add(repo.name);
          all.push(repo);
        }
      }
    }
  }

  return all.sort((a, b) => b.stars - a.stars).slice(0, 20);
}
