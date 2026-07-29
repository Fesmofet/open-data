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

export function renderPlainText(
  message: NotificationMessage,
  dictionary: Readonly<Record<string, string>>,
  options: RenderPlainTextOptions = {},
): string {
  const template =
    dictionary[message.key] ??
    dictionary['notification_generic_default_message'] ??
    message.key;
  const body = applyMessageParams(template, message.params);
  if (!message.href) {
    return body;
  }
  const base = options.baseUrl?.replace(/\/$/, '') ?? '';
  return `${body}\n${base}${message.href}`;
}
