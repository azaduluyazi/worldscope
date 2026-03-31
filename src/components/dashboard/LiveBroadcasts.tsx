"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import {
  ALL_CHANNELS,
  getChannelsByLocale,
  getAvailableCountries,
  getChannelsByCountry,
  getChannelsByCategory,
  sortChannelsByVariant,
  getCountryFlag,
  CHANNEL_CATEGORIES,
  type LiveChannel,
  type ChannelCategory,
} from "@/config/channels";

const HlsPlayer = dynamic(() => import("./HlsPlayer"), { ssr: false });

const PAGE_SIZE = 40;

/**
 * Live broadcast panel — YouTube + HLS embeds with channel tabs.
 * All channels are free — no tier gating.
 */
export function LiveBroadcasts({ variantId = "world" }: { variantId?: string }) {
  const locale = useLocale();

  // All channels with locale + variant sort applied
  const allChannels = useMemo(() => {
    const localeFiltered = getChannelsByLocale(locale, ALL_CHANNELS);
    return sortChannelsByVariant(localeFiltered, variantId);
  }, [locale, variantId]);

  const countries = useMemo(
    () => getAvailableCountries(ALL_CHANNELS),
    []
  );

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory>("all");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filtered channels
  const channels = useMemo(() => {
    let filtered = allChannels;

    if (selectedCountry) {
      const countryChannels = getChannelsByCountry(selectedCountry, ALL_CHANNELS);
      if (countryChannels.length > 0) filtered = countryChannels;
    }

    filtered = getChannelsByCategory(filtered, selectedCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ch) =>
          ch.label.toLowerCase().includes(q) ||
          ch.country?.toLowerCase().includes(q) ||
          ch.lang.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [allChannels, selectedCountry, selectedCategory, searchQuery]);

  // Reset visible count when filters change
  const visibleChannels = useMemo(
    () => channels.slice(0, visibleCount),
    [channels, visibleCount]
  );

  const [activeChannel, setActiveChannel] = useState<LiveChannel>(ALL_CHANNELS[0]);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChannelSwitch = useCallback(
    (channel: LiveChannel) => {
      if (channel.id === activeChannel.id) return;
      setShowFlash(true);
      setIsLoading(true);
      setActiveChannel(channel);
      setTimeout(() => setShowFlash(false), 500);
    },
    [activeChannel.id]
  );

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }, []);

  // Build embed URL based on channel type
  const embedUrl =
    activeChannel.type === "hls" && activeChannel.hlsUrl
      ? activeChannel.hlsUrl
      : activeChannel.videoId
        ? `https://www.youtube.com/embed/${activeChannel.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&modestbranding=1&rel=0&showinfo=0`
        : `https://www.youtube.com/embed/live_stream?channel=${activeChannel.channelId}&autoplay=1&mute=${isMuted ? 1 : 0}`;

  return (
    <div className="h-full flex flex-col bg-hud-surface/50 border border-hud-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-hud-border flex items-center justify-between">
        <span className="hud-label text-[9px] flex items-center gap-1.5">
          <span className="text-severity-critical live-glow inline-block w-1.5 h-1.5 rounded-full bg-severity-critical" />
          LIVE BROADCASTS
        </span>
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="font-mono text-[7px] h-5 w-20 px-1.5 rounded border border-hud-border bg-hud-base text-hud-text placeholder:text-hud-muted/40 focus:border-hud-accent/50 focus:outline-none"
          />
          {/* Country Picker with flags */}
          <div className="relative">
            <button
              onClick={() => setShowCountryPicker(!showCountryPicker)}
              className={`font-mono text-[7px] px-1.5 h-5 flex items-center gap-1 rounded border transition-colors ${
                selectedCountry
                  ? "bg-hud-accent/10 border-hud-accent/30 text-hud-accent"
                  : "border-hud-border text-hud-muted hover:border-hud-accent/30"
              }`}
              title="Filter by country"
            >
              {selectedCountry ? (
                <>
                  <span className="text-[9px]">{getCountryFlag(selectedCountry)}</span>
                  {selectedCountry}
                </>
              ) : (
                "🌍 ALL"
              )}
            </button>
            {showCountryPicker && (
              <div className="absolute right-0 top-6 z-50 bg-hud-surface border border-hud-border rounded-md shadow-lg w-44 max-h-64 overflow-y-auto py-1">
                <button
                  onClick={() => {
                    setSelectedCountry(null);
                    setShowCountryPicker(false);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`w-full text-left px-2 py-1 font-mono text-[8px] hover:bg-hud-panel/50 transition-colors ${!selectedCountry ? "text-hud-accent" : "text-hud-muted"}`}
                >
                  🌍 ALL ({allChannels.length})
                </button>
                {countries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setSelectedCountry(c.code);
                      setShowCountryPicker(false);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={`w-full text-left px-2 py-1 font-mono text-[8px] hover:bg-hud-panel/50 transition-colors ${selectedCountry === c.code ? "text-hud-accent" : "text-hud-muted"}`}
                  >
                    <span className="text-[10px] mr-1">{getCountryFlag(c.code)}</span>
                    {c.name} <span className="text-hud-muted/50">({c.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="font-mono text-[8px] w-6 h-5 flex items-center justify-center rounded border border-hud-border hover:bg-hud-panel/60 hover:border-hud-accent/30 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={handleFullscreen}
            className="font-mono text-[8px] w-6 h-5 flex items-center justify-center rounded border border-hud-border hover:bg-hud-panel/60 hover:border-hud-accent/30 transition-colors"
            title="Fullscreen"
          >
            ⛶
          </button>
          <span className="font-mono text-[8px] text-hud-muted">
            {channels.length} ch
          </span>
        </div>
      </div>

      {/* Category filter — scrollable pills */}
      <div className="flex gap-0.5 px-2 py-1 border-b border-hud-border overflow-x-auto scrollbar-hide">
        {CHANNEL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setVisibleCount(PAGE_SIZE);
            }}
            className={`shrink-0 font-mono text-[7px] px-1.5 h-5 flex items-center gap-0.5 rounded border transition-colors ${
              selectedCategory === cat.id
                ? "bg-hud-accent/15 border-hud-accent/30 text-hud-accent"
                : "border-hud-border text-hud-muted hover:border-hud-accent/20"
            }`}
          >
            <span className="text-[8px]">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Channel tabs — scrollable with load more */}
      <div className="flex flex-wrap gap-0.5 px-2 py-1 border-b border-hud-border max-h-16 overflow-y-auto scrollbar-hide">
        {visibleChannels.map((ch) => {
          const isActive = activeChannel.id === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => handleChannelSwitch(ch)}
              className={`shrink-0 px-2 py-0.5 font-mono text-[7px] tracking-wider rounded transition-all duration-200 ${
                isActive
                  ? "text-hud-base font-bold shadow-md"
                  : "text-hud-muted border border-hud-border hover:text-hud-text hover:border-hud-text/30"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: ch.color || "#00e5ff",
                      boxShadow: `0 0 8px ${ch.color || "#00e5ff"}40`,
                    }
                  : undefined
              }
              title={`${ch.label} (${ch.country || ch.region})`}
            >
              {ch.type === "hls" && (
                <span className="text-[5px] mr-0.5 opacity-60">HLS</span>
              )}
              {ch.label}
            </button>
          );
        })}
        {visibleCount < channels.length && (
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="shrink-0 px-2 py-0.5 font-mono text-[7px] text-hud-accent border border-hud-accent/30 rounded hover:bg-hud-accent/10"
          >
            +{channels.length - visibleCount} more
          </button>
        )}
      </div>

      {/* Video player */}
      <div ref={containerRef} className="flex-1 relative bg-hud-base min-h-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center loading-shimmer">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-hud-accent/30 border-t-hud-accent rounded-full animate-spin mx-auto mb-2" />
              <span className="font-mono text-[8px] text-hud-muted tracking-wider">
                CONNECTING...
              </span>
            </div>
          </div>
        )}

        {showFlash && <div className="channel-flash z-20" />}

        {activeChannel.type === "hls" && activeChannel.hlsUrl ? (
          <HlsPlayer
            key={activeChannel.id}
            src={activeChannel.hlsUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted={isMuted}
          />
        ) : (
          <iframe
            key={activeChannel.id}
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={`${activeChannel.label} Live`}
            loading="lazy"
            onLoad={() => setIsLoading(false)}
          />
        )}

        {/* Channel overlay gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/70 to-transparent pointer-events-none flex items-end justify-between px-3 pb-1.5">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full live-glow"
              style={{
                backgroundColor: activeChannel.color || "#ff4757",
                color: activeChannel.color || "#ff4757",
              }}
            />
            <span className="font-mono text-[10px] text-white font-bold tracking-wider">
              {activeChannel.label}
            </span>
            <span className="font-mono text-[7px] text-white/50 tracking-wider">
              LIVE
            </span>
          </div>
          <span className="font-mono text-[7px] text-white/40">
            {activeChannel.country && (
              <span className="mr-1">{getCountryFlag(activeChannel.country)}</span>
            )}
            {activeChannel.region.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
