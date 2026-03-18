import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRIES, COUNTRY_MAP } from "@/config/countries";
import { CountryDashboard } from "@/components/country/CountryDashboard";

export async function generateStaticParams() {
  return COUNTRIES.map((c) => ({ code: c.code.toLowerCase() }));
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());
  if (!country) return { title: "Country Not Found — WorldScope" };

  const title = `${country.name} Intelligence Report — WorldScope`;
  const description = `Real-time intelligence monitoring for ${country.name}. Events, threat analysis, and security updates from WorldScope.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const country = COUNTRY_MAP.get(code.toUpperCase());
  if (!country) notFound();

  return <CountryDashboard country={country} />;
}
