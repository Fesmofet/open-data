import { Injectable } from '@nestjs/common';
import { hpToVestingShares } from '@opden-data-layer/core/hive-account-history';
import {
  buildDelegateRcOp,
  buildDelegateVestingSharesOp,
  buildHiveEngineTokensOp,
  type HiveOperation,
} from '@opden-data-layer/hive-broadcast';

import {
  HIVE_MIN_DELEGATION_HP,
  HIVE_RC_DELEGATOR_RESERVE,
  HIVE_RC_MAX_DELEGATEES_PER_OP,
} from '../constants/hive-delegation';
import { HiveChainContextService } from './hive-chain-context.service';

export type WalletDelegationKeyType = 'posting' | 'active';

export type WalletDelegationBuildResult = {
  ops: HiveOperation[];
  opsCount: number;
  keyType: WalletDelegationKeyType;
  warnings: string[];
};

export type BuildHpDelegationInput = {
  delegator: string;
  delegatee: string;
  amountHp?: number;
  vestingShares?: string;
};

export type BuildRcDelegationInput = {
  from: string;
  delegatees: readonly string[];
  maxRc: number;
};

export type BuildEngineDelegationInput = {
  account: string;
  symbol: string;
  quantity: string;
  action: 'delegate' | 'undelegate';
  to?: string;
  from?: string;
};

@Injectable()
export class WalletDelegationBuildService {
  constructor(private readonly chainContext: HiveChainContextService) {}

  async buildHpDelegation(
    input: BuildHpDelegationInput,
  ): Promise<WalletDelegationBuildResult> {
    const hasHp = input.amountHp !== undefined;
    const hasVests = input.vestingShares !== undefined;
    if (hasHp === hasVests) {
      throw new Error('Provide exactly one of amountHp or vestingShares');
    }

    const delegator = input.delegator.trim().toLowerCase();
    const delegatee = input.delegatee.trim().toLowerCase();
    const warnings: string[] = [];

    let vestingShares: string;
    if (hasVests) {
      vestingShares = input.vestingShares!.trim();
    } else {
      const amountHp = input.amountHp!;
      if (amountHp > 0 && amountHp < HIVE_MIN_DELEGATION_HP) {
        warnings.push(
          `amountHp ${amountHp} is below the typical minimum delegation of ${HIVE_MIN_DELEGATION_HP} HP`,
        );
      }
      if (amountHp === 0) {
        vestingShares = '0.000000 VESTS';
      } else {
        const chain = await this.chainContext.getChainContext();
        vestingShares = hpToVestingShares(
          amountHp,
          chain.totalVestingShares,
          chain.totalVestingFundSteem,
        );
      }
    }

    const op = buildDelegateVestingSharesOp({
      delegator,
      delegatee,
      vestingShares,
    });

    return {
      ops: [op],
      opsCount: 1,
      keyType: 'active',
      warnings,
    };
  }

  buildRcDelegation(input: BuildRcDelegationInput): WalletDelegationBuildResult {
    const from = input.from.trim().toLowerCase();
    const delegatees = input.delegatees.map((name) => name.trim().toLowerCase());

    if (delegatees.length === 0) {
      throw new Error('delegatees must contain at least one account');
    }
    if (delegatees.length > HIVE_RC_MAX_DELEGATEES_PER_OP) {
      throw new Error(
        `delegatees exceeds maximum of ${HIVE_RC_MAX_DELEGATEES_PER_OP} accounts per operation`,
      );
    }
    if (!Number.isSafeInteger(input.maxRc) || input.maxRc < 0) {
      throw new Error('maxRc must be a non-negative integer');
    }

    const warnings: string[] = [];
    if (input.maxRc > 0) {
      warnings.push(
        `Delegators must keep at least ${HIVE_RC_DELEGATOR_RESERVE} RC on the account; reducing RC burns unused delegated RC`,
      );
    }

    const op = buildDelegateRcOp({
      from,
      delegatees,
      maxRc: input.maxRc,
    });

    return {
      ops: [op],
      opsCount: 1,
      keyType: 'posting',
      warnings,
    };
  }

  buildEngineDelegation(
    input: BuildEngineDelegationInput,
  ): WalletDelegationBuildResult {
    const account = input.account.trim().toLowerCase();
    const symbol = input.symbol.trim().toUpperCase();
    const quantity = input.quantity.trim();

    if (input.action === 'delegate') {
      if (!input.to?.trim()) {
        throw new Error('to is required when action is delegate');
      }
      const op = buildHiveEngineTokensOp({
        account,
        contractAction: 'delegate',
        payload: {
          symbol,
          quantity,
          to: input.to.trim().toLowerCase(),
        },
      });
      return {
        ops: [op],
        opsCount: 1,
        keyType: 'active',
        warnings: [],
      };
    }

    if (!input.from?.trim()) {
      throw new Error('from is required when action is undelegate');
    }
    const op = buildHiveEngineTokensOp({
      account,
      contractAction: 'undelegate',
      payload: {
        symbol,
        quantity,
        from: input.from.trim().toLowerCase(),
      },
    });
    return {
      ops: [op],
      opsCount: 1,
      keyType: 'active',
      warnings: [],
    };
  }
}
