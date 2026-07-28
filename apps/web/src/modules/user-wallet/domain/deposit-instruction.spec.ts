import {
  DEPOSIT_INSTRUCTION_FEE,
  formatDepositInstructionRate,
} from './deposit-instruction';

describe('formatDepositInstructionRate', () => {
  it('subtracts legacy display fee from ex_rate', () => {
    expect(formatDepositInstructionRate(1 + DEPOSIT_INSTRUCTION_FEE, 'HIVE', 'WAIV')).toBe(
      '1 HIVE > 1 WAIV',
    );
  });
});
