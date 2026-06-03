import {
  $parseSerializedNode,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type SerializedElementNode,
  Spread,
  createCommand,
  type LexicalCommand,
} from 'lexical';

export const POST_IMAGE_NODE_TYPE = 'post-image';

export type ImagePayload = {
  src: string;
  altText?: string;
  cid?: string;
};

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> =
  createCommand('INSERT_IMAGE_COMMAND');

export type SerializedImageNode = Spread<
  {
    type: typeof POST_IMAGE_NODE_TYPE;
    version: 1;
    src: string;
    altText: string;
    cid: string;
  },
  SerializedElementNode
>;

function serializedImageNode(payload: ImagePayload): SerializedImageNode {
  return {
    type: POST_IMAGE_NODE_TYPE,
    version: 1,
    src: payload.src,
    altText: payload.altText ?? '',
    cid: payload.cid ?? '',
    children: [],
    format: '',
    indent: 0,
    direction: null,
  };
}

export class ImageNode extends ElementNode {
  __src: string;
  __altText: string;
  __cid: string;

  static getType(): string {
    return POST_IMAGE_NODE_TYPE;
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__cid, node.__key);
  }

  constructor(src: string, altText: string, cid: string, key?: string) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__cid = cid;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-post-image', 'true');
    const className = config.theme.image;
    if (className) {
      wrapper.className = className;
    }
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__altText;
    img.setAttribute('data-cid', this.__cid);
    img.draggable = false;
    img.className = 'max-w-full h-auto rounded-card';
    wrapper.appendChild(img);
    return wrapper;
  }

  updateDOM(prevNode: ImageNode, dom: HTMLElement): boolean {
    const img = dom.querySelector('img');
    if (img && (prevNode.__src !== this.__src || prevNode.__altText !== this.__altText)) {
      img.src = this.__src;
      img.alt = this.__altText;
      if (this.__cid) {
        img.setAttribute('data-cid', this.__cid);
      }
    }
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const Klass = this as typeof ImageNode;
    return new Klass(
      serializedNode.src,
      serializedNode.altText ?? '',
      serializedNode.cid ?? '',
    ).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      type: POST_IMAGE_NODE_TYPE,
      version: 1,
      src: this.__src,
      altText: this.__altText,
      cid: this.__cid,
    };
  }

  getSrc(): string {
    return this.__src;
  }

  getCid(): string {
    return this.__cid;
  }

  setSrc(src: string): void {
    const writable = this.getWritable();
    writable.__src = src;
  }

  isInline(): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

/** Creates an image node via the active editor's registered node class. */
export function $createImageNode(payload: ImagePayload): ImageNode {
  return $parseSerializedNode(
    serializedImageNode(payload),
  ) as ImageNode;
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
