"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VARIANTS, type VariantId } from "@/config/variants";

// ════════════════════════════════════════════════════════════════════
// SHOWCASE — Visual Demo: UI Components + Globe/Map Capabilities
// From RepoScout-discovered repos: animate-ui, shadcn blocks, GlobeStream3D, r3f-globe
// ════════════════════════════════════════════════════════════════════

type Tab = "ui" | "globe" | "sources";

export default function ShowcasePage() {
  const [activeTab, setActiveTab] = useState<Tab>("ui");

  return (
    <div className="min-h-screen bg-[#08081a] text-[#c8c8e8]">
      {/* Header */}
      <header className="border-b border-[#1a1a40] bg-[#0d0d22] px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="font-mono text-lg tracking-widest text-[#00e5ff]">
              WORLDSCOPE // SHOWCASE
            </h1>
            <p className="mt-1 text-xs text-[#4a4a7a]">
              UI Components & Globe/Map Enhancement Demos
            </p>
          </div>
          <Link href="/" className="text-xs text-[#00e5ff] hover:underline">← Dashboard</Link>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-[#1a1a40] bg-[#0d0d22]">
        <div className="mx-auto flex max-w-7xl gap-0">
          {(["ui", "globe", "sources"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors
                ${activeTab === t ? "border-b-2 border-[#00e5ff] text-[#00e5ff]" : "text-[#4a4a7a] hover:text-[#c8c8e8]"}`}
            >
              {t === "ui" ? "🎨 UI Components" : t === "globe" ? "🌍 Globe & Map" : "📡 New Sources"}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-7xl p-6">
        {activeTab === "ui" && <UIShowcase />}
        {activeTab === "globe" && <GlobeShowcase />}
        {activeTab === "sources" && <SourcesShowcase />}
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// UI COMPONENTS — 5 demos inspired by animate-ui, shadcn blocks, kibo
// ════════════════════════════════════════════════════════════════════

function UIShowcase() {
  return (
    <div className="space-y-8">
      <h2 className="font-mono text-sm tracking-widest text-[#00e5ff]">
        UI COMPONENT CAPABILITIES — 5 DEMOS
      </h2>

      {/* Demo 1: Animated Severity Cards */}
      <Demo1_AnimatedSeverityCards />

      {/* Demo 2: Variant Selector with Glow Effects */}
      <Demo2_VariantGlowSelector />

      {/* Demo 3: Animated Counter Stats */}
      <Demo3_AnimatedCounters />

      {/* Demo 4: Glassmorphism Intel Cards */}
      <Demo4_GlassCards />

      {/* Demo 5: Interactive Timeline */}
      <Demo5_Timeline />
    </div>
  );
}

function Demo1_AnimatedSeverityCards() {
  const severities = [
    { level: "critical", color: "#ff4757", count: 3, label: "Kritik Olay", pulse: true },
    { level: "high", color: "#ffd000", count: 12, label: "Yüksek Seviye", pulse: true },
    { level: "medium", color: "#00e5ff", count: 47, label: "Orta Seviye", pulse: false },
    { level: "low", color: "#00ff88", count: 134, label: "Düşük Seviye", pulse: false },
    { level: "info", color: "#8a5cf6", count: 289, label: "Bilgi", pulse: false },
  ];

  return (
    <Card className="border-[#1a1a40] bg-[#10102a]">
      <CardHeader>
        <CardTitle className="font-mono text-[#00e5ff]">1. Animated Severity Cards</CardTitle>
        <CardDescription>animate-ui pattern: Pulse animation on critical alerts, smooth counters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3">
          {severities.map((s) => (
            <div
              key={s.level}
              className="relative overflow-hidden rounded-lg border border-[#1a1a40] bg-[#0d0d22] p-4 transition-all hover:scale-105 hover:shadow-lg"
              style={{ borderTopColor: s.color, borderTopWidth: 2 }}
            >
              {s.pulse && (
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: s.color,
                    boxShadow: `0 0 8px ${s.color}`,
                    animation: "pulse 2s infinite",
                  }}
                />
              )}
              <div className="font-mono text-2xl font-bold" style={{ color: s.color }}>
                {s.count}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-[#4a4a7a]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-[#1a1a40] bg-[#0d0d22]/50">
        <span className="text-xs text-[#4a4a7a]">Source: animate-ui / shadcn pattern</span>
      </CardFooter>
    </Card>
  );
}

function Demo2_VariantGlowSelector() {
  const [selected, setSelected] = useState<VariantId>("world");
  const variants = Object.values(VARIANTS);

  return (
    <Card className="border-[#1a1a40] bg-[#10102a]">
      <CardHeader>
        <CardTitle className="font-mono text-[#00e5ff]">2. Variant Glow Selector</CardTitle>
        <CardDescription>shadcnblocks/kibo pattern: Interactive variant cards with glow borders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 lg:grid-cols-6">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              className={`group relative rounded-xl border p-3 text-left transition-all duration-300 ${
                selected === v.id
                  ? "scale-105 border-transparent"
                  : "border-[#1a1a40] hover:border-[#4a4a7a]"
              }`}
              style={
                selected === v.id
                  ? {
                      background: `linear-gradient(135deg, #0d0d22, ${v.accent}15)`,
                      boxShadow: `0 0 20px ${v.accent}30, inset 0 0 20px ${v.accent}10`,
                      border: `1px solid ${v.accent}60`,
                    }
                  : { background: "#0d0d22" }
              }
            >
              <div className="text-xl">{v.icon}</div>
              <div className="mt-1 text-xs font-bold" style={{ color: selected === v.id ? v.accent : "#c8c8e8" }}>
                {v.name}
              </div>
              <div className="mt-0.5 text-[10px] text-[#4a4a7a]">{v.tagline}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-[#1a1a40] bg-[#0d0d22] p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{VARIANTS[selected].icon}</span>
            <span className="font-mono text-sm" style={{ color: VARIANTS[selected].accent }}>
              {VARIANTS[selected].name}
            </span>
          </div>
          <p className="mt-2 text-xs text-[#4a4a7a]">{VARIANTS[selected].description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {VARIANTS[selected].keywords.map((k) => (
              <Badge key={k} className="bg-[#1a1a40] text-[10px] text-[#c8c8e8]">{k}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-[#1a1a40] bg-[#0d0d22]/50">
        <span className="text-xs text-[#4a4a7a]">Source: shadcnblocks/kibo + tweakcn theme pattern</span>
      </CardFooter>
    </Card>
  );
}

function Demo3_AnimatedCounters() {
  const [counts, setCounts] = useState({ events: 0, sources: 0, countries: 0, feeds: 0 });
  const targets = { events: 1847, sources: 110, countries: 195, feeds: 709 };

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCounts({
        events: Math.round(targets.events * eased),
        sources: Math.round(targets.sources * eased),
        countries: Math.round(targets.countries * eased),
        feeds: Math.round(targets.feeds * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    { label: "Live Events", value: counts.events, color: "#ff4757", suffix: "" },
    { label: "Data Sources", value: counts.sources, color: "#00e5ff", suffix: "+" },
    { label: "Countries", value: counts.countries, color: "#00ff88", suffix: "" },
    { label: "Active Feeds", value: counts.feeds, color: "#ffd000", suffix: "" },
  ];

  return (
    <Card className="border-[#1a1a40] bg-[#10102a]">
      <CardHeader>
        <CardTitle className="font-mono text-[#00e5ff]">3. Animated Counter Stats</CardTitle>
        <CardDescription>animate-ui pattern: Smooth number transitions with easing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-mono text-3xl font-black" style={{ color: s.color }}>
                {s.value.toLocaleString()}{s.suffix}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-[#4a4a7a]">{s.label}</div>
              <div
                className="mx-auto mt-2 h-1 rounded-full"
                style={{
                  width: `${Math.min((s.value / 2000) * 100, 100)}%`,
                  backgroundColor: s.color,
                  boxShadow: `0 0 6px ${s.color}50`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-[#1a1a40] bg-[#0d0d22]/50">
        <span className="text-xs text-[#4a4a7a]">Source: animate-ui counter pattern</span>
      </CardFooter>
    </Card>
  );
}

function Demo4_GlassCards() {
  const events = [
    { title: "7.2 Earthquake — Eastern Turkey", severity: "critical", source: "Kandilli", time: "2m ago", icon: "🔴" },
    { title: "EU Energy Spike: €185/MWh", severity: "high", source: "ENTSO-E", time: "15m ago", icon: "⚡" },
    { title: "BTC Liquidation: $2.4M Long", severity: "medium", source: "Tardis", time: "1h ago", icon: "💰" },
    { title: "Premier League: Arsenal 2-1 Chelsea", severity: "info", source: "ESPN", time: "Live", icon: "⚽" },
    { title: "Supply Chain: npm package compromised", severity: "high", source: "Supply Chain DB", time: "3h ago", icon: "🛡️" },
  ];

  const severityColors: Record<string, string> = {
    critical: "#ff4757", high: "#ffd000", medium: "#00e5ff", low: "#00ff88", info: "#8a5cf6",
  };

  return (
    <Card className="border-[#1a1a40] bg-[#10102a]">
      <CardHeader>
        <CardTitle className="font-mono text-[#00e5ff]">4. Glassmorphism Intel Cards</CardTitle>
        <CardDescription>UI layouts pattern: Frosted glass effect with severity-coded borders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.map((e, i) => (
            <div
              key={i}
              className="group flex items-center gap-3 rounded-lg border border-[#1a1a40]/50 p-3 backdrop-blur-sm transition-all hover:translate-x-1"
              style={{
                background: `linear-gradient(135deg, ${severityColors[e.severity]}08, transparent)`,
                borderLeftWidth: 3,
                borderLeftColor: severityColors[e.severity],
              }}
            >
              <span className="text-lg">{e.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#c8c8e8]">{e.title}</div>
                <div className="text-xs text-[#4a4a7a]">{e.source} · {e.time}</div>
              </div>
              <Badge
                className="text-[10px]"
                style={{ backgroundColor: `${severityColors[e.severity]}20`, color: severityColors[e.severity], border: `1px solid ${severityColors[e.severity]}40` }}
              >
                {e.severity}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-[#1a1a40] bg-[#0d0d22]/50">
        <span className="text-xs text-[#4a4a7a]">Source: ui-layouts/uilayouts glass effect pattern</span>
      </CardFooter>
    </Card>
  );
}

function Demo5_Timeline() {
  const events = [
    { time: "12:45", title: "Kandilli: M4.2 Deprem — Bingöl", color: "#ff4757", variant: "weather" },
    { time: "12:30", title: "ENTSO-E: Germany peak €142/MWh", color: "#ffd000", variant: "energy" },
    { time: "12:15", title: "ESPN: Liverpool vs Man City — LIVE", color: "#22c55e", variant: "sports" },
    { time: "12:00", title: "EIA: WTI Crude at $78.50/bbl", color: "#f39c12", variant: "energy" },
    { time: "11:45", title: "Supply Chain: PyPI malware detected", color: "#00e5ff", variant: "cyber" },
    { time: "11:30", title: "CryptoConvert: BTC = $67,234 USD", color: "#8a5cf6", variant: "finance" },
    { time: "11:15", title: "Crisis: Flood alert Bangladesh", color: "#ff4757", variant: "world" },
  ];

  return (
    <Card className="border-[#1a1a40] bg-[#10102a]">
      <CardHeader>
        <CardTitle className="font-mono text-[#00e5ff]">5. Multi-Source Event Timeline</CardTitle>
        <CardDescription>Animated timeline showing new sources feeding into the dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-[#00e5ff] via-[#1a1a40] to-transparent" />
          {events.map((e, i) => (
            <div key={i} className="relative mb-4 flex items-start gap-3" style={{ animationDelay: `${i * 100}ms` }}>
              <div
                className="absolute left-[-18px] top-1.5 h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: e.color,
                  boxShadow: `0 0 8px ${e.color}60`,
                }}
              />
              <span className="flex-shrink-0 font-mono text-xs text-[#4a4a7a]">{e.time}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#c8c8e8]">{e.title}</span>
                <Badge className="text-[9px] bg-[#1a1a40] text-[#4a4a7a]">{e.variant}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-[#1a1a40] bg-[#0d0d22]/50">
        <span className="text-xs text-[#4a4a7a]">All new sources combined in variant-aware timeline</span>
      </CardFooter>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════
// GLOBE & MAP — 5 demos inspired by GlobeStream3D, r3f-globe
// ════════════════════════════════════════════════════════════════════

function GlobeShowcase() {
  return (
    <div className="space-y-8">
      <h2 className="font-mono text-sm tracking-widest text-[#00e5ff]">
        GLOBE & MAP CAPABILITIES — 5 DEMOS
      </h2>

      {/* Demo 1: Crisis Heatmap Globe */}
      <GlobeDemo1_CrisisHeatmap />

      {/* Demo 2: Energy Flow Map */}
      <GlobeDemo2_EnergyFlows />

      {/* Demo 3: Earthquake Pulse Map */}
      <GlobeDemo3_EarthquakePulse />

      {/* Demo 4: Sports Event Radar */}
      <GlobeDemo4_SportsRadar />

      {/* Demo 5: Crypto Flow Visualization */}
      <GlobeDemo5_CryptoFlows />
    </div>
  );
}

function GlobeDemo1_CrisisHeatmap() {
  const crisisZones = [
    { name: "Eastern Mediterranean", lat: 36.2, lng: 36.1, intensity: 0.9, events: 24 },
    { name: "Sub-Saharan Africa", lat: 4.0, lng: 22.0, intensity: 0.7, events: 18 },
    { name: "Southeast Asia", lat: 13.7, lng: 100.5, intensity: 0.5, events: 11 },
    { name: "Central America", lat: 15.5, lng: -90.2, intensity: 0.4, events: 7 },
    { name: "Eastern Europe", lat: 48.3, lng: 37.8, intensity: 0.95, events: 31 },
  ];

  return (
    <Card className="border-[#1a1a40] bg-[#10102a]">
      <CardHeader>
        <CardTitle className="font-mono text-[#00e5ff]">1. Crisis Heatmap Globe</CardTitle>
        <CardDescription>GlobeStream3D pattern: ReliefWeb crisis data as heat zones on 3D globe</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 overflow-hidden rounded-lg border border-[#1a1a40] bg-[#08081a]">
          {/* SVG Globe Representation */}
          <svg viewBox="0 0 800 300" className="h-full w-full">
            {/* World map outline approximation */}
            <ellipse cx="400" cy="150" rx="350" ry="130" fill="none" stroke="#1a1a40" strokeWidth="1" />
            <ellipse cx="400" cy="150" rx="350" ry="130" fill="none" stroke="#1a1a40" strokeWidth="0.5" strokeDasharray="4 4" />

            {/* Grid lines */}
            {[-240, -120, 0, 120, 240].map((x) => (
              <line key={x} x1={400 + x} y1={20} x2={400 + x} y2={280} stroke="#1a1a4040" strokeWidth="0.5" />
            ))}
            {[50, 100, 150, 200, 250].map((y) => (
              <line key={y} x1={50} y1={y} x2={750} y2={y} stroke="#1a1a4040" strokeWidth="0.5" />
            ))}

            {/* Crisis zones as pulsing circles */}
            {crisisZones.map((z, i) => {
              const cx = 400 + (z.lng / 180) * 350;
              const cy = 150 - (z.lat / 90) * 130;
              const r = z.intensity * 40;
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={r} fill={`rgba(255,71,87,${z.intensity * 0.3})`} stroke="#ff4757" strokeWidth="0.5">
                    <animate attributeName="r" from={r * 0.8} to={r * 1.2} dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0.3" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={cx} cy={cy} r="3" fill="#ff4757" />
                  <text x={cx} y={cy - r - 5} textAnchor="middle" fill="#c8c8e8" fontSize="8" fontFamily="monospace">
                    {z.name} ({z.events})
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-2 right-2 rounded bg-[#0d0d22]/80 p-2 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#ff4757]" /> Active Crisis
              <span className="ml-2 text-[#4a4a7a]">Source: ReliefWeb + GDACS</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-[#1a1a40] bg-[#0d0d22]/50">
        <span className="text-xs text-[#4a4a7a]">Feeds: crisis-news.ts → 3D globe heat overlay</span>
      </CardFooter>
    </Card>
  );
}

function GlobeDemo2_EnergyFlows() {
  const flows = [
    { from: "Norway", to: "Germany", fromX: 350, fromY: 50, toX: 400, toY: 80, mw: 2400 },
    { from: "France", to: "Spain", fromX: 370, fromY: 90, toX: 340, toY: 110, mw: 1800 },
    { from: "Germany", to: "Austria", fromX: 400, fromY: 80, toX: 415, toY: 95, mw: 1200 },
    { from: "Netherlands", to: "Belgium", fromX: 380, fromY: 70, toX: 375, toY: 78, mw: 900 },
    { from: "Sweden", to: "Finland", fromX: 410, fromY: 40, toX: 430, toY: 38, mw: 650 },
  ];

  return (
    <Card className="border-[#1a1a40] bg-[#10102a]">
      <CardHeader>
        <CardTitle className="font-mono text-[#ffd000]">2. EU Energy Cross-Border Flows</CardTitle>
        <CardDescription>ENTSO-E data: Real-time electricity flows between European countries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 overflow-hidden rounded-lg border border-[#1a1a40] bg-[#08081a]">
          <svg viewBox="0 0 800 300" className="h-full w-full">
            {/* EU region */}
            <rect x="280" y="20" width="240" height="200" fill="none" stroke="#1a1a4060" strokeWidth="1" rx="10" />
            <text x="400" y="240" textAnchor="middle" fill="#4a4a7a" fontSize="10" fontFamily="monospace">EUROPEAN ENERGY GRID</text>

            {/* Country nodes */}
            {[
              { name: "NO", x: 350, y: 50, color: "#00ff88" },
              { name: "SE", x: 410, y: 40, color: "#00e5ff" },
              { name: "FI", x: 430, y: 38, color: "#8a5cf6" },
              { name: "NL", x: 380, y: 70, color: "#ffd000" },
              { name: "DE", x: 400, y: 80, color: "#ff4757" },
              { name: "FR", x: 370, y: 90, color: "#00e5ff" },
              { name: "BE", x: 375, y: 78, color: "#ffd000" },
              { name: "AT", x: 415, y: 95, color: "#00ff88" },
              { name: "ES", x: 340, y: 110, color: "#ff9f43" },
            ].map((c) => (
              <g key={c.name}>
                <circle cx={c.x} cy={c.y} r="8" fill={`${c.color}30`} stroke={c.color} strokeWidth="1" />
                <text x={c.x} y={c.y + 3} textAnchor="middle" fill={c.color} fontSize="7" fontFamily="monospace" fontWeight="bold">
                  {c.name}
                </text>
              </g>
            ))}

            {/* Flow arrows */}
            {flows.map((f, i) => (
              <g key={i}>
                <line x1={f.fromX} y1={f.fromY} x2={f.toX} y2={f.toY} stroke="#ffd000" strokeWidth={Math.max(f.mw / 1000, 0.5)} opacity="0.6">
                  <animate attributeName="stroke-dashoffset" from="10" to="0" dur="2s" repeatCount="indefinite" />
                </line>
                <text
                  x={(f.fromX + f.toX) / 2 + 15}
                  y={(f.fromY + f.toY) / 2}
                  fill="#ffd000"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {f.mw}MW
                </text>
              </g>
            ))}

            {/* Price bar on the right */}
            {[
              { country: "DE", price: 142, color: "#ff4757" },
              { country: "FR", price: 98, color: "#ffd000" },
              { country: "NO", price: 45, color: "#00ff88" },
              { country: "ES", price: 112, color: "#ff9f43" },
              { country: "NL", price: 128, color: "#ffd000" },
            ].map((p, i) => (
              <g key={i}>
                <rect x={580} y={40 + i * 35} width={Math.min(p.price, 200)} height="20" fill={`${p.color}40`} rx="3" />
                <text x={575} y={54 + i * 35} textAnchor="end" fill="#c8c8e8" fontSize="9" fontFamily="monospace">{p.country}</text>
                <text x={585 + Math.min(p.price, 200)} y={54 + i * 35} fill={p.color} fontSize="9" fontFamily="monospace">€{p.price}/MWh</text>
              </g>
            ))}
            <text x="650" y="30" textAnchor="middle" fill="#4a4a7a" fontSize="9" fontFamily="monospace">DAY-AHEAD PRICES</text>
          </svg>
        </div>
      </CardContent>
      <CardFooter className="border-[#1a1a40] bg-[#0d0d22]/50">
        <span className="text-xs text-[#4a4a7a]">Feeds: entsoe.ts → Mapbox overlay with cross-border flows</span>
      </CardFooter>
    </Card>
  );
}

function GlobeDemo3_EarthquakePulse() {
  const quakes = [
    { location: "Bingöl, Turkey", lat: 38.8, lng: 40.5, mag: 4.2, depth: 12 },
    { location: "Muğla, Turkey", lat: 37.2, lng: 28.3, mag: 3.1, depth: 8 },
    { location: "Van, Turkey", lat: 38.5, lng: 43.3, mag: 3.8, depth: 15 },
    { location: "İzmir, Turkey", lat: 38.4, lng: 27.1, mag: 2.9, depth: 6 },
    { location: "Elazığ, Turkey", lat: 38.6, lng: 39.2, mag: 5.1, depth: 10 },
  ];

  const magColor = (m: number) => m >= 5 ? "#ff4757" : m >= 4 ? "#ffd000" : m >= 3 ? "#00e5ff" : "#00ff88";

  return (
    <Card className="border-[#1a1a40] bg-[#10102a]">
      <CardHeader>
        <CardTitle className="font-mono text-[#ff4757]">3. Kandilli Earthquake Pulse Map</CardTitle>
        <CardDescription>Turkish earthquake data with magnitude-based pulse animation on Turkey map</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 overflow-hidden rounded-lg border border-[#1a1a40] bg-[#08081a]">
          <svg viewBox="0 0 800 300" className="h-full w-full">
            {/* Turkey outline approximation */}
            <path
              d="M200,140 Q250,100 320,110 L400,100 Q450,95 500,100 L580,110 Q620,115 650,130 Q680,140 670,160 Q660,170 620,175 Q580,180 550,170 L500,175 Q450,180 400,175 Q350,180 300,170 L250,165 Q220,160 200,140 Z"
              fill="#1a1a4030"
              stroke="#4a4a7a"
              strokeWidth="1"
            />
            <text x="420" y="250" textAnchor="middle" fill="#4a4a7a" fontSize="10" fontFamily="monospace">TÜRKİYE — KANDİLLİ OBSERVATORY</text>

            {/* Earthquake dots */}
            {quakes.map((q, i) => {
              const cx = 200 + ((q.lng - 26) / (44 - 26)) * 480;
              const cy = 100 + ((42 - q.lat) / (42 - 36)) * 100;
              const r = q.mag * 5;
              const color = magColor(q.mag);
              return (
                <g key={i}>
                  {/* Outer pulse */}
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="1" opacity="0.4">
                    <animate attributeName="r" from={r} to={r * 2.5} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  {/* Inner dot */}
                  <circle cx={cx} cy={cy} r="4" fill={color}>
                    <animate attributeName="r" from="3" to="5" dur="1s" repeatCount="indefinite" />
                  </circle>
                  {/* Label */}
                  <text x={cx} y={cy - 10} textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace">
                    M{q.mag} — {q.location.split(",")[0]}
                  </text>
                  <text x={cx} y={cy + 18} textAnchor="middle" fill="#4a4a7a" fontSize="7" fontFamily="monospace">
                    {q.depth}km deep
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Earthquake list */}
        <div className="mt-3 space-y-1">
          {quakes.map((q, i) => (
            <div key={i} className="flex items-center justify-between rounded bg-[#0d0d22] px-3 py-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: magColor(q.mag) }} />
                <span className="text-[#c8c8e8]">{q.location}</span>
              </div>
              <div className="flex items-center gap-3 text-[#4a4a7a]">
                <span>Derinlik: {q.depth}km</span>
                <span className="font-mono font-bold" style={{ color: magColor(q.mag) }}>M{q.mag}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-[#1a1a40] bg-[#0d0d22]/50">
        <span className="text-xs text-[#4a4a7a]">Feeds: kandilli.ts → TacticalMap Turkey focused view</span>
      </CardFooter>
    </Card>
  );
}

function GlobeDemo4_SportsRadar() {
  const matches = [
    { league: "Premier League", home: "Arsenal", away: "Chelsea", score: "2-1", status: "LIVE", x: 370, y: 70, color: "#22c55e" },
    { league: "La Liga", home: "Barcelona", away: "Real Madrid", score: "1-1", status: "LIVE", x: 345, y: 95, color: "#22c55e" },
    { league: "NBA", home: "Lakers", away: "Celtics", score: "98-95", status: "Q4", x: 180, y: 90, color: "#ffd000" },
    { league: "NFL", home: "Chiefs", away: "49ers", score: "17-14", status: "3rd", x: 160, y: 80, color: "#ff4757" },
    { league: "Süper Lig", home: "GS", away: "FB", score: "1-0", status: "LIVE", x: 430, y: 90, color: "#22c55e" },
  ];

  return (
    <Card className="border-[#1a1a40] bg-[#10102a]">
      <CardHeader>
        <CardTitle className="font-mono text-[#22c55e]">4. Global Sports Radar Map</CardTitle>
        <CardDescription>ESPN data: Live sports events positioned on world map with scores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 overflow-hidden rounded-lg border border-[#1a1a40] bg-[#08081a]">
          <svg viewBox="0 0 800 300" className="h-full w-full">
            {/* Simplified world outline */}
            <ellipse cx="400" cy="150" rx="350" ry="130" fill="none" stroke="#1a1a4040" strokeWidth="0.5" />
            {[-240, -120, 0, 120, 240].map((x) => (
              <line key={x} x1={400 + x} y1={20} x2={400 + x} y2={280} stroke="#1a1a4020" strokeWidth="0.5" />
            ))}

            {/* Match indicators */}
            {matches.map((m, i) => (
              <g key={i}>
                {/* Ping animation */}
                <circle cx={m.x} cy={m.y} r="15" fill="none" stroke={m.color} strokeWidth="0.5" opacity="0.3">
                  <animate attributeName="r" from="10" to="30" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx={m.x} cy={m.y} r="5" fill={m.color} opacity="0.8" />

                {/* Score card */}
                <rect x={m.x + 10} y={m.y - 18} width="100" height="36" fill="#0d0d22" stroke={m.color} strokeWidth="0.5" rx="4" opacity="0.9" />
                <text x={m.x + 15} y={m.y - 5} fill="#4a4a7a" fontSize="7" fontFamily="monospace">{m.league}</text>
                <text x={m.x + 15} y={m.y + 7} fill="#c8c8e8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  {m.home} {m.score} {m.away}
                </text>
                <text x={m.x + 95} y={m.y + 7} textAnchor="end" fill={m.color} fontSize="7" fontFamily="monospace" fontWeight="bold">
                  {m.status}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </CardContent>
      <CardFooter className="border-[#1a1a40] bg-[#0d0d22]/50">
        <span className="text-xs text-[#4a4a7a]">Feeds: espn-sports.ts → Globe3D sports event layer</span>
      </CardFooter>
    </Card>
  );
}

function GlobeDemo5_CryptoFlows() {
  const liquidations = [
    { pair: "BTC/USDT", amount: "$2.4M", side: "Long", exchange: "Binance", color: "#ff4757" },
    { pair: "ETH/USDT", amount: "$890K", side: "Short", exchange: "Bybit", color: "#00ff88" },
    { pair: "SOL/USDT", amount: "$340K", side: "Long", exchange: "OKX", color: "#ff4757" },
    { pair: "BTC/USDT", amount: "$1.1M", side: "Short", exchange: "Binance", color: "#00ff88" },
  ];

  const conversions = [
    { from: "BTC", to: "USD", rate: "67,234", change: "+2.3%" },
    { from: "ETH", to: "USD", rate: "3,456", change: "-0.8%" },
    { from: "BTC", to: "TRY", rate: "2,184,310", change: "+1.9%" },
    { from: "BTC", to: "EUR", rate: "62,190", change: "+2.1%" },
  ];

  return (
    <Card className="border-[#1a1a40] bg-[#10102a]">
      <CardHeader>
        <CardTitle className="font-mono text-[#8a5cf6]">5. Crypto Market Flow Visualization</CardTitle>
        <CardDescription>Tardis + CryptoConvert: Liquidation events & real-time conversion rates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Liquidations */}
          <div className="rounded-lg border border-[#1a1a40] bg-[#0d0d22] p-3">
            <div className="mb-2 font-mono text-xs text-[#4a4a7a]">LIQUIDATIONS (1H)</div>
            {liquidations.map((l, i) => (
              <div key={i} className="mb-2 flex items-center justify-between rounded bg-[#08081a] px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="font-mono text-xs text-[#c8c8e8]">{l.pair}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold" style={{ color: l.color }}>{l.amount}</div>
                  <div className="text-[10px] text-[#4a4a7a]">{l.side} · {l.exchange}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Conversions */}
          <div className="rounded-lg border border-[#1a1a40] bg-[#0d0d22] p-3">
            <div className="mb-2 font-mono text-xs text-[#4a4a7a]">LIVE RATES</div>
            {conversions.map((c, i) => (
              <div key={i} className="mb-2 flex items-center justify-between rounded bg-[#08081a] px-3 py-2">
                <span className="font-mono text-xs text-[#c8c8e8]">{c.from}/{c.to}</span>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-[#00e5ff]">${c.rate}</div>
                  <div className={`text-[10px] ${c.change.startsWith("+") ? "text-[#00ff88]" : "text-[#ff4757]"}`}>
                    {c.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-[#1a1a40] bg-[#0d0d22]/50">
        <span className="text-xs text-[#4a4a7a]">Feeds: tardis-market.ts + crypto-convert.ts → FinScope overlay</span>
      </CardFooter>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════
// SOURCES — Shows all newly added sources with live status
// ════════════════════════════════════════════════════════════════════

function SourcesShowcase() {
  const [liveData, setLiveData] = useState<Record<string, { status: string; count: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testSources() {
      const tests: Record<string, () => Promise<number>> = {
        "Kandilli": async () => {
          const res = await fetch("/api/intel?source=Kandilli%20Rasathanesi&limit=5");
          const data = await res.json();
          return data.items?.length || 0;
        },
        "ESPN": async () => {
          const res = await fetch("/api/intel?source=ESPN&limit=5");
          const data = await res.json();
          return data.items?.length || 0;
        },
        "CryptoConvert": async () => {
          const res = await fetch("/api/intel?source=CryptoConvert&limit=5");
          const data = await res.json();
          return data.items?.length || 0;
        },
        "ReliefWeb Crisis": async () => {
          const res = await fetch("/api/intel?source=ReliefWeb%20Crisis&limit=5");
          const data = await res.json();
          return data.items?.length || 0;
        },
      };

      const results: Record<string, { status: string; count: number }> = {};
      for (const [name, test] of Object.entries(tests)) {
        try {
          const count = await test();
          results[name] = { status: count > 0 ? "active" : "no_data", count };
        } catch {
          results[name] = { status: "error", count: 0 };
        }
      }
      setLiveData(results);
      setLoading(false);
    }

    testSources();
  }, []);

  const sources = [
    { name: "ENTSO-E", category: "energy", variant: "energy", icon: "⚡", desc: "AB enerji şebekesi — 35 ülke, gün öncesi fiyatlar", requiresKey: "ENTSOE_API_KEY" },
    { name: "Kandilli Rasathanesi", category: "natural", variant: "weather", icon: "🔴", desc: "Türkiye deprem verileri — Boğaziçi Üniversitesi", requiresKey: null },
    { name: "ESPN Sports", category: "sports", variant: "sports", icon: "⚽", desc: "Canlı skorlar — Premier League, NBA, NFL, MLB", requiresKey: null },
    { name: "Supply Chain DB", category: "cyber", variant: "cyber", icon: "🛡️", desc: "Yazılım tedarik zinciri saldırıları kataloğu", requiresKey: null },
    { name: "Iran Dollar-Toman", category: "finance", variant: "finance", icon: "💱", desc: "İran döviz piyasası — Dolar/Toman, altın", requiresKey: null },
    { name: "EIA", category: "energy", variant: "energy", icon: "🛢️", desc: "ABD petrol, doğalgaz, kömür, elektrik verileri", requiresKey: "EIA_API_KEY" },
    { name: "Crisis Reports", category: "natural", variant: "world", icon: "🆘", desc: "ReliefWeb kriz raporları — sel, deprem, salgın", requiresKey: null },
    { name: "CoinGecko News", category: "finance", variant: "finance", icon: "📰", desc: "Kripto haber aggregator", requiresKey: null },
    { name: "CryptoConvert", category: "finance", variant: "finance", icon: "🔄", desc: "Gerçek zamanlı kripto-fiat dönüşüm", requiresKey: null },
    { name: "Tardis.dev", category: "finance", variant: "finance", icon: "📊", desc: "Kripto likidasyonlar, order book verileri", requiresKey: "TARDIS_API_KEY" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-mono text-sm tracking-widest text-[#00e5ff]">
        NEW DATA SOURCES — 10 KAYNAK EKLENDİ
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {sources.map((s) => {
          const live = liveData[s.name];
          const statusColor = !live ? "#4a4a7a" : live.status === "active" ? "#00ff88" : live.status === "no_data" ? "#ffd000" : "#ff4757";

          return (
            <div
              key={s.name}
              className="rounded-lg border border-[#1a1a40] bg-[#0d0d22] p-4 transition-all hover:border-[#4a4a7a]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <div className="font-mono text-sm font-bold text-[#c8c8e8]">{s.name}</div>
                    <div className="text-xs text-[#4a4a7a]">{s.desc}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className="bg-[#1a1a40] text-[10px] text-[#c8c8e8]">{s.variant}</Badge>
                  {s.requiresKey && (
                    <span className="text-[9px] text-[#ffd000]">KEY: {s.requiresKey}</span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
                <span className="text-[10px]" style={{ color: statusColor }}>
                  {loading ? "Testing..." : !live ? "Not tested" : live.status === "active" ? `Active (${live.count} items)` : live.status === "no_data" ? "Connected, no data" : "Error"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
