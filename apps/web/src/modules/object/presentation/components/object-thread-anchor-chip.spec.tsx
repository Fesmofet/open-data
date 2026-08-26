/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

jest.mock('@/i18n/providers/i18n-provider', () => ({
  useI18n: () => ({
    t: (key: string) => (key === 'object_thread_posting_in' ? 'Posting in:' : key),
  }),
}));

jest.mock('@/modules/discover/presentation/components/discover-active-chips', () => ({
  DISCOVER_ACTIVE_CHIP_CLASS: 'discover-chip',
}));

import { ObjectThreadAnchorChip } from './object-thread-anchor-chip';

describe('ObjectThreadAnchorChip', () => {
  it('renders posting-in label and object name without remove control', () => {
    render(<ObjectThreadAnchorChip objectName="FireRock Lounge" />);
    expect(screen.getByText('Posting in:')).toBeInTheDocument();
    expect(screen.getByText('FireRock Lounge')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
