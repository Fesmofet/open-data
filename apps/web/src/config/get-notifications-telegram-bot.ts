import 'server-only';

const DEFAULT_TELEGRAM_BOT_USERNAME = 'WaivioNotificationsBot';

function normalizeTelegramBotUsername(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return DEFAULT_TELEGRAM_BOT_USERNAME;
  }
  return trimmed.replace(/^@/, '');
}

export function getNotificationsTelegramBotUsername(): string {
  const fromEnv = process.env.NOTIFICATIONS_TELEGRAM_BOT_USERNAME ?? '';
  return normalizeTelegramBotUsername(fromEnv);
}

export function getNotificationsTelegramBotUrl(): string {
  return `https://t.me/${getNotificationsTelegramBotUsername()}`;
}
