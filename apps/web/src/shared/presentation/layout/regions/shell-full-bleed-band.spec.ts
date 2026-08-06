import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  ShellFullBleedBand,
  shellFullBleedBreakoutClassName,
} from './shell-full-bleed-band';

describe('ShellFullBleedBand', () => {
  it('renders breakout classes by default', () => {
    const html = renderToStaticMarkup(
      createElement(ShellFullBleedBand, null, createElement('span', null, 'bleed')),
    );
    expect(html).toContain(shellFullBleedBreakoutClassName);
    expect(html).toContain('bleed');
  });

  it('renders w-full when breakout is false', () => {
    const html = renderToStaticMarkup(
      createElement(
        ShellFullBleedBand,
        { breakout: false },
        createElement('span', null, 'shell'),
      ),
    );
    expect(html).toContain('w-full');
    expect(html).not.toContain('ms-[calc(50%-50dvw)]');
  });
});
