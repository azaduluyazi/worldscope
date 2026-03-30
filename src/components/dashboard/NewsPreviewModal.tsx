"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { useTTS, type TTSSpeed } from "@/hooks/useTTS";
import type { IntelItem } from "@/types/intel";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";

interface NewsPreviewModalProps {
  item: IntelItem | null;
  onClose: () => void;
}

const TTS_SPEEDS: TTSSpeed[] = [0.75, 1, 1.25, 1.5];

export function NewsPreviewModal({ item, onClose }: NewsPreviewModalProps) {
  const locale = useLocale();
  const tts = useTTS();
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedSummary, setTranslatedSummary] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);

  // Reset state when item changes
  useEffect(() => {
    if (!item) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTranslatedTitle(""); // reset on item change
    setTranslatedSummary("");
    setArticleContent(null);
    tts.stop();
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  // Translate title and summary when modal opens
  useEffect(() => {
    if (!item || locale === "en") {
      if (item) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTranslatedTitle(item.title);
        setTranslatedSummary(item.summary);
      }
      return;
    }

    let cancelled = false;
    setIsTranslating(true);

    const texts = [item.title, item.summary].filter(Boolean);
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: texts, target: locale, source: "en" }),
    })
      .then((res) => res.json())
      .then(({ translations }) => {
        if (cancelled) return;
        setTranslatedTitle(translations[0] || item.title);
        setTranslatedSummary(translations[1] || item.summary);
      })
      .catch(() => {
        if (cancelled) return;
        setTranslatedTitle(item.title);
        setTranslatedSummary(item.summary);
      })
      .finally(() => {
        if (!cancelled) setIsTranslating(false);
      });

    return () => { cancelled = true; };
  }, [item, locale]);

  // Try to extract full article content
  useEffect(() => {
    if (!item?.url) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingArticle(true);

    fetch("/api/article/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: item.url, lang: locale }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setArticleContent(data?.content || null);
      })
      .catch(() => {
        if (!cancelled) setArticleContent(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingArticle(false);
      });

    return () => { cancelled = true; };
  }, [item?.url, locale]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Handle TTS
  const handleSpeak = useCallback(() => {
    if (!item) return;
    const textToRead = articleContent || translatedSummary || translatedTitle;
    if (tts.isPlaying) {
      if (tts.isPaused) { tts.resume(); } else { tts.pause(); }
    } else {
      tts.speak(textToRead, locale);
    }
  }, [item, articleContent, translatedSummary, translatedTitle, tts, locale]);

  if (!item) return null;

  const severityColor = SEVERITY_COLORS[item.severity];
  const icon = CATEGORY_ICONS[item.category] || "📄";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-x-[15%] md:inset-y-[10%] bg-hud-panel border border-hud-border rounded-lg z-[201] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-hud-border bg-hud-surface">
          <div className="flex items-center gap-2">
            <span className="text-sm">{icon}</span>
            <span
              className="font-mono text-[9px] font-bold tracking-wider"
              style={{ color: severityColor }}
            >
              {item.severity.toUpperCase()} — {item.category.toUpperCase()}
            </span>
            <span className="font-mono text-[8px] text-hud-muted">
              {timeAgo(item.publishedAt)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* TTS Controls */}
            {tts.voiceAvailable && (
              <div className="flex items-center gap-1 border border-hud-border rounded px-1.5 py-0.5">
                <button
                  onClick={handleSpeak}
                  className="text-[10px] hover:text-hud-accent transition-colors"
                  title={tts.isPlaying ? (tts.isPaused ? "Resume" : "Pause") : "Listen"}
                >
                  {tts.isPlaying
                    ? tts.isPaused
                      ? "▶"
                      : "⏸"
                    : "🔊"}
                </button>
                {tts.isPlaying && (
                  <button
                    onClick={tts.stop}
                    className="text-[10px] hover:text-severity-critical transition-colors"
                    title="Stop"
                  >
                    ⏹
                  </button>
                )}
                <select
                  value={tts.speed}
                  onChange={(e) => tts.setSpeed(Number(e.target.value) as TTSSpeed)}
                  className="bg-transparent text-[7px] text-hud-muted font-mono outline-none cursor-pointer"
                >
                  {TTS_SPEEDS.map((s) => (
                    <option key={s} value={s}>
                      {s}x
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Source link */}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[8px] text-hud-accent hover:underline flex items-center gap-0.5"
            >
              SOURCE ↗
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-hud-muted hover:text-white transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">
          {/* Title */}
          <h2 className="text-base md:text-lg font-bold text-white leading-snug mb-3">
            {isTranslating ? (
              <span className="animate-pulse text-hud-muted">Translating...</span>
            ) : (
              translatedTitle || item.title
            )}
          </h2>

          {/* Source & time */}
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-[9px] text-hud-muted">
              {item.source}
            </span>
            <span className="font-mono text-[9px] text-hud-muted">
              {new Date(item.publishedAt).toLocaleString()}
            </span>
            {item.countryCode && (
              <span className="font-mono text-[9px] text-hud-accent">
                📍 {item.countryCode}
              </span>
            )}
          </div>

          {/* Summary */}
          {(translatedSummary || item.summary) && (
            <div className="mb-4 p-3 bg-hud-surface border-l-2 rounded-r" style={{ borderColor: severityColor }}>
              <p className="text-[11px] text-hud-text leading-relaxed">
                {isTranslating ? (
                  <span className="animate-pulse text-hud-muted">Translating...</span>
                ) : (
                  translatedSummary || item.summary
                )}
              </p>
            </div>
          )}

          {/* Full article content */}
          {isLoadingArticle ? (
            <div className="space-y-2">
              <div className="h-3 bg-hud-surface rounded animate-pulse w-full" />
              <div className="h-3 bg-hud-surface rounded animate-pulse w-4/5" />
              <div className="h-3 bg-hud-surface rounded animate-pulse w-3/5" />
            </div>
          ) : articleContent ? (
            <div
              className="text-[12px] text-hud-text leading-relaxed space-y-3 [&_p]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-hud-text [&_a]:text-hud-accent [&_a]:underline [&_img]:rounded [&_img]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-hud-accent [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-hud-muted"
              dangerouslySetInnerHTML={{ __html: articleContent }}
            />
          ) : (
            <div className="text-center py-6">
              <p className="text-[11px] text-hud-muted mb-3">
                Full article content is not available for preview.
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-hud-accent/20 border border-hud-accent/40 rounded text-[10px] font-mono text-hud-accent hover:bg-hud-accent/30 transition-colors"
              >
                READ FULL ARTICLE AT SOURCE ↗
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-hud-border bg-hud-surface">
          <span className="font-mono text-[7px] text-hud-muted">
            {tts.isPlaying && "🔊 Playing..."}
          </span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] text-hud-accent hover:underline"
          >
            {item.source} — Open Original ↗
          </a>
        </div>
      </div>
    </>
  );
}
