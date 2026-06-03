import { lexicalStateToMarkdown } from './lexical-state-to-markdown';

const resolveImageUrl = (cid: string, src: string) =>
  cid ? `https://ipfs.example/ipfs/${cid}` : src;

describe('lexicalStateToMarkdown', () => {
  it('returns plain string when not JSON', () => {
    expect(lexicalStateToMarkdown('hello', { resolveImageUrl })).toBe('hello');
  });

  it('converts paragraph and bold text', () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Hello ', format: 0 },
              { type: 'text', text: 'world', format: 1 },
            ],
          },
        ],
      },
    });
    expect(lexicalStateToMarkdown(json, { resolveImageUrl })).toBe('Hello **world**');
  });

  it('converts heading and link', () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: 'Title', format: 0 }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                url: 'https://example.com',
                children: [{ type: 'text', text: 'link', format: 0 }],
              },
            ],
          },
        ],
      },
    });
    const md = lexicalStateToMarkdown(json, { resolveImageUrl });
    expect(md).toContain('## Title');
    expect(md).toContain('[link](https://example.com)');
  });

  it('converts post-image node', () => {
    const json = JSON.stringify({
      root: {
        children: [
          {
            type: 'post-image',
            cid: 'QmTest',
            src: '',
            altText: 'pic',
            children: [],
          },
        ],
      },
    });
    expect(lexicalStateToMarkdown(json, { resolveImageUrl })).toBe(
      '![pic](https://ipfs.example/ipfs/QmTest)',
    );
  });
});
