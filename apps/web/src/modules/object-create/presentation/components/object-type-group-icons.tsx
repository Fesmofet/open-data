import type { ReactNode } from 'react';

import type { ObjectTypeSelectorGroupId } from '../../domain/object-type-display';

function IconShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

function PopularIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L6 21l2.3-7-6-4.6h7.6L12 2z" />
    </IconShell>
  );
}

function ContentIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </IconShell>
  );
}

function SocialIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconShell>
  );
}

function CommerceIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </IconShell>
  );
}

function MapsIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </IconShell>
  );
}

function WebIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </IconShell>
  );
}

function OtherIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </IconShell>
  );
}

const GROUP_ICONS: Record<
  ObjectTypeSelectorGroupId,
  (props: { className?: string }) => ReactNode
> = {
  popular: PopularIcon,
  content: ContentIcon,
  social: SocialIcon,
  commerce: CommerceIcon,
  maps: MapsIcon,
  web: WebIcon,
  other: OtherIcon,
};

export function ObjectTypeGroupIcon({
  groupId,
  className,
}: {
  groupId: ObjectTypeSelectorGroupId;
  className?: string;
}) {
  const Icon = GROUP_ICONS[groupId];
  return <Icon className={className} />;
}
