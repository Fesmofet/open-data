import { OblConversionService } from './obl-conversion.service';

describe('OblConversionService', () => {
  it('returns null waiv amount when engine rates are missing', async () => {
    const currency = {
      engineLatestStored: jest.fn().mockResolvedValue(null),
    };
    const service = new OblConversionService(currency as never);

    const result = await service.usdToWaiv({ amountUsd: 10 });

    expect(result).toEqual({
      amountUsd: 10,
      rateUsd: null,
      amountWaiv: null,
    });
  });

  it('converts USD to WAIV using stored rate', async () => {
    const currency = {
      engineLatestStored: jest.fn().mockResolvedValue({ USD: 0.5 }),
    };
    const service = new OblConversionService(currency as never);

    const result = await service.usdToWaiv({ amountUsd: 10 });

    expect(result.rateUsd).toBe(0.5);
    expect(result.amountWaiv).toBe(20);
  });
});
