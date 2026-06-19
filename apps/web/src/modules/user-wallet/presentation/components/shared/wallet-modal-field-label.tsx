import type { ReactNode } from 'react';

export type WalletModalFieldLabelProps = {
  children: ReactNode;
};

export function WalletModalFieldLabel({ children }: WalletModalFieldLabelProps) {
  return (
    <h3 className="text-body-sm font-weight-label text-fg">
      {children}:
    </h3>
  );
}
