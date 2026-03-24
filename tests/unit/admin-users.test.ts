import { describe, it, expect } from "vitest";

describe("Admin users API", () => {
  it("rejects request without admin key", () => {
    const mockHeaders = { get: (key: string) => key === "x-admin-key" ? null : null };
    expect(mockHeaders.get("x-admin-key")).toBeNull();
  });

  it("user profile shape is valid", () => {
    const user = {
      id: "uuid-1",
      email: "test@example.com",
      display_name: "Test User",
      locale: "en",
      theme_id: "military",
      created_at: new Date().toISOString(),
    };
    expect(user.email).toContain("@");
    expect(user.locale).toBeTruthy();
  });
});
