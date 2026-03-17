import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SSE endpoint: streams new events from Supabase Realtime.
 * Fallback for clients that can't use Supabase Realtime directly.
 * Usage: const es = new EventSource("/api/intel/stream");
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send keepalive comment every 30s to prevent timeout
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
        }
      }, 30_000);

      // Subscribe to Supabase Realtime
      const db = createServerClient();
      const channel = db
        .channel("sse-events")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "events",
          },
          (payload) => {
            try {
              const event = payload.new;
              const sseData = JSON.stringify({
                id: event.id,
                title: event.title,
                source: event.source,
                category: event.category,
                severity: event.severity,
                url: event.url,
                lat: event.lat,
                lng: event.lng,
                publishedAt: event.published_at,
              });
              controller.enqueue(
                encoder.encode(`event: intel\ndata: ${sseData}\n\n`)
              );
            } catch {
              // Ignore encoding errors
            }
          }
        )
        .subscribe();

      // Cleanup on stream close
      const cleanup = () => {
        clearInterval(keepalive);
        db.removeChannel(channel);
      };

      // Store cleanup for cancel
      (controller as unknown as Record<string, unknown>).__cleanup = cleanup;
    },
    cancel(controller) {
      const cleanup = (controller as unknown as Record<string, unknown>).__cleanup;
      if (typeof cleanup === "function") cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
