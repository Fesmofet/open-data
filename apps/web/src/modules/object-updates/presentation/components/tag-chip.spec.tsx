/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { TagChip } from './tag-chip';

describe('TagChip', () => {
  it('renders label and calls onApprove in vote mode', () => {
    const onApprove = jest.fn();
    render(
      <TagChip label="automation" onApprove={onApprove} approveAria="Approve tag" />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Approve tag' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('shows accent border when viewer voted for', () => {
    const { container } = render(
      <TagChip
        label="automation"
        viewerVote="for"
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );
    expect(container.querySelector('.border-accent')).toBeTruthy();
  });

  it('renders dashed empty compose pill', () => {
    const { container } = render(
      <TagChip label="New tag" empty onClick={jest.fn()} />,
    );
    expect(container.querySelector('.border-dashed')).toBeTruthy();
    expect(screen.getByText('New tag')).toBeInTheDocument();
  });
});
