import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";
import { resolveAccess, TIER_TO_PANTHEON, type TierId } from "@/lib/subscriptions/access";
import { SavedEvents } from "./SavedEvents";

export const metadata: Metadata = {
  title: "Account — WorldScope",
  description: "Your WorldScope account, subscription, and preferences.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TIER_LABEL: Record<TierId, string> = {
  free: "Mortal",
  briefing_country: "Chora",
  bundle5: "Pleiades",
  global: "Gaia",
  pro: "Prometheus",
  team: "Pantheon",
  enterprise: "Pantheon",
};

const TIER_PRICE: Record<TierId, string> = {
  free: "$0",
  briefing_country: "$1 / country",
  bundle5: "$5 / month",
  global: "$9 / month",
  pro: "$19 / month",
  team: "$99 / month",
  enterprise: "Custom",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toISOString().slice(0, 10);
}

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/account");

  const [user, access] = await Promise.all([currentUser(), resolveAccess(userId)]);

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "—";
  const displayName =
    user?.firstName || user?.username
      ? [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username
      : email;

  const tierLabel = TIER_LABEL[access.tier];
  const tierPrice = TIER_PRICE[access.tier];
  const pantheon = TIER_TO_PANTHEON[access.tier];

  return (
    <div className="min-h-screen bg-[#060509] text-gray-200 p-6 font-mono" lang="en">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-amber-400 transition-colors mb-6"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-xl font-bold text-amber-400 mb-1 tracking-wider uppercase">
          Account
        </h1>
        <p className="text-gray-500 text-xs mb-8">
          Signed in as <span className="text-gray-200">{displayName}</span> · {email}
        </p>

        {/* Subscription card */}
        <div className="border border-amber-400/40 rounded-sm p-6 bg-amber-400/5 mb-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-sm tracking-wider uppercase">
              Current Tier
            </span>
            <h2 className="text-lg font-bold text-amber-300 tracking-wide uppercase">
              {tierLabel} <span className="text-amber-200/60 font-normal">· {pantheon}</span>
            </h2>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-amber-300">{tierPrice}</span>
          </div>

          {access.subscription ? (
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <dt className="text-gray-500">Status</dt>
              <dd className="text-gray-200">{access.subscription.status}</dd>
              <dt className="text-gray-500">Renews</dt>
              <dd className="text-gray-200">{formatDate(access.subscription.renewsAt)}</dd>
              <dt className="text-gray-500">Ends</dt>
              <dd className="text-gray-200">{formatDate(access.subscription.endsAt)}</dd>
              <dt className="text-gray-500">Billing email</dt>
              <dd className="text-gray-200">{access.subscription.email ?? "—"}</dd>
            </dl>
          ) : (
            <p className="text-sm text-gray-400 mb-4">
              You&apos;re on the free (Mortal) tier. Upgrade to Chora, Pleiades, Gaia, or
              Prometheus for personalized briefings and pro tools.
            </p>
          )}

          <div className="mt-5 flex gap-2 flex-wrap">
            <Link
              href="/pricing"
              className="inline-block px-3 py-1.5 text-[11px] font-bold tracking-wider border border-amber-400/50 text-amber-300 hover:bg-amber-400/10 transition-colors"
            >
              SEE ALL TIERS →
            </Link>
            {access.tier !== "free" && (
              <a
                href="mailto:info@troiamedia.com?subject=Cancel%20subscription"
                className="inline-block px-3 py-1.5 text-[11px] tracking-wider border border-gray-700 text-gray-400 hover:border-gray-500 transition-colors"
              >
                CANCEL
              </a>
            )}
          </div>
        </div>

        {/* Saved events */}
        <div className="border border-gray-800 rounded-sm p-4 bg-[#0a0810] mb-6">
          <h2 className="text-sm font-bold text-amber-400 mb-3 tracking-wide uppercase">
            Saved Events
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Events you&apos;ve bookmarked across the dashboard. Star any intel
            row to pin it here.
          </p>
          <SavedEvents />
        </div>

        {/* Clerk profile widget */}
        <div className="border border-gray-800 rounded-sm p-4 bg-[#0a0810]">
          <h2 className="text-sm font-bold text-amber-400 mb-3 tracking-wide uppercase">
            Profile & Security
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Manage email addresses, connected accounts, password, two-factor
            authentication, and active sessions.
          </p>
          <UserProfile routing="hash" />
        </div>
      </div>
    </div>
  );
}
