import { Injectable, Logger } from '@nestjs/common';

const TELEGRAM_FETCH_INIT = { keepalive: true } as const;

export interface TelegramUpdateMessage {
  readonly message_id: number;
  readonly chat: { readonly id: number };
  readonly text?: string;
}

export interface TelegramCallbackQuery {
  readonly id: string;
  readonly data?: string;
  readonly message?: TelegramUpdateMessage;
}

export interface TelegramUpdate {
  readonly update_id: number;
  readonly message?: TelegramUpdateMessage;
  readonly callback_query?: TelegramCallbackQuery;
}

export type TelegramSendResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly errorCode: number;
      readonly description?: string;
      readonly retryAfterSec?: number;
    };

export interface TelegramSendMessageOptions {
  readonly replyMarkup?: {
    readonly inline_keyboard: {
      readonly text: string;
      readonly url?: string;
      readonly callback_data?: string;
    }[][];
  };
}

@Injectable()
export class TelegramApiClient {
  private readonly logger = new Logger(TelegramApiClient.name);
  private readonly baseUrl: string;

  constructor(private readonly token: string) {
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  isConfigured(): boolean {
    return this.token.length > 0;
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
    let res: Response;
    try {
      res = await fetch(url, TELEGRAM_FETCH_INIT);
    } catch (err) {
      this.logger.warn(
        `getUpdates network error: ${(err as Error).message}`,
      );
      return [];
    }
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

  async sendMessage(
    chatId: string,
    text: string,
    options: TelegramSendMessageOptions = {},
  ): Promise<TelegramSendResult> {
    const url = `${this.baseUrl}/sendMessage`;
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    };
    if (options.replyMarkup) {
      payload.reply_markup = options.replyMarkup;
    }
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        ...TELEGRAM_FETCH_INIT,
      });
    } catch (err) {
      return {
        ok: false,
        errorCode: 0,
        description: (err as Error).message,
      };
    }
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

  async answerCallbackQuery(callbackQueryId: string): Promise<void> {
    const url = `${this.baseUrl}/answerCallbackQuery`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId }),
        ...TELEGRAM_FETCH_INIT,
      });
    } catch (err) {
      this.logger.warn(
        `answerCallbackQuery network error: ${(err as Error).message}`,
      );
      return;
    }
    const body = (await res.json()) as { ok: boolean; description?: string };
    if (!body.ok) {
      this.logger.warn(
        `answerCallbackQuery failed: ${body.description ?? res.statusText}`,
      );
    }
  }
}
