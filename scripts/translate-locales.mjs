#!/usr/bin/env node
/**
 * translate-locales.mjs
 * ---------------------
 * One-shot batch translation of the convergence/storyline/mapLayers
 * i18n namespaces from English to all 28 other supported locales
 * using Groq (llama-3.3-70b-versatile).
 *
 * Why Groq: already in the stack (GROQ_API_KEY env var), free tier
 * supports thousands of requests/day, llama-3.3-70b is genuinely
 * multilingual (30+ languages natively).
 *
 * Strategy:
 *   - For each locale, send ONE flat key→value JSON of all strings to
 *     translate in a single prompt
 *   - Parse response JSON, validate shape, write back to locale file
 *   - If parse fails or validation fails → keep English fallback
 *
 * Usage:
 *   node scripts/translate-locales.mjs [--dry-run] [--locales=de,fr]
 *
 * Env:
 *   GROQ_API_KEY — required
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const i18nDir = path.join(repoRoot, "src", "i18n");

// ── Config ────────────────────────────────────────────────────────

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Namespaces we want translated (existing keys already in en.json).
// Everything else (app, intel, sidebar, etc.) is not touched.
const TRANSLATE_NAMESPACES = ["mapLayers", "convergence", "storyline"];

// Locales with existing hand-written translations — skip them.
const SKIP_LOCALES = new Set(["en", "tr"]);

// Locale → human-readable language name for the prompt
const LOCALE_NAMES = {
  ar: "Arabic",
  bn: "Bengali",
  cs: "Czech",
  da: "Danish",
  de: "German",
  el: "Greek",
  es: "Spanish",
  fa: "Persian (Farsi)",
  fi: "Finnish",
  fr: "French",
  hi: "Hindi",
  hu: "Hungarian",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  ms: "Malay",
  nl: "Dutch",
  no: "Norwegian",
  pl: "Polish",
  pt: "Portuguese",
  ro: "Romanian",
  ru: "Russian",
  sv: "Swedish",
  th: "Thai",
  uk: "Ukrainian",
  vi: "Vietnamese",
  zh: "Chinese (Simplified)",
};

// ── CLI args ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const LOCALE_FILTER = (() => {
  const arg = args.find((a) => a.startsWith("--locales="));
  if (!arg) return null;
  return new Set(arg.split("=")[1].split(",").map((s) => s.trim()));
})();

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Recursively flatten a nested object into dot-separated keys.
 * Example: { foo: { bar: "x" } } → { "foo.bar": "x" }
 */
function flatten(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flatten(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

/**
 * Reverse of flatten — rebuild nested object from dot-keys.
 */
function unflatten(flat) {
  const result = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let node = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in node)) node[part] = {};
      node = node[part];
    }
    node[parts[parts.length - 1]] = value;
  }
  return result;
}

function buildPrompt(localeName, flatEnglish) {
  const pairs = JSON.stringify(flatEnglish, null, 2);
  return [
    {
      role: "system",
      content:
        `You are a professional localization translator for a global intelligence dashboard called WorldScope. ` +
        `You translate short UI labels, headers, and user-facing strings. ` +
        `\n\nRules:\n` +
        `- Return ONLY valid JSON. No markdown, no explanations, no code fences.\n` +
        `- Preserve all keys EXACTLY as given. Only translate the values.\n` +
        `- Preserve placeholders like {count}, {hours}, {category}, {probability}, {time} — do NOT translate or remove them.\n` +
        `- Keep technical/proper nouns in their original form (e.g., "USGS", "AI", "GDACS").\n` +
        `- ALL CAPS label keywords ("CRITICAL", "HIGH", "LOW") may be translated to the target language's ALL CAPS equivalent where natural; otherwise keep English.\n` +
        `- Be concise — this is dashboard UI, not prose. Match the terseness of the English source.\n` +
        `- Do not add quotes around placeholders. Do not escape characters.`,
    },
    {
      role: "user",
      content:
        `Target language: ${localeName}\n\n` +
        `Translate the VALUES of this JSON to ${localeName}. Return the same JSON structure with translated values only.\n\n` +
        pairs,
    },
  ];
}

async function callGroq(messages, retries = 2) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY env var is required");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.2,
          response_format: { type: "json_object" },
          max_tokens: 4000,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Groq API ${res.status}: ${text}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty Groq response");
      return JSON.parse(content);
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = 1000 * Math.pow(2, attempt);
      console.log(`  Retry ${attempt + 1}/${retries} in ${delay}ms: ${err.message}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/**
 * Validate the translated response: all keys present, no placeholder loss.
 */
function validateTranslation(original, translated) {
  const originalKeys = Object.keys(original).sort();
  const translatedKeys = Object.keys(translated).sort();

  if (originalKeys.length !== translatedKeys.length) {
    return { valid: false, reason: `key count mismatch: ${originalKeys.length} vs ${translatedKeys.length}` };
  }
  for (let i = 0; i < originalKeys.length; i++) {
    if (originalKeys[i] !== translatedKeys[i]) {
      return { valid: false, reason: `missing key: ${originalKeys[i]}` };
    }
  }

  // Check placeholders are preserved
  for (const key of originalKeys) {
    const originalPlaceholders = (original[key].match(/\{[a-zA-Z]+\}/g) || []).sort();
    const translatedPlaceholders = (String(translated[key]).match(/\{[a-zA-Z]+\}/g) || []).sort();
    if (originalPlaceholders.join(",") !== translatedPlaceholders.join(",")) {
      return {
        valid: false,
        reason: `placeholder mismatch in ${key}: expected [${originalPlaceholders}] got [${translatedPlaceholders}]`,
      };
    }
  }

  return { valid: true };
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("Loading en.json...");
  const enPath = path.join(i18nDir, "en.json");
  const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));

  // Extract the namespaces we want to translate
  const sourceObj = {};
  for (const ns of TRANSLATE_NAMESPACES) {
    if (en[ns]) sourceObj[ns] = en[ns];
  }

  const flatSource = flatten(sourceObj);
  const totalKeys = Object.keys(flatSource).length;
  console.log(`Source: ${TRANSLATE_NAMESPACES.join(", ")} (${totalKeys} flat keys)`);

  // Determine target locales
  const allLocales = Object.keys(LOCALE_NAMES);
  const targetLocales = LOCALE_FILTER
    ? allLocales.filter((l) => LOCALE_FILTER.has(l))
    : allLocales.filter((l) => !SKIP_LOCALES.has(l));

  console.log(`\nTranslating to ${targetLocales.length} locales:`);
  console.log(`  ${targetLocales.join(", ")}`);
  if (DRY_RUN) console.log("(DRY RUN — no files will be written)");
  console.log("");

  let ok = 0;
  let failed = 0;
  const failures = [];

  for (const locale of targetLocales) {
    const localeName = LOCALE_NAMES[locale];
    process.stdout.write(`[${locale}] ${localeName.padEnd(22)} `);

    try {
      const messages = buildPrompt(localeName, flatSource);
      const translated = await callGroq(messages);

      const validation = validateTranslation(flatSource, translated);
      if (!validation.valid) {
        console.log(`❌ ${validation.reason}`);
        failed++;
        failures.push({ locale, reason: validation.reason });
        continue;
      }

      if (!DRY_RUN) {
        const localePath = path.join(i18nDir, `${locale}.json`);
        const existing = JSON.parse(fs.readFileSync(localePath, "utf-8"));
        const translatedNested = unflatten(translated);

        // Merge: replace only the TRANSLATE_NAMESPACES, keep everything else
        for (const ns of TRANSLATE_NAMESPACES) {
          if (translatedNested[ns]) existing[ns] = translatedNested[ns];
        }

        fs.writeFileSync(localePath, JSON.stringify(existing, null, 2) + "\n");
      }

      console.log(`✓ ${Object.keys(translated).length} keys`);
      ok++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed++;
      failures.push({ locale, reason: err.message });
    }

    // Rate-limit buffer: Groq free tier TPM is 12K/min. Each request
    // ~3500 tokens, so we need ≥ 8s between requests to stay safely
    // under the limit. Without this, the entire run fails after ~3
    // locales with 429 errors.
    await new Promise((r) => setTimeout(r, 8000));
  }

  console.log("\n─────────────────────────────────");
  console.log(`Done: ${ok} ok, ${failed} failed`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ${f.locale}: ${f.reason}`);
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
