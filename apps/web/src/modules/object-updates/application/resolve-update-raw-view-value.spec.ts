import { resolveUpdateRawViewValue } from './resolve-update-raw-view-value';

describe('resolveUpdateRawViewValue', () => {
  it('prefers value_json when both are set', () => {
    expect(
      resolveUpdateRawViewValue({
        value_json: { foo: 1 },
        value_geo: { latitude: 1, longitude: 2 },
      }),
    ).toEqual({ foo: 1 });
  });

  it('returns value_geo when value_json is null', () => {
    expect(
      resolveUpdateRawViewValue({
        value_json: null,
        value_geo: { latitude: 49.28, longitude: -123.12 },
      }),
    ).toEqual({ latitude: 49.28, longitude: -123.12 });
  });

  it('returns null when neither value is set', () => {
    expect(
      resolveUpdateRawViewValue({
        value_json: null,
        value_geo: null,
      }),
    ).toBeNull();
  });
});
