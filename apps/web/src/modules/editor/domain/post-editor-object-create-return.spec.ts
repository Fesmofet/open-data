import {
  appendAttachObjectToEditorPath,
  buildEditorDraftPath,
  buildObjectCreateHrefFromEditor,
  parseObjectCreateReturnPath,
  stripAttachObjectFromEditorPath,
} from './post-editor-object-create-return';

describe('buildEditorDraftPath', () => {
  it('builds path with draftId', () => {
    expect(buildEditorDraftPath({ draftId: 'abc-123' })).toBe(
      '/editor?draftId=abc-123',
    );
  });

  it('falls back to /editor when params invalid', () => {
    expect(buildEditorDraftPath({ draftId: 'bad/id' })).toBe('/editor');
  });
});

describe('buildObjectCreateHrefFromEditor', () => {
  it('encodes return query', () => {
    expect(buildObjectCreateHrefFromEditor({ draftId: 'x' })).toBe(
      '/object-create?return=%2Feditor%3FdraftId%3Dx',
    );
  });
});

describe('parseObjectCreateReturnPath', () => {
  it('accepts /editor with draftId', () => {
    expect(parseObjectCreateReturnPath('/editor?draftId=abc')).toBe(
      '/editor?draftId=abc',
    );
  });

  it('rejects external URLs', () => {
    expect(parseObjectCreateReturnPath('https://evil.com/editor')).toBeNull();
  });

  it('rejects non-editor paths', () => {
    expect(parseObjectCreateReturnPath('/object/foo')).toBeNull();
  });

  it('rejects both draftId and permlink', () => {
    expect(
      parseObjectCreateReturnPath('/editor?draftId=a&permlink=b'),
    ).toBeNull();
  });
});

describe('appendAttachObjectToEditorPath', () => {
  it('adds attachObject', () => {
    expect(
      appendAttachObjectToEditorPath('/editor?draftId=abc', 'alice/my-list'),
    ).toBe('/editor?draftId=abc&attachObject=alice%2Fmy-list');
  });
});

describe('stripAttachObjectFromEditorPath', () => {
  it('removes attachObject only', () => {
    expect(
      stripAttachObjectFromEditorPath(
        '/editor?draftId=abc&attachObject=alice%2Flist',
      ),
    ).toBe('/editor?draftId=abc');
  });
});
