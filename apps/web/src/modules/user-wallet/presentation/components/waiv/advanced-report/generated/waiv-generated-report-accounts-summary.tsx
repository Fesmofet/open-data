import Link from 'next/link';

import { UserAvatar } from '@/shared/presentation';

type WaivGeneratedReportAccountsSummaryProps = {
  accounts: readonly string[];
};

export function WaivGeneratedReportAccountsSummary({
  accounts,
}: WaivGeneratedReportAccountsSummaryProps) {
  if (accounts.length === 0) {
    return <span className="text-muted">—</span>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {accounts.map((account) => {
        const name = account.trim().replace(/^@/, '').toLowerCase();
        return (
          <li
            key={name}
            className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface-control px-2 py-1"
          >
            <UserAvatar username={name} size={24} />
            <Link href={`/@${name}`} className="text-body-sm text-link" suppressHydrationWarning>
              @{name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
