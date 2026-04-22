import { createHmac, timingSafeEqual } from "crypto";

const SIG_BYTES = 16;

function secret(): string | null {
  return process.env.UNSUBSCRIBE_SECRET || process.env.ADMIN_KEY || null;
}

export function signUnsubscribe(email: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key)
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, SIG_BYTES * 2);
}

export function verifyUnsubscribe(email: string, sig: string): boolean {
  const expected = signUnsubscribe(email);
  if (!expected || !sig) return false;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
