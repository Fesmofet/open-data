import { normalizeApiOrigin } from '../utils/waivio-api-urls';

export function defaultNotificationsWsUrl(waivioApiOrigin: string): string {
  try {
    const url = new URL(normalizeApiOrigin(waivioApiOrigin));
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/notifications/ws';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return 'wss://waiviodev.com/notifications/ws';
  }
}
