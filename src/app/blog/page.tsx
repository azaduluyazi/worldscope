import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/db/supabase";
import { AdSenseUnit } from "@/components/ads";

export const revalidate = 600; // ISR: revalidate every 10 min

export const metadata: Metadata = {
  title: "Intelligence Blog — WorldScope",
  description:
    "AI-powered intelligence analysis, weekly threat reports, country spotlights, and geopolitical insights from WorldScope's 570+ verified sources.",
  openGraph: {
    title: "Intelligence Blog — WorldScope",
    description:
      "AI-powered intelligence analysis, weekly threat reports, and geopolitical insights.",
    type: "website",
  },
  alternates: {
    canonical: "https://troiamedia.com/blog",
    types: { "application/rss+xml": "/blog/feed.xml" },
  },
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  lang: string;
  author: string;
  published_at: string;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const db = createServerClient();
    const { data } = await db
      .from("blog_posts")
      .select("slug, title, excerpt, category, tags, lang, author, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(50);
    return data || [];
  } catch {
    return [];
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  intelligence: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  conflict: "bg-red-500/20 text-red-400 border-red-500/30",
  cyber: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  finance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  technology: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  energy: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  health: "bg-green-500/20 text-green-400 border-green-500/30",
  country: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <main className="min-h-screen bg-hud-base text-hud-text">
      {/* Hero */}
      <section className="border-b border-hud-border bg-hud-panel/50 px-6 py-16 text-center">
        <h1 className="font-mono text-3xl font-bold text-hud-accent tracking-wider">
          INTELLIGENCE BLOG
        </h1>
        <p className="mt-3 text-sm text-hud-muted max-w-2xl mx-auto">
          AI-powered intelligence analysis, weekly threat assessments, country
          spotlights, and geopolitical insights from 570+ verified sources.
        </p>
      </section>

      {/* Posts Grid */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-hud-muted font-mono text-sm">
              First intelligence report coming soon...
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-hud-accent hover:underline text-xs font-mono"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block border border-hud-border rounded-md bg-hud-panel/40 p-5 hover:border-hud-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      CATEGORY_COLORS[post.category] ||
                      "bg-hud-accent/20 text-hud-accent border-hud-accent/30"
                    }`}
                  >
                    {post.category.toUpperCase()}
                  </span>
                  {post.lang !== "en" && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-hud-panel border-hud-border text-hud-muted uppercase">
                      {post.lang}
                    </span>
                  )}
                  <span className="text-[10px] text-hud-muted font-mono">
                    {new Date(post.published_at).toLocaleDateString(
                      post.lang === "tr" ? "tr-TR" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                    )}
                  </span>
                </div>
                <h2 className="font-mono text-sm font-semibold text-hud-text group-hover:text-hud-accent transition-colors leading-tight">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 text-xs text-hud-muted line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
                {post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {post.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-mono text-hud-muted bg-hud-base/50 px-1.5 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Ad unit */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <AdSenseUnit slot="8899001122" format="horizontal" className="mt-4" />
      </div>

      {/* SEO content */}
      <section className="sr-only">
        <h2>WorldScope Intelligence Blog</h2>
        <p>
          Read AI-powered intelligence analysis covering global conflicts,
          cybersecurity threats, financial markets, energy geopolitics, and
          country-specific risk assessments. Updated weekly with data from 570+
          verified intelligence sources across 195 countries.
        </p>
      </section>
    </main>
  );
}
