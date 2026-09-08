import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseKnowledgeFile } from './parse-knowledge-file';

const workspaceRoot = join(__dirname, '../../../..');

describe('skills taxonomy', () => {
  const skillsDir = join(workspaceRoot, 'docs/skills');
  const objectCreateDir = join(skillsDir, 'object-create');

  it('types every object-create doc as playbook and every top-level skill doc as skill', () => {
    const topLevel = readdirSync(skillsDir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => join('docs/skills', name).replace(/\\/g, '/'));

    const playbooks = readdirSync(objectCreateDir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => join('docs/skills/object-create', name).replace(/\\/g, '/'));

    expect(playbooks.length).toBe(27);

    for (const relPath of playbooks) {
      const raw = readFileSync(join(workspaceRoot, relPath), 'utf8');
      const parsed = parseKnowledgeFile(relPath, raw);
      expect(parsed.frontmatter.type).toBe('playbook');
    }

    for (const relPath of topLevel) {
      const raw = readFileSync(join(workspaceRoot, relPath), 'utf8');
      const parsed = parseKnowledgeFile(relPath, raw);
      expect(parsed.frontmatter.type).toBe('skill');
    }
  });

  it('object-create skill doc satisfies the skill contract', () => {
    const relPath = 'docs/skills/object-create.md';
    const raw = readFileSync(join(workspaceRoot, relPath), 'utf8');
    const parsed = parseKnowledgeFile(relPath, raw);

    expect(parsed.frontmatter.type).toBe('skill');
    expect(parsed.frontmatter.description?.trim().length).toBeGreaterThan(0);
    expect(parsed.frontmatter.description!.length).toBeLessThanOrEqual(500);
  });
});
