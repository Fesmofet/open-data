type HiveKeychainWindow = Window & {
  hive_keychain?: {
    requestSignBuffer?: unknown;
  };
};

export function isKeychainExtensionAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const win = window as HiveKeychainWindow;
  return typeof win.hive_keychain?.requestSignBuffer === 'function';
}
