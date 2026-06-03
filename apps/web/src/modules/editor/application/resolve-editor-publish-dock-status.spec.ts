import { resolveEditorPublishDockStatus } from './resolve-editor-publish-dock-status';

describe('resolveEditorPublishDockStatus', () => {
  const readyInput = {
    linkedObjectsOk: true,
    hasTitle: true,
    hasBody: true,
    legalAccepted: true,
  };

  it('returns ready when all requirements met', () => {
    expect(resolveEditorPublishDockStatus(readyInput)).toEqual({
      messageKey: 'ready_to_publish',
      warning: false,
    });
  });

  it('prioritizes linked objects over title', () => {
    expect(
      resolveEditorPublishDockStatus({
        ...readyInput,
        linkedObjectsOk: false,
        hasTitle: false,
      }),
    ).toEqual({ messageKey: 'linked_objects_remaining', warning: true });
  });

  it('reports missing title', () => {
    expect(
      resolveEditorPublishDockStatus({ ...readyInput, hasTitle: false }),
    ).toEqual({
      messageKey: 'editor_post_not_ready_title_missing',
      warning: true,
    });
  });

  it('reports missing body', () => {
    expect(
      resolveEditorPublishDockStatus({ ...readyInput, hasBody: false }),
    ).toEqual({
      messageKey: 'editor_post_not_ready_body_missing',
      warning: true,
    });
  });

  it('reports legal notice when content is complete', () => {
    expect(
      resolveEditorPublishDockStatus({ ...readyInput, legalAccepted: false }),
    ).toEqual({
      messageKey: 'editor_post_not_ready_legal_missing',
      warning: true,
    });
  });
});
