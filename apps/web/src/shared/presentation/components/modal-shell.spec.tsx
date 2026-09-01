/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { ModalShell } from './modal-shell';

jest.mock('../hooks/use-modal-scroll-lock', () => ({
  useModalScrollLock: jest.fn(),
}));

describe('ModalShell variants', () => {
  it('renders dialog variant with centered max-width panel', () => {
    render(
      <ModalShell open onClose={jest.fn()} variant="dialog" maxWidthClass="max-w-md">
        <p>Dialog body</p>
      </ModalShell>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('max-w-md');
    expect(dialog.className).toContain('rounded-card');
    expect(dialog.className).not.toContain('h-dvh');
    expect(dialog.className).not.toContain('rounded-t-card');
  });

  it('renders fullscreen variant as full-height panel', () => {
    render(
      <ModalShell open onClose={jest.fn()} variant="fullscreen">
        <p>Fullscreen body</p>
      </ModalShell>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('h-dvh');
    expect(dialog.className).not.toContain('rounded-t-card');
  });

  it('renders sheet variant as bottom sheet panel', () => {
    render(
      <ModalShell open onClose={jest.fn()} variant="sheet">
        <p>Sheet body</p>
      </ModalShell>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('rounded-t-card');
    expect(dialog.className).toContain('max-h-[92dvh]');
    expect(dialog.className).not.toContain('max-w-md');
  });
});
