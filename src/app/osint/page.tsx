import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/shared/LegalFooter";
import { SEED_OSINT_RESOURCES } from "@/config/osint-resources";
import { COUNTRIES } from "@/config/countries";
import { OsintDirectoryClient } from "./OsintDirectoryClient";

export const metadata: Metadata = {
  title: "OSINT Directory — WorldScope",
  description:
    "Curated directory of 100+ OSINT tools, feeds, and live threat maps used by analysts. Filter by category (cyber, conflict, satellite, telegram, social), by country, and by cost.",
  openGraph: {
    title: "OSINT Directory — WorldScope",
    description:
      "Curated OSINT tools, feeds, and live threat maps. Filter by category, country, and cost.",
    type: "website",
  },
  alternates: {
    canonical: "https://troiamedia.com/osint",
  },
};

export default function OsintDirectoryPage() {
  // Seed data is the source of truth until migration 027 is applied;
  // once applied, swap this for a Supabase query. Active rows only.
  const resources = SEED_OSINT_RESOURCES.filter((r) => r.integrationType !== "widget");
  // Widgets live on /osint/live-maps (Gaia+ gated); keep directory link-focused.

  const countryOptions = COUNTRIES.map((c) => ({
    code: c.code,
    name: c.nameTr ?? c.name,
  }));

  return (
    <div className="min-h-screen bg-hud-base text-hud-text p-6 font-mono">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-hud-muted hover:text-hud-accent transition-colors mb-6"
        >
          &larr; Kontrol Paneline Dön
        </Link>

        <header className="mb-8 border-b border-hud-border pb-6">
          <div className="text-[10px] font-bold tracking-[0.3em] text-hud-accent mb-2 uppercase">
            ◈ OSINT DIRECTORY
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            OSINT Kaynak Dizini
          </h1>
          <p className="text-sm text-hud-muted leading-relaxed max-w-3xl">
            Analistler, araştırmacılar ve gazeteciler için derlenmiş açık-kaynak
            istihbarat araçları. Kategori, ülke, maliyet ve entegrasyon tipine
            göre filtreleyin. <Link href="/osint/live-maps" className="text-hud-accent hover:underline">Canlı tehdit haritaları</Link> Gaia üyeleri için.
          </p>
          <div className="mt-4 flex gap-3 text-[11px] text-hud-muted">
            <span className="px-2 py-1 border border-hud-border rounded-sm">
              {resources.length} kaynak
            </span>
            <span className="px-2 py-1 border border-hud-border rounded-sm">
              {new Set(resources.map((r) => r.category)).size} kategori
            </span>
            <span className="px-2 py-1 border border-hud-border rounded-sm">
              {resources.filter((r) => r.cost === "free").length} ücretsiz
            </span>
          </div>
        </header>

        <OsintDirectoryClient resources={resources} countries={countryOptions} />

        <section className="mt-12 border-t border-hud-border pt-6 text-xs text-hud-muted space-y-2">
          <p>
            <strong className="text-hud-text">Kaynak:</strong> Bu dizin{" "}
            <a
              href="https://github.com/azaduluyazi/awesome-osint"
              target="_blank"
              rel="noopener noreferrer"
              className="text-hud-accent hover:underline"
            >
              awesome-osint
            </a>{" "}
            reposundan WorldScope için haber odaklı olarak derlenmiştir.
          </p>
          <p>
            <strong className="text-hud-text">Not:</strong> Dışa açılan bağlantılar
            üçüncü taraf hizmetleridir. WorldScope bu kaynakların içeriğinden
            veya doğruluğundan sorumlu değildir.
          </p>
        </section>

        <div className="mt-10">
          <LegalFooter />
        </div>
      </div>
    </div>
  );
}
