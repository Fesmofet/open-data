import type { ReactElement } from 'react';

import type { IconSize } from './constants';

export type IconComponentProps = {
  size?: IconSize | number;
  className?: string;
  strokeWidth?: number;
  title?: string;
};

export type IconComponent = (props: IconComponentProps) => ReactElement | null;

export type IconProps = {
  size?: IconSize | number;
  className?: string;
  strokeWidth?: number;
  title?: string;
};

export type IconPack = Record<string, IconComponent>;
