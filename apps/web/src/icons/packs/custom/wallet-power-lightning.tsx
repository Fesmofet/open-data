import type { IconComponentProps } from '../../types';
import {
  WALLET_ROW_POWER_ICON_HEIGHT,
  WALLET_ROW_POWER_ICON_WIDTH,
  resolveIconSize,
} from '../../constants';

export function WalletPowerLightningIcon({
  size,
  className,
  title,
}: IconComponentProps) {
  const px = resolveIconSize(size);
  const width = px === 16 ? WALLET_ROW_POWER_ICON_WIDTH : px;
  const height =
    px === 16
      ? WALLET_ROW_POWER_ICON_HEIGHT
      : (px * WALLET_ROW_POWER_ICON_HEIGHT) / WALLET_ROW_POWER_ICON_WIDTH;
  const ariaProps = title
    ? { role: 'img' as const, 'aria-hidden': undefined }
    : { 'aria-hidden': true as const };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...ariaProps}
    >
      {title ? <title>{title}</title> : null}
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}
