import type { GeoFormValue } from './update-value-form.utils';

/** Map view before the user picks valid coordinates (Greater Vancouver). */
export const GEO_PICKER_DEFAULT_CENTER = [49.2827, -123.1207] as const;

export const GEO_PICKER_ZOOM = 14;
export const GEO_PICKER_ZOOM_EMPTY = 5;

/** WGS84 pair when both coordinates parse and are in range; otherwise `null`. */
export function parseGeoCoordPair(geo: GeoFormValue): [number, number] | null {
  const lat =
    geo.latitude === '' ? Number.NaN : (parseGeoCoordToken(geo.latitude) ?? Number.NaN);
  const lon =
    geo.longitude === ''
      ? Number.NaN
      : (parseGeoCoordToken(geo.longitude) ?? Number.NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }
  return [lat, lon];
}

/** Six decimal places — enough for map picking without noisy input. */
export function formatGeoCoord(n: number): string {
  return String(Math.round(n * 1_000_000) / 1_000_000);
}

export function geoFormValueFromCoordPair(lat: number, lon: number): GeoFormValue {
  return {
    latitude: formatGeoCoord(lat),
    longitude: formatGeoCoord(lon),
  };
}

/** Parses one coordinate token (dot or comma decimal separator). */
export function parseGeoCoordToken(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.includes(',') && !trimmed.includes('.')
    ? trimmed.replace(',', '.')
    : trimmed.replace(/,/g, '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function splitPastedCoordPair(text: string): [string, string] | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const european = trimmed.match(
    /^(-?\d+),(\d+)\s*,\s*(-?\d+),(\d+)$/,
  );
  if (european) {
    return [`${european[1]},${european[2]}`, `${european[3]},${european[4]}`];
  }

  const semi = trimmed.split(';').map((s) => s.trim());
  if (semi.length === 2 && semi[0] && semi[1]) {
    return [semi[0], semi[1]];
  }

  const commaParts = trimmed.split(',').map((s) => s.trim());
  if (commaParts.length === 2 && commaParts[0] && commaParts[1]) {
    return [commaParts[0], commaParts[1]];
  }

  const whitespace = trimmed.split(/\s+/).filter(Boolean);
  if (whitespace.length === 2) {
    return [whitespace[0], whitespace[1]];
  }

  return null;
}

/**
 * Parses clipboard text like `49.637843, 30.300293` or `49,637843, 30,300293`
 * into latitude/longitude form fields.
 */
export function parsePastedGeoCoordinates(text: string): GeoFormValue | null {
  const parts = splitPastedCoordPair(text);
  if (!parts) {
    return null;
  }
  const lat = parseGeoCoordToken(parts[0]);
  const lon = parseGeoCoordToken(parts[1]);
  if (lat === null || lon === null) {
    return null;
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }
  return geoFormValueFromCoordPair(lat, lon);
}
