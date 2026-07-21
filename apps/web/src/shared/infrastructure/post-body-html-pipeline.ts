import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

import { getProxyImageUrl } from './image/get-proxy-image-url';
import { linkifyBareImageUrls, linkifyHiveMentions } from './social-content-html';

/**
 * If the body already contains typical Hive/HTML markup, skip markdown and only sanitize.
 */
export const POST_BODY_LOOKS_LIKE_HTML =
  /<\s*\/?(p|div|br|h[1-6]|ul|ol|li|blockquote|iframe|section|article|center|table|pre|hr|a|img)\b/i;

const YOUTUBE_ID = '[a-zA-Z0-9_-]{11}';

export function postBodyToIntermediateHtml(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return '';
  }
  if (POST_BODY_LOOKS_LIKE_HTML.test(raw)) {
    return raw;
  }
  return marked.parse(raw, {
    async: false,
    gfm: true,
    breaks: true,
  }) as string;
}

export function convertMarkdownImages(html: string): string {
  if (!html.includes('![')) {
    return html;
  }
  return html.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^)\s"'<>]+)\)/g,
    (_, alt: string, src: string) => `<img src="${src}" alt="${alt}">`,
  );
}

function extractYoutubeVideoId(url: string): string | null {
  const fromWatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (fromWatch) {
    return fromWatch[1] ?? null;
  }
  const fromShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (fromShort) {
    return fromShort[1] ?? null;
  }
  return null;
}

function youtubeIframeHtml(videoId: string): string {
  const src = `https://www.youtube.com/embed/${videoId}`;
  return `<div class="blog-post-youtube-embed"><iframe src="${src}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
}

function threeSpeakIframeHtml(videoIdRaw: string): string {
  let videoId = videoIdRaw;
  try {
    videoId = decodeURIComponent(videoIdRaw.replace(/\+/g, ' '));
  } catch {
    videoId = videoIdRaw;
  }
  if (videoId.includes('..')) {
    return '';
  }
  const src = `https://play.3speak.tv/watch?v=${encodeURIComponent(videoId)}&mode=iframe&layout=desktop`;
  return `<div class="blog-post-3speak-embed"><iframe src="${src}" title="3Speak video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
}

/** Legacy Waivio `Body.js` — linked poster images become iframe; drop duplicate posters when embedded. */
export function embedThreeSpeakInBody(html: string): string {
  if (!html.includes('3speak')) {
    return html;
  }

  let out = html;

  out = out.replace(
    /<a\s+[^>]*(?:href|data-href)=["']https?:\/\/3speak\.(?:tv|online)\/(?:watch|embed)\?[^"']*\bv=([^"&]+)[^"']*["'][^>]*>\s*<img[^>]*>\s*<\/a>/gi,
    (_match, videoId: string) => threeSpeakIframeHtml(videoId),
  );

  out = out.replace(
    /<img[^>]*data-linked-url=["']https?:\/\/3speak\.(?:tv|online)\/[^"']*\bv=([^"&]+)[^"']*["'][^>]*>/gi,
    (_match, videoId: string) => threeSpeakIframeHtml(videoId),
  );

  if (!/play\.3speak\.tv/i.test(out)) {
    out = out.replace(
      /https?:\/\/3speak\.(?:tv|online)\/(?:watch|embed)\?(?:[^"'\s]*&)*v=([^&\s<>"']+)/gi,
      (_match, videoId: string) => threeSpeakIframeHtml(videoId),
    );
  }

  if (/play\.3speak\.tv/i.test(out)) {
    out = out.replace(
      /<a\s+[^>]*href=["']https?:\/\/3speak\.(?:tv|online)\/[^"']+["'][^>]*>\s*<img[^>]*>\s*<\/a>/gi,
      '',
    );
    out = out.replace(
      /<img[^>]*data-linked-url=["']https?:\/\/3speak\.[^"']+["'][^>]*>/gi,
      '',
    );
  }

  return out;
}

export function embedYouTubeUrls(html: string): string {
  if (!html.includes('youtube') && !html.includes('youtu.be')) {
    return html;
  }

  let out = html;

  out = out.replace(
    new RegExp(
      `<a\\s+[^>]*href=["'](https?:\\/\\/(?:www\\.)?youtube\\.com\\/watch\\?[^"']*v=(${YOUTUBE_ID})[^"']*)["'][^>]*>[\\s\\S]*?<\\/a>`,
      'gi',
    ),
    (_m, _href: string, id: string) => youtubeIframeHtml(id),
  );
  out = out.replace(
    new RegExp(
      `<a\\s+[^>]*href=["'](https?:\\/\\/youtu\\.be\\/(${YOUTUBE_ID})[^"']*)["'][^>]*>[\\s\\S]*?<\\/a>`,
      'gi',
    ),
    (_m, _href: string, id: string) => youtubeIframeHtml(id),
  );

  const watchUrl = /https?:\/\/(?:www\.)?youtube\.com\/watch\?[^\s<"&]+/gi;
  const shortUrl = /https?:\/\/youtu\.be\/[^\s<"&]+/gi;

  out = out.replace(watchUrl, (url) => {
    if (url.includes('/embed/')) {
      return url;
    }
    const id = extractYoutubeVideoId(url);
    return id ? youtubeIframeHtml(id) : url;
  });
  out = out.replace(shortUrl, (url) => {
    if (url.includes('/embed/')) {
      return url;
    }
    const id = extractYoutubeVideoId(url);
    return id ? youtubeIframeHtml(id) : url;
  });

  return out;
}

const POST_BODY_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img',
    'center',
    'del',
    'ins',
    'picture',
    'source',
    'iframe',
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: [
      'src',
      'alt',
      'title',
      'width',
      'height',
      'class',
      'srcset',
      'sizes',
      'data-fallback-src',
    ],
    a: ['href', 'name', 'target', 'rel', 'class', 'title'],
    iframe: [
      'src',
      'width',
      'height',
      'allowfullscreen',
      'frameborder',
      'title',
      'allow',
      'loading',
      'class',
    ],
    div: ['class'],
    '*': ['class', 'id'],
  },
  allowedIframeHostnames: [
    'www.youtube.com',
    'youtube.com',
    'www.youtube-nocookie.com',
    'player.vimeo.com',
    '3speak.tv',
    'play.3speak.tv',
    'www.dailymotion.com',
    'embed.twitch.tv',
  ],
  transformTags: {
    img: (tagName, attribs) => {
      const originalSrc = attribs.src?.trim() ?? '';
      if (!originalSrc) {
        return { tagName, attribs };
      }
      const proxied = getProxyImageUrl(originalSrc);
      return {
        tagName,
        attribs: {
          ...attribs,
          src: proxied,
          ...(proxied !== originalSrc
            ? { 'data-fallback-src': originalSrc }
            : {}),
        },
      };
    },
  },
};

/** Markdown or HTML post body → safe HTML for display. Client and server safe. */
export function sanitizePostBodyHtml(raw: string): string {
  const parsed = postBodyToIntermediateHtml(raw);
  const withImages = POST_BODY_LOOKS_LIKE_HTML.test(raw)
    ? parsed
    : linkifyBareImageUrls(parsed);
  const intermediate = linkifyHiveMentions(
    embedYouTubeUrls(embedThreeSpeakInBody(convertMarkdownImages(withImages))),
  );
  return sanitizeHtml(intermediate, POST_BODY_SANITIZE_OPTIONS);
}
