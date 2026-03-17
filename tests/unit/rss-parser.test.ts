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
  // ── Critical patterns ──
  it("returns critical for breaking news", () => {
    expect(mapSeverity("BREAKING: Nuclear strike launched")).toBe("critical");
    expect(mapSeverity("Breaking news: Major earthquake")).toBe("critical");
  });

  it("returns critical for nuclear/missile threats", () => {
    expect(mapSeverity("Nuclear warhead detonation confirmed")).toBe("critical");
    expect(mapSeverity("Missile launch detected over Pacific")).toBe("critical");
  });

  it("returns critical for mass casualty / terror events", () => {
    expect(mapSeverity("Mass casualty event reported")).toBe("critical");
    expect(mapSeverity("Terrorist attack in downtown area")).toBe("critical");
    expect(mapSeverity("War declared between two nations")).toBe("critical");
  });

  // ── High patterns ──
  it("returns high for emergency/escalation keywords", () => {
    expect(mapSeverity("Emergency declared in coastal region")).toBe("high");
    expect(mapSeverity("Tensions escalating along the border")).toBe("high");
    expect(mapSeverity("Bombing reported near embassy")).toBe("high");
  });

  it("returns high for cyberattack and ransomware", () => {
    expect(mapSeverity("Major cyberattack hits infrastructure")).toBe("high");
    expect(mapSeverity("Ransomware shuts down hospital network")).toBe("high");
  });

  // ── Medium patterns ──
  it("returns medium for conflict/crisis/threat keywords", () => {
    expect(mapSeverity("Ongoing conflict in the region")).toBe("medium");
    expect(mapSeverity("Humanitarian crisis deepens")).toBe("medium");
    expect(mapSeverity("New threat assessment released")).toBe("medium");
  });

  it("returns medium for breach/vulnerability keywords", () => {
    expect(mapSeverity("Data breached at major retailer")).toBe("medium");
    expect(mapSeverity("Critical vulnerability found in Linux kernel")).toBe("medium");
    expect(mapSeverity("Malware campaign targets government agencies")).toBe("medium");
  });

  it("returns medium for sanctions and protests", () => {
    expect(mapSeverity("New sanctions imposed on regime")).toBe("medium");
    expect(mapSeverity("Protesters gather outside parliament")).toBe("medium");
  });

  // ── Low (default) ──
  it("returns low for general news without threat keywords", () => {
    expect(mapSeverity("Trade talks continue in Geneva")).toBe("low");
    expect(mapSeverity("New ambassador appointed to London")).toBe("low");
    expect(mapSeverity("Tourism numbers increase this quarter")).toBe("low");
  });

  // ── DOWNGRADE patterns (two-pass system) ──
  it("downgrades press releases containing threat keywords", () => {
    // "chemical weapon" matches HIGH, but "press release" triggers downgrade
    expect(mapSeverity("Press release: chemical weapons convention update")).not.toBe("critical");
    expect(mapSeverity("Press release: chemical weapons convention update")).not.toBe("high");
  });

  it("downgrades reports and commemorations", () => {
    expect(mapSeverity("OPCW releases landmark report on chemical weapons destruction")).not.toBe("critical");
    expect(mapSeverity("Commemorating 10th anniversary of nuclear disarmament treaty")).not.toBe("critical");
    expect(mapSeverity("Annual report on conflict resolution published")).not.toBe("critical");
  });

  it("downgrades training programs and academic content", () => {
    expect(mapSeverity("Training series on emergency response techniques")).not.toBe("high");
    expect(mapSeverity("Young professionals help bridge the skills gap in cybersecurity")).not.toBe("critical");
  });

  it("downgrades funding/contribution announcements", () => {
    expect(mapSeverity("EU provides €5M to strengthen OPCW activities")).not.toBe("critical");
    expect(mapSeverity("Germany contributes nearly €2M to chemical weapons destruction")).not.toBe("critical");
  });

  it("still allows medium for downgraded items with medium keywords", () => {
    // Downgraded items can still be medium if they match MEDIUM_PATTERNS
    expect(mapSeverity("Annual report on conflict resolution published")).toBe("medium");
  });
});
