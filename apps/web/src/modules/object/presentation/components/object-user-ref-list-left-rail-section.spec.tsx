/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import {
  LEFT_RAIL_USER_REF_COLLAPSED_COUNT,
  ObjectUserRefListLeftRailSection,
} from './object-user-ref-list-left-rail-section';

const messages = {
  show_more: 'Show more',
  object_updates_show_less: 'Show less',
};

function renderSection(accounts: string[]) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <ObjectUserRefListLeftRailSection headingLabel="Administrators" accounts={accounts} />
    </I18nProvider>,
  );
}

describe('ObjectUserRefListLeftRailSection', () => {
  it('renders profile links for accounts', () => {
    renderSection(['alice', 'bob']);

    expect(screen.getByText('Administrators:')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /@alice/ })).toHaveAttribute('href', '/@alice');
    expect(screen.getByRole('link', { name: /@bob/ })).toHaveAttribute('href', '/@bob');
  });

  it(`shows first ${LEFT_RAIL_USER_REF_COLLAPSED_COUNT} accounts then expands`, () => {
    const accounts = Array.from({ length: 11 }, (_, i) => `user${i + 1}`);
    renderSection(accounts);

    expect(screen.getByRole('link', { name: /@user10/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /@user11/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByRole('link', { name: /@user11/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByRole('link', { name: /@user11/ })).not.toBeInTheDocument();
  });
});
