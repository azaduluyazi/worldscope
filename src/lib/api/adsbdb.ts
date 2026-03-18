/**
 * ADSBdb — Aircraft registration and type database.
 * Free, no API key required.
 * https://www.adsbdb.com/api
 */

export interface AdsbAircraft {
  type: string;
  icao_type: string;
  manufacturer: string;
  mode_s: string;
  registration: string;
  registered_owner_country_iso_name: string;
  registered_owner_country_name: string;
  registered_owner_operator_flag_code: string;
  registered_owner: string;
  url_photo: string | null;
  url_photo_thumbnail: string | null;
}

export interface AdsbAircraftResponse {
  response: {
    aircraft: AdsbAircraft;
  };
}

export interface AdsbCallsign {
  type: string;
  icao_type: string;
  manufacturer: string;
  mode_s: string;
  registration: string;
  registered_owner: string;
  registered_owner_country_iso_name: string;
  registered_owner_country_name: string;
  url_photo: string | null;
  url_photo_thumbnail: string | null;
}

/**
 * Fetch aircraft data by Mode-S hex code from ADSBdb.
 */
export async function fetchAircraftByModeS(modeS: string): Promise<AdsbAircraft | null> {
  if (!modeS) return null;

  try {
    const res = await fetch(
      `https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(modeS)}`,
      {
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: "application/json",
          "User-Agent": "WorldScope/1.0",
        },
      }
    );
    if (!res.ok) return null;

    const data: AdsbAircraftResponse = await res.json();
    return data.response?.aircraft || null;
  } catch {
    return null;
  }
}

/**
 * Fetch aircraft data by callsign from ADSBdb.
 */
export async function fetchAircraftByCallsign(callsign: string): Promise<AdsbCallsign | null> {
  if (!callsign) return null;

  try {
    const res = await fetch(
      `https://api.adsbdb.com/v0/callsign/${encodeURIComponent(callsign)}`,
      {
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: "application/json",
          "User-Agent": "WorldScope/1.0",
        },
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    return data.response?.flightroute || null;
  } catch {
    return null;
  }
}

/**
 * Fetch aircraft data by registration number from ADSBdb.
 */
export async function fetchAircraftByRegistration(registration: string): Promise<AdsbAircraft | null> {
  if (!registration) return null;

  try {
    const res = await fetch(
      `https://api.adsbdb.com/v0/registration/${encodeURIComponent(registration)}`,
      {
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: "application/json",
          "User-Agent": "WorldScope/1.0",
        },
      }
    );
    if (!res.ok) return null;

    const data: AdsbAircraftResponse = await res.json();
    return data.response?.aircraft || null;
  } catch {
    return null;
  }
}
