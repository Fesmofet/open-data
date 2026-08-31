import { ICON_REGISTRY, type IconName } from './registry';
import type { IconProps } from './types';

export type { IconName };

export function Icon({
  name,
  size,
  className,
  strokeWidth,
  title,
}: IconProps & { name: IconName | '' | null | undefined }) {
  if (!name) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[icons] Missing icon name');
    }
    return null;
  }

  const Glyph = ICON_REGISTRY[name as IconName];
  if (!Glyph) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[icons] Unknown icon name: ${String(name)}`);
    }
    return null;
  }

  return (
    <Glyph
      size={size}
      className={className}
      strokeWidth={strokeWidth}
      title={title}
    />
  );
}
