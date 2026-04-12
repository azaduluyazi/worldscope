import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Good News — WorldScope",
  description: "Positive global developments, breakthroughs, and uplifting stories from around the world.",
  keywords: [
    "good news", "positive news", "uplifting stories", "breakthroughs",
    "iyi haberler", "pozitif haberler", "olumlu gelişmeler",
  ],
  alternates: { canonical: "/happy" },
};

export default function HappyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
