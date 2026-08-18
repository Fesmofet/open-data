/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import { ObjectWidgetContent } from './object-widget-content';

const messages = {
  object_widget_empty: 'This widget is empty',
  object_widget_opens_new_tab: 'This widget opens in a new tab. Click the',
  object_widget_opens_same_tab: 'This widget opens in the same tab. Click the',
  object_widget_continue_link: 'link',
};

function renderWidget(
  config: Parameters<typeof ObjectWidgetContent>[0]['config'],
) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <ObjectWidgetContent config={config} />
    </I18nProvider>,
  );
}

describe('ObjectWidgetContent', () => {
  it('renders empty state when config is null', () => {
    renderWidget(null);
    expect(screen.getByText('This widget is empty')).toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('renders newTab link without iframe', () => {
    renderWidget({
      column: 'newTab',
      type: 'Widget',
      content: 'https://example.com/embed',
    });
    const link = screen.getByRole('link', { name: 'link' });
    expect(link).toHaveAttribute('href', 'https://example.com/embed');
    expect(link).toHaveAttribute('target', '_blank');
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('renders forward link without iframe', () => {
    renderWidget({
      column: 'forward',
      type: 'Widget',
      content: 'https://example.com/embed',
    });
    const link = screen.getByRole('link', { name: 'link' });
    expect(link).toHaveAttribute('href', 'https://example.com/embed');
    expect(link).not.toHaveAttribute('target', '_blank');
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('renders srcDoc iframe for Widget type', () => {
    renderWidget({
      column: 'one',
      type: 'Widget',
      content: '<div>embed</div>',
    });
    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe).toHaveAttribute('srcdoc', '<div>embed</div>');
    expect(iframe).not.toHaveAttribute('src');
  });

  it('renders external src iframe for non-Widget type', () => {
    renderWidget({
      column: 'one',
      type: 'Youtube',
      content: 'https://youtube.com/embed/abc',
    });
    const iframe = document.querySelector('iframe');
    expect(iframe).toHaveAttribute('src', 'https://youtube.com/embed/abc');
  });

  it('renders inline iframe HTML when content contains iframe tag', () => {
    const { container } = renderWidget({
      column: 'one',
      type: 'Widget',
      content: '<iframe src="https://x.com"></iframe>',
    });
    expect(container.querySelector('iframe')).not.toBeNull();
    expect(container.querySelector('iframe')?.getAttribute('srcdoc')).toBeNull();
  });
});
