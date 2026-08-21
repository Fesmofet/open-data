import { imageContentUrlForCid } from '@/config/ipfs-content-url';
import { lexicalStateToMarkdown } from '@/modules/editor/application/lexical-state-to-markdown';

export function buildMessagingMarkdownFromLexical(
  bodyLexicalJson: string,
  contentBaseUrl: string | null,
): string {
  const resolveImageUrl = (cid: string, src: string) => {
    if (cid && contentBaseUrl) {
      return imageContentUrlForCid(contentBaseUrl, cid);
    }
    return src.trim();
  };
  return lexicalStateToMarkdown(bodyLexicalJson, { resolveImageUrl }).trim();
}
