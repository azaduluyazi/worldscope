"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import {
  YOUTUBE_CHANNELS,
  getChannelsByLocale,
  getAvailableCountries,
  getChannelsByCountry,
  getChannelsByCategory,
  sortChannelsByVariant,
  loadIPTVChannels,
  CHANNEL_CATEGORIES,
  type LiveChannel,
  type ChannelCategory,
} from "@/config/channels";
import { useSubscription } from "@/hooks/useSubscription";

const HlsPlayer = dynamic(() => import("./HlsPlayer"), { ssr: false });

/**
 * Live news broadcast panel — YouTube + HLS embeds with channel tabs.
 * Tier-aware: free users see only YouTube channels.
 * Premium users see YouTube + IPTV (HLS) channels.
 */
export function LiveBroadcasts({ variantId = "world" }: { variantId?: string }) {
  const locale = useLocale();
  const { isPremium } = useSubscription();

  // IPTV channels — loaded only for premium users
  const [iptvChannels, setIptvChannels] = useState<LiveChannel[]>([]);
  useEffect(() => {
    if (isPremium) {
      loadIPTVChannels().then(setIptvChannels);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIptvChannels([]);
    }
  }, [isPremium]);

  // Merge YouTube (always) + IPTV (premium only), apply locale + variant sort
  const allChannels = useMemo(() => {
    const merged = [...YOUTUBE_CHANNELS, ...iptvChannels];
    const localeFiltered = getChannelsByLocale(locale, merged);
    return sortChannelsByVariant(localeFiltered, variantId);
  }, [locale, iptvChannels, variantId]);

  const countries = useMemo(
    () => getAvailableCountries([...YOUTUBE_CHANNELS, ...iptvChannels]),
    [iptvChannels]
  );

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory>("all");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const channels = useMemo(() => {
    let filtered = allChannels;
    if (selectedCountry) {
      const countryChannels = getChannelsByCountry(
        selectedCountry,
        [...YOUTUBE_CHANNELS, ...iptvChannels]
      );
      if (countryChannels.length > 0) filtered = countryChannels;
    }
    return getChannelsByCategory(filtered, selectedCategory);
  }, [allChannels, selectedCountry, selectedCategory, iptvChannels]);

  const [activeChannel, setActiveChannel] = useState<LiveChannel>(YOUTUBE_CHANNELS[0]);
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

  const ytCount = YOUTUBE_CHANNELS.length;
  const totalCount = channels.length;

  return (
    <div className="h-full flex flex-col bg-hud-surface/50 border border-hud-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-hud-border flex items-center justify-between">
        <span className="hud-label text-[9px] flex items-center gap-1.5">
          <span className="text-severity-critical live-glow inline-block w-1.5 h-1.5 rounded-full bg-severity-critical" />
          LIVE BROADCASTS
        </span>
        <div className="flex items-center gap-1.5">
          {/* Category Filter */}
          <div className="flex gap-0.5">
            {CHANNEL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`font-mono text-[6px] px-1 h-5 flex items-center gap-0.5 rounded border transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-hud-accent/15 border-hud-accent/30 text-hud-accent"
                    : "border-hud-border text-hud-muted hover:border-hud-accent/20"
                }`}
              >
                <span className="text-[7px]">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
          {/* Country Picker */}
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
              {selectedCountry || "ALL"}
            </button>
            {showCountryPicker && (
              <div className="absolute right-0 top-6 z-50 bg-hud-surface border border-hud-border rounded-md shadow-lg w-32 max-h-48 overflow-y-auto py-1">
                <button
                  onClick={() => {
                    setSelectedCountry(null);
                    setShowCountryPicker(false);
                  }}
                  className={`w-full text-left px-2 py-1 font-mono text-[7px] hover:bg-hud-panel/50 transition-colors ${!selectedCountry ? "text-hud-accent" : "text-hud-muted"}`}
                >
                  ALL ({allChannels.length})
                </button>
                {countries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setSelectedCountry(c.code);
                      setShowCountryPicker(false);
                    }}
                    className={`w-full text-left px-2 py-1 font-mono text-[7px] hover:bg-hud-panel/50 transition-colors ${selectedCountry === c.code ? "text-hud-accent" : "text-hud-muted"}`}
                  >
                    {c.name} ({c.count})
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
            {totalCount} ch
            {isPremium && iptvChannels.length > 0 && (
              <span className="text-hud-accent ml-0.5" title="Premium channels active">
                +
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Channel tabs — scrollable */}
      <div className="flex gap-0.5 px-2 py-1 border-b border-hud-border overflow-x-auto scrollbar-hide">
        {channels.map((ch) => {
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
            >
              {ch.type === "hls" && (
                <span className="text-[5px] mr-0.5 opacity-60">HLS</span>
              )}
              {ch.label}
            </button>
          );
        })}
      </div>

      {/* Video player */}
      <div ref={containerRef} className="flex-1 relative bg-hud-base min-h-0">
        {/* Loading shimmer */}
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

        {/* Channel switch flash */}
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
            {activeChannel.region.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
