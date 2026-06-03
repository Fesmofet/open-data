import 'server-only';

import { sanitizePostBodyHtml } from './post-body-html-pipeline';

/**
 * Sanitize Hive post HTML for safe rendering (server-side before `dangerouslySetInnerHTML`).
 */
export function sanitizePostHtml(html: string): string {
  return sanitizePostBodyHtml(html);
}
