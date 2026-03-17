import { describe, it, expect } from "vitest";
import { categorizeFeedItem, mapSeverity } from "@/lib/api/rss-parser";

describe("categorizeFeedItem", () => {
  it("detects conflict category from military keywords", () => {
    expect(categorizeFeedItem("NATO troops deploy near border")).toBe("conflict");
    expect(categorizeFeedItem("Missile strike reported overnight")).toBe("conflict");
  });

  it("detects finance category from market keywords", () => {
    expect(categorizeFeedItem("Stock market rallies on Fed announcement")).toBe("finance");
    expect(categorizeFeedItem("Bitcoin surges past $100k")).toBe("finance");
  });

  it("detects cyber category", () => {
    expect(categorizeFeedItem("DDoS breach targets phishing emails")).toBe("cyber");
    expect(categorizeFeedItem("New CVE vulnerability disclosed")).toBe("cyber");
  });

  it("detects tech category", () => {
    expect(categorizeFeedItem("OpenAI announces new AI model")).toBe("tech");
    expect(categorizeFeedItem("NVIDIA unveils next-gen semiconductor chip")).toBe("tech");
  });

  it("detects natural disaster category", () => {
    expect(categorizeFeedItem("Earthquake hits Turkey at magnitude 7.2")).toBe("natural");
    expect(categorizeFeedItem("Hurricane makes landfall in Florida")).toBe("natural");
  });

  it("detects aviation category", () => {
    expect(categorizeFeedItem("FAA grounds all flights after system outage")).toBe("aviation");
  });

  it("detects energy category", () => {
    expect(categorizeFeedItem("OPEC cuts oil production by 2M barrels")).toBe("energy");
  });

  it("detects diplomacy category", () => {
    expect(categorizeFeedItem("Foreign minister meets at embassy for treaty talks")).toBe("diplomacy");
  });

  it("detects protest category", () => {
    expect(categorizeFeedItem("Mass protest erupts in capital city")).toBe("protest");
  });

  it("detects health category", () => {
    expect(categorizeFeedItem("WHO declares new pandemic threat")).toBe("health");
  });

  it("defaults to diplomacy for unclassifiable text", () => {
    expect(categorizeFeedItem("lorem ipsum dolor sit amet")).toBe("diplomacy");
  });
});

describe("mapSeverity", () => {
  it("returns critical for breaking/urgent keywords", () => {
    expect(mapSeverity("BREAKING: Nuclear test detected")).toBe("critical");
    expect(mapSeverity("URGENT: Tsunami warning issued")).toBe("critical");
  });

  it("returns high for alert/emergency keywords", () => {
    expect(mapSeverity("Emergency declared in the region")).toBe("high");
    expect(mapSeverity("Market crash sends shockwaves")).toBe("high");
  });

  it("returns medium for normal text", () => {
    expect(mapSeverity("Trade talks continue in Geneva")).toBe("medium");
    expect(mapSeverity("Quarterly earnings report released")).toBe("medium");
  });
});
