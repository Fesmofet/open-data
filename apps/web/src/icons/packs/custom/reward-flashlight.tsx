import type { IconComponentProps } from '../../types';
import { resolveIconSize } from '../../constants';

export function RewardFlashlightIcon({
  size,
  className,
  strokeWidth = 2,
  title,
}: IconComponentProps) {
  const px = resolveIconSize(size);
  const ariaProps = title
    ? { role: 'img' as const, 'aria-hidden': undefined }
    : { 'aria-hidden': true as const };

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...ariaProps}
    >
      {title ? <title>{title}</title> : null}
      <path d="M18 6h-6l-2-4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" />
      <path d="M10 16l2-4 2 4" />
    </svg>
  );
}
