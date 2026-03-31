/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const processed = JSON.parse(fs.readFileSync("/tmp/iptv-processed.json", "utf-8"));

function esc(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/\r/g, "");
}

const countryCount = new Set(processed.map((c) => c.country)).size;
const date = new Date().toISOString().split("T")[0];

let ts = "";
ts += "/**\n";
ts += ` * IPTV channels from iptv-org (https://github.com/iptv-org/iptv)\n`;
ts += ` * Auto-generated — ${processed.length} channels from ${countryCount} countries\n`;
ts += ` * Last updated: ${date}\n`;
ts += " */\n\n";
ts += 'import type { LiveChannel } from "./types";\n\n';
ts += "export const IPTV_CHANNELS: LiveChannel[] = [\n";

for (const ch of processed) {
  const parts = [
    `id: "${esc(ch.id)}"`,
    `label: "${esc(ch.label)}"`,
    `hlsUrl: "${esc(ch.hlsUrl)}"`,
    `type: "hls"`,
    `region: "${ch.region}"`,
    `lang: "${ch.lang}"`,
    `country: "${ch.country}"`,
    `category: "${ch.category}"`,
  ];
  ts += `  { ${parts.join(", ")} },\n`;
}

ts += "];\n";

const outPath = path.join(__dirname, "..", "src", "config", "channels", "iptv-channels.ts");
fs.writeFileSync(outPath, ts);
console.log(`Generated iptv-channels.ts: ${(ts.length / 1024).toFixed(0)} KB`);
console.log(`Channels: ${processed.length}`);
