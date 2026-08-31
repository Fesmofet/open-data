/** @jest-environment node */

import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Icon } from './icon';

function collectIconFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectIconFiles(fullPath, acc);
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') && !entry.name.endsWith('.spec.tsx')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

describe('icons server safety', () => {
  it('renders svg markup on the server (TC-022)', () => {
    const markup = renderToStaticMarkup(createElement(Icon, { name: 'bell' }));
    expect(markup).toContain('<svg');
  });

  it('icon module graph has no use client directive (TC-022)', () => {
    const iconsRoot = path.join(__dirname);
    const violations: string[] = [];

    for (const file of collectIconFiles(iconsRoot)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes("'use client'") || content.includes('"use client"')) {
        violations.push(path.relative(iconsRoot, file));
      }
    }

    expect(violations).toEqual([]);
  });
});
