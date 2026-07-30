import type { NotificationMessage } from '../message';

export interface RenderPlainTextOptions {
  readonly baseUrl?: string;
}

export function applyMessageParams(
  template: string,
  params: Readonly<Record<string, string>>,
): string {
  let out = template;
  for (const [key, value] of Object.entries(params)) {
    out = out.split(`{${key}}`).join(value);
  }
  return out;
}

export function renderTelegramBody(
  message: NotificationMessage,
  dictionary: Readonly<Record<string, string>>,
): string {
  const template =
    dictionary[message.key] ??
    dictionary['notification_generic_default_message'] ??
    message.key;
  return applyMessageParams(template, message.params);
}

export function resolveNotificationAbsoluteUrl(
  message: NotificationMessage,
  baseUrl?: string,
): string | undefined {
  if (!message.href) {
    return undefined;
  }
  const base = baseUrl?.replace(/\/$/, '') ?? '';
  return `${base}${message.href}`;
}

export function renderPlainText(
  message: NotificationMessage,
  dictionary: Readonly<Record<string, string>>,
  options: RenderPlainTextOptions = {},
): string {
  const body = renderTelegramBody(message, dictionary);
  const url = resolveNotificationAbsoluteUrl(message, options.baseUrl);
  if (!url) {
    return body;
  }
  return `${body}\n${url}`;
}
