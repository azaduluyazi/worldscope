import { describe, it, expect } from "vitest";
import { CATEGORY_KEYS } from "@/hooks/useKeyboardShortcuts";

describe("CATEGORY_KEYS", () => {
  it("maps number keys 1-9 to categories", () => {
    expect(Object.keys(CATEGORY_KEYS).length).toBe(9);
    for (let i = 1; i <= 9; i++) {
      expect(CATEGORY_KEYS[String(i)]).toBeTruthy();
    }
  });

  it("maps expected categories", () => {
    expect(CATEGORY_KEYS["1"]).toBe("conflict");
    expect(CATEGORY_KEYS["2"]).toBe("natural");
    expect(CATEGORY_KEYS["3"]).toBe("cyber");
    expect(CATEGORY_KEYS["4"]).toBe("finance");
    expect(CATEGORY_KEYS["5"]).toBe("tech");
    expect(CATEGORY_KEYS["6"]).toBe("health");
    expect(CATEGORY_KEYS["7"]).toBe("energy");
    expect(CATEGORY_KEYS["8"]).toBe("diplomacy");
    expect(CATEGORY_KEYS["9"]).toBe("protest");
  });

  it("all categories are unique", () => {
    const values = Object.values(CATEGORY_KEYS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
