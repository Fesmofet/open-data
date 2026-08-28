import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';

import {
  formatProjectedAddress,
  projectedAddressDisplayLine,
} from './object-projected-fields';

function view(fields: Record<string, unknown>): ProjectedObjectView {
  return {
    object_id: 'obj-1',
    object_type: 'restaurant',
    fields,
  } as ProjectedObjectView;
}

describe('formatProjectedAddress', () => {
  it('formats a full structured address', () => {
    expect(
      formatProjectedAddress({
        street: '11151, No. 5 Road',
        locality: 'Richmond',
        state: 'British Columbia',
        postal_code: 'V7A 4E8',
        country: 'Canada',
      }),
    ).toBe('11151, No. 5 Road\nRichmond, British Columbia\nV7A 4E8 Canada');
  });

  it('omits placeholder postal code 0 and keeps real country (hsr-supermarket-leo)', () => {
    expect(
      formatProjectedAddress({
        street: 'On Ruta del Spondylus',
        locality: 'Manglaralto',
        state: 'Santa Elena',
        postal_code: '0',
        country: 'Ecuador',
      }),
    ).toBe('On Ruta del Spondylus\nManglaralto, Santa Elena\nEcuador');
  });

  it('omits Unknown country and placeholder postal (kri-not-bad-advice)', () => {
    expect(
      formatProjectedAddress({
        street: 'Donets-Zakharzhevsky 5',
        locality: 'Kharkiv',
        postal_code: '0',
        country: 'Unknown',
      }),
    ).toBe('Donets-Zakharzhevsky 5\nKharkiv');
  });

  it('omits Unknown locality but keeps real country', () => {
    expect(
      formatProjectedAddress({
        street: 'Main Street 1',
        locality: 'Unknown',
        postal_code: '12345',
        country: 'Canada',
      }),
    ).toBe('Main Street 1\n12345 Canada');
  });
});

describe('projectedAddressDisplayLine', () => {
  it('builds left-rail text from projected address fields', () => {
    expect(
      projectedAddressDisplayLine(
        view({
          address: {
            street: 'Donets-Zakharzhevsky 5',
            locality: 'Kharkiv',
            postal_code: '0',
            country: 'Unknown',
          },
        }),
      ),
    ).toBe('Donets-Zakharzhevsky 5\nKharkiv');
  });
});
