import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/db/supabase-server";
import { AuthCard } from "@/components/auth/AuthCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In — WorldScope",
  description: "Sign in to your WorldScope account.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_to?: string }>;
}) {
  const { redirect_to } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(redirect_to || "/account");

  return (
    <main className="min-h-screen flex items-center justify-center bg-hud-base px-6 py-12">
      <Suspense fallback={null}>
        <AuthCard mode="sign-in" />
      </Suspense>
    </main>
  );
}
