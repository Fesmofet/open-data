import {
  boxCenter,
  extractObjectGeo,
  haversineDistanceKm,
  hasMapEligibleFavoriteTypes,
  mapBoxesEqual,
} from './favorites-map';

describe('favorites-map helpers', () => {
  describe('mapBoxesEqual', () => {
    it('returns true for identical boxes', () => {
      const box = {
        topPoint: [10, 50] as const,
        bottomPoint: [-10, 40] as const,
      };
      expect(mapBoxesEqual(box, box)).toBe(true);
    });

    it('returns true within epsilon', () => {
      expect(
        mapBoxesEqual(
          { topPoint: [1, 2], bottomPoint: [3, 4] },
          { topPoint: [1.00001, 2.00001], bottomPoint: [3.00001, 4.00001] },
        ),
      ).toBe(true);
    });

    it('returns false when boxes differ', () => {
      expect(
        mapBoxesEqual(
          { topPoint: [1, 2], bottomPoint: [3, 4] },
          { topPoint: [5, 6], bottomPoint: [3, 4] },
        ),
      ).toBe(false);
    });
  });

  describe('boxCenter', () => {
    it('averages corners', () => {
      expect(
        boxCenter({
          topPoint: [10, 50],
          bottomPoint: [-10, 30],
        }),
      ).toEqual({ longitude: 0, latitude: 40 });
    });
  });

  describe('haversineDistanceKm', () => {
    it('returns 0 for same point', () => {
      expect(haversineDistanceKm(48.8, 2.3, 48.8, 2.3)).toBe(0);
    });

    it('returns a positive distance for distinct points', () => {
      const km = haversineDistanceKm(48.8566, 2.3522, 51.5074, -0.1278);
      expect(km).toBeGreaterThan(300);
      expect(km).toBeLessThan(400);
    });
  });

  describe('extractObjectGeo', () => {
    it('returns null when geo is missing', () => {
      expect(extractObjectGeo({})).toBeNull();
    });

    it('returns coordinates from geo field', () => {
      expect(
        extractObjectGeo({ geo: { latitude: 45.5, longitude: -73.5 } }),
      ).toEqual({ latitude: 45.5, longitude: -73.5 });
    });

    it('returns null for non-finite coordinates', () => {
      expect(
        extractObjectGeo({ geo: { latitude: Number.NaN, longitude: 1 } }),
      ).toBeNull();
    });
  });

  describe('hasMapEligibleFavoriteTypes', () => {
    it('returns true when a map type is present', () => {
      expect(hasMapEligibleFavoriteTypes(['list', 'restaurant'])).toBe(true);
    });

    it('returns false when no map types match', () => {
      expect(hasMapEligibleFavoriteTypes(['list', 'page'])).toBe(false);
    });
  });
});
