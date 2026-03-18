/**
 * Submarine cable data from public GeoJSON sources.
 * Based on TeleGeography/Infrapedia public data.
 * No API key required.
 */

export interface SubmarineCable {
  id: string;
  name: string;
  length_km: number;
  rfs: string; // Ready for Service year
  owners: string;
  landing_points: Array<{ name: string; lat: number; lng: number }>;
}

// Major strategic submarine cables (curated static dataset)
const MAJOR_CABLES: SubmarineCable[] = [
  {
    id: "sc-1", name: "SEA-ME-WE 6", length_km: 19200, rfs: "2025",
    owners: "China Mobile, Singtel, Telkom Indonesia",
    landing_points: [
      { name: "Singapore", lat: 1.35, lng: 103.82 },
      { name: "Djibouti", lat: 11.59, lng: 43.15 },
      { name: "Marseille", lat: 43.3, lng: 5.37 },
    ],
  },
  {
    id: "sc-2", name: "2Africa", length_km: 45000, rfs: "2024",
    owners: "Meta, MTN, Orange, Vodafone",
    landing_points: [
      { name: "Barcelona", lat: 41.39, lng: 2.17 },
      { name: "Cape Town", lat: -33.92, lng: 18.42 },
      { name: "Mumbai", lat: 19.08, lng: 72.88 },
      { name: "Oman", lat: 23.61, lng: 58.54 },
    ],
  },
  {
    id: "sc-3", name: "PEACE Cable", length_km: 15000, rfs: "2022",
    owners: "PEACE Cable International, Hengtong",
    landing_points: [
      { name: "Karachi", lat: 24.87, lng: 67.01 },
      { name: "Marseille", lat: 43.3, lng: 5.37 },
      { name: "Singapore", lat: 1.35, lng: 103.82 },
    ],
  },
  {
    id: "sc-4", name: "Equiano", length_km: 12000, rfs: "2023",
    owners: "Google",
    landing_points: [
      { name: "Lisbon", lat: 38.72, lng: -9.14 },
      { name: "Lagos", lat: 6.52, lng: 3.38 },
      { name: "Cape Town", lat: -33.92, lng: 18.42 },
    ],
  },
  {
    id: "sc-5", name: "Grace Hopper", length_km: 6400, rfs: "2022",
    owners: "Google",
    landing_points: [
      { name: "New York", lat: 40.71, lng: -74.01 },
      { name: "Bude, UK", lat: 50.83, lng: -4.54 },
      { name: "Bilbao", lat: 43.26, lng: -2.93 },
    ],
  },
  {
    id: "sc-6", name: "Marea", length_km: 6600, rfs: "2018",
    owners: "Microsoft, Meta, Telxius",
    landing_points: [
      { name: "Virginia Beach", lat: 36.85, lng: -75.98 },
      { name: "Bilbao", lat: 43.26, lng: -2.93 },
    ],
  },
  {
    id: "sc-7", name: "JUPITER", length_km: 14000, rfs: "2020",
    owners: "Amazon, Meta, NTT, PLDT, SoftBank",
    landing_points: [
      { name: "Los Angeles", lat: 33.94, lng: -118.41 },
      { name: "Manila", lat: 14.6, lng: 120.98 },
      { name: "Tokyo", lat: 35.69, lng: 139.69 },
    ],
  },
  {
    id: "sc-8", name: "FLAG Europe-Asia", length_km: 28000, rfs: "1997",
    owners: "Reliance Globalcom",
    landing_points: [
      { name: "Porthcurno, UK", lat: 50.04, lng: -5.66 },
      { name: "Mumbai", lat: 19.08, lng: 72.88 },
      { name: "Tokyo", lat: 35.69, lng: 139.69 },
    ],
  },
];

/** Get all major submarine cables */
export function getSubmarineCables(): SubmarineCable[] {
  return MAJOR_CABLES;
}
