import type { AnyNotificationEvent } from '@opden-data-layer/notifications-contract';
import { type NotificationMessage, withParamHrefs } from '../message';
import {
  userProfilePath,
  walletTabFromAmount,
  walletTabFromSymbol,
  walletTabFromSwapLegs,
  walletTransfersPath,
  type WalletTabType,
} from '../links';

function walletMessage(
  key: string,
  params: Record<string, string>,
  username: string,
  actor: string | null,
  walletTab: WalletTabType,
  paramHrefs: Readonly<Record<string, string>>,
): NotificationMessage {
  return withParamHrefs(
    {
      key,
      params,
      href: walletTransfersPath(username, walletTab),
      icon: 'wallet',
      actor,
    },
    paramHrefs,
  );
}

function profileHref(username: string): string {
  return userProfilePath(username);
}

export function buildWalletMessage(
  event: AnyNotificationEvent,
): NotificationMessage | null {
  switch (event.type) {
    case 'transfer_in': {
      const p = event.payload;
      return withParamHrefs(
        {
          key: 'notification_transfer_username_amount',
          params: {
            username: p.from,
            amount: `${p.amount} ${p.symbol}`,
            to: p.to,
          },
          href: walletTransfersPath(p.to, walletTabFromSymbol(p.symbol)),
          icon: 'wallet',
          actor: p.from,
        },
        {
          username: profileHref(p.from),
          to: profileHref(p.to),
        },
      );
    }
    case 'transfer_out': {
      const p = event.payload;
      return walletMessage(
        'transfer_from',
        { amount: `${p.amount} ${p.symbol}`, to: p.to },
        p.from,
        p.from,
        walletTabFromSymbol(p.symbol),
        { to: profileHref(p.to) },
      );
    }
    case 'transfer_from_savings': {
      const p = event.payload;
      return walletMessage(
        'notification_transfer_from_savings',
        { amount: `${p.amount} ${p.symbol}` },
        p.from,
        p.from,
        walletTabFromSymbol(p.symbol),
        {},
      );
    }
    case 'power_up': {
      const p = event.payload;
      return walletMessage(
        'power_up_initiated_actor',
        { from: p.from, amount: p.amount, to: p.to },
        p.from,
        p.from,
        'HIVE',
        {
          from: profileHref(p.from),
          to: profileHref(p.to),
        },
      );
    }
    case 'power_down': {
      const p = event.payload;
      return withParamHrefs(
        {
          key: 'power_down_notification',
          params: { username: p.account, amount: p.amount },
          href: walletTransfersPath(p.account, walletTabFromAmount(p.amount)),
          icon: 'wallet',
          actor: p.account,
        },
        { username: profileHref(p.account) },
      );
    }
    case 'claim_reward': {
      const p = event.payload;
      const account = event.actor ?? '';
      return withParamHrefs(
        {
          key: 'claim_reward_notify',
          params: {
            rewardHIVE: p.rewardHive,
            rewardHBD: p.rewardHbd,
            rewardHP: p.rewardHp,
          },
          href: walletTransfersPath(account, 'HIVE'),
          icon: 'wallet',
          actor: event.actor,
        },
        {},
      );
    }
    case 'witness_vote': {
      const p = event.payload;
      const voter = event.actor ?? p.witness;
      return withParamHrefs(
        {
          key: p.approve
            ? 'notification_approved_witness'
            : 'notification_unapproved_witness',
          params: { username: voter },
          href: userProfilePath(voter),
          icon: 'wallet',
          actor: event.actor,
        },
        { username: profileHref(voter) },
      );
    }
    case 'fill_order': {
      const p = event.payload;
      const account = event.actor ?? p.exchanger;
      return withParamHrefs(
        {
          key: 'fill_order_notification',
          params: {
            current_pays: p.currentPays,
            open_pays: p.openPays,
            exchanger: p.exchanger,
          },
          href: walletTransfersPath(account, 'HIVE'),
          icon: 'wallet',
          actor: event.actor,
        },
        { exchanger: profileHref(p.exchanger) },
      );
    }
    case 'withdraw_route': {
      const p = event.payload;
      return withParamHrefs(
        {
          key: 'withdraw_route_to',
          params: {
            from_account: p.fromAccount,
            to_account: p.toAccount,
          },
          href: walletTransfersPath(p.fromAccount, 'HIVE'),
          icon: 'wallet',
          actor: p.fromAccount,
        },
        {
          from_account: profileHref(p.fromAccount),
          to_account: profileHref(p.toAccount),
        },
      );
    }
    case 'change_recovery_account': {
      const p = event.payload;
      return withParamHrefs(
        {
          key: 'change_recovery_account',
          params: {
            account_to_recover: p.account,
            new_recovery_account: p.newRecoveryAccount,
          },
          href: userProfilePath(p.account),
          icon: 'wallet',
          actor: p.account,
        },
        {
          account_to_recover: profileHref(p.account),
          new_recovery_account: profileHref(p.newRecoveryAccount),
        },
      );
    }
    case 'change_password': {
      const p = event.payload;
      return withParamHrefs(
        {
          key: 'change_password',
          params: { account: p.account },
          href: userProfilePath(p.account),
          icon: 'wallet',
          actor: p.account,
        },
        { account: profileHref(p.account) },
      );
    }
    case 'hp_delegation': {
      const p = event.payload;
      const isUndelegation = p.amount === '0';
      return withParamHrefs(
        {
          key: isUndelegation
            ? 'notification_hp_undelegation'
            : 'notification_hp_delegation',
          params: {
            delegator: p.delegator,
            delegatee: p.delegatee,
            amount: p.amount,
          },
          href: walletTransfersPath(
            p.delegator,
            walletTabFromAmount(p.amount),
          ),
          icon: 'wallet',
          actor: p.delegator,
        },
        {
          delegator: profileHref(p.delegator),
          delegatee: profileHref(p.delegatee),
        },
      );
    }
    case 'engine_transfer': {
      const p = event.payload;
      return withParamHrefs(
        {
          key: 'notification_transfer_username_amount',
          params: {
            username: p.from,
            amount: `${p.amount} ${p.symbol}`,
            to: p.to,
          },
          href: walletTransfersPath(p.to, walletTabFromSymbol(p.symbol)),
          icon: 'wallet',
          actor: p.from,
        },
        {
          username: profileHref(p.from),
          to: profileHref(p.to),
        },
      );
    }
    case 'engine_transfer_out': {
      const p = event.payload;
      return walletMessage(
        'transfer_from',
        { amount: `${p.amount} ${p.symbol}`, to: p.to },
        p.from,
        p.from,
        walletTabFromSymbol(p.symbol),
        { to: profileHref(p.to) },
      );
    }
    case 'engine_swap': {
      const p = event.payload;
      const amountOut = `${p.symbolOutQuantity} ${p.symbolOut}`;
      const amountIn = `${p.symbolInQuantity} ${p.symbolIn}`;
      return walletMessage(
        'notification_engine_swap',
        { amountOut, amountIn },
        p.account,
        p.account,
        walletTabFromSwapLegs(p.symbolOut, p.symbolIn),
        {},
      );
    }
    case 'engine_stake': {
      const p = event.payload;
      return walletMessage(
        'transfer_to_vesting',
        {
          from: p.from,
          to: p.to,
          amount: `${p.amount} ${p.symbol}`,
        },
        p.from,
        p.from,
        walletTabFromSymbol(p.symbol),
        {
          from: profileHref(p.from),
          to: profileHref(p.to),
        },
      );
    }
    case 'engine_delegate': {
      const p = event.payload;
      return walletMessage(
        'notification_engine_delegate',
        {
          from: p.from,
          to: p.to,
          amount: `${p.amount} ${p.symbol}`,
        },
        p.from,
        p.from,
        walletTabFromSymbol(p.symbol),
        {
          from: profileHref(p.from),
          to: profileHref(p.to),
        },
      );
    }
    case 'engine_undelegate': {
      const p = event.payload;
      return walletMessage(
        'notification_engine_undelegate',
        {
          from: p.from,
          to: p.to,
          amount: `${p.amount} ${p.symbol}`,
        },
        p.from,
        p.from,
        walletTabFromSymbol(p.symbol),
        {
          from: profileHref(p.from),
          to: profileHref(p.to),
        },
      );
    }
    case 'engine_unstake':
    case 'engine_cancel_unstake': {
      const p = event.payload;
      return walletMessage(
        'notification_engine_power_down',
        {
          from: p.account,
          amount: `${p.amount} ${p.symbol}`,
        },
        p.account,
        p.account,
        walletTabFromSymbol(p.symbol),
        { from: profileHref(p.account) },
      );
    }
    default:
      return null;
  }
}
