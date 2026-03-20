/**
 * IATA → ICAO airline code mapping for flight search.
 * Used to convert user-friendly codes (TK) to OpenSky callsign format (THY).
 * Top 150 airlines by traffic volume.
 */
export const IATA_TO_ICAO: Record<string, string> = {
  // Turkish
  TK: "THY", PC: "PGT", XQ: "SXS", AJ: "ANA",
  // US Majors
  AA: "AAL", DL: "DAL", UA: "UAL", WN: "SWA", B6: "JBU", AS: "ASA", NK: "NKS", F9: "FFT", HA: "HAL", G4: "AAY",
  // European
  BA: "BAW", LH: "DLH", AF: "AFR", KL: "KLM", IB: "IBE", AZ: "ITY", SK: "SAS", AY: "FIN", LX: "SWR", OS: "AUA",
  TP: "TAP", SN: "BEL", LO: "LOT", OK: "CSA", RO: "ROT", BT: "BTI", OU: "CTN", JU: "JAT", W6: "WZZ", FR: "RYR",
  U2: "EZY", VY: "VLG", EW: "EWG", HV: "TRA", DY: "NAX", EI: "EIN", BE: "BEE",
  // Middle East
  EK: "UAE", QR: "QTR", EY: "ETD", SV: "SVA", GF: "GFA", WY: "OMA", RJ: "RJA", LY: "ELY", ME: "MEA", KU: "KAC",
  // Asia
  SQ: "SIA", CX: "CPA", MH: "MAS", TG: "THA", GA: "GIA", VN: "HVN", CZ: "CSN", MU: "CES", CA: "CCA", HU: "CHH",
  NH: "ANA", JL: "JAL", KE: "KAL", OZ: "AAR", CI: "CAL", BR: "EVA", AI: "AIC", UK: "UKA", SG: "SEJ", AK: "AXM",
  PG: "BKP", FD: "AIQ", QZ: "AWQ", JT: "LNI", TR: "TGW", PR: "PAL",
  // Oceania
  QF: "QFA", NZ: "ANZ", JQ: "JST", VA: "VOZ",
  // Africa
  ET: "ETH", SA: "SAA", MS: "MSR", AT: "RAM", KQ: "KQA", WB: "RWD",
  // Latin America
  LA: "LAN", AV: "AVA", CM: "CMP", AM: "AMX", AR: "ARG", G3: "GLO", AD: "AZU",
  // Russia/CIS
  SU: "AFL", S7: "SBI", UT: "UTA", FV: "SDM",
  // Cargo
  FX: "FDX",
};

/** Convert IATA flight number to OpenSky callsign format */
export function iataToCallsign(flightNumber: string): string {
  const cleaned = flightNumber.trim().toUpperCase().replace(/\s+/g, "");
  // Extract airline code (2-3 chars) and flight number
  const match = cleaned.match(/^([A-Z0-9]{2,3})(\d{1,4}[A-Z]?)$/);
  if (!match) return cleaned;

  const [, airline, number] = match;
  const icao = IATA_TO_ICAO[airline];
  if (icao) return `${icao}${number}`;

  // If no IATA mapping, assume it's already ICAO format
  return cleaned;
}
