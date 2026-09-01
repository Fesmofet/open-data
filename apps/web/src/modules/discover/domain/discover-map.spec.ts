import {
  discoverBoxToMapBoundingBox,
  discoverBoxesEqual,
  extractDiscoverGeo,
  mapBoundingBoxToDiscoverBox,
} from './discover-map';
import type { DiscoverBox } from './discover-url';

const SAMPLE_BOX: DiscoverBox = { swLng: -123.2, swLat: 49.1, neLng: -123.0, neLat: 49.3 };

describe('discover-map conversions', () => {
  it('maps NE to topPoint and SW to bottomPoint', () => {
    const mapBox = discoverBoxToMapBoundingBox(SAMPLE_BOX);
    expect(mapBox.topPoint).toEqual([-123.0, 49.3]);
    expect(mapBox.bottomPoint).toEqual([-123.2, 49.1]);
    expect(mapBoundingBoxToDiscoverBox(mapBox)).toEqual(SAMPLE_BOX);
  });

  it('treats sub-epsilon drift as equal', () => {
    const a = SAMPLE_BOX;
    const b: DiscoverBox = {
      swLng: a.swLng + 1e-6,
      swLat: a.swLat + 1e-6,
      neLng: a.neLng + 1e-6,
      neLat: a.neLat + 1e-6,
    };
    expect(discoverBoxesEqual(a, b)).toBe(true);
    expect(
      discoverBoxesEqual(a, {
        ...a,
        swLat: a.swLat + 1e-2,
      }),
    ).toBe(false);
  });
});

describe('extractDiscoverGeo', () => {
  it('returns null for missing or invalid geo', () => {
    expect(extractDiscoverGeo({})).toBeNull();
    expect(extractDiscoverGeo({ geo: null })).toBeNull();
    expect(extractDiscoverGeo({ geo: { latitude: '49.1', longitude: -123 } })).toBeNull();
    expect(extractDiscoverGeo({ geo: { latitude: NaN, longitude: -123 } })).toBeNull();
  });

  it('reads finite latitude and longitude', () => {
    expect(extractDiscoverGeo({ geo: { latitude: 49.1, longitude: -123.2 } })).toEqual({
      latitude: 49.1,
      longitude: -123.2,
    });
  });
});
