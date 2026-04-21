import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/db/supabase";

export const metadata: Metadata = {
  title: "Unsubscribe — WorldScope",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe via token. We *don't* require the user to be
 * signed in — the token in the email is the authenticator. On success
 * we flip daily_enabled + weekly_enabled to false but keep the row
 * (and the country selections) so the user can re-opt-in from /account
 * without losing their setup.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let state: "ok" | "invalid" | "missing" = "missing";

  if (token) {
    const db = createServerClient();
    const { data } = await db
      .from("briefing_preferences")
      .select("id")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    if (data) {
      const { error } = await db
        .from("briefing_preferences")
        .update({
          daily_enabled: false,
          weekly_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      state = error ? "invalid" : "ok";
    } else {
      state = "invalid";
    }
  }

  return (
    <main className="min-h-screen bg-hud-base flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full border border-hud-border bg-hud-panel/60 rounded-lg p-8 text-center">
        <div className="font-mono text-[10px] text-hud-accent tracking-[0.3em] uppercase mb-2">
          WORLDSCOPE
        </div>
        {state === "ok" && (
          <>
            <h1 className="font-mono text-xl font-bold text-hud-text mb-3">
              You&apos;re unsubscribed.
            </h1>
            <p className="text-sm text-hud-muted mb-6">
              We&apos;ve stopped daily and weekly briefing emails. Your
              subscription and country selections are kept — you can resume
              delivery any time from your account page.
            </p>
            <Link
              href="/account"
              className="inline-block px-4 py-2 font-mono text-xs font-bold tracking-wider border border-hud-accent/50 text-hud-accent hover:bg-hud-accent/10 transition-colors"
            >
              OPEN ACCOUNT
            </Link>
          </>
        )}
        {state === "invalid" && (
          <>
            <h1 className="font-mono text-xl font-bold text-hud-text mb-3">
              Link expired
            </h1>
            <p className="text-sm text-hud-muted mb-6">
              This unsubscribe link is no longer valid. Sign in and change
              email preferences from your account page.
            </p>
            <Link
              href="/sign-in"
              className="inline-block px-4 py-2 font-mono text-xs font-bold tracking-wider border border-hud-accent/50 text-hud-accent hover:bg-hud-accent/10 transition-colors"
            >
              SIGN IN
            </Link>
          </>
        )}
        {state === "missing" && (
          <>
            <h1 className="font-mono text-xl font-bold text-hud-text mb-3">
              Nothing to unsubscribe
            </h1>
            <p className="text-sm text-hud-muted">
              This page needs a token that comes from the unsubscribe link in
              our emails.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
