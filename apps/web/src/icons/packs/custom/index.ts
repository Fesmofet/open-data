import type { IconComponent } from '../../types';
import { BrandFacebookIcon } from './brand-facebook';
import { BrandXIcon } from './brand-x';
import { DimensionsIcon } from './dimensions';
import { HbdSavingsShieldIcon } from './hbd-savings-shield';
import { HiveSavingsShieldIcon } from './hive-savings-shield';
import { RewardFlashlightIcon } from './reward-flashlight';
import { WalletPowerLightningIcon } from './wallet-power-lightning';
import { WalletSavingsShieldIcon } from './wallet-savings-shield';
import { WeightScaleIcon } from './weight-scale';

export const customIconPack = {
  'brand-facebook': BrandFacebookIcon,
  'brand-x': BrandXIcon,
  dimensions: DimensionsIcon,
  'hbd-savings-shield': HbdSavingsShieldIcon,
  'hive-savings-shield': HiveSavingsShieldIcon,
  'reward-flashlight': RewardFlashlightIcon,
  'wallet-power-lightning': WalletPowerLightningIcon,
  'wallet-savings-shield': WalletSavingsShieldIcon,
  'weight-scale': WeightScaleIcon,
} as const satisfies Record<string, IconComponent>;

export type CustomIconName = keyof typeof customIconPack;
