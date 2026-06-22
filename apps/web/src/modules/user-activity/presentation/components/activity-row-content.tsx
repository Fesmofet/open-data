'use client';

import { Fragment } from 'react';
import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

import type { ActivityRowView } from '../../domain/types/activity-row-view';
import { interpolateMessage } from '../utils/interpolate-message';
import { ActivityRowShell } from './activity-row-shell';

type ProfileLinkProps = { name: string; children: React.ReactNode };

function ProfileLink({ name, children }: ProfileLinkProps) {
  return (
    <Link href={`/@${name}`} className="text-link" suppressHydrationWarning>
      {children}
    </Link>
  );
}

function PostLink({
  author,
  permlink,
  children,
}: {
  author: string;
  permlink: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={`/@${author}/${permlink}`} className="text-link" suppressHydrationWarning>
      {children}
    </Link>
  );
}

function ObjectLink({
  permlink,
  children,
}: {
  permlink: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={`/object/${permlink}`} className="text-link" suppressHydrationWarning>
      {children}
    </Link>
  );
}

function formatGenericFieldValue(key: string, value: unknown): string {
  if (key === 'json' && typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

function GenericFieldValueBox({
  text,
  scrollX,
}: {
  text: string;
  scrollX: boolean;
}) {
  return (
    <div
      className={[
        'rounded-btn bg-code-bg px-3 py-2 font-mono text-caption text-code-fg',
        scrollX ? 'overflow-x-auto scrollbar-minimal' : 'overflow-hidden',
      ].join(' ')}
    >
      <code className={scrollX ? 'block whitespace-nowrap' : 'block'}>{text}</code>
    </div>
  );
}

function GenericFieldsTable({ fields }: { fields: Record<string, unknown> }) {
  const entries = Object.entries(fields);
  if (entries.length === 0) {
    return null;
  }
  return (
    <dl className="mt-2 grid grid-cols-[max-content_minmax(0,1fr)] items-start gap-x-3 gap-y-2 text-caption text-muted">
      {entries.map(([key, value]) => {
        const text = formatGenericFieldValue(key, value);
        return (
          <Fragment key={key}>
            <dt className="pt-2 font-weight-label">{key}</dt>
            <dd className="m-0 min-w-0">
              <GenericFieldValueBox text={text} scrollX={key === 'json'} />
            </dd>
          </Fragment>
        );
      })}
    </dl>
  );
}

export function ActivityRowContent({ row }: { row: ActivityRowView }) {
  const { t } = useI18n();

  switch (row.kind) {
    case 'vote': {
      const weightPct = Math.abs(row.weight) / 100;
      const voteKey =
        row.weight > 0 ? 'upvoted' : row.weight < 0 ? 'downvoted' : 'unvoted';
      const weightSuffix =
        row.weight !== 0 ? `(${weightPct.toFixed(2)}%) ` : '';
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {row.isProfileActor ? (
            <>
              {t(voteKey)} {weightSuffix}
              <PostLink author={row.author} permlink={row.permlink}>
                @{row.author}/{row.permlink}
              </PostLink>
            </>
          ) : (
            <>
              {interpolateMessage(t(`user_${voteKey}`), {
                username: `@${row.voter}`,
              })}{' '}
              {weightSuffix}
              <PostLink author={row.author} permlink={row.permlink}>
                @{row.author}/{row.permlink}
              </PostLink>
            </>
          )}
        </ActivityRowShell>
      );
    }
    case 'comment':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {row.isPost ? (
            <>
              {t('activity_authored_post')} (
              <PostLink author={row.author} permlink={row.permlink}>
                {row.permlink}
              </PostLink>
              )
            </>
          ) : row.isProfileActor ? (
            <>
              {t('activity_replied_to')}{' '}
              <ProfileLink name={row.parentAuthor}>@{row.parentAuthor}</ProfileLink> (
              <PostLink author={row.author} permlink={row.permlink}>
                {row.permlink}
              </PostLink>
              )
            </>
          ) : (
            <>
              {interpolateMessage(t('activity_user_replied_to'), {
                username: `@${row.author}`,
              })}{' '}
              <ProfileLink name={row.parentAuthor}>@{row.parentAuthor}</ProfileLink> (
              <PostLink author={row.author} permlink={row.permlink}>
                {row.permlink}
              </PostLink>
              )
            </>
          )}
        </ActivityRowShell>
      );
    case 'delete_comment':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {t('activity_deleted_comment')} (
          <PostLink author={row.author} permlink={row.permlink}>
            {row.permlink}
          </PostLink>
          )
        </ActivityRowShell>
      );
    case 'custom_follow': {
      const labelKey =
        row.what === 'blog'
          ? 'followed_user'
          : row.what === 'ignore'
            ? 'ignored_user'
            : 'unfollowed_user';
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {interpolateMessage(t(labelKey), { following: '' }).trim()}{' '}
          <ProfileLink name={row.following}>@{row.following}</ProfileLink>
        </ActivityRowShell>
      );
    }
    case 'custom_reblog':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {t('activity_reblogged')}{' '}
          <PostLink author={row.author} permlink={row.permlink}>
            @{row.author}/{row.permlink}
          </PostLink>
        </ActivityRowShell>
      );
    case 'custom_follow_object':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {interpolateMessage(
            t(row.isFollow ? 'activity_follow_object' : 'activity_unfollow_object'),
            { objectType: row.objectType },
          )}{' '}
          <ObjectLink permlink={row.objectPermlink}>{row.objectName}</ObjectLink>
        </ActivityRowShell>
      );
    case 'account_create':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          <ProfileLink name={row.creator}>@{row.creator}</ProfileLink>{' '}
          {t('activity_created_account')}{' '}
          {row.withDelegation ? `${t('activity_with_delegation')} ` : ''}
          <ProfileLink name={row.newAccount}>@{row.newAccount}</ProfileLink>
        </ActivityRowShell>
      );
    case 'account_update':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {t('account_updated')}
        </ActivityRowShell>
      );
    case 'reward_author':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {t('author_reward')}: {row.rewards.join(', ')} —{' '}
          <PostLink author={row.author} permlink={row.permlink}>
            {row.permlink}
          </PostLink>
        </ActivityRowShell>
      );
    case 'reward_curation':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {t('curation_reward')}: {row.hpAmount.toFixed(3)} HP —{' '}
          <PostLink author={row.author} permlink={row.permlink}>
            {row.permlink}
          </PostLink>
        </ActivityRowShell>
      );
    case 'witness_vote':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {row.approved
            ? t('activity_witness_approved')
            : t('activity_witness_unapproved')}{' '}
          <ProfileLink name={row.witness}>@{row.witness}</ProfileLink>
        </ActivityRowShell>
      );
    case 'wallet_transfer':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          <span>
            {row.direction === 'in' || row.direction === 'self'
              ? t('activity_received')
              : t('activity_transferred')}{' '}
            {row.amount} {row.currency}{' '}
            {row.direction !== 'self' ? (
              row.direction === 'in' ? (
                <>
                  {t('activity_from')}{' '}
                  <ProfileLink name={row.counterparty}>@{row.counterparty}</ProfileLink>
                </>
              ) : (
                <>
                  {t('activity_to')}{' '}
                  <ProfileLink name={row.counterparty}>@{row.counterparty}</ProfileLink>
                </>
              )
            ) : null}
          </span>
          {row.memo ? (
            <span className="mt-1 block min-w-0 break-all text-caption text-muted">
              {row.memo}
            </span>
          ) : null}
        </ActivityRowShell>
      );
    case 'wallet_power_up':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {t('power_up')} {row.amount} {row.currency}{' '}
          <ProfileLink name={row.counterparty}>@{row.counterparty}</ProfileLink>
        </ActivityRowShell>
      );
    case 'wallet_savings':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {row.operationType}: {row.amount} {row.currency}
        </ActivityRowShell>
      );
    case 'wallet_claim_rewards':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {t('claimed_rewards')}: {[row.hive, row.hbd, row.hp].filter(Boolean).join(', ')}
        </ActivityRowShell>
      );
    case 'wallet_delegate':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {t('activity_delegation')}: {row.hpAmount.toFixed(3)} HP{' '}
          <ProfileLink name={row.delegator}>@{row.delegator}</ProfileLink> →{' '}
          <ProfileLink name={row.delegatee}>@{row.delegatee}</ProfileLink>
        </ActivityRowShell>
      );
    case 'wallet_power_down':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {row.subtype === 'start'
            ? t('activity_power_down_start')
            : row.subtype === 'stop'
              ? t('activity_power_down_stop')
              : row.subtype === 'route'
                ? t('activity_power_down_route')
                : t('power_down')}
          {row.hpAmount ? `: ${row.hpAmount}` : ''}
          {row.from && row.to ? (
            <span className="mt-1 block text-caption text-muted">
              {row.from} → {row.to} ({row.percent}%)
            </span>
          ) : null}
        </ActivityRowShell>
      );
    case 'wallet_convert':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {row.subtype}: {row.amountIn}
          {row.amountOut ? ` → ${row.amountOut}` : ''}
        </ActivityRowShell>
      );
    case 'wallet_fill_order':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {t('activity_market_fill')}: {row.currentPays} ↔ {row.openPays}
        </ActivityRowShell>
      );
    case 'wallet_limit_order':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {t('activity_market_limit')}: {row.amountToSell} → {row.minToReceive}
        </ActivityRowShell>
      );
    case 'wallet_cancel_order':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {row.openPays
            ? interpolateMessage(t('cancel_order'), { open_pays: row.openPays })
            : t('cancel_limit_order')}
        </ActivityRowShell>
      );
    case 'wallet_proposal_pay':
      return (
        <ActivityRowShell timestamp={row.timestamp}>
          {interpolateMessage(
            t(row.direction === 'in' ? 'proposal_payment_from' : 'proposal_payment_to'),
            { steem_dao: row.payer, receiver: row.receiver },
          )}{' '}
          {row.amount}
        </ActivityRowShell>
      );
    case 'generic':
      return (
        <ActivityRowShell
          timestamp={row.timestamp}
          secondary={<GenericFieldsTable fields={row.fields} />}
        >
          <span className="font-weight-label">{row.type}</span>
        </ActivityRowShell>
      );
    default: {
      const _exhaustive: never = row;
      return _exhaustive;
    }
  }
}
