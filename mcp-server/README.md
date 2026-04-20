# @worldscope/mcp

Model Context Protocol server for [WorldScope](https://troiamedia.com) — query live intel, convergence storylines, country briefings, and live markets from Claude Desktop, Cursor, or any MCP-compatible client.

## Install

### Claude Desktop

Add to `~/.claude/claude_desktop_config.json` (Mac/Linux) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "worldscope": {
      "command": "npx",
      "args": ["-y", "@worldscope/mcp"]
    }
  }
}
```

Restart Claude Desktop — WorldScope tools show up in the hammer icon.

### Cursor

Settings → Features → Model Context Protocol → Add Server:

- Name: `worldscope`
- Command: `npx -y @worldscope/mcp`

### Any MCP client (custom)

```bash
npx -y @worldscope/mcp
```

Speaks JSON-RPC 2.0 over stdio per MCP 1.0.

## Tools

| Tool | What it does |
|---|---|
| `search_intel_events` | Keyword/country/category/severity filtered search over 689 feeds + 171 APIs. |
| `get_convergence_storylines` | Active multi-day T1–T4 convergence threads. |
| `get_country_briefing` | 7-day country situation brief, optionally scoped to a pantheon variant. |
| `get_markets_snapshot` | Crypto + commodities + indices + Fear & Greed. |

## Example prompts (in Claude Desktop)

> What's active in Türkiye across cyber and finance right now?

> Pull the top 5 convergence storylines at tier 1 or 2 and summarize what they have in common.

> Give me a Lebanon briefing focused on the conflict variant for the last week.

> Show current BTC, GOLD, and the Fear & Greed index.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `WORLDSCOPE_API_BASE` | `https://troiamedia.com/api` | Override to point at a preview deployment or localhost during dev. |
| `WORLDSCOPE_API_KEY` | *(unset)* | Reserved for future pro-tier endpoints. Not required for public reads. |

## Build from source

```bash
git clone https://github.com/azaduluyazi/worldscope
cd worldscope/mcp-server
npm install
npm run build
npm start
```

## License

MIT — the MCP server only. The WorldScope platform itself is a commercial product; querying is free and ad-supported, but the service terms at [troiamedia.com/terms](https://troiamedia.com/terms) apply to the data you fetch.
