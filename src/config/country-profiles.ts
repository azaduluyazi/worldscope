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

  BR: {
    overview:
      "Brazil is a federal presidential republic of roughly 215 million people across twenty-six states and a federal district, the largest country in Latin America by every major metric — population, land area, economic output. The economy combines globally significant commodity exports (soy, iron ore, beef, coffee, sugar, orange juice, and increasingly crude oil from pre-salt offshore fields) with a sophisticated financial sector centered in São Paulo and a large, protected domestic industrial base. Brasília hosts all three branches of government; Rio de Janeiro remains the cultural and diplomatic reference point.",
    strategicContext:
      "Brazil anchors BRICS, chairs or co-chairs rotating blocs across the Global South, and exercises outsized influence over Amazon basin climate negotiations that directly shape EU and US trade policy. Its strategic autonomy tradition — simultaneously courting US, Chinese, European, and Russian partners — has made Brazilian diplomacy a bellwether for emerging-market alignment. Petrobras output decisions, BNDES lending policy, and the São Paulo stock exchange (B3) all carry spillover implications across Latin America and the broader commodities complex.",
    riskProfile: [
      "Amazon deforestation and wildfire seasons with direct climate-finance and trade-policy consequences.",
      "Organized-crime violence: PCC and Comando Vermelho operations across prison systems, borders, and coastal ports.",
      "Electoral and institutional frictions: Supreme Federal Tribunal rulings, congressional impeachment cycles.",
      "Currency and fiscal volatility: real weakness recurring alongside debt-path reassessments.",
      "Flooding and landslide events: Rio Grande do Sul, Minas Gerais, and São Paulo peri-urban basins.",
      "Indigenous land-rights conflicts with mining and agribusiness interests in the Legal Amazon.",
    ],
    recentFocus:
      "Editorial attention covers Planalto presidential decrees, Central Bank of Brazil Selic decisions, Petrobras pricing and governance changes, IBAMA enforcement against illegal Amazon activity, Federal Police operations against transnational drug and arms trafficking, Supreme Federal Tribunal rulings on electoral and corruption matters, and COP-adjacent climate diplomacy from Itamaraty.",
  },

  MX: {
    overview:
      "Mexico is a federal presidential republic of approximately 129 million people across thirty-one states and Mexico City, the second-largest economy in Latin America and the top US trading partner by goods volume. Manufacturing is concentrated in the northern border corridor and the Bajío region, with automotive, aerospace, electronics, and medical-device clusters that have absorbed substantial nearshoring investment since 2020. The economy also depends on remittances from a large US-based diaspora and on Pemex crude and refined-product flows.",
    strategicContext:
      "Mexico sits at the center of three interlocking dynamics that matter to North American and global intelligence: the USMCA trade framework, the southern-border migration and narcotics corridor, and the Chinese-automaker nearshoring wave routing into the United States through Mexican plants. Decisions made in Palacio Nacional — on energy-sector nationalism, on judicial reform, on security policy — reshape the strategic calculations of neighboring states and multinational investors.",
    riskProfile: [
      "Cartel violence: CJNG, Sinaloa, and regional factions with homicide rates clustered in Michoacán, Guanajuato, Zacatecas, and the northern border.",
      "Fentanyl and precursor flows: the primary narcotics-related friction point in the US-Mexico bilateral.",
      "Migration surges: northward flows from Central America, Haiti, Venezuela, and beyond produce recurring policy crises.",
      "Energy-sector statism: Pemex and CFE prioritization policies raise contract and ratings risk.",
      "Hurricane and earthquake exposure along Pacific and Gulf coasts and the Trans-Mexican Volcanic Belt.",
      "Judicial-reform and rule-of-law signals: constitutional amendments affecting elected judges and oversight bodies.",
    ],
    recentFocus:
      "We track Palacio Nacional daily mañanera briefings, Banxico monetary decisions, Secretaría de Seguridad cartel-operations updates, INM migration-flow reporting, DEA and US Treasury sanctions actions against Mexican financial targets, Pemex bond and production disclosures, and border-crossing throughput at Laredo, Tijuana, and Ciudad Juárez as a nearshoring-volume proxy.",
  },

  CA: {
    overview:
      "Canada is a federal parliamentary constitutional monarchy of approximately 40 million people spanning ten provinces and three territories across nearly 10 million square kilometers. The economy is commodity-heavy (oil sands, natural gas, uranium, potash, lumber, aluminum, agricultural grains) with a concentrated financial-services sector in Toronto and a technology cluster bridging Toronto, Montreal, Vancouver, and Waterloo. Governance splits significant authority between Ottawa and provincial capitals, especially on health, resource extraction, and taxation.",
    strategicContext:
      "Canadian policy matters globally through three channels: cross-border integration with the United States (making Ottawa an involuntary participant in US-China decoupling), Arctic sovereignty and NORAD modernization at the center of Sino-Russian high-north posturing, and critical-minerals supply security where Canadian reserves of lithium, nickel, cobalt, copper, and uranium are increasingly contested. The Bank of Canada's policy moves cluster with the Fed but diverge on housing-market mechanics that produce distinct fiscal dynamics.",
    riskProfile: [
      "Wildfire seasons: British Columbia, Alberta, and increasingly Quebec with air-quality impacts reaching US northeast.",
      "Housing-market fragility: leverage in Toronto and Vancouver with persistent Bank of Canada attention.",
      "Arctic sovereignty signals: Russian long-range aviation, Chinese Polar Silk Road activity, NATO exercises.",
      "Critical-mineral supply-chain frictions with both Chinese investment screening and US IRA alignment.",
      "Quebec separatism and Indigenous reconciliation as structural political dynamics.",
      "Cyber-intrusion activity: CSE public attributions to Chinese, Russian, and Iranian-linked operators.",
    ],
    recentFocus:
      "Coverage includes PMO statements, Bank of Canada policy decisions, CSIS and CSE public advisories, Department of Finance budget measures on critical minerals and defense, Canadian Armed Forces deployment updates (NATO, Latvia, Indo-Pacific), RCMP national-security enforcement actions, and quarterly provincial-election results in Ontario, Quebec, Alberta, and British Columbia.",
  },

  AU: {
    overview:
      "Australia is a federal parliamentary constitutional monarchy of approximately 27 million people on a continent-sized island of roughly 7.7 million square kilometers. The economy is resource-export dominant (iron ore, LNG, coal, lithium, rare earths, agricultural products) complemented by a large financial-services sector anchored in Sydney and Melbourne and a growing advanced-manufacturing base in defense and space. Governance is split across six states and two self-governing territories, with Canberra as the federal capital.",
    strategicContext:
      "Canberra's strategic gravity has increased sharply with AUKUS, which commits Australia to nuclear-powered submarine acquisition and deep industrial integration with the US and UK defense-industrial bases. Australia's position across the Indian Ocean, South Pacific, and Antarctic approaches gives it outsized influence in three oceanic theaters, and its mineral endowment — especially in lithium, rare earths, and uranium — is central to contested critical-mineral supply chains. Pacific Islands Forum diplomacy is a Chinese-Australian contest zone of first-order importance.",
    riskProfile: [
      "Bushfire and extreme-heat seasons with recurring national-emergency episodes and air-quality impacts.",
      "Cyclone and flood activity across Queensland, Northern Territory, and Western Australia's Pilbara iron-ore corridor.",
      "PRC maritime and airspace interactions in the South China Sea, Taiwan Strait, and Pacific Islands.",
      "Cyber-intrusion campaigns: ASD public attributions targeting government, universities, and critical infrastructure.",
      "Commodity-price volatility: iron ore and LNG revenue concentration produces fiscal and FX sensitivity.",
      "Housing affordability and immigration-intake policy frictions as structural political dynamics.",
    ],
    recentFocus:
      "Tracking priorities include PM&C cabinet statements, RBA policy moves, ASIO public threat assessments, ADF deployment disclosures including Pitch Black and Talisman Sabre exercises, Pacific Islands Forum outcomes, DFAT aid and diplomatic packages to Pacific states, and Australian Signals Directorate cyber advisories. Mining-safety and environmental-approval disputes in the Pilbara are also monitored.",
  },

  KR: {
    overview:
      "South Korea (Republic of Korea) is a unitary presidential republic of approximately 52 million people on the southern half of the Korean Peninsula. The economy is the world's twelfth-largest, built on a chaebol-led industrial base led by Samsung, SK, Hyundai, LG, and Posco across semiconductors, automotive, shipbuilding, petrochemicals, and batteries. Seoul is both the political capital and the financial and technology center; K-pop, film, and television constitute a cultural-export sector with measurable macro effects.",
    strategicContext:
      "Seoul sits on the world's most heavily militarized frontier, across the DMZ from a nuclear-armed North Korea, with 28,500 US Forces Korea personnel stationed under a combined-command structure. South Korean semiconductor capacity — especially Samsung and SK Hynix memory fabs — is a pivotal node in global technology supply chains and the primary stake in US-China export-control contests. Trilateral coordination with the US and Japan has deepened materially since 2023.",
    riskProfile: [
      "North Korean missile and nuclear activity: ballistic, cruise, and hypersonic test cadence tracked continuously.",
      "Cyber threats: Lazarus and Kimsuky clusters active against financial institutions, defense, and cryptocurrency exchanges.",
      "Demographic collapse: lowest total fertility rate globally with compounding fiscal and labor-market stress.",
      "Political polarization: adversarial rotation between progressive and conservative blocs with aggressive prosecutorial cycles.",
      "Export-demand sensitivity: semiconductor cycle and Chinese final-demand dependence.",
      "Typhoon and monsoon flooding events, especially across the Han River basin and Jeju.",
    ],
    recentFocus:
      "We follow Blue House (Yongsan) statements, JCS and Ministry of National Defense briefings on DPRK activity, Bank of Korea policy, FSS and KFTC financial-regulation actions, chaebol governance and capex disclosures, and the US-Korea-Japan trilateral coordination calendar across defense and critical-technology tracks.",
  },

  IT: {
    overview:
      "Italy is a parliamentary republic of approximately 59 million people across twenty regions, the eurozone's third-largest economy and the EU's second-largest manufacturing base. Industrial activity is concentrated in the northern triangle of Milan, Turin, and Genoa, with global leadership in luxury, fashion, machinery, specialty chemicals, and defense; the center and south retain significant agricultural and tourism economies. Rome hosts national government and the Vatican, which itself constitutes a distinct geopolitical actor with global Catholic reach.",
    strategicContext:
      "Italy anchors NATO's southern flank, controls Mediterranean sea lanes that carry a significant share of Europe's LNG and North African hydrocarbon imports, and hosts US Sixth Fleet facilities at Naples and Sigonella. Roman diplomacy has historically bridged European positions with North African, Libyan, and Levantine counterparties, giving Palazzo Chigi a distinctive voice on Mediterranean migration and stabilization policy. The Italian debt market is the third-largest sovereign bond pool in the eurozone and a recurring ECB attention point.",
    riskProfile: [
      "Sovereign-debt and fiscal trajectory: recurring rating-agency and ECB scrutiny.",
      "Mediterranean migration flows: Libyan and Tunisian departure-point dynamics with direct arrival impact.",
      "Seismic and volcanic activity: Apennine fault system, Etna and Stromboli activity, Campi Flegrei unrest.",
      "Organized crime: 'Ndrangheta, Cosa Nostra, and Camorra with extensive cross-border financial footprints.",
      "Political cycle volatility: frequent coalition recomposition with measurable market impact.",
      "Industrial-competitiveness pressures: energy costs and Chinese competition in machinery and automotive.",
    ],
    recentFocus:
      "Coverage centers on Palazzo Chigi press statements, Banca d'Italia financial-stability reports, ECB-relevant Italian bank and sovereign dynamics, Guardia di Finanza and DIA anti-mafia actions, Ministry of Interior migration-landing data, civil-protection earthquake and volcanic advisories, and parliamentary votes on EU and NATO posture.",
  },

  ES: {
    overview:
      "Spain is a parliamentary constitutional monarchy of approximately 48 million people across seventeen autonomous communities with substantial devolved authority, particularly in Catalonia, the Basque Country, Galicia, and Andalusia. The economy is the eurozone's fourth-largest, anchored by tourism, automotive manufacturing, renewable energy (wind and solar), banking (Santander, BBVA), and agricultural exports. Madrid hosts national government and financial markets; Barcelona remains a distinct economic and political center.",
    strategicContext:
      "Spain controls the Strait of Gibraltar together with the UK and Morocco, making it a critical node in Mediterranean-Atlantic maritime flows. The country hosts major US facilities at Rota and Morón, maintains an expeditionary NATO contribution, and exercises significant influence across Latin America through historical, linguistic, and corporate ties — Spanish banks, telecoms, and utilities dominate large-country markets from Mexico to Chile. Madrid is also a primary EU voice on North African stability, the Sahel, and Mediterranean migration.",
    riskProfile: [
      "Catalan and Basque autonomy dynamics: periodic constitutional and electoral crises.",
      "Heat, drought, and wildfire seasons intensifying across the Iberian peninsula.",
      "Migration-landing volume at the Canary Islands, Ceuta, and Melilla.",
      "Energy-transition pressure on traditional industrial sectors including steel and cement.",
      "Sovereign-fiscal dynamics: eurozone recovery-fund execution and ECB coordination.",
      "Separatist-linked political violence: historically significant but now at low operational baseline.",
    ],
    recentFocus:
      "Editorial attention includes Moncloa government statements, Banco de España financial-sector notes, Guardia Civil and National Police counter-terror and anti-trafficking operations, Ministry of Interior migration statistics from the Atlantic and Mediterranean routes, and quarterly regional-election outcomes in Catalonia, the Basque Country, and Andalusia.",
  },

  SA: {
    overview:
      "Saudi Arabia is an absolute monarchy of approximately 36 million people (roughly two-thirds Saudi citizens, the balance expatriate workers) covering most of the Arabian Peninsula. The economy remains dominated by Saudi Aramco and state-directed investment under Vision 2030, which is reshaping non-oil sectors including tourism (Red Sea projects, AlUla, Diriyah), entertainment, renewable energy, mining, and logistics. Governance is concentrated in the royal family and the Crown Prince's Court, with the Public Investment Fund functioning as both sovereign-wealth manager and industrial-policy instrument.",
    strategicContext:
      "Riyadh is the world's largest crude exporter, the swing producer within OPEC+, and a first-order actor in every major Middle Eastern security question including Yemen, Iran, Iraq, and the Abraham Accords / Israel track. US-Saudi security coordination and the diversification of Saudi defense partnerships — expanding toward China and France — shape broader Gulf alignment. Vision 2030 capital deployment by the PIF has become a global market-moving force across sports, technology, gaming, and mining.",
    riskProfile: [
      "Yemen conflict residuals: ceasefire dynamics, cross-border missile and drone risk, Houthi relations.",
      "Iran-Saudi normalization trajectory: fragile diplomatic opening with security-sector interactions.",
      "Oil-price policy calibration via OPEC+ with recurring global market impact.",
      "Mega-project execution risk on NEOM, Red Sea, Qiddiya, and Diriyah with fiscal and timeline pressure.",
      "Hajj and Umrah operational risk: crowd-management and health-event exposure.",
      "Human-rights and press-freedom dynamics shaping Western investment and technology-partnership policy.",
    ],
    recentFocus:
      "Tracking covers Royal Court statements, SAMA (central bank) decisions, Saudi Aramco quarterly disclosures, OPEC+ meeting outcomes, PIF portfolio announcements, Ministry of Defence procurement news, Ministry of Energy LNG and renewable auction results, and the Yemen-related operational environment as reported by the Saudi-led coalition and counterparties.",
  },

  AE: {
    overview:
      "The United Arab Emirates is a federation of seven emirates with approximately 10 million residents, only about 12 percent of whom are Emirati citizens. Abu Dhabi serves as the political and hydrocarbon-revenue capital; Dubai operates as the region's preeminent logistics, finance, tourism, and real-estate hub. The economy has substantially diversified from its hydrocarbon base, with ADNOC and Mubadala financing aggressive investment in AI, semiconductors, renewable energy, and global logistics, while Dubai's free zones host a disproportionate share of Middle East-focused multinational regional headquarters.",
    strategicContext:
      "The UAE runs the most active independent foreign policy in the Gulf, with military and economic footprints stretching from Sudan and Libya through Yemen, the Horn of Africa, and into South Asia. Emirati ports (Jebel Ali, Khalifa) and DP World's global port concessions make the federation a critical maritime logistics node. Abu Dhabi's technology partnerships — including G42's activity in AI compute — have placed the UAE at the intersection of US and Chinese technology-transfer policies, particularly on advanced semiconductors.",
    riskProfile: [
      "Houthi long-range strike capability following the 2022 Abu Dhabi incidents.",
      "Iran proxy activity and Strait of Hormuz chokepoint exposure.",
      "Sudan conflict entanglement: alleged RSF support and humanitarian optics.",
      "Technology-export-control scrutiny on AI compute and semiconductor flows.",
      "Real-estate and expatriate-labor cycle sensitivity in Dubai's economy.",
      "Extreme-heat days and recurring flash-flood events along urban drainage systems.",
    ],
    recentFocus:
      "We track Crown Prince's Court statements, Central Bank of the UAE macro notes, ADNOC and Mubadala announcements, DP World concession and incident reports, G42 and related AI-ecosystem partnerships, Ministry of Foreign Affairs diplomatic statements on Yemen, Sudan, Gaza, and Iran, and hydrographic-services advisories from the Arabian Gulf and Strait of Hormuz.",
  },

  EG: {
    overview:
      "Egypt is a presidential republic of approximately 109 million people, the Arab world's most populous country, concentrated along the Nile Valley and Delta. The economy spans Suez Canal transit revenues, hydrocarbon production (with increasingly significant offshore gas from the Zohr field and adjacent blocks), tourism, agriculture, textiles, and a large public-sector employment footprint. Cairo hosts national government, Arab League headquarters, and Al-Azhar, the most influential Sunni religious institution in the world.",
    strategicContext:
      "Egypt controls the Suez Canal — through which roughly 12 percent of global trade passes — and shares borders with Libya, Sudan, Israel, and Gaza, giving Cairo mediating and interdicting roles in several simultaneous conflicts. The country is the world's second-largest recipient of US military assistance, a central counterparty in any Gaza-related ceasefire architecture, and a key actor in Nile-basin water diplomacy with Ethiopia and Sudan around the Grand Ethiopian Renaissance Dam.",
    riskProfile: [
      "Sinai Peninsula insurgency: Wilayat Sinai and associated groups in the northern Sinai with episodic escalation.",
      "Currency and external-debt stress: IMF program cycles and recurring EGP depreciation.",
      "Gaza spillover: Rafah crossing dynamics, humanitarian corridor management, border-security incidents.",
      "Suez Canal traffic disruption: Houthi-driven Red Sea rerouting with direct canal-revenue impact.",
      "GERD water-security tensions with Ethiopia.",
      "Libyan-border arms and migration flows.",
    ],
    recentFocus:
      "Coverage includes Presidency statements, Central Bank of Egypt FX decisions, Ministry of Petroleum gas-discovery updates, Suez Canal Authority traffic statistics, Egyptian Armed Forces operational bulletins on Sinai and the Libyan border, Ministry of Foreign Affairs Gaza and GERD statements, and IMF Article IV and Extended Fund Facility milestones.",
  },

  ZA: {
    overview:
      "South Africa is a parliamentary republic of approximately 61 million people across nine provinces, with Pretoria as the executive capital, Cape Town as the legislative capital, and Bloemfontein as the judicial capital. The economy is sub-Saharan Africa's most industrialized, with global presence in mining (platinum, gold, coal, manganese, chromium), financial services centered in Johannesburg, and agricultural exports. Governance operates under one of the world's most progressive constitutions, with strong judicial institutions despite significant implementation challenges.",
    strategicContext:
      "Pretoria anchors the African National Congress-led post-apartheid order and chairs rotating leadership across the African Union, BRICS, and regional organizations. South African positioning on Russia-Ukraine, Israel-Gaza, and the International Court of Justice reflects a distinctive non-aligned posture that has measurably diverged from Western consensus. The country's mineral endowment — especially platinum-group metals essential to automotive catalytic converters and emerging hydrogen technologies — gives it disproportionate weight in global critical-mineral discussions.",
    riskProfile: [
      "Energy crisis: Eskom load-shedding cycles with direct GDP impact.",
      "Criminal violence: one of the world's highest homicide rates, concentrated in Cape Town and Gauteng.",
      "ANC political fragmentation: coalition governance and Government of National Unity dynamics.",
      "Currency volatility: rand weakness linked to commodity cycles and fiscal signals.",
      "Xenophobic violence episodes targeting African-immigrant communities.",
      "Water-scarcity crises in Gauteng and episodic 'Day Zero' events in Cape Town.",
    ],
    recentFocus:
      "Editorial attention covers the Presidency's Union Buildings statements, South African Reserve Bank policy decisions, Eskom load-shedding stage updates, SAPS crime-statistics releases, Department of International Relations statements on ICJ and BRICS matters, Chamber of Mines disclosures, and Independent Electoral Commission rolling electoral indicators.",
  },

  NG: {
    overview:
      "Nigeria is a federal presidential republic of approximately 224 million people across thirty-six states and the Federal Capital Territory, the most populous country in Africa and home to the continent's largest economy alongside South Africa. The economy is dominated by hydrocarbon exports from the Niger Delta — though production volumes have declined sharply from historical peaks — complemented by a large agricultural sector, rapidly growing fintech and entertainment industries (Nollywood, Afrobeats), and a significant informal economy. Abuja hosts federal government; Lagos is the financial and cultural capital.",
    strategicContext:
      "Lagos is West Africa's financial gateway, and Nigerian policy shapes ECOWAS decisions across regional security, monetary policy, and the evolving response to Sahel coup governments. Naira policy, OPEC-compatible crude production, and fintech regulation all have cross-border impact. Nigerian demographic weight — half the population under twenty — makes the country a structural pillar of continental development and migration trajectories.",
    riskProfile: [
      "Boko Haram and ISWAP insurgency in the Northeast, particularly Borno, Yobe, and Adamawa.",
      "Banditry and kidnapping across the Northwest and Middle Belt.",
      "Niger Delta oil-theft and pipeline-vandalism affecting crude export volumes.",
      "Biafra-related separatist agitation in the Southeast.",
      "FX and inflation stress: naira depreciation cycles and fuel-subsidy reform aftermath.",
      "Flooding along Niger and Benue River basins during monsoon peaks.",
    ],
    recentFocus:
      "We track Aso Villa presidential statements, Central Bank of Nigeria monetary and FX decisions, NNPCL crude production and refinery disclosures, Nigerian Armed Forces operational updates on insurgency fronts, EFCC anti-corruption actions, SEC fintech-regulation announcements, and National Emergency Management Agency flood and displacement bulletins.",
  },

  PK: {
    overview:
      "Pakistan is a federal parliamentary republic of approximately 240 million people across four provinces and two autonomous territories, the world's fifth-most-populous country and a declared nuclear-weapons state. The economy is agriculture-heavy with growing textile and increasingly IT-services exports, but is structurally constrained by external-sector fragility, recurrent IMF programs, and a large informal economy. Islamabad hosts the federal government; Karachi is the financial and largest urban center; Lahore is the cultural capital of Punjab.",
    strategicContext:
      "Pakistan's strategic importance flows from three vectors: its nuclear arsenal and India-Pakistan deterrence dynamics, its geographic role as a land bridge between China (via the CPEC economic corridor) and the Arabian Sea, and its long entanglement with Afghan stability including the post-2021 Taliban regime next door. The military and ISI wield substantial political and economic authority regardless of civilian-government composition, making Rawalpindi a first-tier intelligence address.",
    riskProfile: [
      "Tehrik-i-Taliban Pakistan (TTP) and Baloch separatist violence, especially in Khyber Pakhtunkhwa and Balochistan.",
      "India-Pakistan border frictions: Line of Control incidents and Kashmir-linked diplomatic cycles.",
      "Taliban-adjacent cross-border security: Afghan refugees, Durand Line tensions, TTP safe havens.",
      "External-financing fragility: IMF program dependence and recurrent reserve crises.",
      "Political-system volatility: civil-military tension, judicial confrontations, PTI-PMLN-PPP dynamics.",
      "Monsoon flooding and glacial-lake outburst events across Indus basin.",
    ],
    recentFocus:
      "Tracking priorities include PM Office and Army House statements, State Bank of Pakistan policy, ISPR military-operations briefings, Ministry of Finance IMF-program milestones, Supreme Court and High Court political rulings, and NDMA flood and displacement bulletins. CPEC project-execution status is monitored as an independent Chinese-relationship indicator.",
  },

  ID: {
    overview:
      "Indonesia is a presidential republic of approximately 278 million people across more than 17,000 islands spanning three time zones — the world's largest archipelagic state, fourth-most-populous country, and the most populous Muslim-majority nation. The economy is Southeast Asia's largest, built on commodity exports (nickel, coal, palm oil, natural gas), a substantial manufacturing base, and a rapidly expanding digital economy. Jakarta has been the administrative capital; the Nusantara capital project aims to shift federal functions to East Kalimantan over the coming decade.",
    strategicContext:
      "Indonesia controls the Malacca, Sunda, and Lombok straits — maritime chokepoints through which roughly a quarter of global trade passes — and anchors ASEAN's diplomatic posture on the South China Sea, Myanmar, and great-power competition. The country's 2020 nickel-ore export ban catalyzed domestic battery and stainless-steel industrial policy that has reshaped global EV supply chains. Jakarta pursues an avowedly non-aligned 'free and active' foreign policy, making it a pivotal swing state in US-China strategic competition.",
    riskProfile: [
      "Seismic and volcanic activity: the country sits on the Pacific Ring of Fire with persistent earthquake and eruption risk.",
      "Natuna and North Natuna Sea incidents with Chinese coast guard and fishing vessels.",
      "Papua region unrest: West Papua independence activity and security-force responses.",
      "Terrorism: Jemaah Islamiyah, JAD, and associated networks at reduced but persistent operational baseline.",
      "Deforestation and peat-fire seasons with transboundary haze effects on Malaysia and Singapore.",
      "Rupiah and external-sector volatility tied to commodity cycles and Fed policy.",
    ],
    recentFocus:
      "Coverage includes Istana Merdeka presidential statements, Bank Indonesia policy, BMKG seismic and volcanic advisories, TNI operational updates on Papua and maritime incidents, Ministry of Energy nickel and coal export-policy announcements, Nusantara capital-transition milestones, and OJK financial-regulatory actions.",
  },

  TH: {
    overview:
      "Thailand is a constitutional monarchy with parliamentary government of approximately 70 million people, Southeast Asia's second-largest economy and a regional manufacturing and tourism hub. The economy spans automotive assembly (especially Japanese OEMs), electronics, agricultural exports (rice, rubber, seafood), and a tourism sector that generates a double-digit GDP share in normal years. Bangkok concentrates political, financial, and cultural activity; the Eastern Economic Corridor around Chonburi and Rayong hosts major industrial zones.",
    strategicContext:
      "Bangkok traditionally balances between the United States (a formal treaty ally) and China (the dominant trade and investment partner), producing a distinct hedging posture within ASEAN. Thailand's position astride mainland Southeast Asia, its porous border with Myanmar, and its influence within ASEAN diplomacy give the country outsized weight in regional security discussions. Military-royal interactions and the 2014 coup legacy continue to shape institutional trajectories.",
    riskProfile: [
      "Deep South insurgency: Patani-related violence across Narathiwat, Yala, and Pattani provinces.",
      "Civil-military political cycles: coups, royal-succession dynamics, lèse-majesté enforcement.",
      "Myanmar-border spillover: refugees, narcotics, and cross-border militia interactions.",
      "Tourism-revenue sensitivity to regional security incidents and Chinese outbound demand.",
      "Flooding and monsoon-season events in Bangkok and the central plain.",
      "Air-quality crises in Chiang Mai and the North during biomass-burning seasons.",
    ],
    recentFocus:
      "Editorial tracking covers Government House statements, Bank of Thailand monetary decisions, Ministry of Defence and ISOC operational updates on the Deep South and Myanmar border, TAT tourism-inflow reporting, SEC capital-markets actions, and Constitutional Court rulings on party-dissolution and political-figure cases.",
  },

  VN: {
    overview:
      "Vietnam is a single-party socialist republic of approximately 100 million people, governed by the Communist Party of Vietnam through a bureaucratic structure centered on the Politburo, Central Committee, and Secretariat. The economy has transformed dramatically since Đổi Mới reforms, with manufacturing-export-led growth concentrated around Ho Chi Minh City in the south and Hanoi-Hai Phong in the north. Vietnam has become a primary beneficiary of China-plus-one supply-chain diversification, particularly in electronics, textiles, and furniture.",
    strategicContext:
      "Hanoi executes a sophisticated 'bamboo diplomacy' that simultaneously upgrades relationships with the United States (now a Comprehensive Strategic Partner), China (a Comprehensive Strategic Cooperative Partnership), Russia, Japan, India, and the European Union. Vietnam's South China Sea disputes with China over the Paracels and Spratlys, coupled with its central role in apparel, electronics, and increasingly semiconductor-packaging supply chains, place Hanoi at the intersection of geopolitical and industrial-policy contests.",
    riskProfile: [
      "South China Sea incidents: Chinese coast guard and survey-vessel activity in Vietnamese-claimed EEZ.",
      "Anti-corruption 'blazing furnace' campaign cycles with executive and provincial leadership turnover.",
      "Tropical storm and flooding exposure across the central coast and Mekong Delta.",
      "Mekong River upstream water-management dependence on Chinese and Laotian dam policy.",
      "US trade-currency monitoring exposure: labeling and tariff risk on bilateral surplus.",
      "Power-supply constraints during industrial growth cycles, periodic production curtailments.",
    ],
    recentFocus:
      "We track Party and Government press releases, State Bank of Vietnam policy, Ministry of Foreign Affairs South China Sea protests, Ministry of Industry and Trade export data, Ministry of National Defence exercise and engagement announcements, and the anti-corruption-campaign leadership changes that repeatedly redistribute political authority.",
  },

  PH: {
    overview:
      "The Philippines is a presidential republic of approximately 117 million people across more than 7,600 islands. The economy is services- and remittance-driven, with substantial BPO and IT-BPM industries, a young population, and growing manufacturing and electronics-assembly sectors. Manila hosts national government; Cebu and Davao are secondary urban centers. The country is a treaty ally of the United States under a Mutual Defense Treaty dating to 1951 and has been reinvigorating that relationship since 2022.",
    strategicContext:
      "Manila has become the sharpest flashpoint in the South China Sea, with repeated China Coast Guard water-cannon and ramming incidents at Second Thomas Shoal and Scarborough Shoal. The 2023 Enhanced Defense Cooperation Agreement expansion added four additional US-accessible sites, and US-Philippine-Japanese trilateral coordination has rapidly formalized. The Philippines also anchors Southeast Asian typhoon and disaster-response operations given the country's annual exposure profile.",
    riskProfile: [
      "South China Sea confrontations with Chinese maritime forces at Ayungin Shoal (Second Thomas), Bajo de Masinloc (Scarborough), and Iroquois Reef.",
      "Mindanao conflict residuals: Bangsamoro Autonomous Region political-transition dynamics and NPA insurgency.",
      "Typhoon season: twenty or more named storms annually with repeated mass-displacement events.",
      "Volcanic activity: Taal, Mayon, and Kanlaon with evacuation-level flare-ups.",
      "Drug-policy and human-rights scrutiny: ICC investigation residuals into the 2016-2022 campaign period.",
      "Peso volatility tied to Fed policy and remittance cycles.",
    ],
    recentFocus:
      "Tracking priorities include Malacañang presidential statements, BSP monetary decisions, Philippine Coast Guard and AFP Western Command disclosures on South China Sea incidents, PAGASA typhoon and PHIVOLCS volcanic bulletins, NDRRMC disaster-response updates, and trilateral US-Japan-Philippines defense announcements.",
  },

  SG: {
    overview:
      "Singapore is a parliamentary republic and city-state of approximately 6 million residents on a main island of roughly 730 square kilometers, one of Southeast Asia's three high-income economies and the region's preeminent financial, logistics, and legal-arbitration center. The economy is built on entrepôt trade, banking (DBS, OCBC, UOB and a deep bench of regional subsidiaries of global banks), petrochemical refining on Jurong Island, semiconductor manufacturing and assembly, and a growing biomedical cluster. The People's Action Party has governed continuously since independence in 1965.",
    strategicContext:
      "Singapore punches vastly above its size in global affairs: its port handles one of the world's highest container throughputs, it hosts the Shangri-La Dialogue as Asia's premier defense forum, and the Monetary Authority of Singapore's policy decisions influence regional FX and capital flows. Singaporean strategic posture relies on a strong bilateral relationship with the United States (including extensive military-access agreements) balanced against deep commercial and regulatory ties to China, producing what successive Prime Ministers have described as a 'rules-based order' emphasis.",
    riskProfile: [
      "Transit-chokepoint exposure: Malacca Strait incident risk, piracy, and maritime-cyber dimensions.",
      "Cross-border haze episodes from Indonesian peat fires.",
      "Malaysian-border water-supply and labor-dependency dynamics.",
      "Cybersecurity incidents against CSA-designated critical information infrastructure.",
      "Regional capital-flow volatility affecting SGD and property markets.",
      "Geopolitical fence-sitting scrutiny: US and Chinese pressure on specific technology and sanctions questions.",
    ],
    recentFocus:
      "We track Prime Minister's Office statements, MAS policy and currency-band adjustments, MINDEF and Shangri-La Dialogue proceedings, Maritime and Port Authority incident reports, CSA and Cyber Security Agency advisories, and the Competition and Consumer Commission's digital-platform enforcement as a regional regulatory bellwether.",
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
