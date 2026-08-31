import {
  isSpecialHostLanding,
  resolveObjectMobileCenterLayout,
} from './object-mobile-layout';

describe('resolveObjectMobileCenterLayout', () => {
  it('maps standard Details view to standardView', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'restaurant',
        activePrimarySegment: 'details',
        hasPath: false,
        isEditMode: false,
      }),
    ).toBe('standardView');
  });

  it('maps standard Details edit to standardEdit', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'restaurant',
        activePrimarySegment: 'details',
        hasPath: false,
        isEditMode: true,
      }),
    ).toBe('standardEdit');
  });

  it('maps standard Reviews tab to centerOnly', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'restaurant',
        activePrimarySegment: 'reviews',
        hasPath: false,
        isEditMode: false,
      }),
    ).toBe('centerOnly');
  });

  it('maps standard nested path to centerOnly', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'restaurant',
        activePrimarySegment: 'details',
        hasPath: true,
        isEditMode: false,
      }),
    ).toBe('centerOnly');
  });

  it('maps special list view to centerOnly', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'list',
        activePrimarySegment: 'list',
        hasPath: false,
        isEditMode: false,
      }),
    ).toBe('centerOnly');
  });

  it('maps special list edit to specialEdit', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'list',
        activePrimarySegment: 'list',
        hasPath: false,
        isEditMode: true,
      }),
    ).toBe('specialEdit');
  });

  it('maps special widget edit to specialEdit', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'widget',
        activePrimarySegment: 'widget',
        hasPath: false,
        isEditMode: true,
      }),
    ).toBe('specialEdit');
  });

  it('maps special page edit to specialEdit', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'page',
        activePrimarySegment: '',
        hasPath: false,
        isEditMode: true,
      }),
    ).toBe('specialEdit');
  });

  it('maps special page view to centerOnly', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'page',
        activePrimarySegment: '',
        hasPath: false,
        isEditMode: false,
      }),
    ).toBe('centerOnly');
  });

  it('maps special edit on Reviews to centerOnly', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'list',
        activePrimarySegment: 'reviews',
        hasPath: false,
        isEditMode: true,
      }),
    ).toBe('centerOnly');
  });

  it('maps person Details view to standardView', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'person',
        activePrimarySegment: 'details',
        hasPath: false,
        isEditMode: false,
      }),
    ).toBe('standardView');
  });

  it('maps standard Gallery tab in edit to centerOnly', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'restaurant',
        activePrimarySegment: 'gallery',
        hasPath: false,
        isEditMode: true,
      }),
    ).toBe('centerOnly');
  });

  it('maps standard path in edit to centerOnly', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'restaurant',
        activePrimarySegment: 'details',
        hasPath: true,
        isEditMode: true,
      }),
    ).toBe('centerOnly');
  });

  it('maps widget view to centerOnly', () => {
    expect(
      resolveObjectMobileCenterLayout({
        objectTypeKey: 'widget',
        activePrimarySegment: 'widget',
        hasPath: false,
        isEditMode: false,
      }),
    ).toBe('centerOnly');
  });

  it.each(['html', 'newsfeed'] as const)(
    'maps %s host edit to specialEdit',
    (objectTypeKey) => {
      expect(
        resolveObjectMobileCenterLayout({
          objectTypeKey,
          activePrimarySegment: '',
          hasPath: false,
          isEditMode: true,
        }),
      ).toBe('specialEdit');
    },
  );
});

describe('isSpecialHostLanding', () => {
  it('detects list host landing', () => {
    expect(isSpecialHostLanding('list', 'list')).toBe(true);
    expect(isSpecialHostLanding('list', 'reviews')).toBe(false);
  });

  it('detects page host landing on empty segment', () => {
    expect(isSpecialHostLanding('page', '')).toBe(true);
    expect(isSpecialHostLanding('page', 'reviews')).toBe(false);
  });
});
