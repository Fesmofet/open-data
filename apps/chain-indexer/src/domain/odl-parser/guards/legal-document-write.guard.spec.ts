import { LegalDocumentWriteGuard } from './legal-document-write.guard';

describe('LegalDocumentWriteGuard', () => {
  const guard = new LegalDocumentWriteGuard();

  const baseCtx = {
    action: 'update_create' as const,
    object_type: 'legal_document',
    object_id: 'doc-1',
    object_creator: 'alice',
    event_creator: 'alice',
    update_type: 'legalText',
  };

  it('supports legal_document object type', () => {
    expect(guard.supports({ ...baseCtx, object_type: 'legal_document' })).toBe(true);
    expect(guard.supports({ ...baseCtx, object_type: 'product' })).toBe(false);
  });

  it('allows creator edits', () => {
    expect(guard.check(baseCtx)).toBeNull();
  });

  it('rejects non-creator edits', () => {
    expect(
      guard.check({ ...baseCtx, event_creator: 'bob' }),
    ).toBe('UNAUTHORIZED_LEGAL_DOC_OP');
  });
});
