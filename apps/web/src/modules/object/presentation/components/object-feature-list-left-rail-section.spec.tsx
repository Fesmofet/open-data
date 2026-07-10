/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import { ObjectFeatureListLeftRailSection } from './object-feature-list-left-rail-section';

const messages = {
  show_more_features: 'Show more features',
  object_updates_show_less: 'Show less',
};

function renderSection(items: { key: string; value: string }[]) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <ObjectFeatureListLeftRailSection headingLabel="Features" items={items} />
    </I18nProvider>,
  );
}

describe('ObjectFeatureListLeftRailSection', () => {
  it('renders key/value rows without links', () => {
    renderSection([
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
    ]);

    expect(screen.getByText('Features:')).toBeInTheDocument();
    expect(screen.getByText('key1: value1')).toBeInTheDocument();
    expect(screen.getByText('key2: value2')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows first two rows and expands on Show more features', () => {
    renderSection([
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
      { key: 'key3', value: 'value3' },
    ]);

    expect(screen.queryByText('key3: value3')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show more features' }));
    expect(screen.getByText('key3: value3')).toBeInTheDocument();
  });
});
