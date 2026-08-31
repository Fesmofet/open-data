/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Icon } from './icon';
import { HiveSavingsShieldIcon } from './packs/custom/hive-savings-shield';
import { NAMED_ICON_BY_NAME } from './named';
import { composeIconRegistry, ICON_REGISTRY, type IconName } from './registry';
import type { IconComponent } from './types';

const COLOR_ALLOWLIST = new Set(['hive-savings-shield', 'hbd-savings-shield']);

describe('Icon', () => {
  it('renders the glyph registered under the requested name (TC-001)', () => {
    for (const name of Object.keys(ICON_REGISTRY) as IconName[]) {
      const Direct = ICON_REGISTRY[name];
      const { container: iconContainer } = render(<Icon name={name} />);
      const { container: directContainer } = render(createElement(Direct, {}));

      expect(iconContainer.querySelector('svg')?.innerHTML).toBe(
        directContainer.querySelector('svg')?.innerHTML,
      );
    }
  });

  it('applies default size 16 when size is omitted (TC-002)', () => {
    render(<Icon name="chevron-down" />);
    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('16');
    expect(svg?.getAttribute('height')).toBe('16');
  });

  it.each([
    ['xs', '12'],
    ['sm', '14'],
    ['md', '16'],
    ['lg', '20'],
    ['xl', '24'],
  ] as const)('maps size token %s to %spx (TC-003)', (token, expected) => {
    render(<Icon name="bell" size={token} />);
    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe(expected);
    expect(svg?.getAttribute('height')).toBe(expected);
  });

  it('passes numeric size unchanged (TC-004)', () => {
    render(<Icon name="bell" size={18} />);
    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('18');
    expect(svg?.getAttribute('height')).toBe('18');
  });

  it('preserves className on svg (TC-005)', () => {
    render(<Icon name="bell" className="text-fg-secondary leading-none" />);
    const svg = document.querySelector('svg');
    const className = svg?.getAttribute('class') ?? '';
    expect(className).toContain('text-fg-secondary');
    expect(className).toContain('leading-none');
  });

  it('passes strokeWidth to svg (TC-006)', () => {
    render(<Icon name="bell" strokeWidth={1.5} />);
    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('stroke-width')).toBe('1.5');
  });

  it('is accessible when title is provided (TC-007)', () => {
    render(<Icon name="close" title="Close dialog" />);
    expect(screen.getByRole('img', { name: 'Close dialog' })).toBeInTheDocument();
    expect(document.querySelector('title')?.textContent).toBe('Close dialog');
  });

  it('is decorative when title is omitted (TC-008)', () => {
    render(<Icon name="bell" />);
    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('custom pack entry overrides base pack for the same name (TC-009)', () => {
    const base: Record<string, IconComponent> = {
      wallet: () => createElement('svg', { 'data-testid': 'base' }),
    };
    const overrides: Record<string, IconComponent> = {
      wallet: () => createElement('svg', { 'data-testid': 'override' }),
    };
    const registry = composeIconRegistry(base, overrides);
    expect(registry.wallet).toBe(overrides.wallet);
  });

  it('named components match registry markup (TC-012)', () => {
    for (const [name, Named] of Object.entries(NAMED_ICON_BY_NAME)) {
      const namedMarkup = renderToStaticMarkup(createElement(Named, {}));
      const iconMarkup = renderToStaticMarkup(
        createElement(Icon, { name: name as IconName }),
      );
      expect(namedMarkup).toBe(iconMarkup);
    }
  });

  it('does not hardcode colors except allowlisted icons (TC-013)', () => {
    for (const name of Object.keys(ICON_REGISTRY) as IconName[]) {
      const markup = renderToStaticMarkup(
        createElement(Icon, { name: name as IconName }),
      );
      if (COLOR_ALLOWLIST.has(name)) {
        continue;
      }
      expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}/);
      expect(markup).not.toMatch(/rgb\(/);
      expect(markup).not.toMatch(/hsl\(/);
    }
  });

  it('keeps native shield dimensions when size is omitted (TC-018)', () => {
    render(<HiveSavingsShieldIcon />);
    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('19');
    expect(svg?.getAttribute('height')).toBe('22');
  });

  it('returns null for unknown names without throwing (TC-014)', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(
      <Icon name={'no-such-icon' as IconName} />,
    );
    expect(container.firstChild).toBeNull();
    warn.mockRestore();
  });

  it.each(['', null, undefined] as const)(
    'returns null for empty name %s without throwing (TC-015)',
    (name) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { container } = render(
        <Icon name={name as IconName} />,
      );
      expect(container.firstChild).toBeNull();
      warn.mockRestore();
    },
  );

  it.each([0, -4] as const)(
    'falls back to default size for invalid numeric size %s (TC-016)',
    (size) => {
      render(<Icon name="bell" size={size} />);
      const svg = document.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('16');
      expect(svg?.getAttribute('height')).toBe('16');
    },
  );

  it('treats empty title as decorative (TC-017)', () => {
    render(<Icon name="bell" title="" />);
    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(document.querySelector('title')).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
