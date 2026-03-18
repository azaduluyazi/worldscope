import type { FiscalData } from "@/types/tracking";

const TREASURY_BASE = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service";

/** Fetch US national debt data from Treasury API */
export async function fetchNationalDebt(): Promise<FiscalData[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      `${TREASURY_BASE}/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=5&fields=record_date,tot_pub_debt_out_amt,intragov_hold_amt,debt_held_public_amt`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }
    );

    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.data) return [];

    return data.data.map((r: Record<string, string>): FiscalData => ({
      category: "national_debt",
      amount: parseFloat(r.tot_pub_debt_out_amt || "0"),
      period: r.record_date || "",
      source: "US Treasury",
      description: `Total: $${formatTrillions(r.tot_pub_debt_out_amt)} | Public: $${formatTrillions(r.debt_held_public_amt)} | Intragovernmental: $${formatTrillions(r.intragov_hold_amt)}`,
    }));
  } catch {
    return [];
  }
}

/** Fetch federal spending data from USAspending */
export async function fetchFederalSpending(): Promise<FiscalData[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const currentYear = new Date().getFullYear();
    const res = await fetch(
      `https://api.usaspending.gov/api/v2/references/total_budgetary_resources/?fiscal_year=${currentYear}`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }
    );

    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.results) return [];

    return data.results.slice(0, 10).map((r: Record<string, unknown>): FiscalData => ({
      category: "federal_spending",
      amount: Number(r.total_budgetary_resources || 0),
      period: String(r.fiscal_year || currentYear),
      source: "USAspending.gov",
      description: `FY${r.fiscal_year}: $${formatTrillions(String(r.total_budgetary_resources || 0))}`,
    }));
  } catch {
    return [];
  }
}

function formatTrillions(numStr: string): string {
  const num = parseFloat(numStr);
  if (isNaN(num)) return "0";
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(0)}M`;
  return num.toLocaleString();
}
