export function ConvertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M7 7h10l-3-3M17 17H7l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SuccessIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

export function SwapIcon() {
  return (
    <span className="text-body-lg font-weight-label" aria-hidden>
      ⇆
    </span>
  );
}

export function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

/** Legacy DelegateInstructionCard — Ant Design `wallet` icon. */
export function WalletIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="64 64 896 896"
      fill="currentColor"
      aria-hidden
    >
      <path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 464H528V448h312v128zm0 264H184V184h656v200H496c-17.7 0-32 14.3-32 32v192c0 17.7 14.3 32 32 32h344v200zM580 512a40 40 0 1 0 80 0 40 40 0 1 0-80 0z" />
    </svg>
  );
}
