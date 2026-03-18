import { describe, it, expect, vi } from "vitest";
import { validateFeedUrl, classifyFeedStatus, checkFeed, bulkValidate, type FeedValidationResult, type FeedStatus } from "@/lib/validators/feed-validator";

describe("Feed Validator", () => {
  describe("classifyFeedStatus", () => {
    it("healthy on 200 with xml content", () => {
      const result = classifyFeedStatus(200, "application/xml");
      expect(result.status).toBe("healthy");
      expect(result.isValid).toBe(true);
    });

    it("healthy on 200 with rss+xml content", () => {
      const result = classifyFeedStatus(200, "application/rss+xml");
      expect(result.status).toBe("healthy");
    });

    it("healthy on 200 with atom+xml content", () => {
      const result = classifyFeedStatus(200, "application/atom+xml");
      expect(result.status).toBe("healthy");
      expect(result.isValid).toBe(true);
    });

    it("healthy on 200 with text/xml content", () => {
      const result = classifyFeedStatus(200, "text/xml");
      expect(result.status).toBe("healthy");
    });

    it("broken on 404", () => {
      const result = classifyFeedStatus(404, "text/html");
      expect(result.status).toBe("broken");
      expect(result.isValid).toBe(false);
    });

    it("broken on 500", () => {
      const result = classifyFeedStatus(500, "text/html");
      expect(result.status).toBe("broken");
      expect(result.isValid).toBe(false);
    });

    it("broken on 403", () => {
      const result = classifyFeedStatus(403, "text/html");
      expect(result.status).toBe("broken");
      expect(result.isValid).toBe(false);
    });

    it("degraded on 200 with text/html (might be paywall)", () => {
      const result = classifyFeedStatus(200, "text/html");
      expect(result.status).toBe("degraded");
    });

    it("timeout on 408", () => {
      expect(classifyFeedStatus(408, "").status).toBe("timeout");
    });

    it("timeout on 504", () => {
      expect(classifyFeedStatus(504, "").status).toBe("timeout");
    });

    it("timeout on 522", () => {
      expect(classifyFeedStatus(522, "").status).toBe("timeout");
    });

    it("timeout on 524", () => {
      expect(classifyFeedStatus(524, "").status).toBe("timeout");
    });

    it("rate_limited on 429", () => {
      const result = classifyFeedStatus(429, "");
      expect(result.status).toBe("rate_limited");
      expect(result.isValid).toBe(true);
    });

    it("unknown on 301 redirect", () => {
      const result = classifyFeedStatus(301, "");
      expect(result.status).toBe("unknown");
      expect(result.isValid).toBe(false);
    });

    it("includes httpStatus and contentType in result", () => {
      const result = classifyFeedStatus(200, "application/xml; charset=utf-8");
      expect(result.httpStatus).toBe(200);
      expect(result.contentType).toBe("application/xml; charset=utf-8");
    });
  });

  describe("validateFeedUrl", () => {
    it("should block SSRF attempts", () => {
      expect(() => validateFeedUrl("http://127.0.0.1/rss")).toThrow("SSRF");
      expect(() => validateFeedUrl("http://localhost/rss")).toThrow("SSRF");
      expect(() => validateFeedUrl("http://169.254.169.254/")).toThrow("SSRF");
      expect(() => validateFeedUrl("http://192.168.1.1/rss")).toThrow("SSRF");
      expect(() => validateFeedUrl("http://10.0.0.1/rss")).toThrow("SSRF");
      expect(() => validateFeedUrl("http://172.16.0.1/rss")).toThrow("SSRF");
      expect(() => validateFeedUrl("http://[::1]/rss")).toThrow("SSRF");
      expect(() => validateFeedUrl("https://app.internal/rss")).toThrow("SSRF");
      expect(() => validateFeedUrl("https://service.local/rss")).toThrow("SSRF");
    });

    it("should accept valid external URLs", () => {
      expect(() => validateFeedUrl("https://feeds.reuters.com/reuters/worldNews")).not.toThrow();
      expect(() => validateFeedUrl("https://www.bbc.co.uk/news/rss.xml")).not.toThrow();
      expect(() => validateFeedUrl("https://rss.nytimes.com/services/xml/rss/nyt/World.xml")).not.toThrow();
      expect(() => validateFeedUrl("http://feeds.bbci.co.uk/news/world/rss.xml")).not.toThrow();
    });

    it("should reject non-http protocols", () => {
      expect(() => validateFeedUrl("ftp://example.com/rss")).toThrow("Invalid protocol");
      expect(() => validateFeedUrl("file:///etc/passwd")).toThrow("Invalid protocol");
    });

    it("should reject invalid URLs", () => {
      expect(() => validateFeedUrl("not-a-url")).toThrow("Invalid URL");
      expect(() => validateFeedUrl("")).toThrow("Invalid URL");
    });
  });

  describe("checkFeed", () => {
    it("returns healthy result for valid XML feed", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "application/rss+xml" }),
      });

      const result = await checkFeed("https://feeds.reuters.com/reuters/worldNews");
      expect(result.status).toBe("healthy");
      expect(result.isValid).toBe(true);
      expect(result.responseTimeMs).toBeDefined();
      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("returns timeout on fetch error (abort/network)", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("AbortError"));

      const result = await checkFeed("https://feeds.reuters.com/reuters/worldNews");
      expect(result.status).toBe("timeout");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("AbortError");
    });

    it("throws on SSRF attempt", async () => {
      await expect(checkFeed("http://127.0.0.1/rss")).rejects.toThrow("SSRF");
    });

    it("returns broken for 404", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 404,
        headers: new Headers({ "content-type": "text/html" }),
      });

      const result = await checkFeed("https://example.com/dead-feed");
      expect(result.status).toBe("broken");
    });
  });

  describe("bulkValidate", () => {
    it("validates multiple URLs concurrently", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers({ "content-type": "application/xml" }),
      });

      const urls = [
        "https://feeds.reuters.com/reuters/worldNews",
        "https://www.bbc.co.uk/news/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
      ];

      const results = await bulkValidate(urls, 2);
      expect(results.size).toBe(3);
      for (const url of urls) {
        expect(results.has(url)).toBe(true);
        expect(results.get(url)!.status).toBe("healthy");
      }
    });

    it("handles mixed results", async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            status: 200,
            headers: new Headers({ "content-type": "application/rss+xml" }),
          });
        }
        return Promise.resolve({
          status: 404,
          headers: new Headers({ "content-type": "text/html" }),
        });
      });

      const results = await bulkValidate([
        "https://feeds.reuters.com/reuters/worldNews",
        "https://example.com/dead-feed",
      ], 2);

      expect(results.size).toBe(2);
      expect(results.get("https://feeds.reuters.com/reuters/worldNews")!.status).toBe("healthy");
      expect(results.get("https://example.com/dead-feed")!.status).toBe("broken");
    });

    it("returns empty map for empty input", async () => {
      const results = await bulkValidate([]);
      expect(results.size).toBe(0);
    });
  });

  describe("type exports", () => {
    it("FeedValidationResult has expected shape", () => {
      const result: FeedValidationResult = {
        status: "healthy",
        isValid: true,
        httpStatus: 200,
        contentType: "application/xml",
        responseTimeMs: 150,
      };
      expect(result.status).toBe("healthy");
    });

    it("FeedStatus type covers all statuses", () => {
      const statuses: FeedStatus[] = ["healthy", "broken", "degraded", "timeout", "rate_limited", "unknown"];
      expect(statuses).toHaveLength(6);
    });
  });
});
