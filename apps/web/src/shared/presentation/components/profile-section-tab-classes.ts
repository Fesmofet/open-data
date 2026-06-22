export type ProfileSectionTabSize = 'primary' | 'sub';

/** Underline tab styling for object and user profile horizontal section menus. */
export function profileSectionTabClass(
  active: boolean,
  size: ProfileSectionTabSize = 'primary',
): string {
  const sizeClass = 'px-3 py-2.5 text-body font-weight-strong';

  const base = `-mb-px inline-flex items-center border-b-2 transition-colors ${sizeClass}`;

  if (active) {
    return `${base} border-accent text-accent`;
  }

  return `${base} border-transparent text-fg-tertiary hover:text-fg`;
}

/** Vertical section links (Twitter-style profile rail). */
export function profileSectionVerticalLinkClass(
  active: boolean,
  sub = false,
): string {
  const sizeClass = sub
    ? 'px-3 py-2.5 text-body font-weight-strong pl-5'
    : 'px-3 py-2.5 text-body font-weight-strong';

  const base = `flex w-full items-center rounded-btn transition-colors ${sizeClass}`;

  if (active) {
    return `${base} text-accent`;
  }

  return `${base} text-fg-tertiary hover:bg-surface/80 hover:text-fg`;
}
