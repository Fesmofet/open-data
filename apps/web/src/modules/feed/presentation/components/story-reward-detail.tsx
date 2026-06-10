'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { PostRewardView } from '../../application/dto/post-reward.dto';

import { formatRelativeFeedTime } from './story-utils';

type StoryRewardDetailProps = {
  reward: PostRewardView;
  postAuthor: string;
  variant: 'tooltip' | 'modal';
};

function CurrencyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-caption">
      <span className="text-fg-tertiary">{label}</span>
      <span className="font-weight-label tabular-nums text-fg">{value}</span>
    </div>
  );
}

export function StoryRewardDetail({
  reward,
  postAuthor,
  variant,
}: StoryRewardDetailProps) {
  const { t, locale } = useI18n();
  const breakdown = reward.breakdown;
  const beneficiaries = reward.beneficiaries ?? [];
  const beneficiaryHeading =
    beneficiaries.length === 1 && beneficiaries[0]?.account === postAuthor
      ? t('authors')
      : t('beneficiaries');

  return (
    <div className="space-y-2 text-left">
      {reward.isPayoutDeclined ? (
        <p className="text-caption text-danger">{t('payout_declined')}</p>
      ) : null}
      {reward.payoutLimitHit ? (
        <p className="text-caption text-danger">{t('payout_limit_reached')}</p>
      ) : null}

      <div className="space-y-1">
        <CurrencyRow label={t('waiv_wallet')} value={breakdown.waiv.label} />
        <CurrencyRow label={t('table_HIVE')} value={breakdown.hive.label} />
        <CurrencyRow label={t('table_HBD')} value={breakdown.hbd.label} />
        {reward.promotionCost ? (
          <CurrencyRow
            label={t('payout_promoted_amount')}
            value={reward.promotionCost.label}
          />
        ) : null}
        <CurrencyRow label={t('total')} value={breakdown.total.label} />
      </div>

      {beneficiaries.length > 0 ? (
        <div className="space-y-1 border-t border-border/60 pt-2">
          {variant === 'modal' ? (
            <p className="text-caption font-weight-label text-fg-secondary">
              {beneficiaryHeading}
            </p>
          ) : null}
          <ul className="space-y-1">
            {beneficiaries.map((b) => (
              <li
                key={b.account}
                className="flex items-baseline justify-between gap-3 text-caption"
              >
                <Link
                  href={`/@${encodeURIComponent(b.account)}`}
                  className="truncate text-accent hover:underline"
                  suppressHydrationWarning
                >
                  @{b.account}
                </Link>
                <span className="shrink-0 tabular-nums text-fg-secondary">
                  {variant === 'modal' && b.payout
                    ? `${b.percent}% · ${b.payout.label}`
                    : `${b.percent}%`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {variant === 'modal' &&
      reward.phase === 'potential' &&
      breakdown.curatorPayout ? (
        <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-2 text-caption">
          <span className="text-fg-tertiary">
            {t('payout_curators_payout_amount')}
          </span>
          <span className="font-weight-label tabular-nums text-fg">
            {breakdown.curatorPayout.label}
          </span>
        </div>
      ) : null}

      {variant === 'tooltip' && reward.phase === 'potential' && reward.cashoutAt ? (
        <p className="border-t border-border/60 pt-2 text-caption text-fg-tertiary">
          {t('payout_will_release_in_time').replace(
            '{time}',
            formatRelativeFeedTime(reward.cashoutAt, locale),
          )}
        </p>
      ) : null}

      {variant === 'tooltip' &&
      reward.phase === 'paid' &&
      breakdown.authorPayout &&
      breakdown.curatorPayout ? (
        <div className="space-y-1 border-t border-border/60 pt-2">
          <CurrencyRow
            label={t('payout_author_payout_amount')}
            value={breakdown.authorPayout.label}
          />
          <CurrencyRow
            label={t('payout_curators_payout_amount')}
            value={breakdown.curatorPayout.label}
          />
        </div>
      ) : null}
    </div>
  );
}
