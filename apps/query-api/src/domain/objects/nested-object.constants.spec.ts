import { effectiveUpdateTypes, NESTED_OBJECT_UPDATE_TYPES } from './nested-object.constants';

describe('effectiveUpdateTypes', () => {
  it('returns endpoint defaults when requested is undefined', () => {
    expect(effectiveUpdateTypes(undefined, NESTED_OBJECT_UPDATE_TYPES)).toEqual([
      ...NESTED_OBJECT_UPDATE_TYPES,
    ]);
  });

  it('returns endpoint defaults when requested is empty', () => {
    expect(effectiveUpdateTypes([], NESTED_OBJECT_UPDATE_TYPES)).toEqual([
      ...NESTED_OBJECT_UPDATE_TYPES,
    ]);
  });

  it('returns requested types when non-empty', () => {
    expect(effectiveUpdateTypes(['name'], NESTED_OBJECT_UPDATE_TYPES)).toEqual(['name']);
  });
});
