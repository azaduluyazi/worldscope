"use client";

import { useCompletion } from "@ai-sdk/react";
import { useState } from "react";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
] as const;

export function AIBrief() {
  const [hasRequested, setHasRequested] = useState(false);
  const [lang, setLang] = useState<"en" | "tr">("en");

  const { completion, isLoading, complete } = useCompletion({
    api: "/api/ai/brief",
  });

  const handleGenerate = () => {
    setHasRequested(true);
    complete("", { body: { lang } });
  };

  // Simple markdown-like rendering for ## headers and **bold**
  const renderBrief = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <div key={i} className="text-hud-accent font-bold text-[11px] mt-3 mb-1 tracking-wider">
            ◆ {line.slice(3).toUpperCase()}
          </div>
        );
      }
      if (line.startsWith("- ")) {
        // Bold severity markers
        const formatted = line.slice(2).replace(
          /\*\*(.*?)\*\*/g,
          '<span class="text-severity-critical font-bold">$1</span>'
        );
        return (
          <div key={i} className="flex gap-1.5 ml-1 mb-0.5">
            <span className="text-hud-accent text-[8px] mt-0.5">▸</span>
            <span
              className="text-[10px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatted }}
            />
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-1" />;
      return (
        <p key={i} className="text-[10px] leading-relaxed mb-0.5">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="p-3 flex flex-col gap-3 h-full">
      <div className="flex justify-between items-center">
        <div className="hud-label text-[8px]">◆ AI Strategic Brief</div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex border border-hud-border rounded overflow-hidden">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`font-mono text-[7px] px-1.5 py-0.5 transition-colors ${
                  lang === l.code
                    ? "bg-hud-accent/20 text-hud-accent"
                    : "text-hud-muted hover:text-hud-text"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="font-mono text-[8px] text-hud-accent border border-hud-accent/30 rounded px-2 py-0.5 hover:bg-hud-accent/10 transition-colors disabled:opacity-50"
          >
            {isLoading
              ? lang === "tr" ? "ANALİZ..." : "ANALYZING..."
              : lang === "tr" ? "OLUŞTUR" : "GENERATE"}
          </button>
        </div>
      </div>

      {!hasRequested ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-[10px] text-hud-muted text-center">
            {lang === "tr" ? (
              <>AI destekli stratejik istihbarat<br />brifingini oluşturmak için OLUŞTUR&apos;a tıklayın</>
            ) : (
              <>Click GENERATE for an AI-powered<br />strategic intelligence briefing</>
            )}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="font-mono text-hud-text leading-relaxed">
            {isLoading && !completion && (
              <span className="text-hud-accent animate-blink text-[10px]">
                ◆ {lang === "tr" ? "İSTİHBARAT AKIŞI ANALİZ EDİLİYOR..." : "ANALYZING INTELLIGENCE STREAM..."}
              </span>
            )}
            {completion && renderBrief(completion)}
          </div>
        </div>
      )}
    </div>
  );
}
