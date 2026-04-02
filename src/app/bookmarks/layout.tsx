import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Your saved events and intelligence bookmarks.",
};

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
