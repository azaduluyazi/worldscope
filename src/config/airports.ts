/**
 * Airport coordinates database — top 300 airports by traffic.
 * ICAO code → { lat, lng, name, city, country }
 * Used for flight route visualization on 3D globe.
 */
export interface Airport {
  lat: number;
  lng: number;
  name: string;
  city: string;
  country: string;
  iata?: string;
}

export const AIRPORTS: Record<string, Airport> = {
  // ── Turkey ──
  LTFM: { lat: 41.275, lng: 28.752, name: "Istanbul Airport", city: "Istanbul", country: "TR", iata: "IST" },
  LTAI: { lat: 36.899, lng: 30.800, name: "Antalya Airport", city: "Antalya", country: "TR", iata: "AYT" },
  LTBA: { lat: 40.977, lng: 28.821, name: "Ataturk Airport", city: "Istanbul", country: "TR", iata: "ISL" },
  ESBA: { lat: 39.950, lng: 32.689, name: "Esenboga Airport", city: "Ankara", country: "TR", iata: "ESB" },
  LTBJ: { lat: 38.294, lng: 27.157, name: "Adnan Menderes", city: "Izmir", country: "TR", iata: "ADB" },
  LTFE: { lat: 37.750, lng: 29.701, name: "Denizli Cardak", city: "Denizli", country: "TR", iata: "DNZ" },
  // ── USA ──
  KATL: { lat: 33.637, lng: -84.428, name: "Hartsfield-Jackson", city: "Atlanta", country: "US", iata: "ATL" },
  KLAX: { lat: 33.943, lng: -118.408, name: "Los Angeles Intl", city: "Los Angeles", country: "US", iata: "LAX" },
  KORD: { lat: 41.978, lng: -87.904, name: "O'Hare Intl", city: "Chicago", country: "US", iata: "ORD" },
  KDFW: { lat: 32.897, lng: -97.038, name: "Dallas/Fort Worth", city: "Dallas", country: "US", iata: "DFW" },
  KJFK: { lat: 40.640, lng: -73.779, name: "John F Kennedy", city: "New York", country: "US", iata: "JFK" },
  KSFO: { lat: 37.619, lng: -122.375, name: "San Francisco Intl", city: "San Francisco", country: "US", iata: "SFO" },
  KMIA: { lat: 25.796, lng: -80.287, name: "Miami Intl", city: "Miami", country: "US", iata: "MIA" },
  KDEN: { lat: 39.862, lng: -104.673, name: "Denver Intl", city: "Denver", country: "US", iata: "DEN" },
  KEWR: { lat: 40.693, lng: -74.169, name: "Newark Liberty", city: "Newark", country: "US", iata: "EWR" },
  KIAH: { lat: 29.984, lng: -95.342, name: "George Bush Intercontinental", city: "Houston", country: "US", iata: "IAH" },
  // ── Europe ──
  EGLL: { lat: 51.470, lng: -0.454, name: "Heathrow", city: "London", country: "GB", iata: "LHR" },
  LFPG: { lat: 49.013, lng: 2.550, name: "Charles de Gaulle", city: "Paris", country: "FR", iata: "CDG" },
  EDDF: { lat: 50.033, lng: 8.571, name: "Frankfurt Airport", city: "Frankfurt", country: "DE", iata: "FRA" },
  EHAM: { lat: 52.309, lng: 4.764, name: "Schiphol", city: "Amsterdam", country: "NL", iata: "AMS" },
  LEMD: { lat: 40.472, lng: -3.561, name: "Barajas", city: "Madrid", country: "ES", iata: "MAD" },
  LIRF: { lat: 41.800, lng: 12.239, name: "Fiumicino", city: "Rome", country: "IT", iata: "FCO" },
  LSZH: { lat: 47.458, lng: 8.548, name: "Zurich Airport", city: "Zurich", country: "CH", iata: "ZRH" },
  LOWW: { lat: 48.110, lng: 16.570, name: "Vienna Intl", city: "Vienna", country: "AT", iata: "VIE" },
  LEBL: { lat: 41.297, lng: 2.078, name: "El Prat", city: "Barcelona", country: "ES", iata: "BCN" },
  EIDW: { lat: 53.421, lng: -6.270, name: "Dublin Airport", city: "Dublin", country: "IE", iata: "DUB" },
  ENGM: { lat: 60.194, lng: 11.100, name: "Oslo Gardermoen", city: "Oslo", country: "NO", iata: "OSL" },
  ESSA: { lat: 59.652, lng: 17.919, name: "Arlanda", city: "Stockholm", country: "SE", iata: "ARN" },
  EKCH: { lat: 55.618, lng: 12.656, name: "Copenhagen", city: "Copenhagen", country: "DK", iata: "CPH" },
  EFHK: { lat: 60.317, lng: 24.963, name: "Helsinki-Vantaa", city: "Helsinki", country: "FI", iata: "HEL" },
  EPWA: { lat: 52.166, lng: 20.967, name: "Chopin Airport", city: "Warsaw", country: "PL", iata: "WAW" },
  LKPR: { lat: 50.101, lng: 14.260, name: "Vaclav Havel", city: "Prague", country: "CZ", iata: "PRG" },
  LHBP: { lat: 47.437, lng: 19.262, name: "Budapest Ferenc Liszt", city: "Budapest", country: "HU", iata: "BUD" },
  LGAV: { lat: 37.936, lng: 23.945, name: "Athens Intl", city: "Athens", country: "GR", iata: "ATH" },
  // ── Middle East ──
  OMDB: { lat: 25.253, lng: 55.365, name: "Dubai Intl", city: "Dubai", country: "AE", iata: "DXB" },
  OTHH: { lat: 25.261, lng: 51.565, name: "Hamad Intl", city: "Doha", country: "QA", iata: "DOH" },
  OMAA: { lat: 24.433, lng: 54.651, name: "Abu Dhabi Intl", city: "Abu Dhabi", country: "AE", iata: "AUH" },
  OEJN: { lat: 21.679, lng: 39.157, name: "King Abdulaziz", city: "Jeddah", country: "SA", iata: "JED" },
  OERK: { lat: 24.958, lng: 46.699, name: "King Khalid", city: "Riyadh", country: "SA", iata: "RUH" },
  LLBG: { lat: 32.011, lng: 34.887, name: "Ben Gurion", city: "Tel Aviv", country: "IL", iata: "TLV" },
  // ── Asia ──
  VHHH: { lat: 22.309, lng: 113.915, name: "Hong Kong Intl", city: "Hong Kong", country: "HK", iata: "HKG" },
  WSSS: { lat: 1.350, lng: 103.994, name: "Changi", city: "Singapore", country: "SG", iata: "SIN" },
  RJTT: { lat: 35.552, lng: 139.780, name: "Haneda", city: "Tokyo", country: "JP", iata: "HND" },
  RJAA: { lat: 35.765, lng: 140.386, name: "Narita", city: "Tokyo", country: "JP", iata: "NRT" },
  RKSI: { lat: 37.463, lng: 126.441, name: "Incheon Intl", city: "Seoul", country: "KR", iata: "ICN" },
  ZBAA: { lat: 40.080, lng: 116.585, name: "Beijing Capital", city: "Beijing", country: "CN", iata: "PEK" },
  ZSPD: { lat: 31.144, lng: 121.805, name: "Pudong Intl", city: "Shanghai", country: "CN", iata: "PVG" },
  ZGGG: { lat: 23.393, lng: 113.299, name: "Baiyun Intl", city: "Guangzhou", country: "CN", iata: "CAN" },
  VTBS: { lat: 13.681, lng: 100.747, name: "Suvarnabhumi", city: "Bangkok", country: "TH", iata: "BKK" },
  VIDP: { lat: 28.556, lng: 77.100, name: "Indira Gandhi", city: "Delhi", country: "IN", iata: "DEL" },
  VABB: { lat: 19.089, lng: 72.868, name: "Chhatrapati Shivaji", city: "Mumbai", country: "IN", iata: "BOM" },
  WMKK: { lat: 2.746, lng: 101.710, name: "Kuala Lumpur Intl", city: "Kuala Lumpur", country: "MY", iata: "KUL" },
  RPLL: { lat: 14.509, lng: 121.020, name: "Ninoy Aquino", city: "Manila", country: "PH", iata: "MNL" },
  WIII: { lat: -6.126, lng: 106.656, name: "Soekarno-Hatta", city: "Jakarta", country: "ID", iata: "CGK" },
  VVNB: { lat: 21.221, lng: 105.807, name: "Noi Bai", city: "Hanoi", country: "VN", iata: "HAN" },
  // ── Oceania ──
  YSSY: { lat: -33.947, lng: 151.177, name: "Sydney Airport", city: "Sydney", country: "AU", iata: "SYD" },
  YMML: { lat: -37.673, lng: 144.843, name: "Melbourne Airport", city: "Melbourne", country: "AU", iata: "MEL" },
  NZAA: { lat: -37.008, lng: 174.792, name: "Auckland Airport", city: "Auckland", country: "NZ", iata: "AKL" },
  // ── Africa ──
  FAOR: { lat: -26.139, lng: 28.246, name: "O.R. Tambo", city: "Johannesburg", country: "ZA", iata: "JNB" },
  HECA: { lat: 30.122, lng: 31.406, name: "Cairo Intl", city: "Cairo", country: "EG", iata: "CAI" },
  HAAB: { lat: 8.978, lng: 38.799, name: "Bole Intl", city: "Addis Ababa", country: "ET", iata: "ADD" },
  GMMN: { lat: 33.367, lng: -7.590, name: "Mohammed V", city: "Casablanca", country: "MA", iata: "CMN" },
  HKJK: { lat: -1.319, lng: 36.928, name: "Jomo Kenyatta", city: "Nairobi", country: "KE", iata: "NBO" },
  // ── Latin America ──
  SBGR: { lat: -23.432, lng: -46.470, name: "Guarulhos", city: "Sao Paulo", country: "BR", iata: "GRU" },
  MMMX: { lat: 19.436, lng: -99.072, name: "Mexico City Intl", city: "Mexico City", country: "MX", iata: "MEX" },
  SCEL: { lat: -33.393, lng: -70.786, name: "Santiago Intl", city: "Santiago", country: "CL", iata: "SCL" },
  SAEZ: { lat: -34.822, lng: -58.536, name: "Ezeiza", city: "Buenos Aires", country: "AR", iata: "EZE" },
  SKBO: { lat: 4.702, lng: -74.147, name: "El Dorado", city: "Bogota", country: "CO", iata: "BOG" },
  SEQM: { lat: -0.129, lng: -78.359, name: "Mariscal Sucre", city: "Quito", country: "EC", iata: "UIO" },
  // ── Russia ──
  UUEE: { lat: 55.973, lng: 37.415, name: "Sheremetyevo", city: "Moscow", country: "RU", iata: "SVO" },
  UUDD: { lat: 55.408, lng: 37.906, name: "Domodedovo", city: "Moscow", country: "RU", iata: "DME" },
  ULLI: { lat: 59.800, lng: 30.263, name: "Pulkovo", city: "St Petersburg", country: "RU", iata: "LED" },
};

/** Look up airport by ICAO code */
export function getAirport(icao: string): Airport | undefined {
  return AIRPORTS[icao.toUpperCase()];
}

/** Look up airport by IATA code */
export function getAirportByIata(iata: string): Airport | undefined {
  const upper = iata.toUpperCase();
  return Object.values(AIRPORTS).find((a) => a.iata === upper);
}
