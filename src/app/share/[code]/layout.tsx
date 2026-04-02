import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;

  return {
    title: "Shared Watchlist — WorldScope",
    description: `View and import a shared WorldScope watchlist (${code}).`,
    robots: { index: false, follow: false },
  };
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
