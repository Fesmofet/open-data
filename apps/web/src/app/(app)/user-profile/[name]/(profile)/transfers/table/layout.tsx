import type { ReactNode } from 'react';

export default function UserProfileTransfersTableLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="mt-card-padding min-w-0">{children}</div>;
}
