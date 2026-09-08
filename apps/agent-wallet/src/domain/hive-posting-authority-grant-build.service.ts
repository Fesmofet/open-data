import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildAccountUpdatePostingOp,
  mergeHiveAccountAuths,
  type HiveWireOperation,
} from '@opden-data-layer/hive-broadcast';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { normalizeHiveAccount } from '../utils/hive-account';
import { HiveChainContextService } from './hive-chain-context.service';
import { LocalKeysService } from './local-keys.service';

export type PostingAuthorityGrantAction = 'add' | 'remove';

export type BuildPostingAuthorityGrantInput = {
  account: string;
  grantee: string;
  action: PostingAuthorityGrantAction;
};

export type PostingAuthorityGrantBuildResult = {
  ops: HiveWireOperation[];
  opsCount: number;
  keyType: 'active';
  signerAccount: string;
  canSignLocally: boolean;
  warnings: string[];
};

@Injectable()
export class HivePostingAuthorityGrantBuildService {
  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly chainContext: HiveChainContextService,
    private readonly localKeys: LocalKeysService,
  ) {}

  async buildPostingAuthorityGrant(
    input: BuildPostingAuthorityGrantInput,
  ): Promise<PostingAuthorityGrantBuildResult> {
    const grantor = normalizeHiveAccount(input.account);
    const grantee = normalizeHiveAccount(input.grantee);
    const warnings: string[] = [];

    if (!grantor || !grantee) {
      throw new Error('account and grantee are required');
    }

    const snapshot = await this.chainContext.getAccount(grantor);
    if (!snapshot) {
      throw new Error(`Hive account not found: ${grantor}`);
    }

    const existingNames = new Set(
      snapshot.posting.account_auths.map(([name]) => name.toLowerCase()),
    );
    const granteePresent = existingNames.has(grantee);

    if (input.action === 'add' && granteePresent) {
      warnings.push(`Grantee ${grantee} is already in ${grantor} posting.account_auths`);
      return this.buildResult([], grantor, warnings);
    }
    if (input.action === 'remove' && !granteePresent) {
      warnings.push(`Grantee ${grantee} is not in ${grantor} posting.account_auths`);
      return this.buildResult([], grantor, warnings);
    }

    const accountAuths =
      input.action === 'add'
        ? mergeHiveAccountAuths({
            existing: snapshot.posting.account_auths,
            add: grantee,
          })
        : mergeHiveAccountAuths({
            existing: snapshot.posting.account_auths,
            remove: grantee,
          });

    const op = buildAccountUpdatePostingOp({
      account: grantor,
      posting: {
        weight_threshold: snapshot.posting.weight_threshold,
        account_auths: accountAuths,
        key_auths: snapshot.posting.key_auths,
      },
      memoKey: snapshot.memo_key,
      jsonMetadata: snapshot.json_metadata,
    });

    return this.buildResult([op], grantor, warnings);
  }

  private buildResult(
    ops: HiveWireOperation[],
    signerAccount: string,
    warnings: string[],
  ): PostingAuthorityGrantBuildResult {
    const signingMode = this.config.get('signingMode', { infer: true });
    const grantorReadiness = this.localKeys.getReadiness(signerAccount);
    const canSignLocally =
      this.localKeys.hasAccount(signerAccount) && grantorReadiness.activeReady;

    if (!this.localKeys.hasAccount(signerAccount)) {
      warnings.push('Grantor is not in the local key registry — returned ops are payload only');
    } else if (!grantorReadiness.activeReady) {
      warnings.push(
        `Active key for @${signerAccount} is not configured — payload only`,
      );
    } else if (signingMode === 'has') {
      warnings.push(
        'HAS mode: broadcast via has_broadcast with keyType active (phone approval required)',
      );
    }

    return {
      ops,
      opsCount: ops.length,
      keyType: 'active',
      signerAccount,
      canSignLocally,
      warnings,
    };
  }
}
