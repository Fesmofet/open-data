export interface LessonSection {
  path: string;
  title: string;
  content: string;
}

export function splitLessonsFile(raw: string): LessonSection[] {
  const sections: LessonSection[] = [];
  const parts = raw.split(/^## /m).filter(Boolean);

  if (parts.length === 0) {
    return [];
  }

  // First part before any ## might be file intro — skip if no heading
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const titleLine = nl >= 0 ? part.slice(0, nl).trim() : part.trim();
    const body = nl >= 0 ? part.slice(nl + 1).trim() : '';
    const slug = titleLine
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug) continue;
    sections.push({
      path: `tasks/lessons/${slug}.md`,
      title: titleLine,
      content: `# ${titleLine}\n\n${body}`,
    });
  }

  return sections;
}
