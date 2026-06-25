'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type {
  WaivMarketOrderType,
  WaivWalletHistoryRowView,
} from '@/modules/user-wallet/domain/types/waiv-wallet-history-view';
import { parseAuthorPermlink } from '@/modules/user-wallet/application/mappers/build-waiv-wallet-history-row-view';
import { formatWalletHistoryAmountLabel } from '@/modules/user-wallet/domain/waiv-wallet-history-amount-format';
import { UserAvatar } from '@/shared/presentation';

import {
  WaivWalletAmount,
  WalletDualAmount,
  WalletHistoryRowShell,
} from '../../hive/history/wallet-history-row-shell';
import {
  ConvertIcon,
  SuccessIcon,
  SwapIcon,
  XIcon,
} from '../../hive/history/wallet-history-icons';
import { WalletPowerLightningIcon } from '../../shared/wallet-row-icons';

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
    <Link
      href={`/@${author}/${permlink}`}
      className="text-link"
      suppressHydrationWarning
    >
      {children}
    </Link>
  );
}

function marketOrderLabel(
  t: (key: string) => string,
  orderType: WaivMarketOrderType,
  isLimitOrder: boolean,
): string {
  if (isLimitOrder) {
    return orderType === 'sell'
      ? t('limit_order_to_sell')
      : t('limit_order_to_buy');
  }
  return orderType === 'marketsell' || orderType === 'sell'
    ? t('market_order_to_sell')
    : t('market_order_to_buy');
}

export function WaivWalletHistoryRow({ row }: { row: WaivWalletHistoryRowView }) {
  const { t } = useI18n();

  switch (row.kind) {
    case 'transfer':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          avatar={
            row.direction !== 'self' ? (
              <UserAvatar username={row.counterparty} size={40} />
            ) : undefined
          }
          amount={<WaivWalletAmount view={row.amountView} />}
          secondary={
            row.memo ? (
              <p className="min-w-0 break-all text-caption text-muted">{row.memo}</p>
            ) : undefined
          }
        >
          {row.direction === 'self' ? (
            <>
              {t('activity_received')} {t('activity_from')}{' '}
              <ProfileLink name={row.counterparty}>@{row.counterparty}</ProfileLink>
            </>
          ) : row.direction === 'in' ? (
            <>
              {t('activity_received')} {t('activity_from')}{' '}
              <ProfileLink name={row.counterparty}>@{row.counterparty}</ProfileLink>
            </>
          ) : (
            <>
              {t('activity_transferred')} {t('activity_to')}{' '}
              <ProfileLink name={row.counterparty}>@{row.counterparty}</ProfileLink>
            </>
          )}
        </WalletHistoryRowShell>
      );
    case 'power_up':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<WalletPowerLightningIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {row.direction === 'self' ? (
            t('power_up')
          ) : (
            <>
              {t('power_up')}{' '}
              {row.direction === 'in' ? t('activity_from') : t('activity_to')}{' '}
              <ProfileLink name={row.counterparty}>@{row.counterparty}</ProfileLink>
            </>
          )}
        </WalletHistoryRowShell>
      );
    case 'power_down_start':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<WalletPowerLightningIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('power_down_started')}
        </WalletHistoryRowShell>
      );
    case 'power_down_stop':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<WalletPowerLightningIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('canceled_power_down')}
        </WalletHistoryRowShell>
      );
    case 'power_down_done':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<WalletPowerLightningIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('power_down_stopped')}
        </WalletHistoryRowShell>
      );
    case 'delegate':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          avatar={<UserAvatar username={row.counterparty} size={40} />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {row.isIncoming ? t('delegation_from') : t('delegated_to')}{' '}
          <ProfileLink name={row.counterparty}>@{row.counterparty}</ProfileLink>
        </WalletHistoryRowShell>
      );
    case 'undelegate_start':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<span className="text-body-lg" aria-hidden>→</span>}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('undelegated')}{' '}
          {row.isIncoming ? (
            <>
              {t('undelegated_by')}{' '}
              <ProfileLink name={row.counterparty}>@{row.counterparty}</ProfileLink>
            </>
          ) : (
            <>
              {t('activity_to')}{' '}
              <ProfileLink name={row.counterparty}>@{row.counterparty}</ProfileLink>
            </>
          )}
        </WalletHistoryRowShell>
      );
    case 'undelegate_done':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<span className="text-body-lg" aria-hidden>→</span>}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('undelegated_completed')}
        </WalletHistoryRowShell>
      );
    case 'market_trade':
    case 'market_partial':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          timestampExtra={row.rateLabel}
          avatar={
            row.counterparty ? (
              <UserAvatar username={row.counterparty} size={40} />
            ) : undefined
          }
          amount={
            <WalletDualAmount
              transfer={formatWalletHistoryAmountLabel(
                row.tokenAmount.amount,
                row.tokenAmount.currency,
              )}
              received={formatWalletHistoryAmountLabel(
                row.hiveAmount.amount,
                row.hiveAmount.currency,
              )}
              transferTone={row.tokenAmount.tone}
              receivedTone={row.hiveAmount.tone}
              transferSign={row.tokenAmount.sign}
              receivedSign={row.hiveAmount.sign}
            />
          }
        >
          {row.isBuy ? t('bought') : t('sold')}{' '}
          {row.counterparty ? (
            <>
              {row.isBuy ? t('lowercase_from') : t('lowercase_to')}{' '}
              <ProfileLink name={row.counterparty}>@{row.counterparty}</ProfileLink>
            </>
          ) : null}
        </WalletHistoryRowShell>
      );
    case 'market_order':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          timestampExtra={row.priceLabel}
          icon={<SwapIcon />}
          amount={
            row.isLimitOrder && row.otherAmountLabel ? (
              <span className="text-fg">
                {row.lockedAmountLabel} → {row.otherAmountLabel}
              </span>
            ) : (
              <span className="text-fg">{row.lockedAmountLabel}</span>
            )
          }
        >
          {marketOrderLabel(t, row.orderType, row.isLimitOrder)}
        </WalletHistoryRowShell>
      );
    case 'market_cancel':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<XIcon />}
          amount={row.amount ? <span className="text-fg">{row.amount}</span> : undefined}
        >
          {row.orderType === 'buy'
            ? t('cancel_order_to_buy')
            : t('cancel_order_to_sell')}
        </WalletHistoryRowShell>
      );
    case 'market_expire':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<XIcon />}
          amount={row.amount ? <span className="text-fg">{row.amount}</span> : undefined}
        >
          {row.orderType === 'buy'
            ? t('market_expired_to_buy')
            : t('market_expired_to_sell')}
        </WalletHistoryRowShell>
      );
    case 'market_close':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<XIcon />}
        >
          {row.orderType === 'buy'
            ? t('market_close_to_buy')
            : t('market_close_to_sell')}
        </WalletHistoryRowShell>
      );
    case 'lottery':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<SuccessIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('waiv_mining_lottery')}
        </WalletHistoryRowShell>
      );
    case 'mining':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<SuccessIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('mining_rewards')}
        </WalletHistoryRowShell>
      );
    case 'pegged_deposit':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<ConvertIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('waiv_pegged_deposit')}
        </WalletHistoryRowShell>
      );
    case 'pegged_withdraw':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<ConvertIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('waiv_pegged_withdraw')}
        </WalletHistoryRowShell>
      );
    case 'author_reward': {
      const { author, permlink } = parseAuthorPermlink(row.authorperm);
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<SuccessIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('author_rewards')}{' '}
          {permlink ? (
            <PostLink author={author} permlink={permlink}>
              {row.authorperm}
            </PostLink>
          ) : (
            row.authorperm
          )}
        </WalletHistoryRowShell>
      );
    }
    case 'beneficiary_reward': {
      const { author, permlink } = parseAuthorPermlink(row.authorperm);
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<SuccessIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('curator_rewards')}{' '}
          {permlink ? (
            <PostLink author={author} permlink={permlink}>
              {row.authorperm}
            </PostLink>
          ) : (
            row.authorperm
          )}{' '}
          ({t('comment_lowercase')})
        </WalletHistoryRowShell>
      );
    }
    case 'curation_reward': {
      const { author, permlink } = parseAuthorPermlink(row.authorperm);
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<SuccessIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('curator_rewards')}{' '}
          {permlink ? (
            <PostLink author={author} permlink={permlink}>
              {row.authorperm}
            </PostLink>
          ) : (
            row.authorperm
          )}
        </WalletHistoryRowShell>
      );
    }
    case 'swap':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          timestampExtra={row.rateLabel}
          icon={<SwapIcon />}
          amount={
            <WalletDualAmount
              transfer={formatWalletHistoryAmountLabel(row.quantityIn, row.symbolIn)}
              received={formatWalletHistoryAmountLabel(row.quantityOut, row.symbolOut)}
            />
          }
        >
          {t('swap')}
        </WalletHistoryRowShell>
      );
    case 'airdrop':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          icon={<SuccessIcon />}
          amount={<WaivWalletAmount view={row.amountView} />}
        >
          {t('waiv_airdrop')}
          {row.tokenState ? (
            <span className="block text-body-sm text-muted">{row.tokenState}</span>
          ) : null}
        </WalletHistoryRowShell>
      );
    case 'generic':
      return (
        <WalletHistoryRowShell
          timestamp={row.timestamp}
          amount={
            row.amountView ? <WaivWalletAmount view={row.amountView} /> : undefined
          }
        >
          {row.operation}
        </WalletHistoryRowShell>
      );
    default:
      return null;
  }
}
