import {
  applySliderPercent,
  equalSplitPercents,
  mergeJsonMetadataWithObjects,
  parseLinkedObjectsFromJsonMetadata,
  remainingPercentWeight,
  validateLinkedObjectPercents,
  withEqualPercents,
} from './post-editor-objects-metadata';

describe('equalSplitPercents', () => {
  it('splits 100 across three items', () => {
    expect(equalSplitPercents(3)).toEqual([34, 33, 33]);
  });

  it('returns single 100', () => {
    expect(equalSplitPercents(1)).toEqual([100]);
  });
});

describe('withEqualPercents', () => {
  it('assigns equal weights', () => {
    const out = withEqualPercents([
      { objectId: 'a', percent: 0 },
      { objectId: 'b', percent: 0 },
    ]);
    expect(out).toEqual([
      { objectId: 'a', percent: 50 },
      { objectId: 'b', percent: 50 },
    ]);
  });
});

describe('applySliderPercent', () => {
  it('allows a single object below 100', () => {
    const out = applySliderPercent(
      [{ objectId: 'only', percent: 100 }],
      'only',
      40,
    );
    expect(out).toEqual([{ objectId: 'only', percent: 40 }]);
  });

  it('keeps sum at 100 when one slider increases', () => {
    const input = [
      { objectId: 'a', percent: 50 },
      { objectId: 'b', percent: 50 },
    ];
    const out = applySliderPercent(input, 'a', 70);
    expect(out.find((o) => o.objectId === 'a')?.percent).toBe(70);
    expect(out.find((o) => o.objectId === 'b')?.percent).toBe(30);
    expect(out.reduce((s, o) => s + o.percent, 0)).toBe(100);
  });
});

describe('parseLinkedObjectsFromJsonMetadata', () => {
  it('reads objects array', () => {
    expect(
      parseLinkedObjectsFromJsonMetadata({
        objects: [{ object_id: 'x/y', percent: 40 }],
        host: 'example.com',
      }),
    ).toEqual([{ objectId: 'x/y', percent: 40 }]);
  });
});

describe('mergeJsonMetadataWithObjects', () => {
  it('preserves other keys and replaces objects', () => {
    expect(
      mergeJsonMetadataWithObjects(
        { host: 'h', objects: [{ object_id: 'old', percent: 1 }] },
        [{ objectId: 'new', percent: 100 }],
      ),
    ).toEqual({
      host: 'h',
      objects: [{ object_id: 'new', percent: 100 }],
    });
  });

  it('removes objects key when list empty', () => {
    expect(
      mergeJsonMetadataWithObjects({ host: 'h', objects: [] }, []),
    ).toEqual({ host: 'h' });
  });
});

describe('validateLinkedObjectPercents', () => {
  it('rejects sum over 100', () => {
    expect(
      validateLinkedObjectPercents([
        { objectId: 'a', percent: 60 },
        { objectId: 'b', percent: 50 },
      ]),
    ).toEqual({ ok: false, reason: 'sum_over_total' });
  });
});

describe('remainingPercentWeight', () => {
  it('returns zero when sum is 100', () => {
    expect(
      remainingPercentWeight([
        { objectId: 'a', percent: 50 },
        { objectId: 'b', percent: 50 },
      ]),
    ).toBe(0);
  });
});
