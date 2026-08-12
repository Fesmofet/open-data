import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildHasAuthDeepLink,
  HasClient,
  type HasSession,
  type HasTransportFactory,
} from '@opden-data-layer/hive-auth';
import { buildObjectCreateEnvelope } from '@opden-data-layer/hive-broadcast';
import qrcode from 'qrcode';

import { AgentWalletAuthService } from '../auth/agent-wallet-auth.service';
import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { LocalFilesService } from './local-files.service';
import {
  PendingRequestsStore,
  type BroadcastRequestState,
  type LoginRequestState,
} from './pending-requests.store';
import { toHiveWireOperations } from './wire-operations';
import { HAS_TRANSPORT_FACTORY } from './has-transport.token';

type PersistedSession = HasSession;

@Injectable()
export class HasSessionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HasSessionService.name);
  private client: HasClient | null = null;
  private session: HasSession | null = null;
  private transportFactory?: HasTransportFactory;
  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly auth: AgentWalletAuthService,
    private readonly files: LocalFilesService,
    private readonly pending: PendingRequestsStore,
    @Optional()
    @Inject(HAS_TRANSPORT_FACTORY)
    transportFactory?: HasTransportFactory,
  ) {
    this.transportFactory = transportFactory;
  }

  async onModuleInit(): Promise<void> {
    if (!this.config.get('persistSession', { infer: true })) {
      return;
    }

    const raw = await this.files.readTextFile(this.files.sessionPath());
    if (!raw?.trim()) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedSession;
      if (this.isSessionValid(parsed)) {
        this.session = parsed;
        this.logger.log(`Restored HAS session for @${parsed.username}`);
      } else {
        await this.files.deleteFile(this.files.sessionPath());
      }
    } catch (error) {
      this.logger.warn(
        `Could not restore session file: ${(error as Error).message}`,
      );
    }
  }

  onModuleDestroy(): void {
    this.client?.close();
    this.client = null;
  }

  getSessionInfo(): { account: string; expiresAt: number } | null {
    if (!this.session || !this.isSessionValid(this.session)) {
      return null;
    }
    return {
      account: this.session.username,
      expiresAt: this.session.expire,
    };
  }

  async loginStart(account: string): Promise<{
    requestId: string;
    deepLink: string;
    qrAscii: string;
    expiresAt: number;
    alreadyActive: boolean;
    expiresInSec: number;
    webLink?: string;
    qrPngPath?: string;
    pushSent: boolean;
  }> {
    const normalized = account.trim().replace(/^@/, '').toLowerCase();

    if (
      this.session &&
      this.isSessionValid(this.session) &&
      this.session.username === normalized
    ) {
      return {
        requestId: '',
        deepLink: '',
        qrAscii: '',
        expiresAt: this.session.expire,
        alreadyActive: true,
        expiresInSec: this.secondsUntil(this.session.expire),
        pushSent: false,
      };
    }

    const staleSession = await this.loadStaleSession(normalized);
    if (staleSession?.token) {
      try {
        return await this.startLoginFlow(normalized, {
          token: staleSession.token,
          authKey: staleSession.key,
          pushSent: true,
        });
      } catch (error) {
        this.logger.warn(
          `Token re-auth failed for @${normalized}: ${(error as Error).message}`,
        );
      }
    }

    return this.startLoginFlow(normalized, { pushSent: false });
  }

  loginStatus(requestId: string): LoginRequestState | { status: 'expired' } {
    const state = this.pending.getLogin(requestId);
    if (!state) {
      return { status: 'expired' };
    }

    if (state.status === 'pending' && state.expiresAt <= Date.now()) {
      this.pending.updateLogin(requestId, { status: 'expired' });
      return { status: 'expired' };
    }

    return state;
  }

  async logout(): Promise<void> {
    this.session = null;
    this.client?.close();
    this.client = null;
    if (this.config.get('persistSession', { infer: true })) {
      await this.files.deleteFile(this.files.sessionPath());
    }
  }

  buildObjectCreate(input: {
    objectType: string;
    objectId?: string;
    creator: string;
    fields: { updateType: string; value: unknown; locale?: string }[];
    language?: string;
  }): {
    ops: unknown[];
    opsCount: number;
    bytes: number;
    warnings: string[];
  } {
    const creator = input.creator.trim().replace(/^@/, '').toLowerCase();
    const objectId =
      input.objectId?.trim() ||
      `${input.objectType}-${crypto.randomUUID().slice(0, 8)}`;

    const result = buildObjectCreateEnvelope({
      objectType: input.objectType,
      objectId,
      creator,
      id: this.config.get('odlCustomJsonId', { infer: true }),
      fields: input.fields,
      language: input.language,
    });

    const bytes = result.ops.reduce(
      (sum, op) => sum + new TextEncoder().encode(op.json).length,
      0,
    );

    return {
      ops: result.ops,
      opsCount: result.ops.length,
      bytes,
      warnings: result.warnings,
    };
  }

  async broadcastStart(input: {
    ops: unknown[];
    keyType: 'posting' | 'active';
  }): Promise<{ requestId: string }> {
    if (!this.session || !this.isSessionValid(this.session)) {
      throw new Error('No active HAS session');
    }

    const requestId = this.auth.hashRequestId([
      'broadcast',
      this.session.username,
      String(Date.now()),
      crypto.randomUUID(),
    ]);

    const client = this.getOrCreateClient();
    const wireOps = toHiveWireOperations(input.ops);

    const signPending = await client.startBroadcast({
      session: this.session,
      keyType: input.keyType,
      ops: wireOps,
    });

    this.pending.setBroadcast(requestId, {
      status: 'pending',
      expiresAt: signPending.expire,
    });

    void this.awaitBroadcast(requestId, signPending.uuid, client).catch(
      (error) => {
        this.logger.warn(
          `Broadcast flow ${requestId} failed: ${(error as Error).message}`,
        );
      },
    );

    return { requestId };
  }

  broadcastStatus(
    requestId: string,
  ): BroadcastRequestState | { status: 'expired' } {
    const state = this.pending.getBroadcast(requestId);
    if (!state) {
      return { status: 'expired' };
    }

    if (state.status === 'pending' && state.expiresAt <= Date.now()) {
      this.pending.updateBroadcast(requestId, { status: 'expired' });
      return { status: 'expired' };
    }

    return state;
  }

  private secondsUntil(expiresAt: number): number {
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  }

  private async loadStaleSession(account: string): Promise<HasSession | null> {
    if (this.session?.username === account && this.session.token) {
      return this.session;
    }

    if (!this.config.get('persistSession', { infer: true })) {
      return null;
    }

    const raw = await this.files.readTextFile(this.files.sessionPath());
    if (!raw?.trim()) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as HasSession;
      if (parsed.username !== account || !parsed.token) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private async startLoginFlow(
    normalized: string,
    options: { token?: string; authKey?: string; pushSent: boolean },
  ): Promise<{
    requestId: string;
    deepLink: string;
    qrAscii: string;
    expiresAt: number;
    alreadyActive: boolean;
    expiresInSec: number;
    webLink?: string;
    qrPngPath?: string;
    pushSent: boolean;
  }> {
    const requestId = this.auth.hashRequestId([
      'login',
      normalized,
      String(Date.now()),
      crypto.randomUUID(),
    ]);

    const challenge = this.auth.createLoginChallenge(normalized);
    const client = this.getOrCreateClient();

    const pending = await client.startAuth({
      account: normalized,
      appMeta: {
        name: this.config.get('hasAppName', { infer: true }),
        description: 'ODL agent wallet',
      },
      challenge: {
        key_type: 'posting',
        challenge,
      },
      ...(options.token ? { token: options.token } : {}),
      ...(options.authKey ? { authKey: options.authKey } : {}),
    });

    const host = client.getHost().replace(/\/$/, '');
    const deepLink = buildHasAuthDeepLink({
      account: pending.account,
      uuid: pending.uuid,
      key: pending.authKey,
      host,
    });
    const base64 = deepLink.replace('has://auth_req/', '');
    const webLinkBase = this.config.get('hasWebLinkBase', { infer: true });
    const webLink = webLinkBase ? `${webLinkBase}/has#${base64}` : undefined;

    const qrAscii = await qrcode.toString(deepLink, {
      type: 'terminal',
      small: true,
    });

    let qrPngPath: string | undefined;
    try {
      const png = await qrcode.toBuffer(deepLink, {
        type: 'png',
        width: 256,
        margin: 1,
      });
      const path = this.files.qrPath();
      await this.files.writeBinaryFile(path, png);
      qrPngPath = path;
    } catch (error) {
      this.logger.warn(
        `Could not write QR PNG: ${(error as Error).message}`,
      );
    }

    const loginState: LoginRequestState = {
      status: 'pending',
      account: pending.account,
      deepLink,
      qrAscii,
      ...(webLink ? { webLink } : {}),
      ...(qrPngPath ? { qrPngPath } : {}),
      expiresAt: pending.expire,
    };
    this.pending.setLogin(requestId, loginState);

    void this.awaitLogin(requestId, pending.uuid, client).catch((error) => {
      this.logger.warn(
        `Login flow ${requestId} failed: ${(error as Error).message}`,
      );
    });

    return {
      requestId,
      deepLink,
      qrAscii,
      expiresAt: pending.expire,
      alreadyActive: false,
      expiresInSec: this.secondsUntil(pending.expire),
      ...(webLink ? { webLink } : {}),
      ...(qrPngPath ? { qrPngPath } : {}),
      pushSent: options.pushSent,
    };
  }

  private getOrCreateClient(): HasClient {
    if (!this.client) {
      this.client = new HasClient({
        host: this.config.get('hasWsUrl', { infer: true }),
        ...(this.transportFactory ? { transportFactory: this.transportFactory } : {}),
      });
    }
    return this.client;
  }

  private isSessionValid(session: HasSession): boolean {
    return session.expire > Date.now();
  }

  private async awaitLogin(
    requestId: string,
    uuid: string,
    client: HasClient,
  ): Promise<void> {
    try {
      const session = await client.awaitAuth(uuid);
      this.session = session;
      if (this.config.get('persistSession', { infer: true })) {
        await this.files.writeSecretFile(
          this.files.sessionPath(),
          `${JSON.stringify(session)}\n`,
        );
      }
      this.pending.updateLogin(requestId, {
        status: 'active',
        account: session.username,
        expiresAt: session.expire,
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'auth rejected') {
        this.pending.updateLogin(requestId, { status: 'rejected' });
        return;
      }
      if (message === 'expired') {
        this.pending.updateLogin(requestId, { status: 'expired' });
        return;
      }
      this.pending.updateLogin(requestId, { status: 'rejected' });
    }
  }

  private async awaitBroadcast(
    requestId: string,
    uuid: string,
    client: HasClient,
  ): Promise<void> {
    if (!this.session) {
      this.pending.updateBroadcast(requestId, {
        status: 'error',
        message: 'No active HAS session',
      });
      return;
    }

    try {
      const result = await client.awaitBroadcast(uuid, this.session);
      this.pending.updateBroadcast(requestId, {
        status: 'signed',
        transactionId: result.transactionId,
      });
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'sign rejected') {
        this.pending.updateBroadcast(requestId, { status: 'rejected' });
        return;
      }
      if (message === 'expired') {
        this.pending.updateBroadcast(requestId, { status: 'expired' });
        return;
      }
      this.pending.updateBroadcast(requestId, {
        status: 'error',
        message,
      });
    }
  }
}
