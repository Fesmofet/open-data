import {
  TELEGRAM_BUTTON_GO_TO_WEBSITE,
  TELEGRAM_UNSUBSCRIBE_CALLBACK_PREFIX,
  telegramUnsubscribeButtonLabel,
} from '../constants/telegram.constants';
import { userProfilePath } from '@opden-data-layer/notifications-messages';

export interface TelegramInlineKeyboardButton {
  readonly text: string;
  readonly url?: string;
  readonly callback_data?: string;
}

export interface TelegramReplyMarkup {
  readonly inline_keyboard: TelegramInlineKeyboardButton[][];
}

export function buildNotificationInlineKeyboard(
  account: string,
  websiteUrl?: string,
): TelegramReplyMarkup | undefined {
  const trimmed = account.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const rows: TelegramInlineKeyboardButton[][] = [];
  if (websiteUrl && websiteUrl.length > 0) {
    rows.push([{ text: TELEGRAM_BUTTON_GO_TO_WEBSITE, url: websiteUrl }]);
  }
  rows.push([
    {
      text: telegramUnsubscribeButtonLabel(trimmed),
      callback_data: `${TELEGRAM_UNSUBSCRIBE_CALLBACK_PREFIX}${trimmed}`,
    },
  ]);
  return { inline_keyboard: rows };
}

export function buildSubscriptionListInlineKeyboard(
  accounts: readonly string[],
  webPublicOrigin: string,
): TelegramReplyMarkup | undefined {
  const base = webPublicOrigin.replace(/\/$/, '');
  const rows: TelegramInlineKeyboardButton[][] = [];
  for (const account of accounts) {
    const trimmed = account.trim();
    if (trimmed.length === 0) {
      continue;
    }
    rows.push([
      { text: trimmed, url: `${base}${userProfilePath(trimmed)}` },
      {
        text: telegramUnsubscribeButtonLabel(trimmed),
        callback_data: `${TELEGRAM_UNSUBSCRIBE_CALLBACK_PREFIX}${trimmed}`,
      },
    ]);
  }
  if (rows.length === 0) {
    return undefined;
  }
  return { inline_keyboard: rows };
}

export function parseUnsubscribeCallbackData(
  data: string,
): string | null {
  if (!data.startsWith(TELEGRAM_UNSUBSCRIBE_CALLBACK_PREFIX)) {
    return null;
  }
  const account = data.slice(TELEGRAM_UNSUBSCRIBE_CALLBACK_PREFIX.length).trim();
  return account.length > 0 ? account : null;
}
