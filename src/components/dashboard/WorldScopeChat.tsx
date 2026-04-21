"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useAccess } from "@/hooks/useAccess";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * WorldScope Chat — multi-turn intelligence conversation.
 *
 * Thin UI over POST /api/chat. Manages message history in local state,
 * streams the assistant response incrementally via fetch + a ReadableStream
 * text decoder (no SDK hook needed — keeps the component bundle tiny).
 *
 * Guarded by tier — if the caller passes a non-Pro tier we show the
 * upsell card instead of the input. The server also re-checks so a
 * direct API call can't bypass.
 */
export function WorldScopeChat() {
  const { isSignedIn, isLoaded } = useAuth();
  const { access, loading: accessLoading } = useAccess();
  const tier = access.tier;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  const isPaid = tier !== "free";

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = input.trim();
    if (!q || streaming) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) {
        if (res.status === 402) setError("Prometheus (Pro) tier required for chat.");
        else if (res.status === 401) setError("Sign in to continue.");
        else setError(`Chat failed: ${res.status}`);
        setStreaming(false);
        return;
      }
      if (!res.body) {
        setError("No response stream.");
        setStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assembled = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assembled += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = prev.slice(0, -1);
          return [...copy, { role: "assistant", content: assembled }];
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stream failed");
    } finally {
      setStreaming(false);
    }
  }

  // Loading shell while Clerk hydrates or access is resolving
  if (!isLoaded || (isSignedIn && accessLoading)) {
    return (
      <div className="h-full flex items-center justify-center font-mono text-[10px] text-hud-muted">
        LOADING…
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="h-full p-4 flex flex-col items-center justify-center text-center gap-3">
        <div className="font-mono text-[11px] text-amber-300 tracking-[0.3em]">SIGN IN REQUIRED</div>
        <p className="text-xs text-gray-400 max-w-xs">
          WorldScope Chat is available to signed-in Prometheus (Pro) subscribers.
        </p>
        <Link
          href="/sign-in?redirect_url=/"
          className="px-3 py-1.5 text-[11px] font-bold tracking-wider border border-amber-400/50 text-amber-300 hover:bg-amber-400/10"
        >
          SIGN IN →
        </Link>
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="h-full p-4 flex flex-col items-center justify-center text-center gap-3">
        <div className="font-mono text-[11px] text-amber-300 tracking-[0.3em]">◈ GAIA TIER</div>
        <p className="text-xs text-gray-400 max-w-xs">
          WorldScope Chat with live-feed grounding is part of Gaia ($9/mo).
          Upgrade to bring WorldScope into Claude, GPT, and your dashboard
          in plain English.
        </p>
        <Link
          href="/pricing#gaia"
          className="px-3 py-1.5 text-[11px] font-bold tracking-wider border border-amber-400/50 text-amber-300 hover:bg-amber-400/10"
        >
          UPGRADE →
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-2 gap-2">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] hud-scrollbar pr-1"
      >
        {messages.length === 0 && (
          <div className="text-gray-500 italic px-1 py-6 text-center">
            Ask about a country, a commodity, a cyber event, a conflict
            corridor. Answers cite the live intel feed.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-sm border ${
              m.role === "user"
                ? "border-hud-accent/30 bg-hud-accent/5 text-gray-200"
                : "border-gray-800 bg-[#0a0810] text-gray-300"
            }`}
          >
            <div
              className={`text-[8px] tracking-[0.3em] mb-1 ${
                m.role === "user" ? "text-hud-accent" : "text-gray-500"
              }`}
            >
              {m.role === "user" ? "YOU" : "WORLDSCOPE"}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">
              {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
        {error && (
          <div className="p-2 rounded-sm border border-red-500/40 bg-red-500/5 text-red-400 text-[10px]">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={send} className="flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          placeholder="Ask WorldScope…"
          className="flex-1 px-2 py-1.5 bg-[#0a0810] border border-hud-border font-mono text-[11px] text-gray-200 placeholder:text-gray-600 focus:border-hud-accent focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="px-3 py-1.5 text-[10px] font-bold tracking-wider bg-hud-accent text-[#060509] hover:bg-hud-accent/90 disabled:opacity-40"
        >
          {streaming ? "…" : "SEND"}
        </button>
      </form>
    </div>
  );
}
