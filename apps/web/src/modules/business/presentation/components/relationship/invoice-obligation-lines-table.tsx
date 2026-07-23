'use client';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { formatUsdDisplay } from '../../../domain/dispute-resolution';
import type { OblObligationLineApiRow } from '../../../infrastructure/clients/obl-ledger.server';

export function InvoiceObligationLinesTable({
  lines,
  totalUsd,
}: {
  lines: readonly OblObligationLineApiRow[];
  totalUsd?: string;
}) {
  const { t } = useI18n();
  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-btn border border-border">
      <table className="w-full min-w-[280px] text-body-sm">
        <thead>
          <tr className="border-b border-border bg-surface-alt text-left text-caption text-fg-secondary">
            <th className="px-3 py-2 font-weight-label">{t('business_field_beneficiary')}</th>
            <th className="px-3 py-2 font-weight-label">{t('business_field_amount_usd')}</th>
            <th className="px-3 py-2 font-weight-label">{t('business_field_role')}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.line_id} className="border-b border-border last:border-b-0">
              <td className="px-3 py-2 font-mono">@{line.beneficiary}</td>
              <td className="px-3 py-2">${formatUsdDisplay(line.amount_usd)}</td>
              <td className="px-3 py-2 text-fg-secondary">{line.role ?? '—'}</td>
            </tr>
          ))}
        </tbody>
        {totalUsd ? (
          <tfoot>
            <tr className="bg-surface-alt">
              <td className="px-3 py-2 font-weight-label">{t('business_invoice_total')}</td>
              <td className="px-3 py-2 font-weight-label" colSpan={2}>
                ${formatUsdDisplay(totalUsd)}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
