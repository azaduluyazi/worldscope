import { test, expect } from "@playwright/test";

test("homepage loads and shows WorldScope", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=WORLDSCOPE")).toBeVisible({ timeout: 15000 });
});

test("analytics page loads", async ({ page }) => {
  await page.goto("/analytics");
  await expect(page.locator("text=ANALYTICS")).toBeVisible({ timeout: 15000 });
});

test("admin page shows login gate", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.locator("input[type='password']")).toBeVisible({ timeout: 10000 });
});

test("API health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
});
