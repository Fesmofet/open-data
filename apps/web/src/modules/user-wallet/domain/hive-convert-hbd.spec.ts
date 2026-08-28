import {
  computeEstimatedHbdFromHiveConvert,
  computeImmediateHbdFromHiveConvert,
  deriveHbdPerHiveFromRates,
} from './hive-convert-hbd';

describe('hive-convert-hbd', () => {
  it('derives HBD per HIVE from USD rates', () => {
    expect(deriveHbdPerHiveFromRates(0.4, 1)).toBe(0.4);
    expect(deriveHbdPerHiveFromRates(0, 1)).toBeNull();
  });

  it('computes immediate HBD with half collateral and 5% haircut', () => {
    expect(computeImmediateHbdFromHiveConvert(10, 0.4)).toBeCloseTo(1.9, 10);
  });

  it('computes full HBD To estimate from USD rates', () => {
    expect(computeEstimatedHbdFromHiveConvert(10, 0.4, 1)).toBe(4);
    expect(computeEstimatedHbdFromHiveConvert(10, 0, 1)).toBeNull();
  });
});
