import { parseHiveAccountHistoryAssertContinueFrom } from './parse-hive-account-history-assert';

describe('parseHiveAccountHistoryAssertContinueFrom', () => {
  it('returns sequence from assert_exception stack', () => {
    expect(
      parseHiveAccountHistoryAssertContinueFrom({
        code: -32003,
        message: 'Assert Exception:false: ...',
        data: {
          message: 'Assert Exception',
          stack: [{ data: { sequence: 42 } }],
        },
      }),
    ).toBe(42);
  });

  it('returns undefined when assert has no sequence', () => {
    expect(
      parseHiveAccountHistoryAssertContinueFrom({
        code: -32003,
        message: 'Assert Exception:args.start >= args.limit-1',
        data: { message: 'Assert Exception', stack: [{ data: {} }] },
      }),
    ).toBeUndefined();
  });

  it('returns undefined for non-assert errors', () => {
    expect(
      parseHiveAccountHistoryAssertContinueFrom({
        code: -32000,
        message: 'Internal error',
      }),
    ).toBeUndefined();
  });
});
