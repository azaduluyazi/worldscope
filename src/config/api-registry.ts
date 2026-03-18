/**
 * API Registry — All external data sources with plan details.
 * Used by admin panel to display API status, limits, and expiry.
 */

export interface ApiRegistryEntry {
  name: string;
  provider: string;
  url: string;
  envKey: string;
  plan: "free" | "freemium" | "paid" | "open";
  rateLimit: string;
  expiry: string | null; // null = no expiry, ISO date or "unlimited"
  category: string;
  status: "active" | "no_key" | "expired";
  notes?: string;
}

export function getApiRegistry(): ApiRegistryEntry[] {
  const has = (key: string) => !!process.env[key];

  return [
    // ═══ CORE INFRASTRUCTURE ═══
    { name: "Supabase", provider: "supabase.com", url: "https://supabase.com", envKey: "NEXT_PUBLIC_SUPABASE_URL", plan: "free", rateLimit: "Unlimited (free tier)", expiry: null, category: "Database", status: has("NEXT_PUBLIC_SUPABASE_URL") ? "active" : "no_key" },
    { name: "Upstash Redis", provider: "upstash.com", url: "https://upstash.com", envKey: "UPSTASH_REDIS_REST_URL", plan: "free", rateLimit: "10K cmd/day", expiry: null, category: "Cache", status: has("UPSTASH_REDIS_REST_URL") ? "active" : "no_key" },
    { name: "Mapbox GL", provider: "mapbox.com", url: "https://mapbox.com", envKey: "NEXT_PUBLIC_MAPBOX_TOKEN", plan: "freemium", rateLimit: "50K loads/mo", expiry: null, category: "Map", status: has("NEXT_PUBLIC_MAPBOX_TOKEN") ? "active" : "no_key" },
    { name: "Groq AI", provider: "groq.com", url: "https://groq.com", envKey: "GROQ_API_KEY", plan: "free", rateLimit: "14,400 req/day", expiry: null, category: "AI", status: has("GROQ_API_KEY") ? "active" : "no_key" },
    { name: "Resend", provider: "resend.com", url: "https://resend.com", envKey: "RESEND_API_KEY", plan: "free", rateLimit: "100 emails/day", expiry: null, category: "Email", status: has("RESEND_API_KEY") ? "active" : "no_key" },

    // ═══ NEWS APIS ═══
    { name: "NewsAPI", provider: "newsapi.org", url: "https://newsapi.org", envKey: "NEWSAPI_KEY", plan: "free", rateLimit: "100 req/day", expiry: null, category: "News", status: has("NEWSAPI_KEY") ? "active" : "no_key", notes: "Dev only — production requires paid plan" },
    { name: "GNews", provider: "gnews.io", url: "https://gnews.io", envKey: "GNEWS_API_KEY", plan: "free", rateLimit: "100 req/day", expiry: null, category: "News", status: has("GNEWS_API_KEY") ? "active" : "no_key" },
    { name: "NewsData", provider: "newsdata.io", url: "https://newsdata.io", envKey: "NEWSDATA_API_KEY", plan: "free", rateLimit: "200 credits/day", expiry: null, category: "News", status: has("NEWSDATA_API_KEY") ? "active" : "no_key" },
    { name: "The Guardian", provider: "theguardian.com", url: "https://open-platform.theguardian.com", envKey: "GUARDIAN_API_KEY", plan: "free", rateLimit: "500 req/day", expiry: null, category: "News", status: has("GUARDIAN_API_KEY") ? "active" : "no_key" },
    { name: "NY Times", provider: "nytimes.com", url: "https://developer.nytimes.com", envKey: "NYT_API_KEY", plan: "free", rateLimit: "500 req/day", expiry: null, category: "News", status: has("NYT_API_KEY") ? "active" : "no_key" },
    { name: "Currents API", provider: "currentsapi.services", url: "https://currentsapi.services", envKey: "CURRENTS_API_KEY", plan: "free", rateLimit: "600 req/day", expiry: null, category: "News", status: has("CURRENTS_API_KEY") ? "active" : "no_key" },

    // ═══ FINANCE ═══
    { name: "Alpha Vantage", provider: "alphavantage.co", url: "https://alphavantage.co", envKey: "ALPHA_VANTAGE_KEY", plan: "free", rateLimit: "25 req/day", expiry: null, category: "Finance", status: has("ALPHA_VANTAGE_KEY") ? "active" : "no_key" },
    { name: "Finnhub", provider: "finnhub.io", url: "https://finnhub.io", envKey: "FINNHUB_API_KEY", plan: "free", rateLimit: "60 req/min", expiry: null, category: "Finance", status: has("FINNHUB_API_KEY") ? "active" : "no_key" },
    { name: "Financial Modeling Prep", provider: "financialmodelingprep.com", url: "https://financialmodelingprep.com", envKey: "FMP_API_KEY", plan: "free", rateLimit: "250 req/day", expiry: null, category: "Finance", status: has("FMP_API_KEY") ? "active" : "no_key" },
    { name: "FRED", provider: "stlouisfed.org", url: "https://fred.stlouisfed.org", envKey: "FRED_API_KEY", plan: "free", rateLimit: "120 req/min", expiry: null, category: "Finance", status: has("FRED_API_KEY") ? "active" : "no_key" },

    // ═══ WEATHER / ENVIRONMENT ═══
    { name: "OpenWeatherMap", provider: "openweathermap.org", url: "https://openweathermap.org", envKey: "OPENWEATHERMAP_API_KEY", plan: "free", rateLimit: "1,000 req/day", expiry: null, category: "Weather", status: has("OPENWEATHERMAP_API_KEY") ? "active" : "no_key" },
    { name: "OpenAQ", provider: "openaq.org", url: "https://openaq.org", envKey: "OPENAQ_API_KEY", plan: "free", rateLimit: "Generous", expiry: null, category: "Environment", status: has("OPENAQ_API_KEY") ? "active" : "no_key" },
    { name: "Storm Glass", provider: "stormglass.io", url: "https://stormglass.io", envKey: "STORMGLASS_API_KEY", plan: "free", rateLimit: "10 req/day", expiry: null, category: "Marine Weather", status: has("STORMGLASS_API_KEY") ? "active" : "no_key" },

    // ═══ TRACKING ═══
    { name: "AISStream", provider: "aisstream.io", url: "https://aisstream.io", envKey: "AISSTREAM_API_KEY", plan: "free", rateLimit: "WebSocket stream", expiry: null, category: "Maritime", status: has("AISSTREAM_API_KEY") ? "active" : "no_key" },
    { name: "N2YO Satellite", provider: "n2yo.com", url: "https://n2yo.com", envKey: "N2YO_API_KEY", plan: "free", rateLimit: "300 req/hour", expiry: null, category: "Satellite", status: has("N2YO_API_KEY") ? "active" : "no_key" },
    { name: "Shodan", provider: "shodan.io", url: "https://shodan.io", envKey: "SHODAN_API_KEY", plan: "free", rateLimit: "1 req/sec", expiry: null, category: "Cyber", status: has("SHODAN_API_KEY") ? "active" : "no_key" },

    // ═══ FREE / NO KEY ═══
    { name: "OpenSky Network", provider: "opensky-network.org", url: "https://opensky-network.org", envKey: "-", plan: "open", rateLimit: "400 credits/day (anon)", expiry: null, category: "Flights", status: "active" },
    { name: "USGS Earthquake", provider: "earthquake.usgs.gov", url: "https://earthquake.usgs.gov", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Disasters", status: "active" },
    { name: "NASA EONET", provider: "nasa.gov", url: "https://eonet.gsfc.nasa.gov", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Disasters", status: "active" },
    { name: "GDELT", provider: "gdeltproject.org", url: "https://api.gdeltproject.org", envKey: "-", plan: "open", rateLimit: "Generous", expiry: null, category: "Geopolitics", status: "active" },
    { name: "ReliefWeb", provider: "reliefweb.int", url: "https://api.reliefweb.int", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Humanitarian", status: "active" },
    { name: "NVD CVE", provider: "nvd.nist.gov", url: "https://services.nvd.nist.gov", envKey: "-", plan: "open", rateLimit: "5 req/30s", expiry: null, category: "Cyber", status: "active" },
    { name: "WHO Outbreaks", provider: "who.int", url: "https://disease.int", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Health", status: "active" },
    { name: "Spaceflight News", provider: "spaceflightnewsapi.net", url: "https://api.spaceflightnewsapi.net", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Space", status: "active" },
    { name: "Polymarket", provider: "polymarket.com", url: "https://gamma-api.polymarket.com", envKey: "-", plan: "open", rateLimit: "~1,000/hour", expiry: null, category: "Predictions", status: "active" },
    { name: "USAspending", provider: "usaspending.gov", url: "https://api.usaspending.gov", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Government", status: "active" },
    { name: "US Treasury", provider: "fiscaldata.treasury.gov", url: "https://api.fiscaldata.treasury.gov", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Government", status: "active" },
    { name: "ORNL ODIN", provider: "ornl.gov", url: "https://ornl.opendatasoft.com", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Power Outages", status: "active" },
    { name: "Open-Meteo", provider: "open-meteo.com", url: "https://open-meteo.com", envKey: "-", plan: "open", rateLimit: "10,000 req/day", expiry: null, category: "Weather", status: "active" },
    { name: "NWS", provider: "weather.gov", url: "https://api.weather.gov", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Weather", status: "active" },
    { name: "Disease.sh", provider: "disease.sh", url: "https://disease.sh", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Health", status: "active" },
    { name: "Feodo Tracker", provider: "abuse.ch", url: "https://feodotracker.abuse.ch", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Cyber", status: "active" },
    { name: "URLhaus", provider: "abuse.ch", url: "https://urlhaus-api.abuse.ch", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Cyber", status: "active" },
    { name: "OTX AlienVault", provider: "alienvault.com", url: "https://otx.alienvault.com", envKey: "-", plan: "open", rateLimit: "Generous", expiry: null, category: "Cyber", status: "active" },
    { name: "CoinPaprika", provider: "coinpaprika.com", url: "https://api.coinpaprika.com", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Crypto", status: "active" },
    { name: "Frankfurter", provider: "frankfurter.app", url: "https://api.frankfurter.app", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Forex", status: "active" },
    { name: "Safecast", provider: "safecast.org", url: "https://api.safecast.org", envKey: "-", plan: "open", rateLimit: "Generous", expiry: null, category: "Radiation", status: "active" },
    { name: "GDACS", provider: "gdacs.org", url: "https://www.gdacs.org", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Disasters", status: "active" },
    { name: "IFRC Red Cross", provider: "ifrc.org", url: "https://goadmin.ifrc.org/api/v2", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Humanitarian", status: "active" },
    { name: "SpaceX API", provider: "spacexdata.com", url: "https://api.spacexdata.com", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Space", status: "active" },
    { name: "Launch Library", provider: "thespacedevs.com", url: "https://ll.thespacedevs.com", envKey: "-", plan: "open", rateLimit: "15 req/hour", expiry: null, category: "Space", status: "active" },
    { name: "Federal Register", provider: "federalregister.gov", url: "https://www.federalregister.gov", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Government", status: "active" },
    { name: "HackerNews", provider: "ycombinator.com", url: "https://hacker-news.firebaseio.com", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Tech", status: "active" },
    { name: "UK Carbon Intensity", provider: "carbonintensity.org.uk", url: "https://api.carbonintensity.org.uk", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Energy", status: "active" },
    { name: "Open Notify (ISS)", provider: "open-notify.org", url: "http://api.open-notify.org", envKey: "-", plan: "open", rateLimit: "Unlimited", expiry: null, category: "Space", status: "active" },
    { name: "Yahoo Finance", provider: "yahoo.com", url: "https://query1.finance.yahoo.com", envKey: "-", plan: "open", rateLimit: "~2,000 req/hour", expiry: null, category: "Finance", status: "active", notes: "Unofficial API" },
  ];
}
