import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import {
  DEFAULT_MESSAGING_NOTIFICATION_TYPES,
  NOTIFICATIONS_BUFFER_MAX,
} from '../constants/notifications-buffer';
import { normalizeHiveAccount } from '../utils/hive-account';
import { WaivioAuthSessionService } from './waivio-auth-session.service';

export type BufferedNotificationItem = {
  id: string;
  type: string;
  occurredAt: string;
  blockNum: number;
  trxId: string | null;
  objectId: string | null;
  actor: string | null;
  payload: Record<string, unknown>;
  receivedAtMs: number;
  account: string;
};

type WsEnvelope = {
  event?: string;
  data?: Record<string, unknown>;
};

type ConnectionState = {
  ws: WebSocket | null;
  connected: boolean;
  reconnectAttempt: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  connectPromise: Promise<void> | null;
};

const DEFAULT_TYPES = new Set<string>(DEFAULT_MESSAGING_NOTIFICATION_TYPES);

@Injectable()
export class NotificationsSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsSocketService.name);
  private readonly buffer: BufferedNotificationItem[] = [];
  private readonly connections = new Map<string, ConnectionState>();
  private intentionalClose = false;
  private lastEventAt: number | null = null;

  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly waivioAuth: WaivioAuthSessionService,
  ) {}

  onModuleInit(): void {
    void this.ensureConnectedAll();
  }

  onModuleDestroy(): void {
    this.intentionalClose = true;
    for (const state of this.connections.values()) {
      if (state.reconnectTimer) {
        clearTimeout(state.reconnectTimer);
      }
      state.ws?.close();
    }
    this.connections.clear();
  }

  getStatus(account?: string): {
    connected: boolean;
    bufferedCount: number;
    lastEventAt: number | null;
    account: string | null;
    connections: Array<{
      account: string;
      connected: boolean;
      reconnectAttempt: number;
    }>;
  } {
    const normalized = account?.trim()
      ? normalizeHiveAccount(account)
      : undefined;
    const defaultAccount =
      normalized ??
      this.config.get('defaultAccount', { infer: true }) ??
      this.waivioAuth.getAllStatuses().find((status) => status.active)?.account ??
      null;

    const connections = [...this.connections.entries()].map(
      ([entryAccount, state]) => ({
        account: entryAccount,
        connected: state.connected,
        reconnectAttempt: state.reconnectAttempt,
      }),
    );

    const defaultConnection = defaultAccount
      ? this.connections.get(defaultAccount)
      : undefined;

    return {
      connected: defaultConnection?.connected ?? false,
      bufferedCount: this.buffer.length,
      lastEventAt: this.lastEventAt,
      account: defaultAccount,
      connections,
    };
  }

  async pull(input: {
    limit?: number;
    waitMs?: number;
    types?: readonly string[];
    account?: string;
  }): Promise<{ items: BufferedNotificationItem[] }> {
    const limit = Math.max(1, input.limit ?? 20);
    const waitMs = Math.max(0, input.waitMs ?? 0);
    const allowed = input.types?.length
      ? new Set(input.types.map((type) => type.trim()).filter(Boolean))
      : DEFAULT_TYPES;
    const accountFilter = input.account?.trim()
      ? normalizeHiveAccount(input.account)
      : undefined;

    const deadline = Date.now() + waitMs;
    while (this.buffer.length === 0 && Date.now() < deadline) {
      await this.ensureConnectedAll();
      await sleep(Math.min(250, deadline - Date.now()));
    }

    const items: BufferedNotificationItem[] = [];
    const kept: BufferedNotificationItem[] = [];
    for (const item of this.buffer) {
      const matchesAccount = accountFilter ? item.account === accountFilter : true;
      if (items.length < limit && allowed.has(item.type) && matchesAccount) {
        items.push(item);
      } else {
        kept.push(item);
      }
    }
    this.buffer.length = 0;
    this.buffer.push(...kept);

    return { items };
  }

  isConnected(account: string): boolean {
    return this.connections.get(normalizeHiveAccount(account))?.connected ?? false;
  }

  async refreshConnections(): Promise<void> {
    await this.ensureConnectedAll();
  }

  private async ensureConnectedAll(): Promise<void> {
    const activeAccounts = this.waivioAuth
      .getAllStatuses()
      .filter((status) => status.active && status.account)
      .map((status) => normalizeHiveAccount(status.account as string));

    const activeSet = new Set(activeAccounts);
    for (const account of [...this.connections.keys()]) {
      if (!activeSet.has(account)) {
        const state = this.connections.get(account);
        if (state?.reconnectTimer) {
          clearTimeout(state.reconnectTimer);
        }
        state?.ws?.close();
        this.connections.delete(account);
      }
    }

    await Promise.all(
      activeAccounts.map((account) => this.ensureConnected(account)),
    );
  }

  private getConnectionState(account: string): ConnectionState {
    const existing = this.connections.get(account);
    if (existing) {
      return existing;
    }

    const created: ConnectionState = {
      ws: null,
      connected: false,
      reconnectAttempt: 0,
      reconnectTimer: null,
      connectPromise: null,
    };
    this.connections.set(account, created);
    return created;
  }

  private async ensureConnected(account: string): Promise<void> {
    const state = this.getConnectionState(account);
    if (state.connected && state.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    if (!this.waivioAuth.getStatus(account).active) {
      return;
    }
    if (state.connectPromise) {
      return state.connectPromise;
    }
    state.connectPromise = this.connect(account).finally(() => {
      state.connectPromise = null;
    });
    return state.connectPromise;
  }

  private async connect(account: string): Promise<void> {
    const state = this.getConnectionState(account);
    const token = await this.waivioAuth.getAccessToken(account);
    const baseUrl = this.config.get('notificationsWsUrl', { infer: true });
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);
      state.ws = ws;

      ws.on('open', () => {
        state.connected = true;
        state.reconnectAttempt = 0;
        resolve();
      });

      ws.on('message', (raw) => {
        this.handleMessage(account, raw);
      });

      ws.on('close', () => {
        state.connected = false;
        state.ws = null;
        this.scheduleReconnect(account);
      });

      ws.on('error', (error) => {
        this.logger.warn((error as Error).message);
        if (ws.readyState !== WebSocket.OPEN) {
          reject(error);
        }
      });
    }).catch((error) => {
      this.logger.warn(
        `Notifications WS connect failed for @${account}: ${(error as Error).message}`,
      );
      this.scheduleReconnect(account);
    });
  }

  private scheduleReconnect(account: string): void {
    if (this.intentionalClose || !this.waivioAuth.getStatus(account).active) {
      return;
    }

    const state = this.getConnectionState(account);
    if (state.reconnectTimer) {
      return;
    }

    const delayMs = Math.min(30_000, 1_000 * 2 ** state.reconnectAttempt);
    state.reconnectAttempt += 1;
    state.reconnectTimer = setTimeout(() => {
      state.reconnectTimer = null;
      void this.ensureConnected(account);
    }, delayMs);
  }

  private handleMessage(account: string, raw: WebSocket.RawData): void {
    const text = typeof raw === 'string' ? raw : raw.toString('utf8');
    let envelope: WsEnvelope;
    try {
      envelope = JSON.parse(text) as WsEnvelope;
    } catch {
      return;
    }
    if (envelope.event !== 'notification' || !envelope.data) {
      return;
    }

    const item = parseNotificationItem(account, envelope.data);
    if (!item || !DEFAULT_TYPES.has(item.type)) {
      return;
    }

    this.buffer.push(item);
    while (this.buffer.length > NOTIFICATIONS_BUFFER_MAX) {
      this.buffer.shift();
    }
    this.lastEventAt = item.receivedAtMs;
  }
}

function parseNotificationItem(
  account: string,
  data: Record<string, unknown>,
): BufferedNotificationItem | null {
  const id = typeof data.id === 'string' ? data.id.trim() : '';
  const type = typeof data.type === 'string' ? data.type.trim() : '';
  const occurredAt =
    typeof data.occurredAt === 'string' ? data.occurredAt.trim() : '';
  const blockNum = typeof data.blockNum === 'number' ? data.blockNum : NaN;
  if (!id || !type || !occurredAt || Number.isNaN(blockNum)) {
    return null;
  }

  return {
    id,
    type,
    occurredAt,
    blockNum,
    trxId: typeof data.trxId === 'string' ? data.trxId : null,
    objectId: typeof data.objectId === 'string' ? data.objectId : null,
    actor: typeof data.actor === 'string' ? data.actor : null,
    payload:
      data.payload !== null && typeof data.payload === 'object'
        ? (data.payload as Record<string, unknown>)
        : {},
    receivedAtMs: Date.now(),
    account,
  };
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}
