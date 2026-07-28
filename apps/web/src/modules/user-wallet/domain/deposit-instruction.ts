/** Hive Engine deposit instruction display fee (legacy DelegateInstructionCard). */
export const DEPOSIT_INSTRUCTION_FEE = 0.0075;

export function formatDepositInstructionRate(
  exRate: number,
  symbolIn: string,
  symbolOut: string,
): string {
  const net = exRate - DEPOSIT_INSTRUCTION_FEE;
  return `1 ${symbolIn} > ${net} ${symbolOut}`;
}
