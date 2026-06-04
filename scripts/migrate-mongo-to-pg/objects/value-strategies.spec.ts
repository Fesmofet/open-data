import { addressStrategy } from './value-strategies';

describe('addressStrategy', () => {
  it('combines Waivio address number and street name into ODL street', () => {
    const result = addressStrategy.transform(
      JSON.stringify({
        address: '11151 ',
        street: 'No. 5 Road',
        city: 'Richmond',
        state: 'British Columbia',
        postalCode: 'V7A 4E8',
        country: 'Canada',
      }),
      'address',
    );

    expect(result).toEqual({
      ok: true,
      value: {
        street: '11151, No. 5 Road',
        locality: 'Richmond',
        postal_code: 'V7A 4E8',
        country: 'Canada',
        state: 'British Columbia',
      },
    });
  });

  it('uses street alone when address is missing', () => {
    const result = addressStrategy.transform(
      JSON.stringify({
        street: 'No. 5 Road',
        city: 'Richmond',
        postalCode: 'V7A 4E8',
        country: 'Canada',
      }),
      'address',
    );

    expect(result).toEqual({
      ok: true,
      value: {
        street: 'No. 5 Road',
        locality: 'Richmond',
        postal_code: 'V7A 4E8',
        country: 'Canada',
      },
    });
  });

  it('uses address alone when street is missing', () => {
    const result = addressStrategy.transform(
      JSON.stringify({
        address: '11151',
        city: 'Richmond',
        postalCode: 'V7A 4E8',
        country: 'Canada',
      }),
      'address',
    );

    expect(result).toEqual({
      ok: true,
      value: {
        street: '11151',
        locality: 'Richmond',
        postal_code: 'V7A 4E8',
        country: 'Canada',
      },
    });
  });
});
