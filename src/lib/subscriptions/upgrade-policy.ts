/**
 * Upgrade / downgrade / cross-tier policy.
 *
 * When a signed-in user with an EXISTING active subscription clicks
 * "Subscribe" on a different pantheon tier, there are three honest
 * choices about what to do next. Each is defensible; each has real
 * consequences for support load, revenue, and user trust.
 *
 * This file owns that decision. The checkout route (api/checkout/tier)
 * calls onExistingSubscription() before creating a new checkout URL,
 * and honours the returned action.
 *
 *   OPTION A — "allow":
 *     Let Lemon create a second subscription. Simplest code path but
 *     the user ends up with two active subscriptions and two
 *     recurring charges. Support burden is real.
 *
 *   OPTION B — "block": with a pointer to the Customer Portal
 *     Refuse the new checkout; send the user to Lemon's hosted customer
 *     portal where they can switch plans / cancel the old one first.
 *     Safest for users, slightly frictional UX ("Why can't I just
 *     upgrade here?"), and requires the customer-portal URL hook
 *     (separate follow-up).
 *
 *   OPTION C — "block": with a contact-sales mailto
 *     Refuse the new checkout; tell the user to email info@troiamedia.com.
 *     Appropriate during beta while upgrade flows are brittle, forces
 *     manual review, will not scale.
 *
 * ─────────────────────────────────────────────────────────────────
 *                        >> YOUR INPUT NEEDED <<
 * ─────────────────────────────────────────────────────────────────
 *
 * Fill in the body of onExistingSubscription() below with the policy
 * you want. A working stub that blocks with the portal hint is provided
 * — it's the safest default for launch week. Keep it, or swap to
 * "allow" or "mailto" as you see fit.
 *
 * Keep it short (5-10 lines). The route treats whatever you return as
 * law.
 */

import type { TierId } from "./access";

export interface ExistingSubscriptionInput {
  currentTier: TierId;
  targetTier: TierId;
  /** "active" | "on_trial" | "past_due" | ... */
  subscriptionStatus: string;
}

export type ExistingSubscriptionDecision =
  | { action: "allow" }
  | {
      action: "block";
      reason: string;
      /** Optional portal / mailto URL for the client to send the user to. */
      portalHint?: string;
    };

export function onExistingSubscription(
  input: ExistingSubscriptionInput,
): ExistingSubscriptionDecision {
  // TODO(owner): confirm or replace this policy.
  // Current default (OPTION B): block a duplicate checkout and point
  // the user at a manage-subscription URL. The portal route itself
  // (src/app/api/me/portal/route.ts) is a follow-up; until that ships
  // the client surfaces the hint text to the user.
  if (input.currentTier === input.targetTier) {
    return {
      action: "block",
      reason: "already on this tier",
      portalHint: "/account",
    };
  }
  return {
    action: "block",
    reason:
      "you already have an active subscription; manage or switch tier from your account",
    portalHint: "/account",
  };
}
