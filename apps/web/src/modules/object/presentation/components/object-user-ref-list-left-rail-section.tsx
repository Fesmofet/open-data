'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { UserAvatar } from '@/shared/presentation/avatar/user-avatar';

export const LEFT_RAIL_USER_REF_COLLAPSED_COUNT = 10;

export type ObjectUserRefListLeftRailSectionProps = {
  headingLabel: string;
  accounts: readonly string[];
  editToolbar?: React.ReactNode;
};

function UserRefRow({ account }: { account: string }) {
  const trimmed = account.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return (
    <Link
      href={`/@${encodeURIComponent(trimmed)}`}
      prefetch={false}
      suppressHydrationWarning
      className="-mx-1 flex min-w-0 items-center gap-2 rounded-btn p-1 transition-colors hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <UserAvatar username={trimmed} size={32} displayName={trimmed} />
      <span className="min-w-0 break-words text-accent">@{trimmed}</span>
    </Link>
  );
}

export function ObjectUserRefListLeftRailSection({
  headingLabel,
  accounts,
  editToolbar,
}: ObjectUserRefListLeftRailSectionProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = accounts.length > LEFT_RAIL_USER_REF_COLLAPSED_COUNT;
  const visibleAccounts =
    expanded || !hasOverflow
      ? accounts
      : accounts.slice(0, LEFT_RAIL_USER_REF_COLLAPSED_COUNT);

  if (accounts.length === 0 && editToolbar == null) {
    return null;
  }

  return (
    <div className="space-y-1">
      {editToolbar}
      {accounts.length > 0 ? (
        <>
          <p className="text-body-sm font-weight-body text-fg">{headingLabel}:</p>
          <ul className="mt-1 list-none space-y-1 p-0">
            {visibleAccounts.map((account) => (
              <li key={account} className="text-body-sm">
                <UserRefRow account={account} />
              </li>
            ))}
          </ul>
          {hasOverflow ? (
            <button
              type="button"
              className="mt-1 text-body-sm text-accent hover:underline"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? t('object_updates_show_less') : t('show_more')}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
