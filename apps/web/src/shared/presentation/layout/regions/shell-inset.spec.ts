import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ShellInset } from './shell-inset';

describe('ShellInset', () => {
  it('renders constrained column classes', () => {
    const html = renderToStaticMarkup(
      createElement(ShellInset, null, createElement('span', null, 'inset')),
    );
    expect(html).toContain('max-w-container-page');
    expect(html).toContain('px-gutter');
    expect(html).toContain('inset');
  });
});
