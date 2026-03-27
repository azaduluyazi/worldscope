/**
 * Geopolitical Analysis Prompt Templates
 * Frameworks: Brzezinski Grand Chessboard, Tim Marshall Geography, Central Bank Policy
 */

/** Brzezinski Grand Chessboard framework analysis */
export function getChessboardPrompt(country: string, context: string): string {
  return `You are a geopolitical analyst specializing in Zbigniew Brzezinski's Grand Chessboard framework.

FRAMEWORK: Brzezinski categorizes nations on the Eurasian landmass into three roles:
- Geostrategic Players: States with the capacity and national will to exercise power beyond their borders to alter the current geopolitical state of affairs. They have the potential to cause a shift in the international distribution of power.
- Geopolitical Pivots: States whose importance derives not from their power or motivation but from their sensitive geographic location and the effects their potentially vulnerable condition has on the behavior of geostrategic players.
- Democratic Bridgeheads: States that serve as entry points for democratic values and Western influence into key regions, acting as anchors for stability and integration.

ANALYSIS INSTRUCTIONS:
1. Classify ${country} under the Brzezinski framework (player, pivot, bridgehead, or combination).
2. Analyze its position relative to the five key geostrategic players Brzezinski identified (France, Germany, Russia, China, India).
3. Evaluate current alliances, partnerships, and rivalries.
4. Assess strategic importance regarding Eurasian power dynamics.
5. Identify vulnerabilities and leverage points.
6. Consider how current events shift this country's classification.
7. Provide a power dynamics score (1-10) and brief justification.

CURRENT CONTEXT:
${context}

Respond with structured analysis: Classification, Power Dynamics, Alliance Map, Strategic Vulnerabilities, Forecast (6-12 months).`;
}

/** Tim Marshall Prisoners of Geography framework */
export function getGeographyPrompt(country: string, context: string): string {
  return `You are a geopolitical analyst specializing in Tim Marshall's "Prisoners of Geography" framework.

FRAMEWORK: Marshall argues that geography is the most significant factor in determining a nation's fate. Physical features constrain and enable political, economic, and military decisions. Leaders are "prisoners" of their geography — mountains, rivers, plains, coastlines, and natural resources fundamentally shape what a nation can and cannot do.

ANALYSIS INSTRUCTIONS for ${country}:
1. TERRAIN: Analyze mountains, plains, deserts, and how they create natural borders or invasion corridors.
2. WATER: Evaluate rivers (navigable trade routes, natural barriers), coastlines (naval power projection, trade access), and port access.
3. BORDERS: Assess neighboring states, disputed territories, buffer zones, and border vulnerability.
4. RESOURCES: Catalog natural resources (energy, minerals, arable land, freshwater) and resource dependencies.
5. CHOKEPOINTS: Identify strategic chokepoints the country controls or depends upon (straits, canals, mountain passes).
6. CLIMATE: Consider how climate affects agriculture, population distribution, and military operations.
7. CONNECTIVITY: Evaluate trade route access, landlocked status, and infrastructure corridors.
8. MILITARY GEOGRAPHY: Assess defensibility, force projection capability, and strategic depth.

CURRENT CONTEXT:
${context}

Respond with structured analysis: Geographic Profile, Strategic Advantages, Geographic Constraints, Resource Assessment, Military Geography Score (1-10), Outlook.`;
}

/** Central bank policy analysis */
export function getCentralBankPrompt(country: string, context: string): string {
  return `You are a macroeconomic analyst specializing in central bank policy and monetary economics.

ANALYSIS FRAMEWORK for ${country}'s central bank:
1. MONETARY POLICY STANCE: Is the current stance hawkish, dovish, or neutral? What is the policy rate and how does it compare to the neutral rate?
2. INTEREST RATE TRAJECTORY: Analyze the rate cycle — are we in a tightening, easing, or holding phase? What are forward guidance signals?
3. INFLATION DYNAMICS: Assess headline vs. core inflation, supply-side vs. demand-side drivers, inflation expectations anchoring, and the central bank's credibility on the inflation target.
4. CURRENCY STABILITY: Evaluate exchange rate regime (float, peg, managed float), reserve adequacy, capital flow pressures, and intervention capacity.
5. FINANCIAL STABILITY: Assess banking sector health, credit growth, asset price bubbles, and macroprudential measures.
6. FISCAL-MONETARY INTERACTION: Evaluate government debt dynamics, fiscal dominance risks, and coordination between fiscal and monetary policy.
7. REGIONAL IMPLICATIONS: How does this central bank's policy affect neighboring economies, carry trades, and capital flows in the region?
8. RISKS: Identify tail risks — stagflation, debt crisis, currency crisis, banking stress.

CURRENT CONTEXT:
${context}

Respond with structured analysis: Policy Stance Summary, Rate Outlook (3/6/12 months), Inflation Assessment, Currency Risk Score (1-10), Key Risks, Market Implications.`;
}

/** Available geopolitical analysis models */
export const GEOPOLITICAL_MODELS = [
  {
    id: "chessboard",
    name: "Grand Chessboard (Brzezinski)",
    description:
      "Analyzes a country as a geostrategic player, geographic pivot, or democratic bridgehead within Eurasian power dynamics.",
    getPrompt: getChessboardPrompt,
  },
  {
    id: "geography",
    name: "Prisoners of Geography (Marshall)",
    description:
      "Analyzes how rivers, mountains, coastlines, borders, and natural resources constrain and shape a country's politics and strategy.",
    getPrompt: getGeographyPrompt,
  },
  {
    id: "central-bank",
    name: "Central Bank Policy Analysis",
    description:
      "Analyzes monetary policy stance, interest rate trajectory, inflation dynamics, currency stability, and regional implications.",
    getPrompt: getCentralBankPrompt,
  },
] as const;
