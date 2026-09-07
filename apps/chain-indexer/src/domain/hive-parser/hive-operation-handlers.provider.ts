import type { Provider } from '@nestjs/common';
import { CustomJsonOperation } from '@hiveio/dhive/lib/chain/operation';
import { HIVE_OPERATION } from '../../constants/hive-parser';
import { CommentOperationOrchestrator } from '../hive-comment/comment-orchestrator.service';
import { AccountProfileUpdateService } from '../hive-social/account-profile-update.service';
import { AccountAuthorityService } from '../hive-social/account-authority.service';
import { AccountEnsureService } from '../hive-social/account-ensure.service';
import { VoteHiveService } from '../hive-vote/vote-hive.service';
import { HiveHpDelegationService } from '../hive-delegation/hive-hp-delegation.service';
import { HiveWalletOperationHandlers } from '../hive-wallet/hive-wallet-operation-handlers';
import { HiveCustomJsonParser } from './hive-custom-json-parser';
import {
  HIVE_OPERATION_HANDLERS,
  type RegisteredHiveOperationHandler,
} from './hive-operation-handler';

export const hiveOperationHandlersProvider: Provider = {
  provide: HIVE_OPERATION_HANDLERS,
  useFactory: (
    customJsonParser: HiveCustomJsonParser,
    commentOrchestrator: CommentOperationOrchestrator,
    accountProfileUpdate: AccountProfileUpdateService,
    accountAuthorityService: AccountAuthorityService,
    accountEnsure: AccountEnsureService,
    voteHiveService: VoteHiveService,
    hpDelegationService: HiveHpDelegationService,
    walletHandlers: HiveWalletOperationHandlers,
  ): RegisteredHiveOperationHandler[] => [
    {
      operation: HIVE_OPERATION.CUSTOM_JSON,
      handle: (payload, ctx) =>
        customJsonParser.parse(payload as CustomJsonOperation[1], ctx),
    },
    {
      operation: HIVE_OPERATION.COMMENT,
      handle: (payload, ctx) =>
        commentOrchestrator.handleComment(payload, ctx),
    },
    {
      operation: HIVE_OPERATION.DELETE_COMMENT,
      handle: async (payload) => {
        await commentOrchestrator.handleDeleteComment(payload);
      },
    },
    {
      operation: HIVE_OPERATION.ACCOUNT_UPDATE,
      handle: async (payload, ctx) => {
        await accountProfileUpdate.handleAccountUpdate(payload, ctx);
        await accountAuthorityService.handleAccountUpdate(payload, ctx);
      },
    },
    {
      operation: HIVE_OPERATION.ACCOUNT_UPDATE2,
      handle: async (payload, ctx) => {
        await accountProfileUpdate.handleAccountUpdate(payload, ctx);
        await accountAuthorityService.handleAccountUpdate(payload, ctx);
      },
    },
    {
      operation: HIVE_OPERATION.CREATE_ACCOUNT,
      handle: async (payload, ctx) => {
        await accountEnsure.ensureFromCreateAccountPayload(payload);
        await accountAuthorityService.handleCreateAccount(payload, ctx);
      },
    },
    {
      operation: HIVE_OPERATION.CREATE_CLAIMED_ACCOUNT,
      handle: async (payload, ctx) => {
        await accountEnsure.ensureFromCreateAccountPayload(payload);
        await accountAuthorityService.handleCreateAccount(payload, ctx);
      },
    },
    {
      operation: HIVE_OPERATION.RECOVER_ACCOUNT,
      handle: async (payload, ctx) => {
        await accountAuthorityService.handleRecoverAccount(payload, ctx);
      },
    },
    {
      operation: HIVE_OPERATION.VOTE,
      handle: (payload, ctx) =>
        voteHiveService.handleVote(payload, ctx),
    },
    {
      operation: HIVE_OPERATION.DELEGATE_VESTING_SHARES,
      handle: (payload, ctx) =>
        hpDelegationService.handleDelegateVestingShares(
          payload as {
            delegator?: string;
            delegatee?: string;
            vesting_shares?: string | number;
          },
          ctx,
        ),
    },
    ...walletHandlers.list(),
  ],
  inject: [
    HiveCustomJsonParser,
    CommentOperationOrchestrator,
    AccountProfileUpdateService,
    AccountAuthorityService,
    AccountEnsureService,
    VoteHiveService,
    HiveHpDelegationService,
    HiveWalletOperationHandlers,
  ],
};
