import {
  classifyActivityOperation,
  HIVE_OP,
  parseCustomJsonOp,
  vestToHp,
} from '@opden-data-layer/core/hive-account-history';

import type { ActivityItemApi } from '../dto/activity-api.schema';
import type {
  ActivityChainContextView,
  ActivityRowView,
} from '../../domain/types/activity-row-view';

export type BuildActivityRowContext = {
  profileAccount: string;
  chainContext: ActivityChainContextView;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value) || 0;
}

function asBool(value: unknown): boolean {
  return value === true;
}

function parseAssetAmount(raw: unknown): { amount: string; currency: string } {
  const text = asString(raw);
  const parts = text.trim().split(/\s+/);
  if (parts.length >= 2) {
    return { amount: parts[0] ?? text, currency: parts[1] ?? '' };
  }
  return { amount: text, currency: '' };
}

function profileLower(profileAccount: string): string {
  return profileAccount.trim().toLowerCase();
}

export function buildActivityRowView(
  item: ActivityItemApi,
  ctx: BuildActivityRowContext,
): ActivityRowView | null {
  const kind = classifyActivityOperation(item.type, item.payload);
  if (kind === 'hidden') {
    return null;
  }

  const base = { id: item.id, timestamp: item.timestamp };
  const p = item.payload;
  const profile = profileLower(ctx.profileAccount);
  const { totalVestingShares, totalVestingFundSteem } = ctx.chainContext;

  switch (kind) {
    case 'vote':
      return {
        ...base,
        kind: 'vote',
        voter: asString(p.voter),
        author: asString(p.author),
        permlink: asString(p.permlink),
        weight: asNumber(p.weight),
        isProfileActor: asString(p.voter).toLowerCase() === profile,
      };
    case 'comment': {
      const parentAuthor = asString(p.parent_author);
      return {
        ...base,
        kind: 'comment',
        author: asString(p.author),
        permlink: asString(p.permlink),
        parentAuthor,
        parentPermlink: asString(p.parent_permlink),
        isPost: parentAuthor === '',
        isProfileActor: asString(p.author).toLowerCase() === profile,
      };
    }
    case 'delete_comment':
      return {
        ...base,
        kind: 'delete_comment',
        author: asString(p.author),
        permlink: asString(p.permlink),
      };
    case 'custom_follow': {
      const parsed = parseCustomJsonOp(
        asString(p.id),
        asString(p.json),
      );
      if (parsed.kind !== 'follow') {
        return genericRow(base, item);
      }
      return {
        ...base,
        kind: 'custom_follow',
        follower: parsed.follower,
        following: parsed.following,
        what: parsed.what,
      };
    }
    case 'custom_reblog': {
      const parsed = parseCustomJsonOp(asString(p.id), asString(p.json));
      if (parsed.kind !== 'reblog') {
        return genericRow(base, item);
      }
      return {
        ...base,
        kind: 'custom_reblog',
        account: parsed.account,
        author: parsed.author,
        permlink: parsed.permlink,
      };
    }
    case 'custom_follow_object': {
      const parsed = parseCustomJsonOp(asString(p.id), asString(p.json));
      if (parsed.kind !== 'follow_object') {
        return genericRow(base, item);
      }
      return {
        ...base,
        kind: 'custom_follow_object',
        objectName: parsed.objectName,
        objectPermlink: parsed.objectPermlink,
        objectType: parsed.objectType,
        isFollow: parsed.isFollow,
      };
    }
    case 'account_create':
      return {
        ...base,
        kind: 'account_create',
        creator: asString(p.creator),
        newAccount: asString(p.new_account_name),
        withDelegation: item.type === HIVE_OP.ACCOUNT_CREATE_WITH_DELEGATION,
      };
    case 'account_update':
      return {
        ...base,
        kind: 'account_update',
        account: asString(p.account) || ctx.profileAccount,
      };
    case 'reward_author': {
      const rewards: string[] = [];
      const hbd = parseFloat(asString(p.hbd_payout));
      const hive = parseFloat(asString(p.hive_payout));
      const vests = asString(p.vesting_payout);
      if (hbd > 0) {
        rewards.push(`${hbd.toFixed(3)} HBD`);
      }
      if (hive > 0) {
        rewards.push(`${hive.toFixed(3)} HIVE`);
      }
      const hp = vestToHp(vests, totalVestingShares, totalVestingFundSteem);
      if (hp > 0) {
        rewards.push(`${hp.toFixed(3)} HP`);
      }
      return {
        ...base,
        kind: 'reward_author',
        author: asString(p.author),
        permlink: asString(p.permlink),
        rewards,
      };
    }
    case 'reward_curation':
      return {
        ...base,
        kind: 'reward_curation',
        author: asString(p.comment_author),
        permlink: asString(p.comment_permlink),
        hpAmount: vestToHp(
          asString(p.reward),
          totalVestingShares,
          totalVestingFundSteem,
        ),
      };
    case 'witness_vote':
      return {
        ...base,
        kind: 'witness_vote',
        account: asString(p.account),
        witness: asString(p.witness),
        approved: asBool(p.approve),
      };
    case 'wallet_transfer': {
      const { amount, currency } = parseAssetAmount(p.amount);
      const to = asString(p.to).toLowerCase();
      const from = asString(p.from);
      return {
        ...base,
        kind: 'wallet_transfer',
        direction: to === profile ? 'in' : 'out',
        amount,
        currency,
        counterparty: to === profile ? from : asString(p.to),
        memo: asString(p.memo),
      };
    }
    case 'wallet_power_up': {
      const { amount, currency } = parseAssetAmount(p.amount);
      const to = asString(p.to).toLowerCase();
      const from = asString(p.from);
      const direction = to === profile ? 'in' : 'out';
      return {
        ...base,
        kind: 'wallet_power_up',
        direction,
        amount,
        currency: direction === 'in' ? 'HP' : currency || 'HIVE',
        counterparty: direction === 'in' ? from : asString(p.to),
      };
    }
    case 'wallet_savings': {
      const { amount, currency } = parseAssetAmount(
        p.amount ?? p.interest,
      );
      return {
        ...base,
        kind: 'wallet_savings',
        operationType: item.type,
        amount,
        currency,
      };
    }
    case 'wallet_claim_rewards': {
      const hp = vestToHp(
        asString(p.reward_vests),
        totalVestingShares,
        totalVestingFundSteem,
      );
      return {
        ...base,
        kind: 'wallet_claim_rewards',
        hive: asString(p.reward_hive),
        hbd: asString(p.reward_hbd),
        hp: hp > 0 ? `${hp.toFixed(3)} HP` : '',
      };
    }
    case 'wallet_delegate':
      return {
        ...base,
        kind: 'wallet_delegate',
        delegator: asString(p.delegator),
        delegatee: asString(p.delegatee),
        hpAmount: vestToHp(
          asString(p.vesting_shares),
          totalVestingShares,
          totalVestingFundSteem,
        ),
      };
    case 'wallet_power_down': {
      if (item.type === HIVE_OP.WITHDRAW_VESTING) {
        const vests = asString(p.vesting_shares);
        const hp = vestToHp(vests, totalVestingShares, totalVestingFundSteem);
        const isStart = parseFloat(vests) > 0;
        return {
          ...base,
          kind: 'wallet_power_down',
          subtype: isStart ? 'start' : 'stop',
          hpAmount: `${hp.toFixed(3)} HP`,
        };
      }
      if (item.type === HIVE_OP.SET_WITHDRAW_VESTING_ROUTE) {
        return {
          ...base,
          kind: 'wallet_power_down',
          subtype: 'route',
          hpAmount: '',
          from: asString(p.from_account),
          to: asString(p.to_account),
          percent: asNumber(p.percent),
        };
      }
      return {
        ...base,
        kind: 'wallet_power_down',
        subtype: 'withdraw',
        hpAmount: asString(p.deposited) || asString(p.amount),
      };
    }
    case 'wallet_convert': {
      const subtype =
        item.type === HIVE_OP.CONVERT
          ? 'hbd_request'
          : item.type === HIVE_OP.FILL_CONVERT_REQUEST
            ? 'hbd_completed'
            : item.type === HIVE_OP.COLLATERALIZED_CONVERT
              ? 'hive_request'
              : 'hive_completed';
      return {
        ...base,
        kind: 'wallet_convert',
        subtype,
        amountIn: asString(p.amount) || asString(p.requested_collateral_amount),
        amountOut: asString(p.amount_out) || '',
      };
    }
    case 'wallet_fill_order': {
      const current = parseAssetAmount(p.current_pays);
      const open = parseAssetAmount(p.open_pays);
      return {
        ...base,
        kind: 'wallet_fill_order',
        currentPays: `${current.amount} ${current.currency}`.trim(),
        openPays: `${open.amount} ${open.currency}`.trim(),
      };
    }
    case 'wallet_limit_order': {
      const sell = parseAssetAmount(p.amount_to_sell);
      const minReceive = parseAssetAmount(p.min_to_receive);
      return {
        ...base,
        kind: 'wallet_limit_order',
        seller: asString(p.seller),
        amountToSell: `${sell.amount} ${sell.currency}`.trim(),
        minToReceive: `${minReceive.amount} ${minReceive.currency}`.trim(),
      };
    }
    default:
      return genericRow(base, item);
  }
}

function genericRow(
  base: { id: string; timestamp: string },
  item: ActivityItemApi,
): ActivityRowView {
  return {
    ...base,
    kind: 'generic',
    type: item.type,
    fields: item.payload,
  };
}

export function buildActivityPageViews(
  items: ActivityItemApi[],
  ctx: BuildActivityRowContext,
): ActivityRowView[] {
  return items
    .map((item) => buildActivityRowView(item, ctx))
    .filter((row): row is ActivityRowView => row !== null);
}
