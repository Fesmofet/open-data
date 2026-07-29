import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TelegramUpdateMessage {
  readonly message_id: number;
  readonly chat: { readonly id: number };
  readonly text?: string;
}

export interface TelegramUpdate {
  readonly update_id: number;
  readonly message?: TelegramUpdateMessage;
}

export type TelegramSendResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly errorCode: number;
      readonly description?: string;
      readonly retryAfterSec?: number;
    };

@Injectable()
export class TelegramApiClient {
  private readonly logger = new Logger(TelegramApiClient.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    const token = this.config.get<string>('telegram.botToken') ?? '';
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  isConfigured(): boolean {
    const token = this.config.get<string>('telegram.botToken');
    return typeof token === 'string' && token.length > 0;
  }

  async getUpdates(
    offset: number | undefined,
    timeoutSec: number,
  ): Promise<TelegramUpdate[]> {
    const params = new URLSearchParams();
    if (offset !== undefined) {
      params.set('offset', String(offset));
    }
    params.set('timeout', String(timeoutSec));
    const url = `${this.baseUrl}/getUpdates?${params.toString()}`;
    const res = await fetch(url);
    const body = (await res.json()) as {
      ok: boolean;
      result?: TelegramUpdate[];
      description?: string;
    };
    if (!body.ok) {
      this.logger.warn(
        `getUpdates failed: ${body.description ?? res.statusText}`,
      );
      return [];
    }
    return body.result ?? [];
  }

  async sendMessage(chatId: string, text: string): Promise<TelegramSendResult> {
    const url = `${this.baseUrl}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    const body = (await res.json()) as {
      ok: boolean;
      error_code?: number;
      description?: string;
      parameters?: { retry_after?: number };
    };
    if (body.ok) {
      return { ok: true };
    }
    return {
      ok: false,
      errorCode: body.error_code ?? res.status,
      description: body.description,
      retryAfterSec: body.parameters?.retry_after,
    };
  }
}
