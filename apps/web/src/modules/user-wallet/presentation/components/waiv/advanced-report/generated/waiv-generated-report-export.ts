export function isWaivGeneratedReportRunning(status: string): boolean {
  return status === 'pending' || status === 'in_progress';
}

export function canExportWaivGeneratedReport(
  status: string,
  rowCount: number,
): boolean {
  return !isWaivGeneratedReportRunning(status) && rowCount > 0;
}
