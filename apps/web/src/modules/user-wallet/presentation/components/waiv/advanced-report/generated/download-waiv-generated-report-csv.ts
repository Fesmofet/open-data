import { buildWaivAdvancedReportRowView } from '../../../../../application/mappers/build-waiv-advanced-report-row-view';
import { loadWaivGeneratedReportRows } from '../../../../../application/queries/load-waiv-generated-report-rows';
import { getWaivGeneratedReportClient } from '../../../../../infrastructure/clients/waiv-generated-report.browser.client';
import { buildWaivAdvancedReportCsv } from '../waiv-advanced-report-row';

export type DownloadWaivGeneratedReportCsvResult = 'ok' | 'empty' | 'failed';

export async function downloadWaivGeneratedReportCsv(
  reportId: string,
): Promise<DownloadWaivGeneratedReportCsvResult> {
  const meta = await getWaivGeneratedReportClient(reportId);
  if (!meta.ok) {
    return 'failed';
  }

  const wallet = await loadWaivGeneratedReportRows(reportId);
  if (wallet === null) {
    return 'failed';
  }

  if (wallet.length === 0) {
    return 'empty';
  }

  const rows = wallet.map((row) => buildWaivAdvancedReportRowView(row));
  const csv = buildWaivAdvancedReportCsv(
    rows,
    meta.data.currency,
    meta.data.deposits,
    meta.data.withdrawals,
  );
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `waiv-generated-report-${reportId}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  return 'ok';
}
