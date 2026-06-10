import { chunkMarkdown } from './chunk-markdown';

describe('chunkMarkdown', () => {
  it('returns single chunk for overview type', () => {
    const body = '## A\n\nOne.\n\n## B\n\nTwo.';
    const chunks = chunkMarkdown(body, { singleChunk: true });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.content).toContain('## A');
    expect(chunks[0]!.content).toContain('## B');
  });

  it('splits on h2 sections', () => {
    const body = '## Purpose\n\nGoals.\n\n## Behavior\n\nRules.';
    const chunks = chunkMarkdown(body);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0]!.heading).toBe('Purpose');
    expect(chunks[0]!.sectionType).toBe('purpose');
  });

  it('does not split inside fenced code blocks', () => {
    const body = `## Setup

\`\`\`js
## not a heading
\`\`\`

Done.`;
    const chunks = chunkMarkdown(body);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.content).toContain('## not a heading');
  });
});
