"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

interface FlightRoute {
  origin: { icao: string; name: string; city: string; lat: number; lng: number } | null;
  destination: { icao: string; name: string; city: string; lat: number; lng: number } | null;
}

interface FlightPosition {
  lat: number;
  lng: number;
  altitude: number | null;
  velocity: number | null;
  heading: number | null;
  onGround: boolean;
}

export interface FlightSearchResult {
  callsign: string;
  route: FlightRoute;
  position: FlightPosition | null;
}

interface FlightSearchProps {
  onResult: (result: FlightSearchResult | null) => void;
}

/**
 * Flight search input — type a flight number to find and track it.
 * Displayed when Globe3D is in "globe-flights" mode.
 */
export function FlightSearch({ onResult }: FlightSearchProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FlightSearchResult | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.trim().length < 3) return;

    setIsSearching(true);
    setError(null);

    try {
      const res = await fetch(`/api/flights/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data: FlightSearchResult = await res.json();
        setResult(data);
        onResult(data);
        setError(null);
      } else {
        const err = await res.json().catch(() => ({ error: "Search failed" }));
        setError(err.error || "Flight not found");
        setResult(null);
        onResult(null);
      }
    } catch {
      setError("Connection error");
      setResult(null);
      onResult(null);
    } finally {
      setIsSearching(false);
    }
  }, [query, onResult]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="absolute top-3 left-[180px] z-10">
      <div className="bg-hud-panel/90 backdrop-blur-sm border border-hud-border rounded-lg p-2 min-w-[220px]">
        <div className="font-mono text-[7px] text-hud-muted tracking-wider mb-1.5">
          {t("tracking.flights")}
        </div>

        {/* Search input */}
        <div className="flex gap-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="TK1234"
            className="flex-1 bg-hud-base border border-hud-border rounded px-2 py-1 font-mono text-[9px] text-hud-text placeholder:text-hud-muted/40 outline-none focus:border-hud-accent/50 w-24"
            maxLength={10}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || query.trim().length < 3}
            className="px-2 py-1 bg-hud-accent/20 border border-hud-accent/30 rounded font-mono text-[7px] text-hud-accent hover:bg-hud-accent/30 disabled:opacity-30 transition-all"
          >
            {isSearching ? "..." : "TRACK"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-1 font-mono text-[7px] text-severity-critical">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-2 space-y-1">
            <div className="font-mono text-[8px] text-hud-accent font-bold">
              {result.callsign}
            </div>

            {result.route.origin && result.route.destination && (
              <div className="font-mono text-[7px] text-hud-text">
                {result.route.origin.city} → {result.route.destination.city}
              </div>
            )}

            {result.position && (
              <div className="font-mono text-[7px] text-hud-muted space-y-0.5">
                <div>ALT: {result.position.altitude ? `${Math.round(result.position.altitude)}m` : "N/A"}</div>
                <div>SPD: {result.position.velocity ? `${Math.round(result.position.velocity * 3.6)}km/h` : "N/A"}</div>
                <div>HDG: {result.position.heading ? `${Math.round(result.position.heading)}°` : "N/A"}</div>
                <div>{result.position.onGround ? "ON GROUND" : "AIRBORNE"}</div>
              </div>
            )}

            {!result.position && (
              <div className="font-mono text-[7px] text-hud-muted">
                Not currently airborne
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
