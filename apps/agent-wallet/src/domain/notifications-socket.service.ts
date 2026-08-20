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
};

type WsEnvelope = {
  event?: string;
  data?: Record<string, unknown>;
};

const DEFAULT_TYPES = new Set<string>(DEFAULT_MESSAGING_NOTIFICATION_TYPES);

@Injectable()
export class NotificationsSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsSocketService.name);
  private readonly buffer: BufferedNotificationItem[] = [];
  private ws: WebSocket | null = null;
  private connected = false;
  private intentionalClose = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEventAt: number | null = null;
  private connectPromise: Promise<void> | null = null;

  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly waivioAuth: WaivioAuthSessionService,
  ) {}

  onModuleInit(): void {
    void this.ensureConnected();
  }

  onModuleDestroy(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  getStatus(): {
    connected: boolean;
    bufferedCount: number;
    lastEventAt: number | null;
    account: string | null;
  } {
    return {
      connected: this.connected,
      bufferedCount: this.buffer.length,
      lastEventAt: this.lastEventAt,
      account: this.waivioAuth.getStatus().account ?? null,
    };
  }

  async pull(input: {
    limit?: number;
    waitMs?: number;
    types?: readonly string[];
  }): Promise<{ items: BufferedNotificationItem[] }> {
    const limit = Math.max(1, input.limit ?? 20);
    const waitMs = Math.max(0, input.waitMs ?? 0);
    const allowed = input.types?.length
      ? new Set(input.types.map((type) => type.trim()).filter(Boolean))
      : DEFAULT_TYPES;

    const deadline = Date.now() + waitMs;
    while (this.buffer.length === 0 && Date.now() < deadline) {
      await this.ensureConnected();
      await sleep(Math.min(250, deadline - Date.now()));
    }

    const items: BufferedNotificationItem[] = [];
    const kept: BufferedNotificationItem[] = [];
    for (const item of this.buffer) {
      if (items.length < limit && allowed.has(item.type)) {
        items.push(item);
      } else {
        kept.push(item);
      }
    }
    this.buffer.length = 0;
    this.buffer.push(...kept);

    return { items };
  }

  private async ensureConnected(): Promise<void> {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    if (!this.waivioAuth.getStatus().active) {
      return;
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }
    this.connectPromise = this.connect().finally(() => {
      this.connectPromise = null;
    });
    return this.connectPromise;
  }

  private async connect(): Promise<void> {
    const token = await this.waivioAuth.getAccessToken();
    const baseUrl = this.config.get('notificationsWsUrl', { infer: true });
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.on('open', () => {
        this.connected = true;
        this.reconnectAttempt = 0;
        resolve();
      });

      ws.on('message', (raw) => {
        this.handleMessage(raw);
      });

      ws.on('close', () => {
        this.connected = false;
        this.ws = null;
        this.scheduleReconnect();
      });

      ws.on('error', (error) => {
        this.logger.warn((error as Error).message);
        if (ws.readyState !== WebSocket.OPEN) {
          reject(error);
        }
      });
    }).catch((error) => {
      this.logger.warn(`Notifications WS connect failed: ${(error as Error).message}`);
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose || !this.waivioAuth.getStatus().active) {
      return;
    }
    if (this.reconnectTimer) {
      return;
    }
    const delayMs = Math.min(30_000, 1_000 * 2 ** this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.ensureConnected();
    }, delayMs);
  }

  private handleMessage(raw: WebSocket.RawData): void {
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

    const item = parseNotificationItem(envelope.data);
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
  };
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}
