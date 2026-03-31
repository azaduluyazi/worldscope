"use client";

import { useState } from "react";
import Link from "next/link";

type FormState = "idle" | "submitting" | "success" | "error";

export default function DevelopersPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [website, setWebsite] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/developer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          purpose: purpose.trim(),
          website: website.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFormState("success");
      } else {
        setErrorMsg(data.error || "Something went wrong");
        setFormState("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setFormState("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e0e0e0]">
      {/* Header */}
      <header className="border-b border-[#1a1a2e]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-mono text-lg font-bold tracking-wider text-[#00e5ff]">
            WORLDSCOPE
          </Link>
          <nav className="flex gap-6 text-sm font-mono">
            <Link href="/" className="text-[#8b949e] hover:text-[#00e5ff] transition-colors">
              Dashboard
            </Link>
            <Link href="/about" className="text-[#8b949e] hover:text-[#00e5ff] transition-colors">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 text-xs font-mono bg-[#00e5ff15] text-[#00e5ff] border border-[#00e5ff33] rounded-full mb-6">
            DEVELOPER API
          </div>
          <h1 className="font-mono text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Build with <span className="text-[#00e5ff]">WorldScope</span>
          </h1>
          <p className="text-[#8b949e] text-lg max-w-2xl mx-auto leading-relaxed">
            Access real-time global intelligence data through our REST API. Events, country risk scores,
            conflict data, and more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Left: API Info */}
          <div className="space-y-8">
            {/* Endpoints */}
            <section>
              <h2 className="font-mono text-lg font-bold text-[#00e5ff] mb-4 tracking-wider">
                ENDPOINTS
              </h2>
              <div className="space-y-3">
                <EndpointCard
                  method="GET"
                  path="/api/v1/events"
                  description="Global events feed with category, severity, and country filters"
                />
                <EndpointCard
                  method="GET"
                  path="/api/v1/countries/:code"
                  description="Country risk score, active conflicts, severity breakdown"
                />
              </div>
            </section>

            {/* Authentication */}
            <section>
              <h2 className="font-mono text-lg font-bold text-[#00e5ff] mb-4 tracking-wider">
                AUTHENTICATION
              </h2>
              <div className="bg-[#0d1117] border border-[#1a1a2e] rounded-lg p-4">
                <p className="text-sm text-[#8b949e] mb-3">
                  Include your API key in the Authorization header:
                </p>
                <code className="block bg-[#161b22] border border-[#30363d] rounded px-3 py-2 text-sm text-[#00ff88] font-mono">
                  Authorization: Bearer ws_live_your_key_here
                </code>
              </div>
            </section>

            {/* Rate Limits */}
            <section>
              <h2 className="font-mono text-lg font-bold text-[#00e5ff] mb-4 tracking-wider">
                RATE LIMITS
              </h2>
              <div className="bg-[#0d1117] border border-[#1a1a2e] rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Default limit</span>
                  <span className="font-mono text-[#ffd000]">100 req/hour</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Response format</span>
                  <span className="font-mono text-[#00ff88]">JSON</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8b949e]">Rate limit header</span>
                  <span className="font-mono text-[#c9d1d9]">X-RateLimit-Remaining</span>
                </div>
              </div>
            </section>

            {/* Example Response */}
            <section>
              <h2 className="font-mono text-lg font-bold text-[#00e5ff] mb-4 tracking-wider">
                EXAMPLE RESPONSE
              </h2>
              <pre className="bg-[#0d1117] border border-[#1a1a2e] rounded-lg p-4 text-xs text-[#c9d1d9] overflow-x-auto">
{`{
  "events": [
    {
      "id": "evt_1234",
      "title": "...",
      "category": "conflict",
      "severity": "high",
      "country": "UA",
      "timestamp": "2026-03-31T12:00:00Z",
      "source": "reuters"
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 50
}`}
              </pre>
            </section>
          </div>

          {/* Right: Application Form */}
          <div>
            <div className="bg-[#0d1117] border border-[#1a1a2e] rounded-lg p-8 sticky top-8">
              <h2 className="font-mono text-lg font-bold text-[#00e5ff] mb-2 tracking-wider">
                REQUEST API ACCESS
              </h2>
              <p className="text-sm text-[#8b949e] mb-6">
                Applications are reviewed manually. You will receive an email with your API key upon approval.
              </p>

              {formState === "success" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00ff8815] border border-[#00ff8833] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#00ff88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-mono text-lg font-bold text-[#00ff88] mb-2">APPLICATION SUBMITTED</h3>
                  <p className="text-sm text-[#8b949e]">
                    We will review your application and send your API key to <strong className="text-[#c9d1d9]">{email}</strong> once approved.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-mono text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                      placeholder="Your name or organization"
                      className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2.5 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff33] transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="dev@example.com"
                      className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2.5 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff33] transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Purpose *
                    </label>
                    <textarea
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      required
                      minLength={10}
                      rows={4}
                      placeholder="Describe how you plan to use the WorldScope API (minimum 10 characters)"
                      className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2.5 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff33] transition-colors resize-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Website <span className="text-[#484f58]">(optional)</span>
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://your-project.com"
                      className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2.5 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff33] transition-colors font-mono"
                    />
                  </div>

                  {formState === "error" && errorMsg && (
                    <div className="bg-[#ff475715] border border-[#ff475733] rounded-md px-3 py-2 text-sm text-[#ff4757]">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formState === "submitting"}
                    className="w-full bg-[#00e5ff] hover:bg-[#00d4ee] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0f] font-mono font-bold text-sm py-3 rounded-md transition-colors tracking-wider"
                  >
                    {formState === "submitting" ? "SUBMITTING..." : "SUBMIT APPLICATION"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a2e] mt-24">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-xs font-mono text-[#484f58]">
            WorldScope Developer API &mdash; Real-Time Global Intelligence
          </p>
        </div>
      </footer>
    </div>
  );
}

function EndpointCard({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  return (
    <div className="bg-[#0d1117] border border-[#1a1a2e] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#00ff8815] text-[#00ff88] rounded">
          {method}
        </span>
        <code className="text-sm font-mono text-[#c9d1d9]">{path}</code>
      </div>
      <p className="text-xs text-[#8b949e] mt-1">{description}</p>
    </div>
  );
}
