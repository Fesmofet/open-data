import { POST_IMAGE_NODE_TYPE } from '../domain/nodes/image-node';

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_CODE = 16;

type LexicalJsonNode = {
  type?: string;
  tag?: string;
  format?: number | string;
  text?: string;
  url?: string;
  src?: string;
  altText?: string;
  cid?: string;
  listType?: string;
  children?: LexicalJsonNode[];
};

export type LexicalToMarkdownOptions = {
  resolveImageUrl: (cid: string, src: string) => string;
};

function escapeMarkdownText(text: string): string {
  return text.replace(/([\\`*_[\]#])/g, '\\$1');
}

function formatInlineText(text: string, format: number): string {
  if (!text) {
    return '';
  }
  let out = escapeMarkdownText(text);
  if (format & FORMAT_CODE) {
    out = `\`${out.replace(/`/g, '\\`')}\``;
  }
  if (format & FORMAT_STRIKETHROUGH) {
    out = `~~${out}~~`;
  }
  if (format & FORMAT_BOLD) {
    out = `**${out}**`;
  }
  if (format & FORMAT_ITALIC) {
    out = `*${out}*`;
  }
  return out;
}

function serializeChildren(
  nodes: LexicalJsonNode[] | undefined,
  options: LexicalToMarkdownOptions,
): string {
  if (!nodes?.length) {
    return '';
  }
  return nodes.map((n) => serializeNode(n, options)).join('');
}

function serializeNode(node: LexicalJsonNode, options: LexicalToMarkdownOptions): string {
  const type = node.type ?? '';
  switch (type) {
    case 'text': {
      const format =
        typeof node.format === 'number' ? node.format : Number(node.format) || 0;
      return formatInlineText(node.text ?? '', format);
    }
    case 'linebreak':
      return '\n';
    case 'link': {
      const inner = serializeChildren(node.children, options);
      const url = (node.url ?? '').trim();
      return url ? `[${inner}](${url})` : inner;
    }
    case 'paragraph':
      return serializeChildren(node.children, options);
    default:
      return serializeChildren(node.children, options);
  }
}

function blockMarkdown(
  node: LexicalJsonNode,
  options: LexicalToMarkdownOptions,
): string {
  const type = node.type ?? '';
  const childMd = serializeChildren(node.children, options).trimEnd();

  switch (type) {
    case 'heading': {
      const level = node.tag === 'h1' ? 1 : node.tag === 'h3' ? 3 : 2;
      const prefix = '#'.repeat(level);
      return childMd ? `${prefix} ${childMd}\n\n` : '';
    }
    case 'quote':
      return childMd
        ? childMd
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n') + '\n\n'
        : '';
    case 'spoiler':
      return childMd ? `||${childMd}||\n\n` : '';
    case POST_IMAGE_NODE_TYPE:
    case 'image': {
      const cid = typeof node.cid === 'string' ? node.cid.trim() : '';
      const src = typeof node.src === 'string' ? node.src : '';
      const url = options.resolveImageUrl(cid, src);
      if (!url) {
        return '';
      }
      const alt = (node.altText ?? '').trim();
      return `![${alt}](${url})\n\n`;
    }
    case 'list': {
      const items = node.children ?? [];
      const ordered = node.listType === 'number';
      const lines = items.map((item, index) => {
        const text = serializeChildren(item.children, options).trim();
        const marker = ordered ? `${index + 1}.` : '-';
        return `${marker} ${text}`;
      });
      return lines.length > 0 ? `${lines.join('\n')}\n\n` : '';
    }
    case 'listitem':
      return serializeChildren(node.children, options);
    case 'paragraph':
      return childMd ? `${childMd}\n\n` : '\n';
    default:
      return childMd ? `${childMd}\n\n` : '';
  }
}

function walkRootBlocks(
  nodes: LexicalJsonNode[] | undefined,
  options: LexicalToMarkdownOptions,
): string {
  if (!nodes?.length) {
    return '';
  }
  const parts: string[] = [];
  for (const node of nodes) {
    const type = node.type ?? '';
    if (type === 'paragraph' || type === 'heading' || type === 'quote' || type === 'spoiler' || type === 'list' || type === POST_IMAGE_NODE_TYPE || type === 'image') {
      parts.push(blockMarkdown(node, options));
    } else {
      const inline = serializeChildren(node.children, options);
      if (inline.trim()) {
        parts.push(`${inline.trim()}\n\n`);
      }
    }
  }
  return parts.join('').replace(/\n{3,}/g, '\n\n').trim();
}

/** Converts Lexical `editorState.toJSON()` string to Hive markdown body. */
export function lexicalStateToMarkdown(
  body: string,
  options: LexicalToMarkdownOptions,
): string {
  const trimmed = body.trim();
  if (!trimmed.startsWith('{')) {
    return trimmed;
  }
  try {
    const state = JSON.parse(trimmed) as { root?: { children?: LexicalJsonNode[] } };
    return walkRootBlocks(state.root?.children, options);
  } catch {
    return trimmed;
  }
}
