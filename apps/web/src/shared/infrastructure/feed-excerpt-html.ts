import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

import {
  linkifyBareImageUrls,
  linkifyHiveMentions,
} from './social-content-html';

/**
 * Detect minimal HTML so we skip markdown (Hive bodies may be HTML already).
 */
const LOOKS_LIKE_HTML =
  /<\s*\/?(p|div|br|h[1-6]|ul|ol|li|a|strong|em|blockquote|img)\b/i;

const FEED_CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['a', 'p', 'br', 'strong', 'em', 'code', 'span', 'ul', 'ol', 'li', 'img'],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'class'],
  },
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? '';
      const isProfileLink = href.startsWith('/@');
      return {
        tagName,
        attribs: {
          ...attribs,
          ...(isProfileLink
            ? {}
            : { target: '_blank', rel: 'noopener noreferrer' }),
        },
      };
    },
  },
};

/**
 * Turn feed excerpt text (often Markdown) into safe HTML for `dangerouslySetInnerHTML`.
 * Client-safe — use in `Story` and other client components (unlike `sanitize-post-html`).
 */
export function feedExcerptToSafeHtml(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return '';
  }
  const prepared = LOOKS_LIKE_HTML.test(raw) ? raw : linkifyBareImageUrls(raw);
  const intermediate = LOOKS_LIKE_HTML.test(raw)
    ? prepared
    : (marked.parse(prepared, { async: false, gfm: true, breaks: true }) as string);
  const withMentions = linkifyHiveMentions(intermediate);
  return sanitizeHtml(withMentions, FEED_CONTENT_SANITIZE_OPTIONS);
}
