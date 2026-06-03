import {
  applyObjectCreateStepToSearchParams,
  OBJECT_CREATE_STEP_EDIT,
  OBJECT_CREATE_STEP_QUERY,
  OBJECT_CREATE_TYPE_QUERY,
  objectCreateUrlIndicatesEditStep,
  readObjectCreateTypeFromUrl,
} from './object-create-url';

describe('object-create-url', () => {
  it('detects edit step in query', () => {
    expect(
      objectCreateUrlIndicatesEditStep(
        new URLSearchParams(`${OBJECT_CREATE_STEP_QUERY}=${OBJECT_CREATE_STEP_EDIT}`),
      ),
    ).toBe(true);
    expect(objectCreateUrlIndicatesEditStep(new URLSearchParams())).toBe(false);
  });

  it('sets and clears step query param', () => {
    const base = new URLSearchParams('foo=bar');
    const edit = applyObjectCreateStepToSearchParams(base, 'edit-fields', 'person');
    expect(edit.get(OBJECT_CREATE_STEP_QUERY)).toBe(OBJECT_CREATE_STEP_EDIT);
    expect(edit.get(OBJECT_CREATE_TYPE_QUERY)).toBe('person');
    expect(edit.get('foo')).toBe('bar');

    const cleared = applyObjectCreateStepToSearchParams(edit, 'select-type');
    expect(cleared.has(OBJECT_CREATE_STEP_QUERY)).toBe(false);
    expect(cleared.has(OBJECT_CREATE_TYPE_QUERY)).toBe(false);
    expect(cleared.get('foo')).toBe('bar');
  });

  it('reads type from url', () => {
    expect(
      readObjectCreateTypeFromUrl(
        new URLSearchParams(`${OBJECT_CREATE_TYPE_QUERY}=recipe`),
      ),
    ).toBe('recipe');
    expect(readObjectCreateTypeFromUrl(new URLSearchParams())).toBeNull();
  });
});
