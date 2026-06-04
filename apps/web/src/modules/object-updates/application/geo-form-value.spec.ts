import {
  formatGeoCoord,
  geoFormValueFromCoordPair,
  parseGeoCoordPair,
  parseGeoCoordToken,
  parsePastedGeoCoordinates,
} from './geo-form-value';

describe('geo-form-value', () => {
  it('parseGeoCoordPair accepts valid coordinates', () => {
    expect(parseGeoCoordPair({ latitude: '49.945363', longitude: '35.914822' })).toEqual(
      [49.945363, 35.914822],
    );
  });

  it('parseGeoCoordPair rejects empty or out-of-range values', () => {
    expect(parseGeoCoordPair({ latitude: '', longitude: '10' })).toBeNull();
    expect(parseGeoCoordPair({ latitude: '91', longitude: '0' })).toBeNull();
  });

  it('formatGeoCoord rounds to six decimal places', () => {
    expect(formatGeoCoord(49.945363499)).toBe('49.945363');
  });

  it('geoFormValueFromCoordPair formats both fields', () => {
    expect(geoFormValueFromCoordPair(10.5, 20.25)).toEqual({
      latitude: '10.5',
      longitude: '20.25',
    });
  });

  it('parseGeoCoordPair accepts comma decimal separators', () => {
    expect(
      parseGeoCoordPair({ latitude: '49,637843', longitude: '30,300293' }),
    ).toEqual([49.637843, 30.300293]);
  });

  it('parseGeoCoordToken parses dot and comma decimals', () => {
    expect(parseGeoCoordToken('49.637843')).toBe(49.637843);
    expect(parseGeoCoordToken('49,637843')).toBe(49.637843);
  });

  it('parsePastedGeoCoordinates splits common clipboard formats', () => {
    expect(parsePastedGeoCoordinates('49.637843, 30.300293')).toEqual({
      latitude: '49.637843',
      longitude: '30.300293',
    });
    expect(parsePastedGeoCoordinates('49,637843, 30,300293')).toEqual({
      latitude: '49.637843',
      longitude: '30.300293',
    });
    expect(parsePastedGeoCoordinates('49.637843 30.300293')).toEqual({
      latitude: '49.637843',
      longitude: '30.300293',
    });
  });
});
