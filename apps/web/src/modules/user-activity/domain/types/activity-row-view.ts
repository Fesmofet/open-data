export type ActivityChainContextView = {
  totalVestingShares: string;
  totalVestingFundSteem: string;
};

export type ActivityRowView =
  | {
      kind: 'vote';
      id: string;
      timestamp: string;
      voter: string;
      author: string;
      permlink: string;
      weight: number;
      isProfileActor: boolean;
    }
  | {
      kind: 'comment';
      id: string;
      timestamp: string;
      author: string;
      permlink: string;
      parentAuthor: string;
      parentPermlink: string;
      isPost: boolean;
      isProfileActor: boolean;
    }
  | {
      kind: 'delete_comment';
      id: string;
      timestamp: string;
      author: string;
      permlink: string;
    }
  | {
      kind: 'custom_follow';
      id: string;
      timestamp: string;
      follower: string;
      following: string;
      what: 'blog' | 'ignore' | 'unfollow';
    }
  | {
      kind: 'custom_reblog';
      id: string;
      timestamp: string;
      account: string;
      author: string;
      permlink: string;
    }
  | {
      kind: 'custom_follow_object';
      id: string;
      timestamp: string;
      objectName: string;
      objectPermlink: string;
      objectType: string;
      isFollow: boolean;
    }
  | {
      kind: 'account_create';
      id: string;
      timestamp: string;
      creator: string;
      newAccount: string;
      withDelegation: boolean;
    }
  | {
      kind: 'account_update';
      id: string;
      timestamp: string;
      account: string;
    }
  | {
      kind: 'reward_author';
      id: string;
      timestamp: string;
      author: string;
      permlink: string;
      rewards: string[];
    }
  | {
      kind: 'reward_curation';
      id: string;
      timestamp: string;
      author: string;
      permlink: string;
      hpAmount: number;
    }
  | {
      kind: 'witness_vote';
      id: string;
      timestamp: string;
      account: string;
      witness: string;
      approved: boolean;
    }
  | {
      kind: 'wallet_transfer';
      id: string;
      timestamp: string;
      direction: 'in' | 'out' | 'self';
      amount: string;
      currency: string;
      counterparty: string;
      memo: string;
    }
  | {
      kind: 'wallet_power_up';
      id: string;
      timestamp: string;
      direction: 'in' | 'out';
      amount: string;
      currency: string;
      counterparty: string;
    }
  | {
      kind: 'wallet_savings';
      id: string;
      timestamp: string;
      operationType: string;
      amount: string;
      currency: string;
      requestId?: string;
    }
  | {
      kind: 'wallet_claim_rewards';
      id: string;
      timestamp: string;
      hive: string;
      hbd: string;
      hp: string;
    }
  | {
      kind: 'wallet_delegate';
      id: string;
      timestamp: string;
      delegator: string;
      delegatee: string;
      hpAmount: number;
      isUndelegation: boolean;
    }
  | {
      kind: 'wallet_power_down';
      id: string;
      timestamp: string;
      subtype: 'start' | 'stop' | 'withdraw' | 'route';
      hpAmount: string;
      from?: string;
      to?: string;
      percent?: number;
      counterparty?: string;
      direction?: 'in' | 'out';
    }
  | {
      kind: 'wallet_convert';
      id: string;
      timestamp: string;
      subtype: 'hbd_request' | 'hbd_completed' | 'hive_request' | 'hive_completed';
      amountIn: string;
      amountOut: string;
    }
  | {
      kind: 'wallet_fill_order';
      id: string;
      timestamp: string;
      currentPays: string;
      openPays: string;
      exchanger: string;
      transferAmount: string;
      receivedAmount: string;
      isSeller: boolean;
    }
  | {
      kind: 'wallet_limit_order';
      id: string;
      timestamp: string;
      amountToSell: string;
      minToReceive: string;
      seller: string;
    }
  | {
      kind: 'wallet_cancel_order';
      id: string;
      timestamp: string;
      openPays: string;
      currentPays: string;
    }
  | {
      kind: 'wallet_proposal_pay';
      id: string;
      timestamp: string;
      receiver: string;
      payer: string;
      amount: string;
      direction: 'in' | 'out';
    }
  | {
      kind: 'generic';
      id: string;
      timestamp: string;
      type: string;
      fields: Record<string, unknown>;
    };

export type ActivityPageView = {
  items: ActivityRowView[];
  cursor: string | null;
  hasMore: boolean;
  chainContext: ActivityChainContextView;
};

export type ActivityLoadError = 'unavailable' | 'invalid_response';

export type ActivityPageQueryResult = {
  page: ActivityPageView;
  error: ActivityLoadError | null;
};
