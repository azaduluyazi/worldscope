import { NextRequest, NextResponse } from "next/server";
import { locales, type Locale } from "@/i18n/config";

/**
 * POST /api/locale — Sets the NEXT_LOCALE cookie.
 * Body: { locale: "en" | "tr" }
 */
export async function POST(req: NextRequest) {
  try {
    const { locale } = await req.json();

    if (!locales.includes(locale as Locale)) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const res = NextResponse.json({ locale });
    res.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
