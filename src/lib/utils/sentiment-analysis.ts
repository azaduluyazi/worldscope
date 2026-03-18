import type { IntelItem } from "@/types/intel";

export type SentimentLabel = "negative" | "neutral" | "positive";

export interface SentimentResult {
  overall: SentimentLabel;
  score: number; // -1 to 1
  distribution: { negative: number; neutral: number; positive: number };
  topNegative: string[];
  topPositive: string[];
}

// Keyword-based sentiment lexicon (lightweight, no ML dependency)
const NEGATIVE_WORDS = new Set([
  "attack", "kill", "dead", "death", "war", "bomb", "terror", "crisis", "threat",
  "destroy", "violence", "conflict", "assault", "explosion", "casualties", "wounded",
  "collapse", "crash", "fail", "breach", "hack", "ransomware", "sanctions", "protest",
  "riot", "arrest", "coup", "famine", "drought", "flood", "earthquake", "tsunami",
  "epidemic", "pandemic", "recession", "default", "bankruptcy", "inflation",
  "shutdown", "strike", "hostage", "kidnap", "murder", "shooting", "missile",
  "nuclear", "invasion", "occupation", "displacement", "refugee", "catastrophe",
]);

const POSITIVE_WORDS = new Set([
  "peace", "agreement", "ceasefire", "deal", "treaty", "cooperation", "aid",
  "rescue", "recovery", "growth", "success", "breakthrough", "innovation",
  "launch", "discover", "progress", "improve", "reform", "release", "resolve",
  "summit", "alliance", "partnership", "investment", "surge", "rally",
  "record", "milestone", "achievement", "victory", "safe", "secure", "stable",
  "humanitarian", "relief", "donation", "vaccine", "cure", "solution",
]);

function scoreSentiment(text: string): number {
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  let counted = 0;

  for (const word of words) {
    if (NEGATIVE_WORDS.has(word)) { score -= 1; counted++; }
    if (POSITIVE_WORDS.has(word)) { score += 1; counted++; }
  }

  return counted > 0 ? score / counted : 0;
}

/** Analyze sentiment across intelligence items */
export function analyzeSentiment(items: IntelItem[]): SentimentResult {
  if (items.length === 0) {
    return { overall: "neutral", score: 0, distribution: { negative: 0, neutral: 0, positive: 0 }, topNegative: [], topPositive: [] };
  }

  let totalScore = 0;
  const dist = { negative: 0, neutral: 0, positive: 0 };
  const negItems: { title: string; score: number }[] = [];
  const posItems: { title: string; score: number }[] = [];

  for (const item of items) {
    const text = `${item.title} ${item.summary || ""}`;
    const s = scoreSentiment(text);
    totalScore += s;

    if (s < -0.2) {
      dist.negative++;
      negItems.push({ title: item.title, score: s });
    } else if (s > 0.2) {
      dist.positive++;
      posItems.push({ title: item.title, score: s });
    } else {
      dist.neutral++;
    }
  }

  const avgScore = totalScore / items.length;
  const overall: SentimentLabel = avgScore < -0.1 ? "negative" : avgScore > 0.1 ? "positive" : "neutral";

  return {
    overall,
    score: Math.round(avgScore * 100) / 100,
    distribution: dist,
    topNegative: negItems.sort((a, b) => a.score - b.score).slice(0, 5).map((i) => i.title.slice(0, 80)),
    topPositive: posItems.sort((a, b) => b.score - a.score).slice(0, 5).map((i) => i.title.slice(0, 80)),
  };
}
