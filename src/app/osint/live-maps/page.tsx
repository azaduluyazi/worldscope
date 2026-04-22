import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/db/supabase-server";
import { resolveAccess } from "@/lib/subscriptions/access";
import { PaywallGate } from "@/components/shared/PaywallGate";
import { SEED_OSINT_RESOURCES } from "@/config/osint-resources";
import { LegalFooter } from "@/components/shared/LegalFooter";

export const metadata: Metadata = {
  title: "Canlı Tehdit Haritaları — WorldScope",
  description:
    "Canlı siber tehdit haritaları, DDoS telemetrisi, uydu görüntüleri ve çatışma haritaları tek sayfada. Gaia üyelerine özel.",
  robots: { index: false, follow: false }, // Paywalled page, don't index
  alternates: {
    canonical: "https://troiamedia.com/osint/live-maps",
  },
};

export default async function LiveMapsPage() {
  const user = await getCurrentUser();
  const access = await resolveAccess(user?.id ?? null);

  const widgets = SEED_OSINT_RESOURCES.filter(
    (r) => r.integrationType === "widget" && r.embedUrl,
  ).sort((a, b) => b.priority - a.priority);

  return (
    <div className="min-h-screen bg-hud-base text-hud-text p-6 font-mono">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/osint"
          className="inline-flex items-center gap-1 text-xs text-hud-muted hover:text-hud-accent transition-colors mb-6"
        >
          &larr; OSINT Dizinine Dön
        </Link>

        <header className="mb-6 border-b border-hud-border pb-6">
          <div className="text-[10px] font-bold tracking-[0.3em] text-hud-accent mb-2 uppercase">
            ◈ LIVE THREAT MAPS · GAIA TIER
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Canlı Tehdit Haritaları
          </h1>
          <p className="text-sm text-hud-muted leading-relaxed max-w-3xl">
            Gerçek zamanlı siber saldırı, DDoS, fırtına, uydu ve çatışma
            haritaları. {widgets.length} canlı kaynak tek sayfada.
          </p>
        </header>

        <PaywallGate
          access={access}
          requires="global"
          title="Gaia üyeliği gerekli"
          body="Canlı tehdit haritaları Gaia+ üyelerine özel bir özelliktir. OSINT dizininin ücretsiz bölümüne OSINT Dizini sayfasından erişebilirsiniz."
        >
          <WidgetGrid widgets={widgets} />
        </PaywallGate>

        <section className="mt-10 border-t border-hud-border pt-6 text-xs text-hud-muted space-y-2">
          <p>
            <strong className="text-hud-text">Teknik not:</strong> Bazı üçüncü
            taraf sağlayıcılar X-Frame-Options ile embed&apos;i engelleyebilir.
            Yüklenmezse bağlantı üzerinden yeni sekmede açılır.
          </p>
        </section>

        <div className="mt-10">
          <LegalFooter />
        </div>
      </div>
    </div>
  );
}

function WidgetGrid({
  widgets,
}: {
  widgets: typeof SEED_OSINT_RESOURCES;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {widgets.map((w) => (
        <article
          key={w.slug}
          className="border border-hud-border rounded-sm overflow-hidden flex flex-col"
        >
          <header className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-hud-border bg-hud-base/50">
            <div className="min-w-0">
              <div className="text-sm font-bold text-hud-text truncate">
                {w.name}
              </div>
              <div className="text-[10px] text-hud-muted uppercase tracking-wider truncate">
                {w.category} · {w.scope}
              </div>
            </div>
            <a
              href={w.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[10px] text-hud-accent hover:underline"
            >
              YENİ SEKMEDE AÇ ↗
            </a>
          </header>
          <iframe
            src={w.embedUrl}
            title={w.name}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="w-full bg-black"
            style={{ height: `${w.embedHeight ?? 600}px`, border: 0 }}
          />
        </article>
      ))}
    </div>
  );
}
