import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("homepage loads and shows dashboard", async ({ page }) => {
    await page.goto("/");
    // Dashboard shell should render
    await expect(page.locator("body")).toBeVisible();
    // Should have the skip-to-content link (accessibility)
    await expect(page.locator('a[href="#main-content"]')).toBeAttached();
    // Main content area
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("404 page shows for invalid routes", async ({ page }) => {
    await page.goto("/nonexistent-page-xyz");
    await expect(page.locator("body")).toContainText("404");
  });

  test("country page renders for Turkey", async ({ page }) => {
    await page.goto("/country/tr");
    await expect(page.locator("body")).toContainText("Turkey");
  });

  test("reports page loads", async ({ page }) => {
    await page.goto("/reports");
    // Should have the reports heading or structure
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("API Smoke Tests", () => {
  test("GET /api/intel returns JSON", async ({ request }) => {
    const res = await request.get("/api/intel");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/market returns JSON", async ({ request }) => {
    const res = await request.get("/api/market");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("indices");
  });

  test("GET /api/threat returns JSON", async ({ request }) => {
    const res = await request.get("/api/threat");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("score");
  });

  test("GET /api/feeds/health returns JSON", async ({ request }) => {
    const res = await request.get("/api/feeds/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("timestamp");
  });

  test("GET /sitemap.xml returns XML", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("<urlset");
  });

  test("GET /robots.txt returns text", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain("User-Agent");
  });
});
