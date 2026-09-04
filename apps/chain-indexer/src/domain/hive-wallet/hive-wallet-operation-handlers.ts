import { Injectable } from '@nestjs/common';
import { HIVE_OPERATION } from '../../constants/hive-parser';
import type { HiveOperationHandlerContext } from '../hive-parser/hive-handler-context';
import type { RegisteredHiveOperationHandler } from '../hive-parser/hive-operation-handler';
import { NotificationEmitterService } from '../notification-adapter/notification-emitter.service';
import { HiveChainContextCache } from './hive-chain-context.cache';
import { parseClaimRewardNotificationPayload } from './parse-claim-reward-notification-payload';

function assetAmount(value: unknown): { amount: string; symbol: string } {
  if (typeof value === 'string') {
    const parts = value.trim().split(/\s+/);
    return { amount: parts[0] ?? '0', symbol: parts[1] ?? '' };
  }
  return { amount: '0', symbol: '' };
}

function sameHiveAccount(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

@Injectable()
export class HiveWalletOperationHandlers {
  constructor(
    private readonly notificationEmitter: NotificationEmitterService,
    private readonly hiveChainContext: HiveChainContextCache,
  ) {}

  list(): RegisteredHiveOperationHandler[] {
    return [
      {
        operation: HIVE_OPERATION.TRANSFER,
        handle: async (payload, ctx) => {
          this.handleTransfer(payload, ctx);
        },
      },
      {
        operation: HIVE_OPERATION.TRANSFER_TO_VESTING,
        handle: async (payload, ctx) => {
          this.handleTransferToVesting(payload, ctx);
        },
      },
      {
        operation: HIVE_OPERATION.WITHDRAW_VESTING,
        handle: async (payload, ctx) => {
          this.handleWithdrawVesting(payload, ctx);
        },
      },
      {
        operation: HIVE_OPERATION.CLAIM_REWARD_BALANCE,
        handle: async (payload, ctx) => {
          await this.handleClaimReward(payload, ctx);
        },
      },
      {
        operation: HIVE_OPERATION.ACCOUNT_WITNESS_VOTE,
        handle: async (payload, ctx) => {
          this.handleWitnessVote(payload, ctx);
        },
      },
      {
        operation: HIVE_OPERATION.CHANGE_RECOVERY_ACCOUNT,
        handle: async (payload, ctx) => {
          this.handleChangeRecovery(payload, ctx);
        },
      },
      {
        operation: HIVE_OPERATION.SET_WITHDRAW_VESTING_ROUTE,
        handle: async (payload, ctx) => {
          this.handleWithdrawRoute(payload, ctx);
        },
      },
      {
        operation: HIVE_OPERATION.TRANSFER_FROM_SAVINGS,
        handle: async (payload, ctx) => {
          this.handleTransferFromSavings(payload, ctx);
        },
      },
      {
        operation: HIVE_OPERATION.FILL_ORDER,
        handle: async (payload, ctx) => {
          this.handleFillOrder(payload, ctx);
        },
      },
    ];
  }

  private handleTransfer(
    payload: Record<string, unknown>,
    ctx: HiveOperationHandlerContext,
  ): void {
    const from = String(payload.from ?? '');
    const to = String(payload.to ?? '');
    const { amount, symbol } = assetAmount(payload.amount);
    const memo =
      typeof payload.memo === 'string' ? payload.memo : null;
    const emitCtx = this.notificationEmitter.hiveContext(ctx);
    if (to) {
      this.notificationEmitter.emitWithContext(emitCtx, {
        type: 'transfer_in',
        objectId: null,
        actor: from,
        payload: { from, to, amount, symbol, memo },
      });
    }
    if (from && !sameHiveAccount(from, to)) {
      this.notificationEmitter.emitWithContext(emitCtx, {
        type: 'transfer_out',
        objectId: null,
        actor: from,
        payload: { from, to, amount, symbol, memo },
      });
    }
  }

  private handleTransferToVesting(
    payload: Record<string, unknown>,
    ctx: HiveOperationHandlerContext,
  ): void {
    const from = String(payload.from ?? '');
    const to = String(payload.to ?? '');
    const { amount } = assetAmount(payload.amount);
    this.notificationEmitter.emitWithContext(
      this.notificationEmitter.hiveContext(ctx),
      {
        type: 'power_up',
        objectId: null,
        actor: from,
        payload: { from, to, amount },
      },
    );
  }

  private handleWithdrawVesting(
    payload: Record<string, unknown>,
    ctx: HiveOperationHandlerContext,
  ): void {
    const account = String(payload.account ?? '');
    const { amount, symbol } = assetAmount(payload.vesting_shares);
    const amountLabel = symbol ? `${amount} ${symbol}` : amount;
    this.notificationEmitter.emitWithContext(
      this.notificationEmitter.hiveContext(ctx),
      {
        type: 'power_down',
        objectId: null,
        actor: account,
        payload: { account, amount: amountLabel },
      },
    );
  }

  private async handleClaimReward(
    payload: Record<string, unknown>,
    ctx: HiveOperationHandlerContext,
  ): Promise<void> {
    const account = String(payload.account ?? '');
    const chainContext = await this.hiveChainContext.getFields();
    const { rewardHive, rewardHbd, rewardHp } = parseClaimRewardNotificationPayload(
      payload,
      chainContext,
    );
    this.notificationEmitter.emitWithContext(
      this.notificationEmitter.hiveContext(ctx),
      {
        type: 'claim_reward',
        objectId: null,
        actor: account,
        payload: { rewardHive, rewardHbd, rewardHp },
      },
    );
  }

  private handleWitnessVote(
    payload: Record<string, unknown>,
    ctx: HiveOperationHandlerContext,
  ): void {
    const account = String(payload.account ?? '');
    const witness = String(payload.witness ?? '');
    const approve = Boolean(payload.approve);
    this.notificationEmitter.emitWithContext(
      this.notificationEmitter.hiveContext(ctx),
      {
        type: 'witness_vote',
        objectId: null,
        actor: account,
        payload: { witness, approve },
      },
    );
  }

  private handleChangeRecovery(
    payload: Record<string, unknown>,
    ctx: HiveOperationHandlerContext,
  ): void {
    const account = String(payload.account_to_recover ?? payload.account ?? '');
    const newRecoveryAccount = String(payload.new_recovery_account ?? '');
    this.notificationEmitter.emitWithContext(
      this.notificationEmitter.hiveContext(ctx),
      {
        type: 'change_recovery_account',
        objectId: null,
        actor: account,
        payload: { account, newRecoveryAccount },
      },
    );
  }

  private handleWithdrawRoute(
    payload: Record<string, unknown>,
    ctx: HiveOperationHandlerContext,
  ): void {
    const fromAccount = String(payload.from_account ?? '');
    const toAccount = String(payload.to_account ?? '');
    const percent = Number(payload.percent ?? 0);
    const autoVest = Boolean(payload.auto_vest);
    this.notificationEmitter.emitWithContext(
      this.notificationEmitter.hiveContext(ctx),
      {
        type: 'withdraw_route',
        objectId: null,
        actor: fromAccount,
        payload: { fromAccount, toAccount, percent, autoVest },
      },
    );
  }

  private handleTransferFromSavings(
    payload: Record<string, unknown>,
    ctx: HiveOperationHandlerContext,
  ): void {
    const from = String(payload.from ?? '');
    const to = String(payload.to ?? '');
    const { amount, symbol } = assetAmount(payload.amount);
    const memo =
      typeof payload.memo === 'string' ? payload.memo : null;
    this.notificationEmitter.emitWithContext(
      this.notificationEmitter.hiveContext(ctx),
      {
        type: 'transfer_from_savings',
        objectId: null,
        actor: from,
        payload: { from, to, amount, symbol, memo },
      },
    );
  }

  private handleFillOrder(
    payload: Record<string, unknown>,
    ctx: HiveOperationHandlerContext,
  ): void {
    const currentPays = String(payload.current_pays ?? '');
    const openPays = String(payload.open_pays ?? '');
    const exchanger = String(payload.exchanger ?? '');
    const orderId = Number(payload.orderid ?? payload.order_id ?? 0);
    const account = String(payload.account ?? exchanger);
    this.notificationEmitter.emitWithContext(
      this.notificationEmitter.hiveContext(ctx),
      {
        type: 'fill_order',
        objectId: null,
        actor: account,
        payload: {
          currentPays,
          openPays,
          exchanger,
          orderId,
        },
      },
    );
  }
}
