import type { IntelItem } from "@/types/intel";

export interface ExtractedEntity {
  name: string;
  type: "person" | "organization" | "location" | "event";
  count: number;
  contexts: string[]; // first few titles mentioning this entity
}

// Known organizations (pattern-based detection)
const ORG_PATTERNS = [
  /\b(NATO|UN|EU|WHO|IMF|FBI|CIA|NSA|IAEA|OPEC|ASEAN|BRICS|G7|G20)\b/g,
  /\b(United Nations|European Union|World Bank|Red Cross|Amnesty International)\b/gi,
  /\b(Pentagon|Kremlin|White House|Downing Street|Elysee)\b/gi,
  /\b(Hamas|Hezbollah|ISIS|Taliban|Al[- ]?Qaeda)\b/gi,
  /\b(Microsoft|Google|Apple|Meta|Amazon|Tesla|OpenAI|Nvidia)\b/gi,
  /\b(Reuters|BBC|CNN|Al Jazeera|Associated Press)\b/gi,
];

// Known location patterns
const LOCATION_PATTERNS = [
  /\b(Gaza|Kyiv|Moscow|Beijing|Tehran|Jerusalem|Kabul|Damascus|Taipei)\b/gi,
  /\b(Middle East|South China Sea|Black Sea|Red Sea|Mediterranean)\b/gi,
  /\b(Wall Street|Silicon Valley|Capitol Hill|Downing Street)\b/gi,
];

// Event type patterns
const EVENT_PATTERNS = [
  /\b(earthquake|tsunami|hurricane|typhoon|flood|wildfire|eruption)\b/gi,
  /\b(ceasefire|sanctions|summit|election|coup|protest|strike)\b/gi,
  /\b(cyberattack|data breach|ransomware|hack|exploit|vulnerability)\b/gi,
  /\b(IPO|merger|acquisition|bankruptcy|default|recession)\b/gi,
];

function extractFromText(
  text: string,
  patterns: RegExp[],
   
  _type: ExtractedEntity["type"]
): Map<string, { count: number; contexts: string[] }> {
  const found = new Map<string, { count: number; contexts: string[] }>();

  for (const pattern of patterns) {
    // Reset regex lastIndex
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[0];
      const normalized = name.charAt(0).toUpperCase() + name.slice(1);
      const existing = found.get(normalized);
      if (existing) {
        existing.count++;
      } else {
        found.set(normalized, { count: 1, contexts: [] });
      }
    }
  }

  return found;
}

/** Extract named entities from intelligence items */
export function extractEntities(items: IntelItem[], maxEntities = 20): ExtractedEntity[] {
  const entityMap = new Map<string, { type: ExtractedEntity["type"]; count: number; contexts: string[] }>();

  for (const item of items) {
    const text = `${item.title} ${item.summary || ""}`;

    const types: Array<[RegExp[], ExtractedEntity["type"]]> = [
      [ORG_PATTERNS, "organization"],
      [LOCATION_PATTERNS, "location"],
      [EVENT_PATTERNS, "event"],
    ];

    for (const [patterns, type] of types) {
      const found = extractFromText(text, patterns, type);
      for (const [name, data] of found) {
        const existing = entityMap.get(name);
        if (existing) {
          existing.count += data.count;
          if (existing.contexts.length < 3) {
            existing.contexts.push(item.title.slice(0, 80));
          }
        } else {
          entityMap.set(name, { type, count: data.count, contexts: [item.title.slice(0, 80)] });
        }
      }
    }
  }

  return [...entityMap.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxEntities);
}
