import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { LineBreakNode, ParagraphNode, TextNode } from 'lexical';

import { ImageNode } from './nodes/image-node';
import { SpoilerNode } from './nodes/spoiler-node';

/** Stable node list — must not be recreated per render (Lexical registry identity). */
export const POST_EDITOR_NODES = [
  ParagraphNode,
  TextNode,
  LineBreakNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  SpoilerNode,
  ImageNode,
] as const;

export { ImageNode, SpoilerNode };
export {
  $createImageNode,
  $isImageNode,
  INSERT_IMAGE_COMMAND,
  type ImagePayload,
} from './nodes/image-node';
