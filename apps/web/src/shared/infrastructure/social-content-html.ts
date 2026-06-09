/**
 * Linkify @mentions and bare image URLs in feed/comment text (legacy Waivio `steemitHtmlReady`).
 */

const HIVE_MENTION_RE =
  /(^|[\s(\[>])(@([a-z][a-z0-9.-]{2,15}))(?=[\s).,!?;:\]<>]|$)/gi;

const BARE_IMAGE_URL_RE =
  /https?:\/\/[^\s"'()<>]+?\.(?:jpe?g|png|gif|webp|svg)(?:\?[^\s"'()<>]*)?(?:#[^\s"'()<>]*)?(?=$|[\s'")\].,!?;:<>])/gi;

export function linkifyHiveMentions(content: string): string {
  return content.replace(HIVE_MENTION_RE, (match, prefix, full, username) => {
    return `${prefix}<a href="/@${username}">${full}</a>`;
  });
}

export function linkifyBareImageUrls(content: string): string {
  return content.replace(BARE_IMAGE_URL_RE, (match) => `<img src="${match}" alt="" />`);
}
