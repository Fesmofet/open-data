import {
  evaluateCursorLag,
  formatCursorStatusLine,
  renderSystemHealthReport,
  systemHealthReportToAlert,
} from './block-cursor-check';

describe('block cursor health', () => {
  it('marks ok when within buffer', () => {
    expect(evaluateCursorLag(1000, 1050, 100)).toEqual({
      lagBlocks: 50,
      ok: true,
    });
  });

  it('marks warn when lag exceeds buffer', () => {
    expect(evaluateCursorLag(1000, 1200, 100)).toEqual({
      lagBlocks: 200,
      ok: false,
    });
  });

  it('renders report and builds alert from warnings', () => {
    const report = {
      checkedAt: '2026-01-01T00:00:00.000Z',
      ok: [
        {
          label: 'hive',
          redisKey: 'k1',
          actualBlock: 100,
          headBlock: 150,
          lagBlocks: 50,
          ok: true,
        },
      ],
      warnings: [
        {
          label: 'engine',
          redisKey: 'k2',
          actualBlock: 1,
          headBlock: 200,
          lagBlocks: 199,
          ok: false,
        },
      ],
    };
    expect(renderSystemHealthReport(report)).toContain('WARNING MESSAGES');
    expect(formatCursorStatusLine(report.warnings[0])).toContain('Warning');
    const alert = systemHealthReportToAlert(report, 'scheduler');
    expect(alert?.source).toBe('scheduler');
    expect(alert?.lines.length).toBe(1);
  });

  it('returns null alert when no warnings', () => {
    expect(
      systemHealthReportToAlert(
        { checkedAt: 't', ok: [], warnings: [] },
        'scheduler',
      ),
    ).toBeNull();
  });
});
