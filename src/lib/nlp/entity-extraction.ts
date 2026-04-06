/**
 * Named Entity Recognition (NER) — extracts people, organizations,
 * countries, and topics from intelligence event titles and summaries.
 *
 * Uses a rule-based approach with gazetteers (name lists) for speed.
 * No external NLP dependency needed — runs in both server and client.
 *
 * For higher accuracy, call Groq LLM via /api/entities/extract endpoint.
 */

export type EntityType = "person" | "organization" | "country" | "topic";

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  confidence: number; // 0-1
}

// ── Country gazetteers ──────────────────────────────────────────
const COUNTRIES = new Set([
  "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus",
  "Belgium", "Bolivia", "Bosnia", "Brazil", "Bulgaria", "Cambodia",
  "Cameroon", "Canada", "Chad", "Chile", "China", "Colombia", "Congo",
  "Croatia", "Cuba", "Cyprus", "Czech", "Denmark", "Ecuador", "Egypt",
  "Estonia", "Ethiopia", "Finland", "France", "Georgia", "Germany",
  "Ghana", "Greece", "Guatemala", "Haiti", "Honduras", "Hungary",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Korea", "Kosovo", "Kuwait",
  "Kyrgyzstan", "Latvia", "Lebanon", "Libya", "Lithuania", "Malaysia",
  "Mali", "Mexico", "Moldova", "Mongolia", "Montenegro", "Morocco",
  "Mozambique", "Myanmar", "Nepal", "Netherlands", "Nicaragua", "Niger",
  "Nigeria", "Norway", "Oman", "Pakistan", "Palestine", "Panama",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saudi", "Senegal", "Serbia",
  "Singapore", "Slovakia", "Slovenia", "Somalia", "Spain", "Sudan",
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tanzania", "Thailand",
  "Tunisia", "Turkey", "Turkmenistan", "Uganda", "Ukraine",
  "UAE", "UK", "US", "USA", "Uruguay", "Uzbekistan", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe",
]);

// ── Organization gazetteers ──────────────────────────────────────
const ORGANIZATIONS = new Set([
  "NATO", "UN", "EU", "WHO", "IAEA", "IMF", "FBI", "CIA", "NSA",
  "OPEC", "BRICS", "ASEAN", "AUKUS", "G7", "G20", "WTO", "ICC",
  "Red Cross", "ICRC", "Amnesty", "Greenpeace", "UNHCR",
  "Pentagon", "Kremlin", "White House", "Congress", "Parliament",
  "SpaceX", "Tesla", "Apple", "Google", "Microsoft", "Amazon",
  "Meta", "OpenAI", "Anthropic", "Nvidia", "TSMC", "Samsung",
  "Hezbollah", "Hamas", "ISIS", "Taliban", "Wagner",
  "IRGC", "Houthi", "PKK", "IDF", "USAF", "RAF",
  "Interpol", "Europol", "Frontex",
  "ECB", "Fed", "Bank of England", "Bank of Japan",
  "Polymarket", "Binance", "Coinbase",
]);

// ── Topic patterns ────────────────────────────────────────────
const TOPIC_PATTERNS = [
  { pattern: /\b(nuclear|atomic|uranium|enrichment)\b/i, topic: "Nuclear" },
  { pattern: /\b(missile|ICBM|ballistic|hypersonic)\b/i, topic: "Missiles" },
  { pattern: /\b(drone|UAV|unmanned)\b/i, topic: "Drones" },
  { pattern: /\b(cyber|hack|ransomware|CVE|vulnerability)\b/i, topic: "Cyber" },
  { pattern: /\b(earthquake|tsunami|hurricane|flood|wildfire)\b/i, topic: "Natural Disaster" },
  { pattern: /\b(election|vote|ballot|referendum)\b/i, topic: "Elections" },
  { pattern: /\b(sanction|embargo|tariff|trade war)\b/i, topic: "Sanctions" },
  { pattern: /\b(oil|petroleum|crude|LNG|natural gas)\b/i, topic: "Energy" },
  { pattern: /\b(bitcoin|crypto|blockchain|stablecoin)\b/i, topic: "Crypto" },
  { pattern: /\b(AI|artificial intelligence|LLM|GPT|machine learning)\b/i, topic: "AI" },
  { pattern: /\b(pandemic|outbreak|epidemic|virus|vaccine)\b/i, topic: "Pandemic" },
  { pattern: /\b(coup|insurrection|protest|uprising|revolution)\b/i, topic: "Unrest" },
  { pattern: /\b(GPS jamming|spoofing|signal interference)\b/i, topic: "GPS Jamming" },
  { pattern: /\b(submarine cable|undersea|fiber optic)\b/i, topic: "Infrastructure" },
];

// ── Person detection (Title Case, 2-3 words, not a known entity) ──
const PERSON_PATTERN = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})\b/g;

/**
 * Extract entities from text using rule-based NER.
 * Fast (~1ms per call), no API dependency.
 */
export function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  // Countries
  for (const country of COUNTRIES) {
    if (text.includes(country) && !seen.has(country)) {
      entities.push({ name: country, type: "country", confidence: 0.95 });
      seen.add(country);
    }
  }

  // Organizations
  for (const org of ORGANIZATIONS) {
    if (text.includes(org) && !seen.has(org)) {
      entities.push({ name: org, type: "organization", confidence: 0.9 });
      seen.add(org);
    }
  }

  // Topics
  for (const { pattern, topic } of TOPIC_PATTERNS) {
    if (pattern.test(text) && !seen.has(topic)) {
      entities.push({ name: topic, type: "topic", confidence: 0.85 });
      seen.add(topic);
    }
  }

  // Persons (heuristic: Title Case names not in country/org sets)
  const personMatches = text.matchAll(PERSON_PATTERN);
  for (const match of personMatches) {
    const name = match[1];
    if (
      !seen.has(name) &&
      !COUNTRIES.has(name) &&
      !ORGANIZATIONS.has(name) &&
      name.length > 4 &&
      !["The", "This", "That", "When", "Where", "After", "Before", "About"].includes(name.split(" ")[0])
    ) {
      entities.push({ name, type: "person", confidence: 0.6 });
      seen.add(name);
    }
  }

  return entities;
}

/**
 * Extract entities from multiple texts and aggregate frequencies.
 */
export function extractBulkEntities(
  texts: string[]
): Map<string, { entity: ExtractedEntity; frequency: number }> {
  const aggregated = new Map<
    string,
    { entity: ExtractedEntity; frequency: number }
  >();

  for (const text of texts) {
    const entities = extractEntities(text);
    for (const entity of entities) {
      const existing = aggregated.get(entity.name);
      if (existing) {
        existing.frequency++;
      } else {
        aggregated.set(entity.name, { entity, frequency: 1 });
      }
    }
  }

  return aggregated;
}
