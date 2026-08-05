export type WalletSelectChevronProps = {
  className?: string;
};

export function WalletSelectChevron({ className }: WalletSelectChevronProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 15.5 4 8h16l-8 7.5z" />
    </svg>
  );
}
