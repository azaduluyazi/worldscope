import type { Metadata } from "next";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import "./globals.css";
import "../styles/tactical.css";

export const metadata: Metadata = {
  title: "WorldScope — Global Intelligence Dashboard",
  description: "Real-time global intelligence, finance & technology monitoring platform.",
  openGraph: {
    title: "WorldScope — Global Intelligence Dashboard",
    description: "Real-time global intelligence, finance & technology monitoring.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-hud-base text-hud-text overflow-hidden">
        <ThemeProvider>
          {children}
          <div className="scanlines" />
        </ThemeProvider>
      </body>
    </html>
  );
}
