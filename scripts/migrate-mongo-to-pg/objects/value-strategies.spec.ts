import { addressStrategy, transformTelephoneFromField } from './value-strategies';
import type { MongoWObjectField } from './types';

describe('transformTelephoneFromField', () => {
  const base: MongoWObjectField = { name: 'phone' };

  it('maps number to value and body to title', () => {
    expect(
      transformTelephoneFromField('telephone', {
        ...base,
        body: 'Телефон',
        number: '+1 604-423-3447',
      }),
    ).toEqual({
      ok: true,
      value: { value: '+1 604-423-3447', title: 'Телефон' },
    });
  });

  it('maps number only without title when body is empty', () => {
    expect(
      transformTelephoneFromField('telephone', {
        ...base,
        body: '',
        number: '+1 604-423-3447',
      }),
    ).toEqual({
      ok: true,
      value: { value: '+1 604-423-3447' },
    });
  });

  it('falls back body to value when number is missing', () => {
    expect(
      transformTelephoneFromField('telephone', {
        ...base,
        body: '+58 212-555-0100',
      }),
    ).toEqual({
      ok: true,
      value: { value: '+58 212-555-0100' },
    });
  });

  it('returns null for non-telephone update types', () => {
    expect(transformTelephoneFromField('email', { ...base, number: '1' })).toBeNull();
  });

  it('fails when number and body are empty', () => {
    expect(transformTelephoneFromField('telephone', { ...base, body: '', number: '' })).toEqual({
      ok: false,
      reason: 'telephone: missing number and body',
    });
  });
});

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
