#!/usr/bin/env node
/**
 * WorldScope MCP Server
 *
 * Implements the Model Context Protocol over stdio so any MCP client
 * (Claude Desktop, Cursor, custom LLM apps) can query the WorldScope
 * intelligence platform directly: intel feed, convergence storylines,
 * country briefings, live markets.
 *
 * Protocol: Model Context Protocol 1.0 — https://modelcontextprotocol.io
 * Transport: stdio JSON-RPC 2.0
 *
 * Install in Claude Desktop:
 *   ~/.claude/claude_desktop_config.json:
 *   {
 *     "mcpServers": {
 *       "worldscope": {
 *         "command": "npx",
 *         "args": ["-y", "@worldscope/mcp"]
 *       }
 *     }
 *   }
 *
 * Environment:
 *   WORLDSCOPE_API_BASE   defaults to https://troiamedia.com/api
 *   WORLDSCOPE_API_KEY    optional, reserved for future pro-tier routes
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.WORLDSCOPE_API_BASE ?? "https://troiamedia.com/api";
const API_KEY = process.env.WORLDSCOPE_API_KEY;

interface ToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

const TOOLS: ToolDef[] = [
  {
    name: "search_intel_events",
    description:
      "Search WorldScope's live intel feed. Returns recent events matching any combination of keyword, country, category (pantheon variant), or severity. Data is near-real-time across 689 RSS feeds and 171 API clients.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text keyword(s). Optional." },
        country: {
          type: "string",
          description: "ISO 3166-1 alpha-2 country code (e.g. 'TR', 'US'). Optional.",
        },
        category: {
          type: "string",
          description:
            "Pantheon variant: world, conflict (ares), tech (hephaestus), finance (hermes), cyber (athena), weather (poseidon), health (apollo), energy (zeus), commodity (demeter), sports (nike), happy (eirene).",
        },
        severity: {
          type: "string",
          enum: ["critical", "high", "medium", "low", "info"],
          description: "Minimum severity tier. Optional.",
        },
        limit: {
          type: "number",
          description: "Max items to return (1-50, default 20).",
        },
      },
    },
  },
  {
    name: "get_convergence_storylines",
    description:
      "Retrieve active multi-day convergence storylines from WorldScope's T1-T4 engine. Each storyline aggregates multiple related events into a thread with a convergence score.",
    inputSchema: {
      type: "object",
      properties: {
        tier: {
          type: "string",
          enum: ["1", "2", "3", "4"],
          description: "Convergence tier (1 = highest). Optional.",
        },
        limit: {
          type: "number",
          description: "Max storylines (default 10).",
        },
      },
    },
  },
  {
    name: "get_country_briefing",
    description:
      "Get a country-level situation brief covering the last 7 days across the selected pantheon variant.",
    inputSchema: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "ISO 3166-1 alpha-2 country code. Required.",
        },
        variant: {
          type: "string",
          description:
            "One of: conflict, tech, finance, cyber, weather, health, energy, commodity, sports, happy.",
        },
      },
      required: ["country"],
    },
  },
  {
    name: "get_markets_snapshot",
    description:
      "Current market snapshot — crypto, commodities, indices, and the Fear & Greed index. Refreshed every ~2 minutes.",
    inputSchema: {
      type: "object",
      properties: {
        symbols: {
          type: "array",
          items: { type: "string" },
          description: "Optional subset — e.g. ['BTC','ETH','GOLD']. Omit for the default bundle.",
        },
      },
    },
  },
];

async function wsFetch(path: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = {
    accept: "application/json",
    "user-agent": "worldscope-mcp/0.1.0",
  };
  if (API_KEY) headers["x-worldscope-key"] = API_KEY;
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

async function dispatch(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "search_intel_events": {
      const data = await wsFetch("/intel", {
        q: args.query,
        country: args.country,
        category: args.category,
        severity: args.severity,
        limit: args.limit ?? 20,
      });
      return JSON.stringify(data);
    }
    case "get_convergence_storylines": {
      const data = await wsFetch("/convergence/storylines", {
        tier: args.tier,
        limit: args.limit ?? 10,
      });
      return JSON.stringify(data);
    }
    case "get_country_briefing": {
      const country = String(args.country ?? "").toUpperCase();
      if (!country) throw new Error("country is required");
      const data = await wsFetch(`/country/${country}/briefing`, {
        variant: args.variant,
      });
      return JSON.stringify(data);
    }
    case "get_markets_snapshot": {
      const symbols = Array.isArray(args.symbols) ? args.symbols.join(",") : undefined;
      const data = await wsFetch("/market", { symbols });
      return JSON.stringify(data);
    }
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

async function main(): Promise<void> {
  const server = new Server(
    { name: "worldscope-mcp", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
      const text = await dispatch(name, (args as Record<string, unknown>) ?? {});
      return { content: [{ type: "text", text }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: `worldscope-mcp error: ${message}` }],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Keep process alive on stdin close; SDK handles shutdown on SIGTERM.
}

main().catch((err) => {
  console.error("[worldscope-mcp] fatal", err);
  process.exit(1);
});
