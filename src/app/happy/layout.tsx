import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Good News — WorldScope",
  description: "Positive global developments, breakthroughs, and uplifting stories from around the world.",
};

export default function HappyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
