"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/db/supabase-browser";

type Mode = "sign-in" | "sign-up";

interface AuthCardProps {
  mode: Mode;
}

/**
 * Auth card — Supabase Auth UI hand-rolled to match WorldScope's HUD
 * aesthetic (dark base, amber accent, mono font). Two primary paths:
 *
 *   1. Google OAuth  — single button, redirects to Supabase's OAuth
 *      endpoint which bounces to Google then back to /auth/callback.
 *   2. Email magic link — user types their address, we POST a passwordless
 *      sign-in link. No password fields, no reset flow, no stored secrets.
 *
 * Both sign-in and sign-up use the same flow — Supabase `signInWithOtp`
 * transparently creates the account if it doesn't exist (controlled by
 * the project setting "Enable email signups"). The only UI difference is
 * copy + which page you land on when clicking the tab-swap link.
 */
export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = getSupabaseBrowser();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const redirectTo =
    params.get("redirect_to") || (mode === "sign-up" ? "/account?welcome=1" : "/");

  async function handleGoogle() {
    setError(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        // Force Google to show the account chooser instead of silently
        // signing the user in with whichever account Chrome remembers.
        // Important for shared browsers, family devices, and for users
        // with multiple Google accounts (work vs personal).
        queryParams: { prompt: "select_account" },
      },
    });
    if (oauthError) setError(oauthError.message);
    // Success path navigates the browser — router.push unnecessary.
  }

  function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          shouldCreateUser: true,
        },
      });
      if (otpError) {
        setError(otpError.message);
      } else {
        setSent(true);
      }
    });
  }

  const headline =
    mode === "sign-up" ? "Create your WorldScope account" : "Welcome back";
  const subline =
    mode === "sign-up"
      ? "One account. Global intelligence, daily briefings, Gaia unlocks."
      : "Sign in to access your briefings, bookmarks, and Gaia subscription.";
  const swapHref = mode === "sign-up" ? "/sign-in" : "/sign-up";
  const swapLabel =
    mode === "sign-up" ? "Already have an account? Sign in" : "New here? Create an account";

  return (
    <div className="w-full max-w-md">
      {/* Brand mark */}
      <div className="mb-8 text-center">
        <div className="font-mono text-[10px] text-hud-accent tracking-[0.3em] uppercase mb-2">
          WORLDSCOPE
        </div>
        <h1 className="font-mono text-xl font-bold text-hud-text">{headline}</h1>
        <p className="mt-2 text-xs text-hud-muted">{subline}</p>
      </div>

      <div className="border border-hud-border bg-hud-panel/60 backdrop-blur rounded-lg p-6">
        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-hud-accent/20 flex items-center justify-center">
              <span className="text-hud-accent text-2xl">✓</span>
            </div>
            <p className="font-mono text-sm text-hud-text">Check your inbox</p>
            <p className="mt-2 text-xs text-hud-muted">
              We sent a sign-in link to{" "}
              <strong className="text-hud-text">{email}</strong>. Click it to
              continue — the link expires in 1 hour.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="mt-4 text-[10px] font-mono text-hud-accent hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-100 text-[#060509] rounded font-mono text-xs font-semibold transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 border-t border-hud-border/50" />
              <span className="font-mono text-[9px] text-hud-muted uppercase tracking-wider">
                or
              </span>
              <div className="flex-1 border-t border-hud-border/50" />
            </div>

            {/* Magic link */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <label className="block">
                <span className="block font-mono text-[10px] text-hud-muted uppercase tracking-wider mb-1.5">
                  Email
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-hud-base border border-hud-border rounded font-mono text-sm text-hud-text placeholder:text-hud-muted/40 focus:outline-none focus:border-hud-accent transition-colors"
                />
              </label>

              <button
                type="submit"
                disabled={pending}
                className="w-full px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#060509] rounded font-mono text-xs font-bold tracking-wider disabled:opacity-60 disabled:cursor-wait transition-colors"
              >
                {pending
                  ? "…"
                  : mode === "sign-up"
                    ? "Send sign-up link"
                    : "Send sign-in link"}
              </button>

              <p className="text-[10px] font-mono text-hud-muted/80 text-center">
                No password. We&apos;ll email a one-time link.
              </p>
            </form>

            {error && (
              <p
                role="alert"
                className="mt-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-[11px] font-mono text-red-300"
              >
                {error}
              </p>
            )}
          </>
        )}
      </div>

      {/* Tab swap */}
      <div className="mt-6 text-center">
        <Link
          href={swapHref}
          className="text-[10px] font-mono text-hud-accent hover:underline"
        >
          {swapLabel}
        </Link>
      </div>

      {/* Fine print */}
      <p className="mt-6 text-center text-[9px] font-mono text-hud-muted/60">
        By continuing you agree to our{" "}
        <Link href="/terms" className="hover:text-hud-accent">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="hover:text-hud-accent">
          privacy policy
        </Link>
        .
      </p>

      {/* Back link */}
      <div className="mt-4 text-center">
        <Link
          href="/"
          className="text-[10px] font-mono text-hud-muted hover:text-hud-accent"
          // router unused so suppress
          onClick={() => void router}
        >
          ← Back to WorldScope
        </Link>
      </div>
    </div>
  );
}
