import { WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE } from '@opden-data-layer/core/waiv-advanced-report';

import type { WaivAdvancedReportRowApi } from '../dto/waiv-advanced-report-api.schema';
import { listWaivGeneratedReportRowsClient } from '../../infrastructure/clients/waiv-generated-report.browser.client';

export type LoadWaivGeneratedReportRowsOptions = {
  startSkip?: number;
  pageSize?: number;
  onBatch?: (
    batch: WaivAdvancedReportRowApi[],
    accumulated: WaivAdvancedReportRowApi[],
  ) => void;
};

export async function loadWaivGeneratedReportRows(
  reportId: string,
  options: LoadWaivGeneratedReportRowsOptions = {},
): Promise<WaivAdvancedReportRowApi[] | null> {
  const pageSize = options.pageSize ?? WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE;
  const startSkip = options.startSkip ?? 0;
  const accumulated: WaivAdvancedReportRowApi[] = [];
  let skip = startSkip;
  let hasMore = true;

  while (hasMore) {
    const page = await listWaivGeneratedReportRowsClient(reportId, {
      skip,
      limit: pageSize,
    });
    if (!page.ok) {
      return null;
    }

    const batch = page.data.wallet;
    accumulated.push(...batch);
    options.onBatch?.(batch, accumulated);

    hasMore = page.data.hasMore;
    skip += batch.length;
  }

  return accumulated;
}
