import { Injectable } from '@nestjs/common';
import { normalizeHiveBlockTimestampUtc } from '@opden-data-layer/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  HiveEngineBlock,
  HiveEngineTokensLogEvent,
  HiveEngineTokensLogs,
  HiveEngineTransaction,
} from '@opden-data-layer/clients';
import { NotificationEmitterService } from '../../notification-adapter/notification-emitter.service';
import {
  USER_OBJECT_POWERS_UPDATE_EVENT,
  UserObjectPowersUpdateEvent,
} from '../../user-object-powers/user-object-powers.events';
import type { HiveEngineSubParser } from '../hive-engine-sub-parser.interface';

const TOKENS_CONTRACT = 'tokens';
const WAIV_SYMBOL = 'WAIV';
const TRACKED_ACTIONS = new Set([
  'stake',
  'delegate',
  'undelegate',
  'unstake',
  'checkPendingUnstakes',
  'checkPendingUndelegations',
]);

const ACTION_LOG_EVENTS: Record<string, readonly string[]> = {
  stake: ['stake'],
  delegate: ['delegate'],
  undelegate: ['undelegateStart'],
  unstake: ['unstakeStart'],
  checkPendingUnstakes: ['unstake'],
  checkPendingUndelegations: ['undelegateDone'],
};

const PAYLOAD_FALLBACK_ACTIONS = new Set(['stake', 'delegate', 'undelegate', 'unstake']);

/**
 * Tracks WAIV stake/delegate operations from Hive Engine `tokens` contract logs
 * and emits `user_object_powers.update` deltas when stake or delegationsIn change.
 *
 * @see docs/spec/waiv-power.md
 */
@Injectable()
export class WaivStakeParser implements HiveEngineSubParser {
  private currentBlock: HiveEngineBlock | null = null;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationEmitter: NotificationEmitterService,
  ) {}

  async parseBlock(block: HiveEngineBlock): Promise<void> {
    this.currentBlock = block;
    const txs = [...block.transactions, ...(block.virtualTransactions ?? [])];
    for (const tx of txs) {
      this.processTransaction(tx);
    }
    this.currentBlock = null;
  }

  private processTransaction(tx: HiveEngineTransaction): void {
    if (tx.contract === TOKENS_CONTRACT && tx.action === 'transfer') {
      this.processTransfer(tx);
      return;
    }
    if (tx.contract !== TOKENS_CONTRACT || !TRACKED_ACTIONS.has(tx.action)) {
      return;
    }

    const allowedEvents = ACTION_LOG_EVENTS[tx.action];
    if (!allowedEvents) {
      return;
    }

    const events = this.parseLogs(tx);
    const logErrors = this.hasLogErrors(tx);
    let notificationEmitted = false;

    for (const ev of events) {
      if (!allowedEvents.includes(ev.event)) {
        continue;
      }
      if (this.processLogEvent(tx, ev)) {
        notificationEmitted = true;
      }
    }

    if (!notificationEmitted && !logErrors && PAYLOAD_FALLBACK_ACTIONS.has(tx.action)) {
      this.tryPayloadFallbackNotification(tx);
    }
  }

  private processLogEvent(
    tx: HiveEngineTransaction,
    ev: HiveEngineTokensLogEvent,
  ): boolean {
    if (ev.data.symbol !== WAIV_SYMBOL) {
      return false;
    }

    const quantity = parseFloat(String(ev.data.quantity ?? '0'));
    if (!Number.isFinite(quantity) || quantity === 0) {
      return false;
    }

    switch (ev.event) {
      case 'unstake': {
        const account = String(ev.data.account ?? '').trim();
        this.emitDelta(account, -quantity);
        return false;
      }
      case 'unstakeStart': {
        const account = tx.sender.trim();
        this.emitEngineNotification('engine_unstake', account, {
          account,
          amount: String(quantity),
          symbol: WAIV_SYMBOL,
        });
        return true;
      }
      case 'undelegateDone': {
        const account = String(ev.data.account ?? '').trim();
        this.emitDelta(account, quantity);
        return false;
      }
      case 'delegate': {
        const to = String(ev.data.to ?? '').trim();
        const from = tx.sender.trim();
        this.emitDelta(from, -quantity);
        this.emitDelta(to, quantity);
        this.emitEngineNotification('engine_delegate', from, {
          from,
          to,
          amount: String(quantity),
          symbol: WAIV_SYMBOL,
        });
        return true;
      }
      case 'undelegateStart': {
        const delegatee = String(ev.data.from ?? '').trim();
        const delegator = tx.sender.trim();
        this.emitDelta(delegatee, -quantity);
        this.emitEngineNotification('engine_undelegate', delegator, {
          from: delegator,
          to: delegatee,
          amount: String(quantity),
          symbol: WAIV_SYMBOL,
        });
        return true;
      }
      case 'stake': {
        const account = String(ev.data.account ?? '').trim();
        this.emitDelta(account, quantity);
        this.emitEngineNotification('engine_stake', account, {
          from: tx.sender.trim(),
          to: account,
          amount: String(quantity),
          symbol: WAIV_SYMBOL,
        });
        return true;
      }
      default:
        return false;
    }
  }

  private tryPayloadFallbackNotification(tx: HiveEngineTransaction): void {
    const payload = this.parsePayload(tx);
    if (!payload) {
      return;
    }

    const symbol = String(payload.symbol ?? '');
    if (symbol !== WAIV_SYMBOL) {
      return;
    }

    const quantity = parseFloat(String(payload.quantity ?? '0'));
    if (!Number.isFinite(quantity) || quantity === 0) {
      return;
    }

    const sender = tx.sender.trim();
    const amount = String(quantity);

    switch (tx.action) {
      case 'stake': {
        const to = String(payload.to ?? sender).trim();
        this.emitEngineNotification('engine_stake', sender, {
          from: sender,
          to,
          amount,
          symbol: WAIV_SYMBOL,
        });
        break;
      }
      case 'delegate': {
        const to = String(payload.to ?? '').trim();
        if (to === '') {
          return;
        }
        this.emitEngineNotification('engine_delegate', sender, {
          from: sender,
          to,
          amount,
          symbol: WAIV_SYMBOL,
        });
        break;
      }
      case 'undelegate': {
        const to = String(payload.from ?? '').trim();
        if (to === '') {
          return;
        }
        this.emitEngineNotification('engine_undelegate', sender, {
          from: sender,
          to,
          amount,
          symbol: WAIV_SYMBOL,
        });
        break;
      }
      case 'unstake':
        this.emitEngineNotification('engine_unstake', sender, {
          account: sender,
          amount,
          symbol: WAIV_SYMBOL,
        });
        break;
      default:
        break;
    }
  }

  private parsePayload(tx: HiveEngineTransaction): Record<string, unknown> | null {
    try {
      if (typeof tx.payload === 'string') {
        const parsed = JSON.parse(tx.payload) as Record<string, unknown>;
        return Object.keys(parsed).length > 0 ? parsed : null;
      }
      const payload = tx.payload as Record<string, unknown>;
      return payload && Object.keys(payload).length > 0 ? payload : null;
    } catch {
      return null;
    }
  }

  private parseLogs(tx: HiveEngineTransaction): HiveEngineTokensLogEvent[] {
    try {
      const logs = JSON.parse(tx.logs) as HiveEngineTokensLogs;
      return logs.events ?? [];
    } catch {
      return [];
    }
  }

  private hasLogErrors(tx: HiveEngineTransaction): boolean {
    try {
      const logs = JSON.parse(tx.logs) as HiveEngineTokensLogs & { errors?: unknown };
      return Boolean(logs.errors);
    } catch {
      return false;
    }
  }

  private emitDelta(account: string, delta: number): void {
    const trimmed = account.trim();
    if (trimmed.length === 0 || delta === 0) {
      return;
    }
    this.eventEmitter.emit(
      USER_OBJECT_POWERS_UPDATE_EVENT,
      new UserObjectPowersUpdateEvent(trimmed, delta),
    );
  }

  private processTransfer(tx: HiveEngineTransaction): void {
    const payload = this.parsePayload(tx);
    if (!payload) {
      return;
    }
    const symbol = String(payload.symbol ?? '');
    if (symbol !== WAIV_SYMBOL) {
      return;
    }
    const from = tx.sender.trim();
    const to = String(payload.to ?? '').trim();
    const amount = String(payload.quantity ?? '0');
    const memo = typeof payload.memo === 'string' ? payload.memo : null;
    this.emitEngineNotification('engine_transfer', from, {
      from,
      to,
      amount,
      symbol,
      memo,
    });
  }

  private emitEngineNotification(
    type:
      | 'engine_transfer'
      | 'engine_stake'
      | 'engine_unstake'
      | 'engine_delegate'
      | 'engine_undelegate',
    actor: string,
    payload: Record<string, unknown>,
  ): void {
    const block = this.currentBlock;
    if (!block) {
      return;
    }
    this.notificationEmitter.emit({
      type,
      occurredAt: normalizeHiveBlockTimestampUtc(
        block.timestamp ?? '1970-01-01T00:00:00',
      ),
      blockNum: block.refHiveBlockNumber || block.blockNumber,
      trxId: null,
      objectId: null,
      actor,
      payload,
    } as Parameters<NotificationEmitterService['emit']>[0]);
  }
}
