export type SectionType = 'purpose' | 'behavior' | 'verification' | 'other';

export interface MarkdownChunk {
  heading: string | null;
  headingPath: string[];
  chunkIndex: number;
  content: string;
  tokenCount: number;
  sectionType: SectionType;
}

const MAX_TOKENS = 1200;
const MIN_TOKENS = 500;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function classifySection(heading: string): SectionType {
  const h = heading.toLowerCase();
  if (h.includes('purpose') || h.includes('context') || h.includes('goal')) return 'purpose';
  if (h.includes('behavior') || h.includes('requirement') || h.includes('implementation')) {
    return 'behavior';
  }
  if (h.includes('verification') || h.includes('test')) return 'verification';
  return 'other';
}

interface Section {
  heading: string | null;
  level: number;
  content: string;
}

function splitSections(body: string): Section[] {
  const lines = body.split(/\r?\n/);
  const sections: Section[] = [];
  let current: Section = { heading: null, level: 0, content: '' };

  for (const line of lines) {
    const h2 = /^(#{2,3})\s+(.+)$/.exec(line);
    if (h2) {
      if (current.content.trim() || current.heading) {
        sections.push(current);
      }
      current = {
        heading: h2[2]!.trim(),
        level: h2[1]!.length,
        content: '',
      };
      continue;
    }
    current.content += `${line}\n`;
  }
  if (current.content.trim() || current.heading) {
    sections.push(current);
  }

  if (sections.length === 0) {
    return [{ heading: null, level: 0, content: body }];
  }

  return sections;
}

function splitLargeSection(section: Section): Section[] {
  const tokens = estimateTokens(section.content);
  if (tokens <= MAX_TOKENS) {
    return [section];
  }

  const paragraphs = section.content.split(/\n\n+/);
  const parts: Section[] = [];
  let buf = '';

  for (const para of paragraphs) {
    const candidate = buf ? `${buf}\n\n${para}` : para;
    if (estimateTokens(candidate) > MAX_TOKENS && buf) {
      parts.push({ ...section, content: buf });
      buf = para;
    } else {
      buf = candidate;
    }
  }
  if (buf.trim()) {
    parts.push({ ...section, content: buf });
  }

  return parts.length > 0 ? parts : [section];
}

export function chunkMarkdown(
  body: string,
  options?: { singleChunk?: boolean },
): MarkdownChunk[] {
  if (options?.singleChunk || !body.trim()) {
    const content = body.trim();
    return [
      {
        heading: null,
        headingPath: [],
        chunkIndex: 0,
        content,
        tokenCount: estimateTokens(content),
        sectionType: 'other',
      },
    ];
  }

  const rawSections = splitSections(body);
  const sections = rawSections.flatMap(splitLargeSection);

  const headingPath: string[] = [];
  const chunks: MarkdownChunk[] = [];
  let index = 0;

  for (const section of sections) {
    const content = section.content.trim();
    if (!content && !section.heading) continue;

    if (section.heading) {
      if (section.level <= 2) {
        headingPath.length = 0;
        headingPath.push(section.heading);
      } else if (section.level === 3) {
        if (headingPath.length > 1) headingPath.pop();
        headingPath.push(section.heading);
      }
    }

    const text =
      section.heading && content
        ? `## ${section.heading}\n\n${content}`
        : section.heading
          ? `## ${section.heading}`
          : content;

  if (!text.trim()) continue;

    if (estimateTokens(text) < MIN_TOKENS && chunks.length > 0) {
      const prev = chunks[chunks.length - 1]!;
      prev.content = `${prev.content}\n\n${text}`;
      prev.tokenCount = estimateTokens(prev.content);
      continue;
    }

    chunks.push({
      heading: section.heading,
      headingPath: [...headingPath],
      chunkIndex: index++,
      content: text,
      tokenCount: estimateTokens(text),
      sectionType: section.heading ? classifySection(section.heading) : 'other',
    });
  }

  if (chunks.length === 0) {
    return chunkMarkdown(body, { singleChunk: true });
  }

  return chunks.map((c, i) => ({ ...c, chunkIndex: i }));
}
