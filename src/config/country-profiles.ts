/**
 * Country-specific editorial profiles rendered server-side on /country/[code].
 *
 * Each profile is ~350-450 words of original prose written for WorldScope,
 * not scraped from Wikipedia or CIA Factbook. Four sections:
 *
 *   - overview:          scale, location, political system (~100 words)
 *   - strategicContext:  why this country matters for global monitoring (~100 words)
 *   - riskProfile:       4-6 bullets of recurring / active risk vectors
 *   - recentFocus:       themes our pipeline has been tracking (~80-100 words)
 *
 * Countries without a profile fall back to the generic template. Adding a
 * new entry is the unit of work for Paket 2 of the 2026-04-22 AdSense
 * remediation — goal is 30-50 profiles across the highest-traffic and
 * most-newsworthy markets before requesting re-review.
 *
 * Keep each field plain text (no markdown). The renderer adds headings and
 * semantic markup. Do not reference specific dated events — profiles are
 * meant to be stable for 6-12 months between edits.
 */

export interface CountryProfile {
  overview: string;
  strategicContext: string;
  riskProfile: string[];
  recentFocus: string;
}

export const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  TR: {
    overview:
      "Turkey spans the Anatolian peninsula and a small but symbolically critical foothold in southeastern Europe, bridging the Black Sea, the Aegean, and the eastern Mediterranean. Its population of roughly 85 million makes it the largest country in its immediate neighborhood, and its economy — heavily industrialized in the northwest, agricultural in the interior, and tourism-driven along the coasts — ranks among the world's twenty largest by nominal output. A parliamentary republic until 2018, Turkey now operates under a strong executive presidency with a unicameral legislature and an increasingly centralized security apparatus.",
    strategicContext:
      "Turkey sits at an uncommon intersection: NATO's second-largest standing army, a customs-union partner of the European Union, an energy corridor between the Caspian and European markets, and an independent regional actor in Syria, Libya, the South Caucasus, and the Horn of Africa. The Bosphorus and Dardanelles give Ankara control over the only maritime access between the Black Sea and the world ocean — a chokepoint that has shaped Russian, Ukrainian, and Mediterranean grain logistics throughout the ongoing war. Few intelligence dashboards can afford to leave Turkey out of their weekly rotation.",
    riskProfile: [
      "Currency and inflation volatility: persistent lira weakness and double-digit CPI print recurring market-moving events.",
      "Cross-border military operations: periodic incursions and airstrikes into northern Syria and Iraq targeting PKK/YPG infrastructure.",
      "Seismic risk: North Anatolian and East Anatolian fault systems place Istanbul, Izmir, and the southeastern provinces in high-hazard zones.",
      "Domestic terrorism: historical activity by PKK, ISIS splinter cells, and DHKP-C, mostly suppressed but episodically active.",
      "Migration pressure: host to the world's largest refugee population, with sensitive re-emigration dynamics toward the EU.",
      "Election and regulatory cycles: frequent reshuffles of central bank leadership and monetary orthodoxy.",
    ],
    recentFocus:
      "Our pipeline has emphasized Turkish cross-border operations in Syria, domestic currency interventions, earthquake recovery infrastructure in the Hatay-Gaziantep corridor, natural gas discovery and distribution in the Black Sea, and defense-industrial export deals — drones in particular — to Central Asia, the Gulf, and sub-Saharan Africa. Opposition-held municipal governance since 2019, especially in Istanbul and Ankara, is also tracked as an independent political signal.",
  },

  US: {
    overview:
      "The United States is a federal constitutional republic of fifty states, a federal district, and assorted territories, spanning roughly 9.8 million square kilometers and home to about 335 million people. It remains the world's largest economy by nominal GDP and hosts the reserve currency of global trade. Political power is distributed across three co-equal branches at the federal level and paralleled by substantial state-level authority, producing a legal and regulatory landscape that can vary dramatically from one jurisdiction to the next.",
    strategicContext:
      "US decisions drive global markets, currency flows, semiconductor supply chains, and the posture of every major military alliance. Federal Reserve policy moves emerging-market debt costs; Treasury sanctions cut off or reconnect entire economies; export controls on advanced chips reshape the industrial strategies of rivals and partners alike. Eleven unified combatant commands project force across every major region, and the US intelligence community's collection apparatus is referenced, explicitly or implicitly, in nearly every serious geopolitical analysis.",
    riskProfile: [
      "Monetary policy transmission: Fed rate decisions cascade through sovereign debt, FX, and commodity markets within minutes.",
      "Political polarization: federal shutdowns, debt-ceiling standoffs, and contested elections raise governance risk premia.",
      "Cyber threat activity: persistent targeting of critical infrastructure, defense contractors, and municipal systems by state and criminal actors.",
      "Extreme weather: hurricanes along the Gulf and Atlantic, tornadoes in the central plains, wildfires in the west, and Arctic cold-air outbreaks.",
      "Gun violence and mass-casualty events: high baseline rate with distinct urban and suburban patterns.",
      "Immigration and border dynamics: ongoing southern-border policy shifts with knock-on effects in Mexico and Central America.",
    ],
    recentFocus:
      "We track Federal Reserve communications, Treasury sanctions actions, CISA and FBI cybersecurity advisories, Department of Defense contract awards, federal election integrity incidents, AI export controls, and the operational tempo of immigration enforcement agencies. Severe weather alerts from NOAA and the National Hurricane Center enter the pipeline in near real time during storm season.",
  },

  GB: {
    overview:
      "The United Kingdom comprises England, Scotland, Wales, and Northern Ireland, plus a globe-spanning network of Crown Dependencies and British Overseas Territories. Its population of roughly 67 million is concentrated in southeastern England, and London remains one of two dominant centers of global finance alongside New York. Governance is a parliamentary constitutional monarchy, with substantial devolved authority to Edinburgh, Cardiff, and Belfast on matters ranging from health policy to taxation.",
    strategicContext:
      "Post-Brexit, the UK has reoriented as an independent trading and regulatory power while remaining deeply integrated into transatlantic intelligence-sharing under the Five Eyes framework. London is a top-tier node for foreign-exchange turnover, commodities trading, maritime insurance, and legal arbitration. British defense commitments span carrier strike group deployments, a continuously-at-sea nuclear deterrent, and forward presence in the Gulf, the Mediterranean, and the Indo-Pacific under the AUKUS partnership.",
    riskProfile: [
      "Financial-sector contagion: City of London exposure to emerging-market debt and energy derivatives.",
      "Northern Ireland protocol frictions: lingering political sensitivity around Irish Sea trade arrangements.",
      "Scottish independence dynamics: periodic resurgence as a constitutional question.",
      "Critical infrastructure cyber risk: sustained targeting of NHS trusts, water utilities, and local councils.",
      "Counter-terrorism: Islamist and far-right threat streams tracked by MI5 at consistently elevated levels.",
      "Energy-price and cost-of-living shocks: heavy reliance on imported gas produces recurring household stress.",
    ],
    recentFocus:
      "Recent tracking has centered on Bank of England rate decisions, Home Office counter-terror arrests, Ministry of Defence Ukraine-aid packages, Serious Fraud Office investigations, sanctions enforcement against Russian-linked UK property and shell entities, and the political arithmetic around the next general election. We also monitor GCHQ and NCSC public advisories whenever they attribute cyber activity to specific threat actors.",
  },

  DE: {
    overview:
      "Germany is a federal parliamentary republic of sixteen states and approximately 84 million people, the largest economy in Europe and the world's third-largest exporter. Its post-war constitutional framework — the Basic Law — emphasizes distributed power, strong judicial review, and constrained executive authority. The industrial heartland stretches from the Ruhr Valley through Baden-Württemberg and Bavaria, anchoring the continent's automotive, chemical, and precision-machinery sectors.",
    strategicContext:
      "German decisions on energy policy, defense spending, and industrial strategy move the entire European Union. The country's Zeitenwende pivot — announced after the 2022 invasion of Ukraine — committed to sustained defense-budget increases, the retirement of Russian pipeline gas, and a reorientation toward LNG and renewables. Berlin's fiscal stance disproportionately shapes eurozone policy debates, and Deutsche Bundesbank positions remain influential within the ECB Governing Council.",
    riskProfile: [
      "Industrial energy costs: post-Nord-Stream gas pricing continues to pressure chemical and glass producers.",
      "Far-right political mobilization: AfD polling and state-election results tracked as a structural trend.",
      "Supply-chain concentration: heavy automotive exposure to Chinese demand and rare-earth inputs.",
      "Cyber threats: BSI advisories on ransomware targeting SMEs and municipal administrations.",
      "Migration integration pressures: Mediterranean and eastern-border arrivals intersect with housing and fiscal strain.",
      "Flooding and extreme precipitation: recurring Ahr Valley-type events across western and southern basins.",
    ],
    recentFocus:
      "We track Bundeswehr procurement decisions, Federal Network Agency gas-storage fill levels, BaFin enforcement actions, domestic counter-extremism arrests by the Federal Prosecutor, Chinese direct-investment screening cases under the Außenwirtschaftsverordnung, and the ongoing recalibration of defense-industrial ties with France, Italy, and the United Kingdom.",
  },

  FR: {
    overview:
      "France is a semi-presidential republic of roughly 68 million people spanning metropolitan Europe and an archipelago of overseas territories — Réunion, French Guiana, French Polynesia, New Caledonia, and others — that together give Paris the world's second-largest exclusive economic zone. The economy combines a dense industrial base (aerospace, defense, luxury, nuclear energy, agri-food) with a sophisticated services and tourism sector. The Fifth Republic concentrates substantial authority in the presidency, balanced by a bicameral legislature and a constitutional council.",
    strategicContext:
      "France is the European Union's only nuclear-weapons state and the sole EU member with a permanent UN Security Council seat. Paris maintains the continent's most expeditionary military, with active deployments and recent interventions across the Sahel, the Levant, the Indo-Pacific, and the Caribbean basin. French diplomatic positioning — on Ukraine, on China, on Africa — often diverges from Washington and London in ways that materially affect EU policy outcomes.",
    riskProfile: [
      "Urban unrest: periodic banlieue riots and national labor strikes with significant economic disruption.",
      "Counter-terrorism: DGSI tracks persistent Islamist and separatist threat streams at high intensity.",
      "Indo-Pacific sovereignty frictions: New Caledonia independence dynamics and regional Chinese pressure.",
      "African redeployment: sequential withdrawals from Mali, Burkina Faso, Niger, Chad — operational and reputational exposure.",
      "Heat and drought: Mediterranean-basin heatwaves with mounting wildfire seasons in the south.",
      "Public-finance strain: structural deficits triggering recurring ratings-agency reviews.",
    ],
    recentFocus:
      "Editorial attention centers on Élysée statements and European Council positioning, DGSE and DGSI public activity, nuclear-operator EDF and Framatome disclosures, Paris-hosted diplomatic summits, Sahel withdrawal logistics, and the domestic political arithmetic across Rassemblement National, the centrist bloc, and the left-wing NUPES coalition.",
  },

  UA: {
    overview:
      "Ukraine is a unitary semi-presidential republic of roughly 38 million people (excluding occupied territories and wartime displacement) covering 603,000 square kilometers — the largest country entirely within Europe. The economy is dominated by agricultural exports (grain, sunflower oil, corn), heavy metallurgy, and a rapidly evolving IT services sector. Governance operates under wartime legal regime, with martial law renewed on rolling cycles since February 2022.",
    strategicContext:
      "Ukraine is the single most consequential active conflict zone in Europe since 1945 and a proving ground for contemporary military doctrine, from maritime drones against the Black Sea Fleet to electronic-warfare adaptations at scale. Outcomes in Kyiv shape NATO posture, European defense budgets, global grain and fertilizer markets, and the political economy of energy across the continent. Any serious intelligence pipeline must maintain a dense Ukrainian feed.",
    riskProfile: [
      "Active conventional warfare: frontline operations across Donetsk, Zaporizhzhia, and Kherson oblasts with daily indicators.",
      "Missile and drone campaigns: sustained targeting of power generation, transmission, and urban infrastructure.",
      "Maritime insurance and grain logistics: Black Sea corridor tension with direct global food-price consequences.",
      "Nuclear safety: Zaporizhzhia NPP occupation and the Chornobyl exclusion zone under active monitoring.",
      "Displacement and humanitarian logistics: internal and cross-border refugee flows and reintegration challenges.",
      "Political cohesion: wartime governance, elections postponed, and anti-corruption enforcement under scrutiny.",
    ],
    recentFocus:
      "Our feed prioritizes General Staff operational updates, Ukrainian Air Force shootdown tallies, IAEA statements on Zaporizhzhia, Western aid-package timing and composition, long-range strike campaigns against Russian refineries, and the drone-production capacity expansion in western oblasts. Russian cross-border incursions into Belgorod and Kursk are cross-referenced.",
  },

  RU: {
    overview:
      "Russia is a federal semi-presidential republic spanning eleven time zones and approximately 144 million people, the largest country on Earth by area. The economy is heavily dependent on hydrocarbon extraction and export — crude oil, natural gas, LNG, coal, refined products — complemented by metals, fertilizers, and an arms-export sector that has been substantially reorganized since 2022. Political power is concentrated in the presidency and an associated security apparatus drawn heavily from the FSB, GRU, and Presidential Administration.",
    strategicContext:
      "Russia remains a nuclear superpower, the world's largest sanctioned economy, a top-three crude producer, and a permanent UN Security Council member. Moscow exercises significant influence across the post-Soviet space, the Middle East (Syria, Iran), parts of Africa (via Wagner and its successor structures), and in global energy markets through OPEC+ coordination. Every major geopolitical dashboard treats Russia as a first-tier coverage priority regardless of ideological framing.",
    riskProfile: [
      "Active war in Ukraine: frontline engagements, mobilization waves, and long-range strike exchanges.",
      "Sanctions evasion and shadow-fleet activity: tracked through vessel transponder anomalies and ship-to-ship transfers.",
      "Internal political risk: opposition suppression, occasional succession speculation, regional elite frictions.",
      "Cyber and influence operations: GRU and FSB-linked activity targeting Western elections, infrastructure, and media.",
      "Domestic terrorism: North Caucasus-linked and ISIS-K-claimed incidents reported with persistent frequency.",
      "Economic bifurcation: parallel-import supply chains, yuan-denominated trade, and inflation management.",
    ],
    recentFocus:
      "Tracking emphasizes Kremlin statements, Ministry of Defence briefings and their Ukrainian counter-claims, Central Bank of Russia policy moves, Rosstat macro data, shadow-fleet tanker movements through the Bosphorus and Danish straits, and Wagner/Africa Corps operational reconfiguration across Mali, CAR, Libya, Sudan, and Burkina Faso.",
  },

  CN: {
    overview:
      "The People's Republic of China is a one-party state of approximately 1.4 billion people and the world's second-largest economy, organized as a unitary republic with twenty-three claimed provinces (including Taiwan, administered separately), five autonomous regions, four municipalities, and two special administrative regions. The Chinese Communist Party exercises authority through parallel state and party structures, with the Politburo Standing Committee as the apex decision-making body. Economic activity ranges from export-oriented coastal manufacturing to inland heavy industry and a rapidly maturing services sector.",
    strategicContext:
      "China is the central counterparty in nearly every significant 21st-century strategic question: semiconductors, rare earths, green-energy supply chains, maritime territorial disputes, Taiwan, digital currency, and the architecture of global development finance. Beijing's Belt and Road Initiative, its DCEP digital-yuan pilot, and the PLA Navy's transition to a blue-water force all carry first-order implications for allied and neutral states alike.",
    riskProfile: [
      "Taiwan Strait tensions: air-defense-identification-zone incursions and recurring military exercises.",
      "Property-sector deleveraging: developer defaults with local-government financing-vehicle spillovers.",
      "Technology decoupling: bidirectional export controls on semiconductors, EDA tools, and AI accelerators.",
      "South China Sea frictions: coast guard and maritime militia confrontations with the Philippines and Vietnam.",
      "Xinjiang and Hong Kong: sustained governance-and-sanctions dynamics with international audit implications.",
      "Industrial cyber activity: MSS and PLA-linked intrusion sets targeting semiconductor, biotech, and aerospace firms.",
    ],
    recentFocus:
      "Editorial priorities include Politburo readouts, PLA Eastern Theater Command exercise announcements, PBOC reserve-requirement moves, State Council fiscal and property-market guidance, China Coast Guard incident reports near Scarborough and Second Thomas Shoals, and outbound FDI flow into Southeast Asia, Mexico, and Eastern Europe as an indirect signal of decoupling pressure.",
  },

  IL: {
    overview:
      "Israel is a parliamentary democracy of roughly 9.7 million people, geographically small but concentrating outsized scientific, military, and economic capacity. The economy is advanced-industrial and technology-intensive, with leadership positions in cybersecurity, defense electronics, agri-tech, and pharmaceuticals. The Knesset operates under a pure proportional-representation system that has produced successive coalition governments across a fragmented political spectrum.",
    strategicContext:
      "Israeli security posture shapes — and is shaped by — conflict and negotiation dynamics across Gaza, the West Bank, southern Lebanon, Syria, and the broader Iranian proxy network stretching from Yemen to Iraq. The country's intelligence services (Mossad, Shin Bet, Aman) operate with global reach, and US-Israeli coordination remains one of the closest bilateral security relationships in the world. Tel Aviv is also a significant node in global technology investment flows.",
    riskProfile: [
      "Multi-front kinetic risk: Gaza operations, West Bank escalation, Hezbollah exchanges, and Iran-backed proxy strikes.",
      "Domestic political volatility: repeated coalition collapses and judicial-reform-era mass protests.",
      "Cyber operations: elevated offensive and defensive activity with both state and non-state counterparties.",
      "Economic and ratings pressure: defense spending and war-time budget reallocations shifting fiscal trajectory.",
      "Regional normalization dynamics: Abraham Accords, Saudi track, and their oscillation with conflict cycles.",
      "Reservist mobilization: periodic call-ups producing measurable private-sector productivity impacts.",
    ],
    recentFocus:
      "Coverage centers on IDF Spokesperson updates, Shin Bet and Mossad disclosures where public, Bank of Israel statements, West Bank settlement-expansion announcements, Red Sea and southern-Lebanon kinetic exchanges, and the parliamentary arithmetic around coalition stability. International Criminal Court and International Court of Justice proceedings are tracked where they intersect with Israeli officials and operations.",
  },

  IR: {
    overview:
      "The Islamic Republic of Iran is a theocratic republic of approximately 89 million people, structured around a dual system in which an elected president and parliament operate under the supervisory authority of the Supreme Leader, the Guardian Council, and the Expediency Discernment Council. The economy is resource-rich — oil, gas, petrochemicals, metals — but persistently constrained by US and multilateral sanctions regimes. The Islamic Revolutionary Guard Corps (IRGC) exercises substantial economic as well as military authority.",
    strategicContext:
      "Iran anchors one of the most consequential proxy networks in the contemporary international system, with capability-transfer relationships sustaining Hezbollah in Lebanon, the Houthi movement in Yemen, Iraqi Shia militias, and Syrian regime forces. Tehran's nuclear program, its ballistic and cruise missile arsenal, and its drone-production capacity — increasingly exported to Russia — make Iran a direct participant in multiple active conflicts even when its own territory is not engaged.",
    riskProfile: [
      "Nuclear escalation: enrichment trajectories tracked against JCPOA baselines and IAEA inspection regimes.",
      "Proxy activation: Hezbollah, Houthi, and Iraqi militia operational tempo with direct maritime-trade impacts.",
      "Internal dissent: periodic protest waves, notably post-2022 Mahsa Amini dynamics, met with significant state response.",
      "Cyber operations: IRGC-linked intrusion sets active against US, Israeli, and Gulf critical infrastructure.",
      "Sanctions enforcement: financial-system isolation, oil-flow rerouting through shadow-fleet vessels, and FATF-related risk.",
      "Succession uncertainty: Supreme Leader succession planning remains opaque and system-shaping.",
    ],
    recentFocus:
      "We track IRGC and Artesh statements, Supreme National Security Council meetings where disclosed, IAEA Board of Governors reports, Central Bank of Iran FX-rate interventions, Strait of Hormuz and Bab el-Mandeb maritime incidents, drone-export flows toward Russia and sub-state clients, and diaspora-diplomacy signals from Vienna, Muscat, and Doha.",
  },

  IN: {
    overview:
      "India is the world's most populous democracy, a federal parliamentary republic of 1.43 billion people spanning twenty-eight states and eight union territories. The economy is the world's fifth-largest by nominal GDP and among the fastest-growing at scale, combining a large agricultural base, an increasingly competitive industrial sector, and a globally dominant IT and business-process services industry. The central government operates from New Delhi; the financial capital is Mumbai.",
    strategicContext:
      "India's non-aligned diplomatic tradition has evolved into what New Delhi calls 'multi-alignment,' allowing simultaneous deepening with the United States under the Quad framework, with Russia for discounted crude and defense supply, with France for Indo-Pacific coordination, and with Israel for technology partnerships. The country is a nuclear power, a permanent Security Council aspirant, and the single largest digital-identity ecosystem in the world via the Aadhaar and UPI stacks.",
    riskProfile: [
      "Line of Actual Control with China: recurring standoffs in Ladakh, Arunachal Pradesh, and Sikkim sectors.",
      "Line of Control with Pakistan: episodic ceasefire breaches and associated Kashmir dynamics.",
      "Maoist (Naxalite) insurgency: persistent activity across the 'Red Corridor' states.",
      "Communal and electoral violence: regionally concentrated incidents, especially during major election cycles.",
      "Cyclones and monsoon extremes: recurring mass-displacement events in Odisha, Bengal, and coastal Andhra.",
      "Air-quality and public-health episodes: seasonal Delhi-NCR crises with measurable macro productivity impact.",
    ],
    recentFocus:
      "Editorial attention is given to Prime Minister's Office readouts, Ministry of External Affairs briefings, RBI monetary-policy decisions, CERT-In cyber advisories, ISRO launch-manifest items, state-election results in key polities (UP, Maharashtra, Tamil Nadu, West Bengal), and ongoing India-China border-management dialogue rounds.",
  },

  JP: {
    overview:
      "Japan is a constitutional monarchy with a parliamentary government of roughly 125 million people, concentrated across a mountainous archipelago of nearly 7,000 islands. The economy is the world's fourth-largest by nominal output, with enduring global leadership in automotive manufacturing, precision machinery, advanced materials, semiconductors (especially equipment and specialty chemicals), and robotics. The Diet is bicameral; the emperor serves a symbolic role under the 1947 Constitution.",
    strategicContext:
      "Tokyo's security posture has quietly transformed over the past decade, with the largest defense-budget increases since the post-war period, counterstrike-capability acquisition, and deepening trilateral coordination with the United States and South Korea. Japan's economic statecraft — supply-chain resilience subsidies, semiconductor onshoring, and strategic export controls — has become a reference point for allied industrial policy. The Bank of Japan's policy trajectory influences global carry trades and bond markets far beyond Japanese borders.",
    riskProfile: [
      "Seismic and volcanic activity: Japan Trench and Nankai Trough events remain among the world's highest-consequence tail risks.",
      "Regional kinetic risk: North Korean ballistic-missile tests over or near Japanese EEZ, Senkaku incursions by Chinese vessels.",
      "Demographic contraction: the steepest among G7 economies, with compounding labor-market and fiscal implications.",
      "Critical-infrastructure cyber threats: nation-state targeting of utilities, defense, and advanced-manufacturing sectors.",
      "Typhoon and flood events: annual impacts on Kyushu, Shikoku, and the Kanto plain.",
      "Energy-import dependence: LNG and crude pricing pass through directly to industrial competitiveness.",
    ],
    recentFocus:
      "Tracking focuses on Kantei (Cabinet Office) statements, MOD defense-budget and posture updates, BoJ policy and yen-intervention signals, METI export-control announcements on semiconductor equipment, China-Coast-Guard Senkaku incident logs, and North Korean missile-test telemetry as reported by Self-Defense Forces and US Indo-Pacific Command.",
  },
};

/** Helper: does this country have an editorial profile? */
export function hasCountryProfile(code: string): boolean {
  return code.toUpperCase() in COUNTRY_PROFILES;
}

/** Helper: fetch profile by ISO code (uppercase). Returns undefined if missing. */
export function getCountryProfile(code: string): CountryProfile | undefined {
  return COUNTRY_PROFILES[code.toUpperCase()];
}
