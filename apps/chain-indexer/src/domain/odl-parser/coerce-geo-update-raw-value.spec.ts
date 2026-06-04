import {
  geoPayloadToGeoJsonPoint,
  normalizeGeoPayloadToLatLon,
} from './coerce-geo-update-raw-value';

describe('coerceGeoUpdateRawValue', () => {
  it('parses IPFS restaurant geo payload (flowmaster fixture)', () => {
    const raw = { latitude: 49.774724, longitude: 35.68634 };
    expect(normalizeGeoPayloadToLatLon(raw)).toEqual({
      latitude: 49.774724,
      longitude: 35.68634,
    });
    expect(geoPayloadToGeoJsonPoint(raw)).toEqual({
      type: 'Point',
      coordinates: [35.68634, 49.774724],
    });
  });

  it('accepts GeoJSON Point in value_geo', () => {
    expect(
      geoPayloadToGeoJsonPoint({
        type: 'Point',
        coordinates: [35.68634, 49.774724],
      }),
    ).toEqual({
      type: 'Point',
      coordinates: [35.68634, 49.774724],
    });
  });

  it('parses stringified lat/lon object', () => {
    const raw = '{"latitude":49.774724,"longitude":35.68634}';
    expect(geoPayloadToGeoJsonPoint(raw)?.coordinates).toEqual([
      35.68634, 49.774724,
    ]);
  });
});
