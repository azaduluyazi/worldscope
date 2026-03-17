import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/db/supabase";
import type { IntelItem } from "@/types/intel";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeEvent {
  id: string;
  source: string;
  category: string;
  severity: string;
  title: string;
  summary: string | null;
  url: string | null;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
  country_code: string | null;
  published_at: string;
}

function dbRowToIntelItem(row: RealtimeEvent): IntelItem {
  return {
    id: `rt-${row.id}`,
    title: row.title,
    summary: row.summary || "",
    url: row.url || "",
    source: row.source,
    category: row.category as IntelItem["category"],
    severity: row.severity as IntelItem["severity"],
    publishedAt: row.published_at,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    countryCode: row.country_code ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

/**
 * Subscribe to Supabase Realtime INSERT events on the `events` table.
 * Calls `onNewEvent` for each new event — the parent hook merges it into SWR state.
 */
export function useRealtimeEvents(
  onNewEvent: (item: IntelItem) => void,
  enabled = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(onNewEvent);

  useEffect(() => {
    callbackRef.current = onNewEvent;
  }, [onNewEvent]);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return cleanup;

    const channel = supabase
      .channel("events-realtime")
      .on<RealtimeEvent>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
        },
        (payload) => {
          if (payload.new) {
            callbackRef.current(dbRowToIntelItem(payload.new));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return cleanup;
  }, [enabled, cleanup]);
}
