import { z } from 'zod';

import { normalizeHiveAccount } from '../utils/hive-account';

export const walletAccountKeysSchema = z.object({
  posting: z.string().min(1),
  active: z.string().optional(),
  memo: z.string().optional(),
  owner: z.string().optional(),
});

export const walletAccountSchema = z.object({
  account: z
    .string()
    .min(1)
    .transform((value) => normalizeHiveAccount(value)),
  keys: walletAccountKeysSchema,
});

export const walletAccountsSchema = z.array(walletAccountSchema).min(1);

export type WalletAccountKeys = z.infer<typeof walletAccountKeysSchema>;
export type WalletAccount = z.infer<typeof walletAccountSchema>;
export type AccountsSource = 'file' | 'env' | 'none';
