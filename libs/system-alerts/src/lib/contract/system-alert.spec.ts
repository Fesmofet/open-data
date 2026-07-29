import {
  renderSystemAlertText,
  systemAlertSchema,
  type SystemAlert,
} from './system-alert';

describe('system alert contract', () => {
  const valid: SystemAlert = {
    source: 'scheduler',
    severity: 'warn',
    title: 'System health warnings',
    lines: ['line one'],
    occurredAt: '2026-01-01T00:00:00.000Z',
  };

  it('accepts valid payload', () => {
    expect(systemAlertSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty source', () => {
    expect(
      systemAlertSchema.safeParse({ ...valid, source: '' }).success,
    ).toBe(false);
  });

  it('renders plain text title and lines', () => {
    expect(renderSystemAlertText(valid)).toBe(
      'System health warnings\nline one',
    );
  });
});
