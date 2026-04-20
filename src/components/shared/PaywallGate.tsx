import type { ReactNode } from "react";
import Link from "next/link";
import { hasAtLeast, TIER_TO_PANTHEON, type AccessContext, type TierId } from "@/lib/subscriptions/access";

interface PaywallGateProps {
  access: AccessContext;
  requires: TierId;
  children: ReactNode;
  /** Override the upsell copy. */
  title?: string;
  body?: string;
}

const TIER_LABEL: Record<TierId, string> = {
  free: "Mortal",
  briefing_country: "Chora",
  bundle5: "Pleiades",
  global: "Gaia",
  pro: "Prometheus",
  team: "Pantheon",
  enterprise: "Pantheon",
};

/**
 * Server-side paywall wrapper. Renders children if the user meets the
 * required tier, otherwise shows a small upsell card that points at
 * /pricing with a deep-link-friendly hash for the target tier.
 *
 * Pure presentation — the access check is done upstream (a layout /
 * page loader), so the wrapping is just a conditional.
 */
export function PaywallGate({ access, requires, children, title, body }: PaywallGateProps) {
  if (hasAtLeast(access, requires)) return <>{children}</>;

  const targetLabel = TIER_LABEL[requires];
  const targetSlug = TIER_TO_PANTHEON[requires];
  const heading = title ?? `${targetLabel} tier required`;
  const copy =
    body ??
    `This section is part of the ${targetLabel} tier. Upgrade to unlock the full experience.`;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="border border-amber-400/40 bg-amber-400/5 rounded-sm p-5 my-4 font-mono"
    >
      <div className="text-[10px] font-bold tracking-[0.3em] text-amber-300 mb-2 uppercase">
        ◈ {heading}
      </div>
      <p className="text-sm text-gray-300 leading-relaxed mb-3">{copy}</p>
      <Link
        href={`/pricing#${targetSlug}`}
        className="inline-block px-3 py-1.5 text-[11px] font-bold tracking-wider border border-amber-400/50 text-amber-300 hover:bg-amber-400/10 transition-colors"
      >
        SEE {targetLabel.toUpperCase()} →
      </Link>
    </div>
  );
}
