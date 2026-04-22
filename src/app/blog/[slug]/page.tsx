import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/db/supabase";
import { AdSenseUnit } from "@/components/ads";
import { AD_PLACEMENTS } from "@/config/ads";

// Skip build prerender — same pattern as /blog. Supabase query has hit
// the 60s build worker ceiling under concurrent generation; dynamic
// render + ISR caching after first request.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  tags: string[];
  author: string;
  published_at: string;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const db = createServerClient();
    const { data } = await db
      .from("blog_posts")
      .select("slug, title, excerpt, content, category, tags, author, published_at")
      .eq("slug", slug)
      .eq("published", true)
      .single();
    if (!data) return null;
    return {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      tags: data.tags ?? [],
      author: data.author,
      published_at: data.published_at ?? new Date().toISOString(),
    };
  } catch (err) {
    console.error("[blog/getPost]", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found — WorldScope" };

  return {
    title: `${post.title} — WorldScope Blog`,
    description: post.excerpt || `${post.title} — Intelligence analysis from WorldScope.`,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      type: "article",
      publishedTime: post.published_at,
      authors: [post.author],
      tags: post.tags,
    },
    keywords: [
      ...post.tags,
      post.category,
      "intelligence analysis",
      "OSINT",
      "WorldScope",
      "geopolitics",
      "threat assessment",
      "global intelligence blog",
      "istihbarat analizi",
    ],
    alternates: {
      canonical: `https://troiamedia.com/blog/${slug}`,
    },
  };
}

/** JSON-LD Article schema for rich snippets */
function ArticleJsonLd({ post }: { post: BlogPost }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.title,
    author: {
      "@type": "Person",
      name: post.author,
      url: "https://troiamedia.com/about",
    },
    publisher: {
      "@type": "Organization",
      name: "WorldScope",
      url: "https://troiamedia.com",
      logo: {
        "@type": "ImageObject",
        url: "https://troiamedia.com/icon-512.png",
      },
    },
    datePublished: post.published_at,
    mainEntityOfPage: `https://troiamedia.com/blog/${post.slug}`,
    keywords: post.tags.join(", "),
    articleSection: post.category,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <>
      <ArticleJsonLd post={post} />
      <main className="min-h-screen bg-hud-base text-hud-text">
        {/* Header */}
        <article className="max-w-3xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <nav className="text-[10px] font-mono text-hud-muted mb-6">
            <Link href="/" className="hover:text-hud-accent">
              Home
            </Link>
            {" / "}
            <Link href="/blog" className="hover:text-hud-accent">
              Blog
            </Link>
            {" / "}
            <span className="text-hud-text">{post.category}</span>
          </nav>

          {/* Title */}
          <header>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-hud-accent/20 text-hud-accent border-hud-accent/30">
                {post.category.toUpperCase()}
              </span>
              <time
                dateTime={post.published_at}
                className="text-[10px] font-mono text-hud-muted"
              >
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span className="text-[10px] font-mono text-hud-muted">
                by {post.author}
              </span>
            </div>
            <h1 className="font-mono text-2xl font-bold text-hud-text leading-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-3 text-sm text-hud-muted leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Content — rendered as markdown-like HTML */}
          <div
            className="mt-8 prose prose-invert prose-sm max-w-none
              prose-headings:font-mono prose-headings:text-hud-accent
              prose-a:text-hud-accent prose-a:no-underline hover:prose-a:underline
              prose-code:bg-hud-panel prose-code:text-hud-accent prose-code:px-1 prose-code:rounded
              prose-strong:text-hud-text
              prose-li:text-hud-muted
              leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-hud-border">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono text-hud-muted bg-hud-panel border border-hud-border px-2 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ad unit */}
          <AdSenseUnit
            slot={AD_PLACEMENTS.blog[1].slot!}
            format={AD_PLACEMENTS.blog[1].format as "horizontal"}
            className="mt-8"
          />

          {/* Back link */}
          <div className="mt-8">
            <Link
              href="/blog"
              className="text-xs font-mono text-hud-accent hover:underline"
            >
              &larr; All Posts
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
