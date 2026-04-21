/**
 * POST /api/chat — WorldScope Chat endpoint.
 *
 * Multi-turn conversation with the pantheon analyst. Uses Vercel AI SDK
 * streaming on top of Groq (llama-3.3-70b). The system prompt includes
 * a recent-events snapshot so the model can ground answers in live
 * intel from the 689 RSS + 171 API source set.
 *
 * Body: { messages: CoreMessage[] }  — as produced by useChat
 * Returns: streaming text/plain response
 *
 * Auth: signed-in Supabase user required. Tier gating (Gaia) is enforced
 * at the page level via <PaywallGate>, but we also double-check here so
 * a direct API call can't bypass the UI.
 */

import { NextResponse } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { getCurrentUser } from "@/lib/db/supabase-server";
import { briefModel } from "@/lib/ai/providers";
import { fetchPersistedEvents } from "@/lib/db/events";
import { resolveAccess, hasAtLeast } from "@/lib/subscriptions/access";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGES = 20;
const MAX_CONTEXT_EVENTS = 20;

interface ChatBody {
  messages: ModelMessage[];
}

function systemPrompt(eventsBlock: string): string {
  return `You are WorldScope, a senior intelligence analyst from the pantheon of the Troia platform. You ground every answer in the live event feed shown below plus your broader knowledge of geopolitics, markets, cyber, and open-source intelligence.

Style:
- Precise, analytical, concise. Absolute dates (YYYY-MM-DD) not "recently".
- Call out uncertainty and the primary source when you cite an event.
- When the user asks a yes/no question, lead with the answer then justify.
- When the user asks about a country or region, scan the event block for matches first.
- Turkish inputs get Turkish output; English inputs get English output; otherwise default to English.

Live event snapshot (last ~24 hours):
${eventsBlock || "(no events available right now)"}

If the user asks about something outside the snapshot, say so explicitly before answering from general knowledge.`;
}

async function buildEventsBlock(): Promise<string> {
  try {
    const events = await fetchPersistedEvents({ limit: MAX_CONTEXT_EVENTS, hoursBack: 24 });
    if (events.length === 0) return "";
    return events
      .slice(0, MAX_CONTEXT_EVENTS)
      .map(
        (e, i) =>
          `${i + 1}. [${e.severity.toUpperCase()}/${e.category}] ${e.title} — ${
            e.source
          }${e.countryCode ? ` (${e.countryCode})` : ""}`,
      )
      .join("\n");
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "sign-in required" }, { status: 401 });
  }

  // Gaia gate — single paid tier (2026-04-21).
  const access = await resolveAccess(user.id);
  if (!hasAtLeast(access, "global")) {
    return NextResponse.json(
      { error: "gaia tier required", currentTier: access.tier },
      { status: 402 },
    );
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "no messages" }, { status: 400 });
  }

  const eventsBlock = await buildEventsBlock();
  const result = streamText({
    model: briefModel,
    system: systemPrompt(eventsBlock),
    messages,
  });

  return result.toTextStreamResponse();
}
