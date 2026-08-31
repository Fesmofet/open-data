import type { IconComponentProps } from '../../types';
import {
  resolveIconSize,
  WALLET_SAVINGS_SHIELD_HEIGHT,
  WALLET_SAVINGS_SHIELD_PATH,
  WALLET_SAVINGS_SHIELD_WIDTH,
} from '../../constants';

function resolveShieldDimensions(size?: IconComponentProps['size']) {
  if (size === undefined) {
    return {
      width: WALLET_SAVINGS_SHIELD_WIDTH,
      height: WALLET_SAVINGS_SHIELD_HEIGHT,
    };
  }
  const px = resolveIconSize(size);
  return {
    width: px,
    height: (px * WALLET_SAVINGS_SHIELD_HEIGHT) / WALLET_SAVINGS_SHIELD_WIDTH,
  };
}

/** Theme-aware savings shield (inherits color from parent). */
export function WalletSavingsShieldIcon({
  size,
  className,
  title,
}: IconComponentProps) {
  const { width, height } = resolveShieldDimensions(size);
  const ariaProps = title
    ? { role: 'img' as const, 'aria-hidden': undefined }
    : { 'aria-hidden': true as const };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 19 22"
      fill="none"
      className={className}
      {...ariaProps}
    >
      {title ? <title>{title}</title> : null}
      <path d={WALLET_SAVINGS_SHIELD_PATH} fill="currentColor" />
    </svg>
  );
}
