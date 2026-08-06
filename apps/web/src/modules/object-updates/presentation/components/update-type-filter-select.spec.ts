import {
  filterUpdateTypeOptionsByQuery,
  optionLabelForUpdateType,
  sortUpdateTypeOptionsByLabel,
} from './update-type-filter-select';

describe('sortUpdateTypeOptionsByLabel', () => {
  it('orders options by display label A–Z', () => {
    const options = [
      { value: 'email', label: 'Email' },
      { value: 'address', label: 'Address' },
      { value: 'avatar', label: 'Avatar' },
    ];
    expect(sortUpdateTypeOptionsByLabel(options).map((o) => o.value)).toEqual([
      'address',
      'avatar',
      'email',
    ]);
  });
});

describe('filterUpdateTypeOptionsByQuery', () => {
  const options = [
    { value: 'address', label: 'Address' },
    { value: 'avatar', label: 'Avatar' },
    { value: 'email', label: 'Email' },
  ] as const;

  it('returns all options when query is empty', () => {
    expect(filterUpdateTypeOptionsByQuery(options, '')).toEqual([...options]);
    expect(filterUpdateTypeOptionsByQuery(options, '   ')).toEqual([...options]);
  });

  it('filters by label case-insensitively', () => {
    expect(filterUpdateTypeOptionsByQuery(options, 'addr')).toEqual([options[0]]);
    expect(filterUpdateTypeOptionsByQuery(options, 'EMAIL')).toEqual([
      options[2],
    ]);
  });

  it('falls back to update type id when label is empty', () => {
    expect(
      filterUpdateTypeOptionsByQuery(
        [{ value: 'gallery_album', label: '' }],
        'gallery',
      ),
    ).toEqual([{ value: 'gallery_album', label: '' }]);
    expect(optionLabelForUpdateType({ value: 'gallery_album', label: '' })).toBe(
      'Gallery_album',
    );
  });

  it('does not match internal update_type id when label does not contain query', () => {
    const options = [
      { value: 'address', label: 'Address' },
      { value: 'walletAddress', label: 'Wallet' },
    ];
    expect(filterUpdateTypeOptionsByQuery(options, 'ad')).toEqual([options[0]]);
  });
});
