import { Injectable, Logger } from '@nestjs/common';
import type { CustomJsonOperation } from '@hiveio/dhive/lib/chain/operation';
import { normalizeRcAmount } from '@opden-data-layer/core';
import { UserRcDelegationsRepository } from '../../repositories/user-rc-delegations.repository';
import { normalizeHiveAccountName } from './parse-vesting-shares';

const DELEGATE_RC_OP = 'delegate_rc';

type DelegateRcPayload = {
  from?: string;
  delegatees?: string[];
  max_rc?: number;
};

function parseDelegateRcJson(json: string): DelegateRcPayload | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed) || parsed.length < 2) {
      return null;
    }
    if (parsed[0] !== DELEGATE_RC_OP) {
      return null;
    }
    const payload = parsed[1];
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    return payload as DelegateRcPayload;
  } catch {
    return null;
  }
}

@Injectable()
export class HiveRcDelegationService {
  private readonly logger = new Logger(HiveRcDelegationService.name);

  constructor(private readonly userRcDelegations: UserRcDelegationsRepository) {}

  async handleRcCustomJson(payload: CustomJsonOperation[1]): Promise<void> {
    const body = parseDelegateRcJson(payload.json);
    if (!body) {
      return;
    }

    const postingAuth = payload.required_posting_auths?.[0];
    const bodyFrom = body.from ? normalizeHiveAccountName(body.from) : '';
    const delegator = normalizeHiveAccountName(postingAuth ?? body.from ?? '');
    if (delegator === '') {
      this.logger.warn('delegate_rc missing delegator from posting auth');
      return;
    }
    if (bodyFrom !== '' && bodyFrom !== delegator) {
      this.logger.warn(
        `delegate_rc body.from (${bodyFrom}) does not match posting auth (${delegator}); using posting auth`,
      );
    }

    const delegatees = (body.delegatees ?? [])
      .map((name) => normalizeHiveAccountName(name))
      .filter((name) => name !== '');
    if (delegatees.length === 0) {
      return;
    }

    const maxRc = body.max_rc ?? 0;
    if (maxRc === 0) {
      await this.userRcDelegations.removeRcDelegations(delegator, delegatees);
      return;
    }

    for (const delegatee of delegatees) {
      await this.userRcDelegations.upsertRcDelegation({
        delegator,
        delegatee,
        rc: String(normalizeRcAmount(maxRc)),
      });
    }
  }
}
