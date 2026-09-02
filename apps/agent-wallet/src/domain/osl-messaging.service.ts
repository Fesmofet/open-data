import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildEncryptedMessageCreatePayload,
  buildGroupChannelCreatePayload,
  buildMessageCreatePayload,
  buildObjectChannelCreatePayload,
  buildOslChannelCreateOp,
  buildOslMessageCreateOp,
  generateGroupChannelId,
} from '@opden-data-layer/hive-broadcast';
import {
  createMemoCryptoOperations,
  type EncryptionMode,
} from '@opden-data-layer/hive-memo-crypto';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { LocalKeysService } from './local-keys.service';

type BuildResult = {
  ops: unknown[];
  opsCount: number;
  bytes: number;
  warnings?: string[];
};

@Injectable()
export class OslMessagingService {
  private readonly memoCrypto = createMemoCryptoOperations();

  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly localKeys: LocalKeysService,
  ) {}

  buildChannelCreate(input: {
    kind: 'group' | 'object';
    creator: string;
    channelId?: string;
    members?: readonly string[];
    objectId?: string;
    title?: string;
  }): BuildResult {
    const creator = normalizeAccount(input.creator);
    const channelId =
      input.channelId?.trim() ||
      (input.kind === 'group' ? generateGroupChannelId() : undefined);

    let payload: Record<string, unknown>;
    if (input.kind === 'group') {
      if (!channelId) {
        throw new Error('channelId is required for group channels');
      }
      payload = buildGroupChannelCreatePayload({
        channelId,
        members: input.members ?? [],
        title: input.title,
        viewerUsername: creator,
      });
    } else {
      const objectId = input.objectId?.trim();
      if (!objectId) {
        throw new Error('objectId is required for object channels');
      }
      payload = buildObjectChannelCreatePayload({
        objectId,
        objectName: input.title,
      });
    }

    const op = buildOslChannelCreateOp({
      id: this.config.get('oslCustomJsonId', { infer: true }),
      creator,
      payload,
    });
    return this.singleOpBuildResult(op);
  }

  buildMessageCreate(input: {
    creator: string;
    channelId?: string;
    peer?: string;
    body: string;
    originalCreatedAtUnix?: number | null;
  }): BuildResult {
    const creator = normalizeAccount(input.creator);
    const payload = buildMessageCreatePayload({
      channelId: input.channelId,
      peer: input.peer,
      body: input.body,
      originalCreatedAtUnix: input.originalCreatedAtUnix,
    });
    const op = buildOslMessageCreateOp({
      id: this.config.get('oslCustomJsonId', { infer: true }),
      creator,
      payload,
    });
    return this.singleOpBuildResult(op);
  }

  async buildEncryptedMessageCreate(input: {
    creator: string;
    channelId?: string;
    peer?: string;
    recipient: string;
    plaintext: string;
    mode: EncryptionMode;
  }): Promise<BuildResult> {
    this.assertEncryptedBuildAllowed(input.mode);
    const recipientMemoPublic = await this.fetchMemoPublicKey(input.recipient);
    const { ciphertext, mode } = await this.memoEncrypt({
      recipientMemoPublic,
      plaintext: input.plaintext,
      mode: input.mode,
    });
    const creator = normalizeAccount(input.creator);
    const payload = buildEncryptedMessageCreatePayload({
      channelId: input.channelId,
      peer: input.peer,
      ciphertext,
      mode,
      to: normalizeAccount(input.recipient),
    });
    const op = buildOslMessageCreateOp({
      id: this.config.get('oslCustomJsonId', { infer: true }),
      creator,
      payload,
    });
    return this.singleOpBuildResult(op);
  }

  async memoEncrypt(input: {
    recipientMemoPublic: string;
    plaintext: string;
    mode: EncryptionMode;
  }): Promise<{ ciphertext: string; mode: EncryptionMode }> {
    if (input.mode === 'memo' && !this.localKeys.isMemoReady()) {
      throw new Error('HIVE_MEMO_KEY is required for memo mode encryption');
    }
    return this.memoCrypto.encryptForRecipient({
      senderMemoPrivateWif:
        input.mode === 'memo'
          ? this.localKeys.getMemoPrivateKey().toString()
          : undefined,
      recipientMemoPublic: input.recipientMemoPublic,
      plaintext: input.plaintext,
      mode: input.mode,
    });
  }

  memoDecrypt(input: { ciphertext: string }): string {
    if (!this.localKeys.isMemoReady()) {
      throw new Error('HIVE_MEMO_KEY is required for decryption');
    }
    return this.memoCrypto.decrypt({
      recipientMemoPrivateWif: this.localKeys.getMemoPrivateKey().toString(),
      ciphertext: input.ciphertext,
    });
  }

  async fetchMemoPublicKey(account: string): Promise<string> {
    const normalized = normalizeAccount(account);
    const accounts = await this.localKeys.getRpcClient().database.getAccounts([
      normalized,
    ]);
    const row = accounts[0];
    if (!row?.memo_key) {
      throw new Error(`Account not found or missing memo key: ${normalized}`);
    }
    return String(row.memo_key);
  }

  assertEncryptedBuildAllowed(mode: EncryptionMode): void {
    if (this.config.get('signingMode', { infer: true }) !== 'local') {
      throw new Error(
        'Encrypted OSL messages require AGENT_WALLET_SIGNING_MODE=local with HIVE_MEMO_KEY',
      );
    }
    if (mode === 'memo' && !this.localKeys.isMemoReady()) {
      throw new Error('HIVE_MEMO_KEY is not configured or invalid');
    }
  }

  private singleOpBuildResult(op: { json: string }): BuildResult {
    const bytes = new TextEncoder().encode(op.json).length;
    return {
      ops: [op],
      opsCount: 1,
      bytes,
    };
  }
}

function normalizeAccount(account: string): string {
  return account.trim().replace(/^@/, '').toLowerCase();
}
